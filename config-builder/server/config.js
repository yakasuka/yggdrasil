import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const text = (value) => (typeof value === "string" ? value.trim() : "");
const defaultDataDir = resolve(dirname(fileURLToPath(import.meta.url)), "data");

// Only bare origins are accepted: no path, query, fragment or credentials.
export function originOf(value, label = "address") {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw Error(`${label} 必须是完整的 http(s) 地址。`);
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw Error(`${label} 只能是不含路径、参数或凭据的源地址。`);
  return url.origin;
}

export function loadConfig(source = process.env) {
  const port = Number(text(source.PORT) || 8788);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw Error("PORT 必须是 1-65535 之间的整数。");
  const allowedOrigins = text(source.ALLOWED_ORIGINS)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => originOf(item, "ALLOWED_ORIGINS"));
  return {
    host: text(source.HOST) || "0.0.0.0",
    port,
    trustProxy: text(source.TRUST_PROXY) === "true",
    publicBase: text(source.PUBLIC_BASE_URL)
      ? originOf(text(source.PUBLIC_BASE_URL), "PUBLIC_BASE_URL")
      : "",
    allowedOrigins,
    dataDir: text(source.DATA_DIR) ? resolve(text(source.DATA_DIR)) : defaultDataDir,
    templateURL: text(source.TEMPLATE_URL) || "bundled",
    tcpProbeEnabled: text(source.TCP_PROBE_ENABLED) === "true",
    token: text(source.TOKEN),
    ghToken: text(source.GH_TOKEN),
    publicConfigURL:
      text(source.PUBLIC_CONFIG_URL) ||
      "https://raw.githubusercontent.com/yakasuka/yggdrasil/main/resources/template/ratatoskr-template.yaml",
    privateRepo: text(source.PRIVATE_REPO) ||
      "https://api.github.com/repos/yakasuka/yggdrasil-private/contents",
  };
}

// The worker modules expect a Cloudflare-style env object. Everything they
// read is mapped to local configuration and the on-disk store here.
export function serviceEnv(config, storage) {
  return {
    SUBSCRIPTIONS: storage,
    ALLOWED_ORIGINS: config.allowedOrigins.join(","),
    TEMPLATE_URL: config.templateURL,
    TCP_PROBE_ENABLED: config.tcpProbeEnabled ? "true" : "false",
    TOKEN: config.token,
    GH_TOKEN: config.ghToken,
    PUBLIC_CONFIG_URL: config.publicConfigURL,
    PRIVATE_REPO: config.privateRepo,
  };
}
