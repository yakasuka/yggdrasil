export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.TOKEN || url.searchParams.get("token") !== env.TOKEN)
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  if (!env.GH_TOKEN)
    return new Response("Missing GH_TOKEN", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

  const api =
    "https://api.github.com/repos/yakasuka/yggdrasil-private/contents/providers.yaml";
  try {
    const response = await fetch(api, {
      headers: {
        Authorization: `Bearer ${env.GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "yggdrasil-providers",
      },
    });
    if (!response.ok)
      return new Response(`Failed to read node file: GitHub HTTP ${response.status}`, {
        status: 502,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
      });
    const data = await response.json();
    if (!data.content || data.encoding !== "base64")
      return new Response("Invalid GitHub file response", { status: 502 });
    const binary = atob(data.content.replace(/\s/g, ""));
    const yaml = new TextDecoder("utf-8").decode(
      Uint8Array.from(binary, (character) => character.charCodeAt(0)),
    );
    return new Response(yaml, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": "inline",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Failed to read node file", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
}
