// Edge subscription endpoint.
//
// Authenticates the request with the TOKEN Pages secret and reads nodes.yaml
// straight from the private GitHub repository using GH_TOKEN. The file is
// returned verbatim (UTF-8 YAML) with subscription-friendly headers — there
// is no redirect and no self-hosted hop.
//
// Kept dependency-free so it runs unchanged on Cloudflare Pages Functions and
// in the Node test suite. `fetchImpl` is injectable for testing.

const DEFAULT_NODES_API =
  "https://api.github.com/repos/yakasuka/yggdrasil-private/contents/nodes.yaml";

const textResponse = (body, status, extraHeaders = {}) =>
  new Response(body, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      ...extraHeaders,
    },
  });

// Decode a GitHub API base64 payload into a UTF-8 string. GitHub wraps the
// base64 in newlines; strip them, then decode bytes explicitly so non-ASCII
// proxy names (CJK / emoji) survive intact.
function decodeBase64Utf8(base64) {
  const clean = String(base64).replace(/\s/g, "");
  const binary = atob(clean);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

export async function subResponse({ request, env }, fetchImpl = fetch) {
  const url = new URL(request.url);

  if (!env.TOKEN || url.searchParams.get("token") !== env.TOKEN)
    return textResponse("Unauthorized", 401);

  if (!env.GH_TOKEN)
    return textResponse("Missing GH_TOKEN", 500);

  const api = String(env.NODES_API || DEFAULT_NODES_API).trim();
  try {
    const response = await fetchImpl(api, {
      headers: {
        Authorization: `Bearer ${env.GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "yggdrasil-sub",
      },
    });
    if (!response.ok)
      return textResponse(
        `Failed to read nodes.yaml: GitHub HTTP ${response.status}`,
        502,
      );

    const data = await response.json();
    if (!data.content || data.encoding !== "base64")
      return textResponse("Invalid GitHub file response", 502);

    const yaml = decodeBase64Utf8(data.content);
    return textResponse(yaml, 200, {
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Subscription-Userinfo":
        "upload=0; download=0; total=10000000000000",
    });
  } catch {
    return textResponse("Failed to read nodes.yaml", 502);
  }
}

export async function onRequestGet(context) {
  return subResponse(context, fetch);
}
