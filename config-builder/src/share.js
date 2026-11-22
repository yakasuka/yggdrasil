import { SERVICE_ROUTES } from "../shared/service-routes.js";
import { apiFetch } from "./config.js";

export async function createShareCode(profile, includeProviders) {
  const response = await apiFetch(SERVICE_ROUTES.preset, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, includeProviders }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error || "分享码生成失败。");
  return data;
}

export async function fetchShareCode(code) {
  const response = await apiFetch(SERVICE_ROUTES.preset + "/" + code, {
    signal: AbortSignal.timeout(30000),
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error || "分享码读取失败。");
  return data;
}
