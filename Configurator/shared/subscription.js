import { parse } from "yaml";

export const MAX_SUBSCRIPTION_BYTES = 2 * 1024 * 1024;
const protocols = /^(?:vmess|vless|ss|ssr|trojan|hysteria2|hy2|tuic):\/\//im;
const decode = (text) => {
  const value = text.trim().replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value)) throw Error("Invalid Base64");
  const binary = atob(
    value.replace(/=+$/, "") +
      "=".repeat((4 - (value.replace(/=+$/, "").length % 4)) % 4),
  );
  return new TextDecoder("utf-8", { fatal: true }).decode(
    Uint8Array.from(binary, (c) => c.charCodeAt(0)),
  );
};
const unescape = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};
const address = (url) => ({
  server: url.hostname.replace(/^\[|\]$/g, ""),
  port: Number(url.port || 443),
});

function transport(node, values) {
  const net = values.type || values.net || "tcp";
  if (net === "ws") {
    node.network = "ws";
    node["ws-opts"] = {
      path: values.path || "/",
      ...(values.host ? { headers: { Host: values.host } } : {}),
    };
  } else if (net === "grpc") {
    node.network = "grpc";
    node["grpc-opts"] = {
      "grpc-service-name": values.serviceName || values.path || "",
    };
  } else if (net === "h2") {
    node.network = "h2";
    node["h2-opts"] = {
      path: values.path || "/",
      ...(values.host ? { host: values.host.split(",") } : {}),
    };
  } else if (
    net === "http" ||
    (net === "tcp" && values.headerType === "http")
  ) {
    node.network = "http";
    node["http-opts"] = {
      path: [values.path || "/"],
      ...(values.host ? { headers: { Host: values.host.split(",") } } : {}),
    };
  } else if (net !== "tcp" && net !== "none")
    throw Error("Unsupported transport");
}

function tls(node, values, required = false) {
  const security = values.security || values.tls;
  if (required || ["tls", "reality", true, "true", "1"].includes(security)) {
    node.tls = true;
    if (values.sni || values.serverName || values.host)
      node[node.type === "trojan" ? "sni" : "servername"] =
        values.sni || values.serverName || values.host;
    if (values.fp) node["client-fingerprint"] = values.fp;
    if (values.alpn)
      node.alpn = Array.isArray(values.alpn)
        ? values.alpn
        : values.alpn.split(",");
    if (
      ["1", "true"].includes(values.allowInsecure) ||
      ["1", "true"].includes(values.insecure)
    )
      node["skip-cert-verify"] = true;
    if (security === "reality")
      node["reality-opts"] = {
        "public-key": values.pbk,
        "short-id": values.sid || "",
      };
  }
}

function ssLink(line) {
  let body = line.slice(5),
    fragment = "";
  const hash = body.indexOf("#");
  if (hash >= 0) {
    fragment = body.slice(hash + 1);
    body = body.slice(0, hash);
  }
  if (!body.includes("@")) body = decode(body);
  const at = body.lastIndexOf("@");
  if (at < 0) throw Error("Invalid SS");
  let login = unescape(body.slice(0, at));
  if (!login.includes(":")) login = decode(login);
  const colon = login.indexOf(":");
  if (colon < 1) throw Error("Invalid SS credentials");
  const url = new URL("ss://" + body.slice(at + 1));
  const node = {
    name: unescape(fragment) || url.hostname,
    type: "ss",
    ...address(url),
    cipher: login.slice(0, colon),
    password: login.slice(colon + 1),
    udp: true,
  };
  const plugin = url.searchParams.get("plugin");
  if (plugin) {
    const [name, ...parts] = plugin.split(";");
    const opts = Object.fromEntries(
      parts.map((part) => {
        const i = part.indexOf("=");
        return i < 0 ? [part, true] : [part.slice(0, i), part.slice(i + 1)];
      }),
    );
    if (["obfs-local", "simple-obfs"].includes(name)) {
      node.plugin = "obfs";
      node["plugin-opts"] = {
        mode: opts.obfs || "http",
        ...(opts["obfs-host"] ? { host: opts["obfs-host"] } : {}),
      };
    } else if (name === "v2ray-plugin") {
      node.plugin = name;
      node["plugin-opts"] = opts;
    } else throw Error("Unsupported SS plugin");
  }
  return node;
}

function ssrLink(line) {
  const text = decode(line.slice(6));
  const [main, query = ""] = text.split("/?");
  const match = main.match(/^(.+):(\d+):([^:]+):([^:]+):([^:]+):(.+)$/);
  if (!match) throw Error("Invalid SSR");
  const params = new URLSearchParams(query);
  const node = {
    name: params.get("remarks") ? decode(params.get("remarks")) : match[1],
    type: "ssr",
    server: match[1],
    port: Number(match[2]),
    protocol: match[3],
    cipher: match[4],
    obfs: match[5],
    password: decode(match[6]),
    udp: true,
  };
  if (params.get("obfsparam"))
    node["obfs-param"] = decode(params.get("obfsparam"));
  if (params.get("protoparam"))
    node["protocol-param"] = decode(params.get("protoparam"));
  return node;
}

function uri(line) {
  line = line.replace(/^[A-Za-z0-9]+:/, (scheme) => scheme.toLowerCase());
  if (line.startsWith("ss://")) return ssLink(line);
  if (line.startsWith("ssr://")) return ssrLink(line);
  if (line.startsWith("vmess://") && !line.slice(8).includes("@")) {
    const v = JSON.parse(decode(line.slice(8).split("#")[0]));
    const node = {
      name: v.ps || v.add,
      type: "vmess",
      server: v.add,
      port: Number(v.port),
      uuid: v.id,
      alterId: Number(v.aid || 0),
      cipher: v.scy || "auto",
      udp: true,
    };
    tls(node, v);
    transport(node, { ...v, type: v.net || "tcp", headerType: v.type });
    return node;
  }
  const url = new URL(line),
    v = Object.fromEntries(url.searchParams);
  const kind = url.protocol.slice(0, -1).toLowerCase();
  const node = {
    name: unescape(url.hash.slice(1)) || url.hostname,
    type: kind === "hy2" ? "hysteria2" : kind,
    ...address(url),
    udp: true,
  };
  if (["vmess", "vless"].includes(kind)) {
    node.uuid = unescape(url.username);
    if (kind === "vmess") {
      node.alterId = Number(v.alterId || 0);
      node.cipher = v.encryption || "auto";
    }
    if (kind === "vless" && v.flow) node.flow = v.flow;
    tls(node, v);
    transport(node, v);
  } else if (kind === "trojan") {
    node.password = unescape(url.username);
    tls(node, v, true);
    transport(node, v);
  } else if (["hysteria2", "hy2"].includes(kind)) {
    node.password = unescape(
      url.username + (url.password ? ":" + url.password : ""),
    );
    if (v.sni) node.sni = v.sni;
    if (v.obfs) node.obfs = v.obfs;
    if (v["obfs-password"]) node["obfs-password"] = v["obfs-password"];
    if (["1", "true"].includes(v.insecure)) node["skip-cert-verify"] = true;
  } else if (kind === "tuic") {
    node.uuid = unescape(url.username);
    node.password = unescape(url.password);
    if (v.sni) node.sni = v.sni;
    if (v.alpn) node.alpn = v.alpn.split(",");
    if (v.congestion_control)
      node["congestion-controller"] = v.congestion_control;
  } else throw Error("Unsupported protocol");
  return node;
}

export function parseSubscription(input) {
  if (
    typeof input !== "string" ||
    new TextEncoder().encode(input).length > MAX_SUBSCRIPTION_BYTES
  )
    throw Error("节点订阅超过 2 MiB。");
  let text = input.replace(/^\uFEFF/, "").trim(),
    encoded = false;
  for (
    let i = 0;
    i < 3 && !protocols.test(text) && /^[A-Za-z0-9+/_=\s-]+$/.test(text);
    i++
  ) {
    try {
      text = decode(text.replace(/\s/g, "")).trim();
      encoded = true;
    } catch {
      break;
    }
  }
  let proxies,
    skipped = 0,
    format;
  if (protocols.test(text)) {
    const lines = text
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("#"));
    if (lines.length > 2000) throw Error("订阅最多支持 2000 个节点。");
    proxies = [];
    for (const line of lines) {
      try {
        if (!protocols.test(line)) throw Error();
        proxies.push(uri(line));
      } catch {
        skipped++;
      }
    }
    format = encoded ? "base64-uri" : "uri";
  } else {
    let data;
    try {
      data = parse(text, {
        merge: true,
        maxAliasCount: 100,
        logLevel: "silent",
        prettyErrors: false,
      });
    } catch {
      throw Error(
        "订阅格式无法识别，支持 Mihomo YAML、Base64 和常见节点链接。",
      );
    }
    proxies = Array.isArray(data?.proxies)
      ? data.proxies
      : Array.isArray(data?.payload)
        ? data.payload
        : Array.isArray(data)
          ? data
          : [];
    format = encoded ? "base64-yaml" : "mihomo";
  }
  if (proxies.length > 2000) throw Error("订阅最多支持 2000 个节点。");
  const valid = proxies
    .filter(
      (p) =>
        p &&
        typeof p.name === "string" &&
        p.name.length > 0 &&
        p.name.length <= 300 &&
        typeof p.type === "string" &&
        typeof p.server === "string" &&
        p.server.length > 0 &&
        Number.isInteger(Number(p.port)) &&
        Number(p.port) > 0 &&
        Number(p.port) <= 65535,
    )
    .map((p) => ({ ...p, port: Number(p.port) }));
  skipped += proxies.length - valid.length;
  if (!valid.length)
    throw Error(
      "没有识别到可用节点，请提供 Mihomo YAML 或支持的 Base64 / 节点链接订阅。",
    );
  return { proxies: valid, format, skipped };
}

export function nodeInventory(proxies, providerIndex = 0) {
  return proxies.map((p, i) => ({
    id: `P${providerIndex + 1}:${i}`,
    provider: providerIndex,
    name: p.name,
    server: p.server,
    port: p.port,
    latencyMs: null,
  }));
}
