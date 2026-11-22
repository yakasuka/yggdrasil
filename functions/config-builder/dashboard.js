// Cloudflare Pages Function for the owner dashboard, served through the Pages
// domain so the backend address never appears in the address bar. The edge
// relays the request (including the browser's HTTP Basic credentials) to the
// self-hosted service and forwards the 401 challenge back, so the browser's
// native login dialog works exactly as it does against the backend directly.
//
// The page's own fetch() calls /api/admin/configs on the same Pages origin;
// functions/api/admin/configs.js handles that path.

import {
  proxyAdmin,
  DEFAULT_SERVICE,
} from "../../config-builder/shared/pages-proxy.js";

export async function onRequest(context) {
  const { request, env } = context;
  const service =
    (env && typeof env.SERVICE_BASE_URL === "string" && env.SERVICE_BASE_URL) ||
    DEFAULT_SERVICE;
  return proxyAdmin(request, service);
}
