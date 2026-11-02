import { SERVICE_ROUTES } from "../shared/service-routes.js";
export { SERVICE_ROUTES };

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

// Probe only the public health route. Airport credentials are never included.
export async function probeService(origin, version, fetcher = fetch) {
  const base = serviceOrigin(origin);
  if (!base)
    return {
      state: "unconfigured",
      message:
        "可直接读取允许跨域的订阅，或导入节点文件。连接可信服务后，可代取订阅并生成持久链接。",
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
          : "无法连接订阅服务，请检查地址、网络及服务的访问权限。",
    };
  }
  let health;
  try {
    health = await response.json();
  } catch {
    return {
      state: "offline",
      message: "服务响应无效，请确认填写的是订阅服务地址。",
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
  if (health.storage !== "kv" || health.format !== "mihomo")
    return { state: "offline", message: "该地址未提供兼容的订阅服务。" };
  if (health.version !== version)
    return {
      state: "mismatch",
      message: "页面与订阅服务版本不一致，请更新后重试。",
    };
  return {
    state: "ready",
    message:
      "已连接。在线解析和持久订阅可用，机场链接仅在处理配置时发送给该服务。",
    tcp: health.capabilities?.tcp === true,
  };
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
