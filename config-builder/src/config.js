// One bundle serves both Cloudflare Pages and GitHub Pages. Both hosts only
// deliver static files; every request goes to the self-hosted service below.
//
// Resolution order:
//   1. <meta name="yggdrasil:service" content="https://api.example.com">
//      Edit the deployed HTML to switch backends without rebuilding.
//   2. SERVICE_BASE_URL injected at build time by scripts/build.mjs.
//   3. Same origin, for a reverse proxy that serves UI and API together.
const META = "yggdrasil:service";
const PUBLIC_META = "yggdrasil:public";
let discovered = "";
let discoveredPublic = "";

function configured() {
  const meta =
    typeof document === "undefined"
      ? ""
      : document.querySelector(`meta[name="${META}"]`)?.content?.trim();
  const injected =
    typeof __SERVICE_BASE_URL__ === "string" ? __SERVICE_BASE_URL__ : "";
  return meta || injected || "";
}

// The public origin shown in subscription links. It can differ from the
// backend origin: a Pages domain redirects the config path to the backend via
// _redirects, keeping the service address out of links users copy around.
export function publicLinkBase() {
  const meta =
    typeof document === "undefined"
      ? ""
      : document.querySelector(`meta[name="${PUBLIC_META}"]`)?.content?.trim();
  const injected =
    typeof __PUBLIC_LINK_BASE__ === "string" ? __PUBLIC_LINK_BASE__ : "";
  const raw = meta || injected || discoveredPublic || "";
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.href.replace(/\/+$/, "");
  } catch {
    return "";
  }
}

// When neither the meta tag nor the build-time value is present, read the
// plain-URL service.json that ships next to both static sites. Editing that
// one file switches the backend without rebuilding any bundle.
export async function discoverService() {
  if (configured() || typeof location === "undefined") return "";
  try {
    const response = await fetch(new URL("../service.json", location.href), {
      credentials: "omit",
      cache: "no-store",
    });
    if (!response.ok) return "";
    const data = await response.json();
    const url = new URL(data.service);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    discovered = url.origin;
    if (data.public) discoveredPublic = String(data.public);
    return discovered;
  } catch {
    return "";
  }
}

export function serviceBase() {
  const fallback =
    typeof location === "undefined" ? "http://localhost:8788" : location.origin;
  const raw = configured() || discovered || fallback;
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return fallback;
    return url.origin;
  } catch {
    return fallback;
  }
}

// Cross-origin calls never carry cookies. The browser sends airport URLs only
// to the configured service, and Cloudflare / GitHub Pages never see them.
export function apiFetch(path, init = {}) {
  const target = /^https?:\/\//i.test(path) ? path : serviceBase() + path;
  return fetch(target, {
    credentials: "omit",
    cache: "no-store",
    ...init,
  });
}
