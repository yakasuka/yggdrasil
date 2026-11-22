import { SERVICE_ROUTES } from "../shared/service-routes.js";
export { SERVICE_ROUTES };

// The wizard is a static page; the subscription service lives on the owner's
// own server. Only a bare HTTPS origin (or a local development address) is
// accepted, and legacy workers.dev addresses are refused so the browser can
// never fall back to an old Cloudflare Worker that still handles node data.
export function serviceOrigin(value) {
  if (!value) return null;
  if (typeof value !== "string") throw Error("请填写有效的 HTTPS 服务地址。");
  if (!value.trim()) return null;
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw Error("请填写有效的 HTTPS 服务地址。");
  }
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

// Static frontends on Cloudflare Pages and GitHub Pages both probe the same
// self-hosted service. There is no unconfigured / offline-only mode: a failed
// probe is a hard error. Only the public health route is probed; airport
// credentials are never included.
const STORAGE_KINDS = new Set(["kv", "self-hosted", "file", "disk"]);

export async function probeService(origin, version, fetcher = fetch) {
  const base = serviceOrigin(origin);
  if (!base)
    return {
      state: "offline",
      message: "当前站点未提供订阅服务，请通过已部署服务的地址访问。",
    };
  let response;
  try {
    response = await fetcher(base + SERVICE_ROUTES.status, {
      credentials: "omit",
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    return {
      state: "offline",
      message:
        error.name === "TimeoutError"
          ? "连接订阅服务超时，请重试。"
          : "无法连接订阅服务，请检查网络或稍后重试。",
    };
  }
  let health;
  try {
    health = await response.json();
  } catch {
    return {
      state: "offline",
      message: "服务响应无效，请确认当前站点已部署订阅服务。",
    };
  }
  if (!response.ok || health?.ready !== true)
    return {
      state: "offline",
      message:
        health?.code === "SERVICE_NOT_BOUND" ||
        health?.storage === "unavailable"
          ? "订阅服务尚未连接存储，请联系维护者。"
          : "订阅服务暂不可用，请重试或联系维护者。",
    };
  if (!STORAGE_KINDS.has(health.storage) || health.format !== "mihomo")
    return { state: "offline", message: "该地址未提供兼容的订阅服务。" };
  if (health.version !== version)
    return {
      state: "mismatch",
      message: "页面与订阅服务版本不一致，请更新后重试。",
    };
  return {
    state: "ready",
    message:
      "已连接。在线解析与持久订阅可用；机场链接和生成的配置只经过该服务。",
    tcp: health.capabilities?.tcp === true,
    service: health.service,
    endpoints: health.endpoints,
  };
}

const CONFIG_TOKEN_RE = /^[\p{L}\p{N}_-]{3,60}$/u;

function configToken(url, status) {
  const expected = SERVICE_ROUTES.config + (status ? "/status" : "");
  if (
    url.pathname !== expected ||
    url.hash ||
    url.username ||
    url.password ||
    [...url.searchParams.keys()].length !== 1
  )
    return null;
  const token = url.searchParams.get("token");
  return CONFIG_TOKEN_RE.test(token || "") ? token : null;
}

export function subscriptionURL(value, origin) {
  const url = new URL(value);
  if (url.origin !== origin || url.username || url.password || url.hash)
    throw Error("服务返回的订阅地址无效。");
  // New links carry the user's configuration name; legacy links still work.
  if (configToken(url, false)) return url.href;
  if (url.search || !/^\/subscription\/[A-Za-z0-9_-]{22}\/[A-Za-z0-9_-]{43}\.yaml$/.test(url.pathname))
    throw Error("服务返回的订阅地址无效。");
  return url.href;
}

export function usageURL(value, origin) {
  const url = new URL(value);
  if (url.origin !== origin || url.username || url.password || url.hash)
    throw Error("服务返回的流量地址无效。");
  if (configToken(url, true)) return url.href;
  if (url.search || !/^\/subscription\/[A-Za-z0-9_-]{22}\/[A-Za-z0-9_-]{43}\/status$/.test(url.pathname))
    throw Error("服务返回的流量地址无效。");
  return url.href;
}
