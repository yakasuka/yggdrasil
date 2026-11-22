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
export const ADMIN_COOKIE = "ygg_admin";

// Read the HttpOnly session cookie set by the dashboard login function.
export function adminSession(request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(
    new RegExp("(?:^|;\\s*)" + ADMIN_COOKIE + "=([^;]+)"),
  );
  return match ? decodeURIComponent(match[1]) : "";
}

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

// Admin endpoints (the dashboard shell + its JSON API) need a few headers the
// subscription proxy deliberately drops: Basic credentials in both directions
// (Authorization request / WWW-Authenticate challenge) and the Content-Type
// body for DELETE. Everything runs in the browser's Basic session against the
// Pages origin; the edge relays it to the self-hosted backend unchanged.
const ADMIN_REQUEST_HEADERS = [
  "accept",
  "authorization",
  "content-type",
  "user-agent",
];
const ADMIN_RESPONSE_HEADERS = [
  "content-type",
  "www-authenticate",
  "cache-control",
  "content-security-policy",
  "x-content-type-options",
  "x-frame-options",
];

export async function proxyAdmin(
  request,
  service = DEFAULT_SERVICE,
  fetcher = fetch,
) {
  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, service);

  const headers = new Headers();
  for (const name of ADMIN_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // The sign-in form stores the validated Basic credential in an HttpOnly
  // cookie. Translate it back into an Authorization header for the backend so
  // the dashboard can be reloaded and its fetch() calls stay on this origin.
  if (!headers.has("authorization")) {
    const session = adminSession(request);
    if (session) headers.set("authorization", "Basic " + session);
  }

  const init = { method: request.method, headers, redirect: "manual" };
  if (!["GET", "HEAD"].includes(request.method) && request.body) {
    init.body = request.body;
    init.duplex = "half";
  }

  const upstream = await fetcher(target, init);
  const output = new Headers();
  for (const name of ADMIN_RESPONSE_HEADERS) {
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
