const PRIVATE_REPO =
  "https://api.github.com/repos/yakasuka/yggdrasil-private/contents";

async function readPrivateFile(env, filename) {
  const response = await fetch(`${PRIVATE_REPO}/${filename}`, {
    headers: {
      Authorization: `Bearer ${env.GH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "yggdrasil-merge",
    },
  });
  if (!response.ok)
    throw new Error(`Failed to read ${filename}: GitHub HTTP ${response.status}`);
  const data = await response.json();
  if (!data.content || data.encoding !== "base64")
    throw new Error(`Invalid GitHub response for ${filename}`);
  const binary = atob(data.content.replace(/\s/g, ""));
  return new TextDecoder("utf-8").decode(
    Uint8Array.from(binary, (character) => character.charCodeAt(0)),
  );
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.TOKEN || url.searchParams.get("token") !== env.TOKEN)
    return new Response("Unauthorized", { status: 401 });
  if (!env.GH_TOKEN) return new Response("Missing GH_TOKEN", { status: 500 });
  if (!env.PUBLIC_CONFIG_URL)
    return new Response("Missing PUBLIC_CONFIG_URL", { status: 500 });
  try {
    const mainResponse = await fetch(env.PUBLIC_CONFIG_URL, {
      headers: { "User-Agent": "yggdrasil-merge" },
    });
    if (!mainResponse.ok)
      throw new Error(`Failed to read public config: HTTP ${mainResponse.status}`);
    let mainConfig = await mainResponse.text();
    const providers = await readPrivateFile(env, "providers.yaml");
    const startMarker = "# >>> AUTO-PROVIDERS-START";
    const endMarker = "# <<< AUTO-PROVIDERS-END";
    const startIndex = mainConfig.indexOf(startMarker);
    const endIndex = mainConfig.indexOf(endMarker);
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex)
      throw new Error("Provider markers missing or incorrectly ordered");
    mainConfig =
      mainConfig.slice(0, startIndex + startMarker.length) +
      "\n" + providers.trim() + "\n" + mainConfig.slice(endIndex);
    return new Response(mainConfig, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": "inline",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return new Response(`Merge failed: ${error.message}`, {
      status: 502,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
