export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);

  if (!env.TOKEN || url.searchParams.get("token") !== env.TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!env.GH_TOKEN) {
    return new Response("Missing GH_TOKEN", { status: 500 });
  }

  const api =
    "https://api.github.com/repos/yakasuka/yggdrasil-private/contents/nodes.yaml";

  try {
    const res = await fetch(api, {
      headers: {
        Authorization: `Bearer ${env.GH_TOKEN}`,
        Accept: "application/vnd.github.raw+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!res.ok) {
      return new Response(`Failed to read node file: GitHub HTTP ${res.status}`, {
        status: 502,
      });
    }

    const content = await res.text();

    return new Response(content, {
      headers: {
        "Content-Type": "text/yaml; charset=utf-8",
        "Content-Disposition": 'attachment; filename="yggdrasil.yaml"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return new Response("Failed to read node file", { status: 502 });
  }
}