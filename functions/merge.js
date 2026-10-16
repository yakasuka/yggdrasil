
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const token = url.searchParams.get("token");
  const env = context.env;

  if (!token || token !== env.TOKEN) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const [configObj, nodesObj] = await Promise.all([
      env.CONFIG.get("yggdrasil.yaml"),
      env.CONFIG.get("nodes.yaml")
    ]);

    if (!configObj || !nodesObj) {
      return new Response("Configuration file missing", {
        status: 500
      });
    }

    const config = await configObj.text();
    const nodes = await nodesObj.text();

    if (/^(proxies|proxy-providers):/m.test(config)) {
      return new Response("Remove proxies/provider section from config.yaml", {
        status: 500
      });
    }

    if (!/^proxies:/m.test(nodes)) {
      return new Response("Invalid nodes.yaml", {
        status: 500
      });
    }

    return new Response(
      config.trimEnd() + "\n\n" + nodes.trim() + "\n",
      {
        headers: {
          "Content-Type": "text/yaml; charset=utf-8",
          "Cache-Control": "no-store",
          "Content-Disposition": 'attachment; filename="openclash.yaml"'
        }
      }
    );
  } catch {
    return new Response("Internal error", { status: 500 });
  }
}
