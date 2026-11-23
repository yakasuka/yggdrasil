// Shareable configuration codes.
//
// A code is 18 random bytes rendered as 36 lowercase hex characters (144 bits).
// The code itself is the only bearer token: anyone holding it can read the
// saved choices, so it must never be derived from user data. Airport URLs are
// excluded by default and only included when the sharer explicitly opts in.
import { LIFETIMES } from "./profile.js";
import { STRATEGIES, CORE_STRATEGY_IDS, ruleModules } from "./compiler.js";

export const SHARE_CODE_LENGTH = 36;
export const SHARE_CODE_RE = /^[0-9a-f]{36}$/i;

// Whitelist of profile fields a code may carry. Nothing else is ever stored.
export const SHARE_FIELDS = [
  "version",
  "title",
  "countries",
  "other",
  "strategies",
  "defaultStrategy",
  "appsMode",
  "apps",
  "appPolicy",
  "modules",
  "port",
  "allowLan",
  "lifetime",
];

export function newShareCode(cryptoObject = globalThis.crypto) {
  const bytes = new Uint8Array(18);
  cryptoObject.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Accept a bare code, a full share URL, or a pasted host/path. Whitespace and
// line breaks from chat apps are ignored; nothing else is guessed.
export function parseShareCode(input) {
  if (typeof input !== "string") return null;
  const raw = input.trim();
  if (!raw) return null;
  if (SHARE_CODE_RE.test(raw)) return raw.toLowerCase();
  for (const candidate of [raw, `https://${raw}`]) {
    try {
      const path = new URL(candidate).pathname;
      const match = path.match(/\/(?:api\/presets|p)\/([0-9a-f]{36})\/?$/i);
      if (match) return match[1].toLowerCase();
    } catch {}
  }
  const compact = raw.replace(/\s+/g, "");
  return SHARE_CODE_RE.test(compact) ? compact.toLowerCase() : null;
}

const copy = (value) =>
  Array.isArray(value)
    ? [...value]
    : value && typeof value === "object"
      ? { ...value }
      : value;

// Pick only allowed fields. Airport URLs are copied only on explicit request.
export function pickShareable(profile, includeProviders = false) {
  if (!profile || typeof profile !== "object") return null;
  const out = {};
  for (const key of SHARE_FIELDS)
    if (Object.hasOwn(profile, key)) out[key] = copy(profile[key]);
  if (includeProviders && Array.isArray(profile.providers))
    out.providers = profile.providers
      .slice(0, 10)
      .map((p) => ({
        name: String(p?.name ?? "").slice(0, 40),
        url: String(p?.url ?? "").slice(0, 4096),
      }));
  return out;
}

export function shareIncludesProviders(shared) {
  return Array.isArray(shared?.providers) && shared.providers.length > 0;
}

const ids = (value, allowed, fallback) =>
  Array.isArray(value)
    ? [...new Set(value.filter((id) => allowed.includes(id)))]
    : fallback;
const bool = (value, fallback) =>
  typeof value === "boolean" ? value : fallback;

function validProviders(value, fallback) {
  if (!Array.isArray(value) || !value.length || value.length > 10) return fallback;
  const seen = new Set();
  const result = [];
  for (const item of value) {
    const name = typeof item?.name === "string" ? item.name.trim() : "";
    const url = typeof item?.url === "string" ? item.url.trim() : "";
    if (!name || name.length > 40 || url.length > 4096 || seen.has(url)) return fallback;
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password)
        return fallback;
      parsed.hash = "";
      result.push({ name, url: parsed.href });
      seen.add(parsed.href);
    } catch {
      return fallback;
    }
  }
  return result;
}

// Merge saved choices into the current profile. Unknown IDs from an older or
// newer catalog are dropped instead of breaking the wizard. Missing/invalid
// fields fall back to what the user already has on screen.
export function applyShare(base, shared, model) {
  if (!shared || typeof shared !== "object" || shared.version !== 2)
    throw Error("分享码内容无效或版本不受支持。");
  const next = { ...base };
  const knownRegions = model.regions.map((r) => r.id);
  const knownApps = model.apps.map((a) => a.id);
  const knownStrategies = [...CORE_STRATEGY_IDS, ...STRATEGIES.map((s) => s.id)];
  const knownModules = ruleModules(model);

  const countries = ids(shared.countries, knownRegions, base.countries);
  const other = bool(shared.other, base.other);
  if (countries.length || other) {
    next.countries = countries;
    next.other = other;
  }
  next.title =
    typeof shared.title === "string" &&
    shared.title.trim() &&
    shared.title.length <= 60
      ? shared.title.trim()
      : base.title;
  next.strategies = [
    ...new Set([
      ...ids(shared.strategies, knownStrategies, base.strategies),
      ...CORE_STRATEGY_IDS,
    ]),
  ];
  next.modules = ids(shared.modules, knownModules, base.modules);
  next.appsMode = shared.appsMode === "all" ? "all" : "custom";
  next.apps =
    next.appsMode === "all"
      ? knownApps
      : ids(shared.apps, knownApps, base.apps);
  const defaultIds = ["manual", ...STRATEGIES.map((s) => s.id)];
  next.defaultStrategy =
    defaultIds.includes(shared.defaultStrategy) &&
    (shared.defaultStrategy === "manual" ||
      next.strategies.includes(shared.defaultStrategy))
      ? shared.defaultStrategy
      : base.defaultStrategy;
  const allowedPolicies = [
    "proxy",
    "direct",
    "reject",
    ...(next.other ? ["region:OTHER"] : []),
    ...next.countries.map((id) => "region:" + id),
  ];
  const policies = shared.appPolicy && typeof shared.appPolicy === "object" ? shared.appPolicy : {};
  next.appPolicy = Object.fromEntries(
    next.apps.map((id) => {
      const value = Object.hasOwn(policies, id) ? policies[id] : "proxy";
      return [id, allowedPolicies.includes(value) ? value : "proxy"];
    }),
  );
  const port = Number(shared.port);
  if (Number.isInteger(port) && port >= 1024 && port <= 65535) next.port = port;
  if (LIFETIMES.some((x) => x.id === shared.lifetime)) next.lifetime = shared.lifetime;
  next.allowLan = bool(shared.allowLan, base.allowLan);
  // Airport URLs are private: keep what the importer already typed unless the
  // sharer deliberately included them.
  next.providers = shareIncludesProviders(shared)
    ? validProviders(shared.providers, base.providers)
    : base.providers;
  return next;
}
