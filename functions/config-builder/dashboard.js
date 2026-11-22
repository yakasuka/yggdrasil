// Cloudflare Pages Function for the owner dashboard, served through the Pages
// domain so the backend address never appears in the address bar. Without a
// validated session cookie it renders a sign-in screen instead of forwarding a
// 401 Basic challenge, so visitors get a real login page.
//
// The page's own fetch() calls /api/admin/configs on the same Pages origin;
// functions/api/admin/configs.js relays it with the session cookie.

import {
  proxyAdmin,
  adminSession,
  DEFAULT_SERVICE,
} from "../../config-builder/shared/pages-proxy.js";
import { dashboardLoginHTML } from "../../config-builder/shared/dashboard-login.js";

export async function onRequest(context) {
  const { request, env } = context;
  const service =
    (env && typeof env.SERVICE_BASE_URL === "string" && env.SERVICE_BASE_URL) ||
    DEFAULT_SERVICE;
  // Access is granted only by the HttpOnly cookie issued by the sign-in page.
  // A browser may still carry a Basic credential cached from an earlier native
  // auth prompt; trusting it would let a stale credential survive sign-out and
  // keep the dashboard reachable after its cookie has been cleared.
  if (!adminSession(request))
    return new Response(dashboardLoginHTML(), {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store, private",
        "x-content-type-options": "nosniff",
        "x-frame-options": "DENY",
      },
    });
  return proxyAdmin(request, service);
}
