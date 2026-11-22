// Cloudflare Pages Function for the owner admin API, relayed to the backend on
// the Pages origin. The dashboard page fetches this path with the browser's
// Basic session; the edge forwards Authorization (and forwards the 401
// challenge for GET) so listing/deleting works without exposing the backend.

import {
  proxyAdmin,
  DEFAULT_SERVICE,
} from "../../../config-builder/shared/pages-proxy.js";

export async function onRequest(context) {
  const { request, env } = context;
  const service =
    (env && typeof env.SERVICE_BASE_URL === "string" && env.SERVICE_BASE_URL) ||
    DEFAULT_SERVICE;
  return proxyAdmin(request, service);
}
