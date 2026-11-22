// Validates dashboard credentials against the self-hosted admin API and sets
// an HttpOnly session cookie. The credential is never written to localStorage,
// and failures are returned as plain JSON without a Basic challenge.

import {
  ADMIN_COOKIE,
  DEFAULT_SERVICE,
} from "../../../config-builder/shared/pages-proxy.js";
import { dashboardLoginHTML } from "../../../config-builder/shared/dashboard-login.js";

const json = (data, status = 200, headers = {}) =>
  Response.json(data, {
    status,
    headers: { "cache-control": "no-store", ...headers },
  });

function basic(username, password) {
  const bytes = new TextEncoder().encode(username + ":" + password);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function onRequest(context) {
  const { request, env } = context;
  const service =
    (env && typeof env.SERVICE_BASE_URL === "string" && env.SERVICE_BASE_URL) ||
    DEFAULT_SERVICE;
  if (request.method === "GET")
    return new Response(dashboardLoginHTML(), {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store, private",
        "x-content-type-options": "nosniff",
        "x-frame-options": "DENY",
      },
    });
  if (request.method !== "POST")
    return json({ error: "方法不受支持。" }, 405, { allow: "GET, POST" });

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: "请求格式不正确。" }, 400);
  }
  const username = String(input?.username || "").trim();
  const password = String(input?.password || "");
  if (!username || !password || username.length > 200 || password.length > 200)
    return json({ error: "请输入管理员账号与密码。" }, 400);

  const credential = basic(username, password);
  let target;
  try {
    target = new URL("/api/admin/configs", service);
  } catch {
    return json({ error: "管理服务暂不可用。" }, 503);
  }
  let upstream;
  try {
    upstream = await fetch(target, {
      headers: {
        authorization: "Basic " + credential,
        accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return json({ error: "管理服务暂不可用，请稍后重试。" }, 503);
  }
  if (!upstream.ok)
    return json({ error: "账号或密码不正确。" }, 401);

  return json(
    { ok: true },
    200,
    {
      "set-cookie":
        `${ADMIN_COOKIE}=${encodeURIComponent(credential)}; ` +
        "Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Lax",
    },
  );
}
