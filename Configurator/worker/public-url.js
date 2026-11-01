export const literalIP = (hostname) =>
  /^\d+\.\d+\.\d+\.\d+$/.test(hostname) || hostname.includes(":");

export function isPublicAddress(address) {
  const host = address.replace(/^\[|\]$/g, "").toLowerCase();
  if (host.includes(":"))
    return /^[23][a-f0-9]{3}:/.test(host) && !host.startsWith("2001:db8:");
  const p = host.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255))
    return false;
  const [a, b] = p;
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 192 && b === 0)
  );
}

export function publicURL(value) {
  const url = new URL(value);
  const host = url.hostname.replace(/\.$/, "").toLowerCase();
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    (!host.includes(".") && !host.includes(":")) ||
    /(?:^|\.)(?:localhost|local|internal|invalid|test)$/.test(host)
  )
    throw Error("订阅地址需要可公开访问的域名。");
  if (literalIP(host) && !isPublicAddress(host))
    throw Error("不能访问私有网络地址。");
  return url;
}
