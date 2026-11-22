// Cloudflare Pages Function for the traffic/status link. Same edge proxy as
// the subscription route: the client stays on the Pages domain while the
// Function relays the traffic report from the self-hosted service.

import {
  isSubscription,
  proxySubscription,
  DEFAULT_SERVICE,
} from "../../config-builder/shared/pages-proxy.js";

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  if (!isSubscription(url)) return next();

  const service =
    (env && typeof env.SERVICE_BASE_URL === "string" && env.SERVICE_BASE_URL) ||
    DEFAULT_SERVICE;
  return proxySubscription(request, service);
}
