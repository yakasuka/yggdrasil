// Clears the dashboard session cookie. Called by the dashboard's logout button.

import { ADMIN_COOKIE } from "../../../config-builder/shared/pages-proxy.js";

export async function onRequest({ request }) {
  if (request.method !== "POST")
    return Response.json({ error: "方法不受支持。" }, {
      status: 405,
      headers: { allow: "POST", "cache-control": "no-store" },
    });
  return Response.json(
    { ok: true },
    {
      headers: {
        "cache-control": "no-store",
        "set-cookie": `${ADMIN_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
      },
    },
  );
}
