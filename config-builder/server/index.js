import { createServer as createHttpServer } from "node:http";
import { Readable } from "node:stream";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "./env-file.js";
import { loadConfig } from "./config.js";
import { createService } from "./create-server.js";

const here = dirname(fileURLToPath(import.meta.url));
await loadEnvFile(join(here, ".env"));

const config = loadConfig();
const service = createService({ config });

function clientIP(req) {
  if (config.trustProxy) {
    const forwarded = req.headers["x-forwarded-for"];
    const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)
      ?.split(",")[0]
      ?.trim();
    if (first) return first;
  }
  return req.socket?.remoteAddress || "";
}

function requestHeaders(req) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) for (const item of value) headers.append(name, item);
    else headers.set(name, value);
  }
  return headers;
}

const server = createHttpServer(async (req, res) => {
  const method = req.method || "GET";
  try {
    const host = req.headers.host || `127.0.0.1:${config.port}`;
    const init = {
      method,
      headers: requestHeaders(req),
      redirect: "manual",
    };
    if (!["GET", "HEAD"].includes(method)) {
      init.body = Readable.toWeb(req);
      init.duplex = "half";
    }
    const request = new Request(`http://${host}${req.url || "/"}`, init);
    const response = await service.fetch(request, { clientIP: clientIP(req) });
    const headers = [];
    response.headers.forEach((value, key) => headers.push(key, value));
    res.writeHead(response.status, headers);
    if (method !== "HEAD" && response.body)
      for await (const chunk of response.body) res.write(chunk);
    res.end();
  } catch (error) {
    if (res.headersSent) {
      res.destroy();
      return;
    }
    console.error("[service] request failed:", error);
    res.writeHead(503, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({ error: "配置服务暂时不可用，请稍后重试。" }));
  }
});

server.requestTimeout = 120000;
server.headersTimeout = 30000;

const timer = setInterval(
  () => void service.storage.purge().catch(() => {}),
  15 * 60 * 1000,
);
timer.unref();
void service.storage.purge().catch(() => {});

server.listen(config.port, config.host, () => {
  console.log(
    `[service] listening on http://${config.host}:${config.port}\n` +
      `[service] public base: ${config.publicBase || "(from request Host / X-Forwarded-*)"}\n` +
      `[service] store: ${config.dataDir}\n` +
      `[service] CORS: ${config.allowedOrigins.length ? config.allowedOrigins.join(", ") : "open (set ALLOWED_ORIGINS)"}\n` +
      `[service] endpoints: /api/status /api/endpoints /api/subscriptions /subscription/`,
  );
});

for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    clearInterval(timer);
    server.close(() => process.exit(0));
  });
