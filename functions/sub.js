
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const token = url.searchParams.get("token");

  if (!token || token !== context.env.TOKEN) {
    return new Response("Forbidden", { status: 403 });
  }

  const ua = context.request.headers.get("User-Agent") || "";

  console.log("Subscription request UA:", ua);

  const headers = {
    "Content-Type": "text/yaml; charset=utf-8",
    "Subscription-Userinfo":
      "upload=1073741824; download=5368709120; total=107374182400; expire=1798761600",
    "Profile-Update-Interval": "24",
    "Content-Disposition":
      'attachment; filename="My-Private-Nodes.yaml"'
  };

  console.log(
    "Subscription-Userinfo:",
    headers["Subscription-Userinfo"]
  );

  return new Response(context.env.NODES, { headers });
}
