// Cloudflare Pages Function for the owner's front-end configuration editor.
// Same path is relayed to the self-hosted service with the HttpOnly session
// cookie translated to Basic auth, exactly like /api/admin/configs. The
// dashboard (served on the Pages origin) fetches this path same-origin.

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
