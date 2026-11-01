import {
  parseSubscription,
  nodeInventory,
  MAX_SUBSCRIPTION_BYTES,
} from "../shared/subscription.js";
import { parseUsage } from "../shared/nodes.js";

async function read(response) {
  if (Number(response.headers.get("Content-Length")) > MAX_SUBSCRIPTION_BYTES)
    throw Error("节点订阅超过 2 MiB。");
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
      throw Error("节点订阅超过 2 MiB。");
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
      if (file) text = await file.text();
      else {
        const response = await fetcher(provider.url, {
          mode: "cors",
          credentials: "omit",
          cache: "no-store",
          referrerPolicy: "no-referrer",
          signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
        });
        if (!response.ok) throw Error("机场订阅暂时不可读取。");
        text = await read(response);
        usage = parseUsage(response.headers.get("Subscription-Userinfo"));
      }
      const parsed = parseSubscription(text);
      return {
        name: provider.name,
        nodes: nodeInventory(parsed.proxies, i),
        proxies: parsed.proxies,
        format: parsed.format,
        skipped: parsed.skipped,
        usage,
      };
    }),
  );
}
