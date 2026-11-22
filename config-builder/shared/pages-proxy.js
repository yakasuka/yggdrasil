// Edge proxy shared by the Cloudflare Pages Functions that serve public
// subscription links. The browser (or Clash client) talks only to the Pages
// domain; the Function fetches the YAML from the self-hosted service and
// relays it, so there is no redirect and the backend address never appears in
// the address bar or the copied link.
//
// Kept dependency-free and Web-API-only so it can be unit tested in Node.

export const DEFAULT_SERVICE = "https://yggdrasil.xyang.cyou";
export const CONFIG_PATH = "/config-builder";
export const STATUS_PATH = "/config-builder/status";

// Only requests carrying a token are subscriptions. Everything else (the
// wizard, its assets) must fall through to the static site.
export function isSubscription(url) {
  return url.searchParams.has("token");
}

export function upstreamURL(url, service = DEFAULT_SERVICE) {
  const status = url.pathname.replace(/\/+$/, "") === STATUS_PATH;
  const target = new URL(status ? STATUS_PATH : CONFIG_PATH, service);
  // token/pwd (and any future params) travel in the query string; pass them
  // through verbatim so the backend sees exactly what the client sent.
  target.search = url.search;
  return target;
}

// Request headers worth forwarding. Hop-by-hop headers, Host, Origin and
// Accept-Encoding are intentionally dropped: the Worker re-creates them.
const FORWARD_REQUEST_HEADERS = ["accept", "user-agent", "x-config-pwd"];

// Response headers the client needs: subscription traffic info, caching and
// CORS. Content-Length/Encoding are recomputed by the runtime.
const FORWARD_RESPONSE_HEADERS = [
  "content-type",
  "subscription-userinfo",
  "cache-control",
  "content-disposition",
  "access-control-allow-origin",
  "access-control-allow-headers",
  "access-control-expose-headers",
  "access-control-max-age",
];

export async function proxySubscription(
  request,
  service = DEFAULT_SERVICE,
  fetcher = fetch,
) {
  const url = new URL(request.url);
  const target = upstreamURL(url, service);

  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const upstream = await fetcher(target, {
    method: request.method === "HEAD" ? "GET" : request.method,
    headers,
    redirect: "manual",
  });

  const output = new Headers();
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) output.set(name, value);
  }
  if (!output.has("cache-control")) output.set("cache-control", "no-store");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: output,
  });
}
