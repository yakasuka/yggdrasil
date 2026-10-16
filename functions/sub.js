
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!env.TOKEN || token !== env.TOKEN) {
    return new Response("Forbidden", { status: 403 });
  }

  if (!env.GH_TOKEN) {
    return new Response("GitHub token not configured", {
      status: 500
    });
  }

  try {
    const response = await fetch(
      "https://api.github.com/repos/yakasuka/yggdrasil-private/contents/nodes.yaml",
      {
        headers: {
          "Authorization": `Bearer ${env.GH_TOKEN}`,
          "Accept": "application/vnd.github.raw+json",
          "X-GitHub-Api-Version": "2022-11-28"
        }
      }
    );

    if (!response.ok) {
      console.error("GitHub read failed:", response.status);
      return new Response("Failed to read node file", {
        status: 502
      });
    }

    const nodes = await response.text();

    if (!/^proxies:\s*$/m.test(nodes)) {
      return new Response("Invalid nodes.yaml format", {
        status: 500
      });
    }

    return new Response(nodes, {
      headers: {
        "Content-Type": "text/yaml; charset=utf-8",
        "Subscription-Userinfo":
          "upload=1073741824; download=5368709120; total=107374182400; expire=1798761600",
        "Profile-Update-Interval": "24",
        "Content-Disposition": 'attachment; filename="node.yaml"',
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    console.error("Subscription error:", error);
    return new Response("Internal error", { status: 500 });
  }
}
