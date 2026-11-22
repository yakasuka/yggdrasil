import { createConnection } from "node:net";
import { resolve4, resolve6 } from "node:dns/promises";

// Node's fetch can reach literal public IPs directly, so the Cloudflare
// cloudflare:sockets implementation in worker/ip-fetch.js is never used here.
export const fetcher = (input, init) => fetch(input, init);
export const ipFetcher = fetcher;

export async function resolver(hostname) {
  const addresses = [];
  for (const lookup of [resolve4, resolve6]) {
    try {
      addresses.push(...(await lookup(hostname)));
    } catch {}
  }
  return addresses;
}

// TCP connect timing, equivalent to the old worker probe but using node:net.
export function probe(node) {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const socket = createConnection({
      host: node.server,
      port: Number(node.port),
    });
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      if (error) reject(error);
      else resolve(value);
    };
    const timer = setTimeout(() => finish(Error("TCP 检测超时")), 3000);
    socket.once("connect", () => finish(null, performance.now() - started));
    socket.once("error", (error) => finish(error));
  });
}
