import {
  parseSubscription,
  nodeInventory,
  MAX_SUBSCRIPTION_BYTES,
} from "../shared/subscription.js";
import { parseUsage } from "../shared/nodes.js";

const sourceError = (code, message) =>
  Object.assign(new Error(message), { code });
export function sourceFailureMessage(error, service) {
  const specific = [
    "SOURCE_FORMAT",
    "SOURCE_HTTP",
    "SOURCE_TOO_LARGE",
    "SOURCE_FILE",
  ];
  if (specific.includes(error.code)) return error.message;
  const reason =
    error.code === "SOURCE_TIMEOUT"
      ? "读取机场订阅超时。"
      : "浏览器未能读取订阅，可能受到跨域、网络或证书限制。";
  const help =
    service === "unconfigured"
      ? "订阅服务尚未连接，请连接服务后重试。"
      : service === "mismatch"
        ? "页面与订阅服务版本不一致，请更新后重试。"
        : "订阅服务暂不可用，请重试连接。";
  return reason + help;
}

async function read(response) {
  if (Number(response.headers.get("Content-Length")) > MAX_SUBSCRIPTION_BYTES)
    throw sourceError("SOURCE_TOO_LARGE", "节点订阅超过 2 MiB。");
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks = [];
  let size = 0;
  while (true) {
    const item = await reader.read();
    if (item.done) break;
    size += item.value.length;
    if (size > MAX_SUBSCRIPTION_BYTES) {
      await reader.cancel();
      throw sourceError("SOURCE_TOO_LARGE", "节点订阅超过 2 MiB。");
    }
    chunks.push(item.value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(bytes);
}

// Credentials stay in this transient record; publicInspection passes only the
// inventory and usage to the following wizard steps.
export async function browserRecords(
  providers,
  files,
  signal,
  fetcher = fetch,
) {
  return Promise.all(
    providers.map(async (provider, i) => {
      let text,
        usage = null;
      const file = files.get(i);
      let stage = "read";
      try {
        if (file) text = await file.text();
        else {
          const response = await fetcher(provider.url, {
            mode: "cors",
            credentials: "omit",
            cache: "no-store",
            referrerPolicy: "no-referrer",
            signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
          });
          if (!response.ok)
            throw sourceError(
              "SOURCE_HTTP",
              `机场订阅返回 HTTP ${response.status}，请检查链接是否有效。`,
            );
          text = await read(response);
          usage = parseUsage(response.headers.get("Subscription-Userinfo"));
        }
        stage = "parse";
        const parsed = parseSubscription(text);
        return {
          name: provider.name,
          nodes: nodeInventory(parsed.proxies, i),
          proxies: parsed.proxies,
          format: parsed.format,
          skipped: parsed.skipped,
          usage,
        };
      } catch (error) {
        if (
          error.name === "AbortError" ||
          (typeof error.code === "string" && error.code.startsWith("SOURCE_"))
        )
          throw error;
        if (stage === "parse")
          throw sourceError(
            file ? "SOURCE_FILE" : "SOURCE_FORMAT",
            "未识别到有效节点，请确认内容是 YAML、Base64 或支持的节点链接。",
          );
        if (file)
          throw sourceError(
            "SOURCE_FILE",
            "节点文件无法读取，请重新选择文件。",
          );
        throw sourceError(
          error.name === "TimeoutError" ? "SOURCE_TIMEOUT" : "SOURCE_NETWORK",
          "浏览器未能读取订阅。",
        );
      }
    }),
  );
}
