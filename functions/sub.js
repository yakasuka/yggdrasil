export async function onRequest(context) {

  const url = new URL(context.request.url);
  const token = url.searchParams.get("token");

  // 读取 Cloudflare 里的 TOKEN
  if (token !== context.env.TOKEN) {
    return new Response("Forbidden", {
      status: 403
    });
  }

  // 读取 Cloudflare 里的 NODES
  return new Response(context.env.NODES, {
    headers: {
      "Content-Type": "text/yaml; charset=utf-8"
    }
  });

}