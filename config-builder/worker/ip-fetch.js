import { HTTPParser } from "http-parser-js";
import { Buffer } from "buffer";
import { MAX_SUBSCRIPTION_BYTES } from "../shared/subscription.js";
import { publicURL, literalIP } from "./public-url.js";

const MAX_HEADERS = 32 * 1024;
const invalid = () => Error("机场返回了无效的 HTTP 响应。");

async function decoded(bytes, encoding) {
  if (!encoding || encoding === "identity") return bytes;
  if (!["gzip", "deflate"].includes(encoding)) throw invalid();
  const reader = new Response(bytes).body
    .pipeThrough(new DecompressionStream(encoding))
    .getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_SUBSCRIPTION_BYTES) {
        await reader.cancel();
        throw Error("订阅内容过大。");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, size);
}

async function responseFrom(socket, method) {
  const parser = new HTTPParser(HTTPParser.RESPONSE);
  parser.maxHeaderSize = MAX_HEADERS;
  let status,
    headers,
    complete = false,
    size = 0,
    wireSize = 0,
    interim = 0;
  const chunks = [];
  parser[HTTPParser.kOnHeadersComplete] = (info) => {
    if (complete) return 1;
    if (info.headers.join("").length > MAX_HEADERS || info.headers.length > 512)
      throw invalid();
    if (info.statusCode < 200) {
      if (info.statusCode === 101 || ++interim > 4) throw invalid();
      return 1;
    }
    status = info.statusCode;
    headers = new Headers();
    for (let i = 0; i < info.headers.length; i += 2)
      headers.append(info.headers[i], info.headers[i + 1]);
    const length = headers.get("Content-Length"),
      transfer = headers.get("Transfer-Encoding");
    if (
      (length && !/^\d+$/.test(length)) ||
      (transfer && (length || transfer.toLowerCase() !== "chunked"))
    )
      throw invalid();
    if (
      method !== "HEAD" &&
      status >= 200 &&
      status < 300 &&
      length &&
      Number(length) > MAX_SUBSCRIPTION_BYTES
    )
      throw Error("订阅内容过大。");
    return method === "HEAD" || status === 205 || status >= 300 ? 1 : 0;
  };
  parser[HTTPParser.kOnBody] = (chunk, start, length) => {
    if (complete) return;
    size += length;
    if (size > MAX_SUBSCRIPTION_BYTES) throw Error("订阅内容过大。");
    chunks.push(Buffer.from(chunk.subarray(start, start + length)));
  };
  parser[HTTPParser.kOnMessageComplete] = () => {
    if (status) complete = true;
  };
  const reader = socket.readable.getReader();
  try {
    while (!complete) {
      const { done, value } = await reader.read();
      if (done) {
        if (parser.finish() instanceof Error || !complete) throw invalid();
        break;
      }
      wireSize += value.length;
      if (wireSize > MAX_SUBSCRIPTION_BYTES * 2 + MAX_HEADERS)
        throw Error("订阅内容过大。");
      const result = parser.execute(Buffer.from(value));
      if (result instanceof Error && !complete) throw invalid();
    }
  } finally {
    reader.releaseLock();
  }
  if (!headers || !status) throw invalid();
  const empty =
    method === "HEAD" || status === 204 || status === 205 || status >= 300;
  const bytes = empty
    ? null
    : await decoded(
        Buffer.concat(chunks, size),
        headers.get("Content-Encoding")?.toLowerCase(),
      );
  for (const name of [
    "Connection",
    "Keep-Alive",
    "Transfer-Encoding",
    "Trailer",
  ])
    headers.delete(name);
  if (!empty) {
    headers.delete("Content-Encoding");
    headers.set("Content-Length", String(bytes.length));
  }
  return new Response(bytes, { status, headers });
}

// Cloudflare fetch() cannot target literal IPs. This small GET/HEAD client uses
// the platform's TLS socket for public IP subscriptions and keeps redirects in
// subscriptions.js, where every destination is checked again.
export async function fetchIP(value, options = {}, connector) {
  const url = publicURL(value),
    host = url.hostname.replace(/^\[|\]$/g, "");
  const method = options.method || "GET";
  if (!literalIP(host) || !["GET", "HEAD"].includes(method)) throw invalid();
  const signal = options.signal || AbortSignal.timeout(12000);
  signal.throwIfAborted();
  const connect = connector || (await import("cloudflare:sockets")).connect;
  const socket = connect(
    {
      hostname: host,
      port: Number(url.port || (url.protocol === "https:" ? 443 : 80)),
    },
    { secureTransport: url.protocol === "https:" ? "on" : "off" },
  );
  socket.closed?.catch(() => {});
  let rejectAbort;
  const aborted = new Promise((_, reject) => {
    rejectAbort = reject;
  });
  const abort = () => {
    rejectAbort(signal.reason);
    void socket.close().catch(() => {});
  };
  signal.addEventListener("abort", abort, { once: true });
  try {
    if (signal.aborted) abort();
    return await Promise.race([
      aborted,
      (async () => {
        await socket.opened;
        const h = new Headers(options.headers);
        const request = `${method} ${url.pathname}${url.search} HTTP/1.1\r\nHost: ${url.host}\r\nUser-Agent: ${h.get("User-Agent") || "mihomo/Configurator"}\r\nAccept: ${h.get("Accept") || "*/*"}\r\nAccept-Encoding: identity\r\nConnection: close\r\n\r\n`;
        const writer = socket.writable.getWriter();
        try {
          await writer.write(new TextEncoder().encode(request));
        } finally {
          writer.releaseLock();
        }
        return responseFrom(socket, method);
      })(),
    ]);
  } finally {
    signal.removeEventListener("abort", abort);
    await socket.close().catch(() => {});
  }
}
