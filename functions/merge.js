// Cloudflare Pages only forwards the link. Every node, token and private
// repository read now happens on the self-hosted service configured in
// SERVICE_BASE_URL. This function contains no subscription data at all.
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const configured = String(env.SERVICE_BASE_URL || "")
    .trim()
    .replace(/\/+$/, "");
  const unavailable = (message) =>
    new Response(message, {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  if (!configured)
    return unavailable(
      "SERVICE_BASE_URL 未配置：请在 Cloudflare Pages 项目变量中填写自建服务地址。",
    );
  let target;
  try {
    target = new URL("/merge" + url.search, configured);
    if (!["http:", "https:"].includes(target.protocol)) throw Error("invalid");
  } catch {
    return unavailable("SERVICE_BASE_URL 无效。");
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: target.href,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
