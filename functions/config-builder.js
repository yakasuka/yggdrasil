// Cloudflare Pages Function for public subscription links.
//
// The browser / Clash client only ever talks to the Pages domain. When a link
// carries a `token`, this Function fetches the YAML from the self-hosted
// service and relays it verbatim: no HTTP redirect, so the address bar and the
// copied link stay on the Pages domain and the backend address is hidden.
//
// Requests without a token are the static wizard:
//   /config-builder/  -> fall through to the static index.html
//   /config-builder   -> 308 to the canonical wizard path with trailing slash
// Redirects in _redirects do NOT apply to requests handled by a Function, so
// the trailing-slash normalization is implemented here.

import {
  isSubscription,
  proxySubscription,
  DEFAULT_SERVICE,
} from "../config-builder/shared/pages-proxy.js";

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  if (!isSubscription(url)) {
    // Only the no-slash form needs normalizing; the slash form is the static
    // wizard itself. Redirecting that would loop forever.
    if (url.pathname === "/config-builder")
      return Response.redirect(new URL("/config-builder/", url).href, 308);
    return next();
  }

  const service =
    (env && typeof env.SERVICE_BASE_URL === "string" && env.SERVICE_BASE_URL) ||
    DEFAULT_SERVICE;
  return proxySubscription(request, service);
}
