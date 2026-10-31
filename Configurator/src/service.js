export { SERVICE_ROUTES } from "../shared/service-routes.js";

export function serviceOrigin(value) {
  if (!value) return null;
  const url = new URL(value);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    (!local && url.protocol !== "https:") ||
    (local && !["http:", "https:"].includes(url.protocol)) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    url.hostname === "workers.dev" ||
    url.hostname.endsWith(".workers.dev")
  )
    throw Error("配置服务地址不可用。");
  return url.origin;
}

export function subscriptionURL(value, origin) {
  const url = new URL(value);
  if (
    url.origin !== origin ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !/^\/subscription\/[A-Za-z0-9_-]{22}\/[A-Za-z0-9_-]{43}\.yaml$/.test(
      url.pathname,
    )
  )
    throw Error("服务返回的订阅地址无效。");
  return url.href;
}
