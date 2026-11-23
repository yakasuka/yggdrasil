import { parse, stringify } from "yaml";
import catalog from "./catalog.json" with { type: "json" };
import { filename, lifetime } from "./profile.js";
import { classifyNodes } from "./nodes.js";
import { renderFromTemplate } from "./template-render.js";
export { catalog };
export const STRATEGIES = [
  {
    id: "auto",
    name: "♻️ 自动选择",
    label: "自动选择",
    description: "根据统一延迟选择节点",
    type: "url-test",
  },
  {
    id: "fallback",
    name: "🔯 故障转移",
    label: "故障转移",
    description: "按顺序使用可用节点",
    type: "fallback",
  },
  {
    id: "balanced",
    name: "🔮 负载均衡",
    label: "一致性哈希",
    description: "同一目标尽量保持相同出口",
    type: "load-balance",
    strategy: "consistent-hashing",
  },
  {
    id: "download",
    name: "⚖️ 下载均衡",
    label: "轮询分配",
    description: "将不同连接分散到不同节点",
    type: "load-balance",
    strategy: "round-robin",
  },
];
// The two select groups the template always contains. They are shown in the
// wizard as fixed strategy cards; the backend maps these IDs to the real group
// names from the template instead of inventing display strings.
export const CORE_STRATEGY_IDS = ["gateway", "manual"];

// The authoritative strategy list comes from the derived catalog (template).
// STRATEGIES above is only a curated display/type fallback for the four
// well-known IDs; a brand-new strategy group added to the template carries its
// own type/name/label/description, so this resolver always returns a complete
// definition and never drops an unknown strategy.
const humanizeStrategy = (id) =>
  String(id).replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
export const strategyDefs = (model = catalog) =>
  (model.strategies || []).map((s) => {
    const legacy = STRATEGIES.find((x) => x.id === s.id) || {};
    return {
      ...legacy,
      ...s,
      label: s.label || legacy.label || humanizeStrategy(s.id),
      description: s.description || legacy.description || "来自示例模板的自动策略组。",
      type: s.type || legacy.type || "url-test",
    };
  });
export const strategyIds = (model = catalog) => [
  ...CORE_STRATEGY_IDS,
  ...strategyDefs(model).map((s) => s.id),
];
// Rule modules are the template-authored rule groups (private / china / gfw /
// game / community rule-sets ...). They are presented as toggle blocks in the
// configurator. IDs come from the catalog so a remote template can add or drop
// a module without any browser change; this table only supplies display text.
export const RULE_MODULES = [
  {
    id: "private",
    label: "私有网络直连",
    description: "内网地址不经过代理，避免本地流量外泄。",
    symbol: "🏠",
  },
  {
    id: "china",
    label: "中国大陆直连",
    description: "国内域名与 IP 直连，含 Google 中国服务。",
    symbol: "🇨🇳",
  },
  {
    id: "gfw",
    label: "受限制域名",
    description: "GFW 名单内的域名走代理出口。",
    symbol: "🧱",
  },
  {
    id: "game-direct",
    label: "国服游戏直连",
    description: "国服游戏与下载流量直连，降低延迟。",
    symbol: "🎮",
  },
  {
    id: "direct-extra",
    label: "增强直连规则集",
    description: "社区维护的直连域名与 IP 规则集。",
    symbol: "↘️",
  },
  {
    id: "proxy-extra",
    label: "增强代理规则集",
    description: "社区维护的代理域名与 IP 规则集。",
    symbol: "🌍",
  },
  {
    id: "ports",
    label: "特殊端口直连",
    description: "按端口匹配的直连规则集。",
    symbol: "🔌",
  },
];
// Actual module IDs present in a given model. Derived from the catalog, never
// hardcoded, so a new template module shows up automatically.
export const ruleModules = (model = catalog) => [
  ...new Set(model.orderedRules.filter((r) => r.module).map((r) => r.module)),
];

// Display text for a module ID, resolved in three tiers so a module added to
// the template is NEVER dropped from the picker:
//   1. x-configurator metadata authored on the provider/rule in the template
//   2. the legacy RULE_MODULES table (keeps the current seven modules curated)
//   3. a generic fallback derived from the ID itself
// `model.moduleMeta` is optional; older catalogs simply skip tier 1.
const humanize = (id) =>
  String(id)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
export const moduleView = (id, model = catalog) => {
  const authored = model.moduleMeta?.[id] || {};
  const legacy = RULE_MODULES.find((m) => m.id === id) || {};
  return {
    id,
    label: authored.label || legacy.label || humanize(id),
    description:
      authored.description ||
      legacy.description ||
      "模板自定义规则模块，规则来自示例模板。",
    symbol: authored.symbol || legacy.symbol || "🧩",
  };
};
export class ConfigError extends Error {
  constructor(message, field = "") {
    super(message);
    this.name = "ConfigError";
    this.field = field;
  }
}
const fail = (m, f) => {
  throw new ConfigError(m, f);
};
const unique = (a) => [...new Set(a)];
export function defaults(model = catalog) {
  return {
    version: 2,
    title: "",
    providers: [{ name: "", url: "" }],
    countries: [],
    // Match the example template: both select groups and all four automatic
    // strategies start enabled. The select groups are fixed in the wizard;
    // automatic strategies can still be switched off there.
    other: true,
    strategies: strategyIds(model),
    // 节点选择是所有规则的入口组，也是客户端里唯一需要切换的地方。
    defaultStrategy: "gateway",
    appsMode: "all",
    apps: model.apps.map((a) => a.id),
    appPolicy: {},
    modules: ruleModules(model),
    // Widget grid order, one array per group. Defaults follow the catalog;
    // the user can reorder cards in the iOS-style edit mode.
    order: {
      regions: [...model.regions.map((r) => r.id), "OTHER"],
      strategies: strategyIds(model),
      apps: model.apps.map((a) => a.id),
      modules: ruleModules(model),
    },
    port: 7890,
    allowLan: true,
    lifetime: "30d",
  };
}
export function normalizeProviders(input) {
  if (!Array.isArray(input) || !input.length || input.length > 10)
    fail("请添加 1–10 个机场订阅。", "providers");
  const names = new Set(),
    urls = new Set();
  return input.map((v, i) => {
    const name = typeof v?.name === "string" ? v.name.trim() : "",
      raw = typeof v?.url === "string" ? v.url.trim() : "";
    if (!name || name.length > 40 || /[\x00-\x1f]/.test(name))
      fail(`第 ${i + 1} 个订阅名称需要 1–40 个字符。`, "providers");
    let url;
    try {
      url = new URL(raw);
    } catch {
      fail(`第 ${i + 1} 个订阅地址格式不正确。`, "providers");
    }
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      raw.length > 4096
    )
      fail("订阅地址需要有效的 HTTP / HTTPS 链接。", "providers");
    url.hash = "";
    if (names.has(name.toLowerCase()) || urls.has(url.href))
      fail("订阅名称或订阅链接重复。", "providers");
    names.add(name.toLowerCase());
    urls.add(url.href);
    return { name, url: url.href };
  });
}
function selection(value, allowed, field, max = 1000) {
  if (
    !Array.isArray(value) ||
    value.length > max ||
    value.some((id) => !allowed.includes(id))
  )
    fail("存在无效的选择项，请刷新页面。", field);
  return unique(value);
}
// Order of the four widget groups. Invalid ids are dropped and any id the
// template knows about but the saved profile predates is appended, so a new
// region/app/strategy/module always shows up instead of being lost by sorting.
function orderIds(value, allowed, fallback) {
  const kept = Array.isArray(value)
    ? value.filter((id) => allowed.includes(id))
    : [...fallback];
  return unique([...kept, ...allowed.filter((id) => !kept.includes(id))]);
}
// Stable sort by a saved id order; ids not present in `order` keep their
// relative position at the end. Shared by the compiler and the wizard panels.
export function sortByOrder(items, order = [], idOf = (x) => x.id) {
  const rank = new Map(order.map((id, i) => [id, i]));
  return [...items].sort((a, b) => {
    const ai = rank.get(idOf(a)),
      bi = rank.get(idOf(b));
    if (ai === undefined && bi === undefined) return 0;
    if (ai === undefined) return 1;
    if (bi === undefined) return -1;
    return ai - bi;
  });
}
export function normalize(input, model = catalog, { migrate = false } = {}) {
  if (!input || input.version !== 2) fail("配置版本不受支持，请刷新页面。");
  for (const field of ["rules", "custom", "fallback"])
    if (Object.hasOwn(input, field))
      fail("规则和最终出口由模板统一维护。", "rules");
  const p = defaults(model);
  p.title = typeof input.title === "string" ? input.title.trim() : "";
  if (!p.title || p.title.length > 60 || /[\x00-\x1f]/.test(p.title))
    fail("请填写 1–60 个字符的配置名称。", "title");
  p.providers = normalizeProviders(input.providers);
  const knownStrategies = strategyIds(model);
  p.strategies = unique([
    ...selection(input.strategies, knownStrategies, "strategies", knownStrategies.length),
    // Old saved profiles predate these IDs; both select groups are always
    // present in the generated YAML, so keep them enabled regardless.
    ...CORE_STRATEGY_IDS,
  ]);
  p.defaultStrategy = input.defaultStrategy;
  // 节点选择是固定入口组，始终可用；其余策略需已启用。
  const defaultAllowed = knownStrategies;
  if (
    !defaultAllowed.includes(p.defaultStrategy) ||
    (!CORE_STRATEGY_IDS.includes(p.defaultStrategy) &&
      !p.strategies.includes(p.defaultStrategy))
  )
    fail("请选择已启用的默认策略。", "strategies");
  const knownCountries = model.regions.map((r) => r.id);
  const countries = migrate
    ? (input.countries || []).filter((x) => knownCountries.includes(x))
    : input.countries;
  p.countries = selection(countries, knownCountries, "countries");
  p.other = input.other === true;
  if (migrate && !p.countries.length && !p.other) p.other = true;
  if (!p.countries.length && !p.other)
    fail("至少保留一个有节点的地区。", "countries");
  p.appsMode = input.appsMode === "all" ? "all" : "custom";
  const knownApps = model.apps.map((a) => a.id);
  p.apps =
    p.appsMode === "all"
      ? knownApps
      : selection(
          migrate
            ? (input.apps || []).filter((x) => knownApps.includes(x))
            : input.apps,
          knownApps,
          "apps",
        );
  p.appPolicy = Object.fromEntries(
    p.apps.map((id) => {
      let value = Object.hasOwn(input.appPolicy || {}, id)
        ? input.appPolicy[id]
        : "proxy";
      if (
        migrate &&
        typeof value === "string" &&
        value.startsWith("region:") &&
        !p.countries.includes(value.slice(7))
      )
        value = "proxy";
      if (
        ![
          "proxy",
          "direct",
          "reject",
          ...(p.other ? ["region:OTHER"] : []),
          ...p.countries.map((x) => "region:" + x),
        ].includes(value)
      )
        fail("APP 默认地区不在已保留的地区中。", "apps");
      return [id, value];
    }),
  );
  // Older saved tokens have no `modules` field. Treat an absent value as
  // "every module" so existing subscription links keep working unchanged.
  const knownModules = ruleModules(model);
  p.modules =
    input.modules === undefined
      ? knownModules
      : selection(input.modules, knownModules, "modules");
  p.port = Number(input.port);
  if (!Number.isInteger(p.port) || p.port < 1024 || p.port > 65535)
    fail("代理端口应为 1024–65535。", "port");
  p.allowLan = input.allowLan === true;
  p.lifetime = input.lifetime;
  try {
    lifetime(p.lifetime);
  } catch {
    fail("请选择有效的 Token 持续时间。", "lifetime");
  }
  // Widget order is cosmetic: normalise against the same allow-lists so a
  // stale/over-long saved order can never inject unknown ids or break compile.
  const savedOrder = input.order && typeof input.order === "object" ? input.order : {};
  p.order = {
    regions: orderIds(savedOrder.regions, [...knownCountries, "OTHER"], p.order.regions),
    strategies: orderIds(savedOrder.strategies, knownStrategies, p.order.strategies),
    apps: orderIds(savedOrder.apps, knownApps, p.order.apps),
    modules: orderIds(savedOrder.modules, knownModules, p.order.modules),
  };
  return p;
}
const strip = (p) => p.replaceAll("(?i)", "");
export function regionFilter(regions, model = catalog, { other = false } = {}) {
  const clean = strip(model.cleanFilter);
  const expression = (r) => "(?:" + strip(r.filter) + ")";
  if (other)
    return (
      "(?i)^(?=" +
      clean +
      ")(?!.*(?:" +
      model.regions.map(expression).join("|") +
      ")).*$"
    );
  const clauses = regions.map((r) => {
    const index = model.regions.findIndex((item) => item.id === r.id);
    const earlier = model.regions.slice(0, index).map(expression).join("|");
    return (
      "^(?=" +
      clean +
      ")(?=.*" +
      expression(r) +
      ")" +
      (earlier ? "(?!.*(?:" + earlier + "))" : "") +
      ".*$"
    );
  });
  return "(?i)(?:" + clauses.join("|") + ")";
}

const hash = async (text) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
    ),
  )
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
export async function compile(input, model = catalog, options = {}) {
  const p = normalize(input, model, options),
    g = model.groups,
    regions = sortByOrder(
      model.regions.filter((r) => p.countries.includes(r.id)),
      p.order.regions,
    );
  const allFilter =
    "(?i)(?:" +
    [
      ...(regions.length ? [strip(regionFilter(regions, model))] : []),
      ...(p.other ? [strip(regionFilter([], model, { other: true }))] : []),
    ].join("|") +
    ")";
  // Derive active strategies from the catalog so a strategy added to the
  // template is compiled automatically; legacy table supplies type fallback.
  const active = sortByOrder(
    strategyDefs(model).filter((s) => p.strategies.includes(s.id)),
    p.order.strategies,
  );
  // preferred 只决定「节点选择」组在客户端里默认选中哪一项。选择 gateway
  // 时保持模板原样（先进入「手动切换」挑节点），不把入口组自己塞进成员，
  // 避免自引用；所有规则仍然统一走节点选择。
  const preferred =
    p.defaultStrategy === "gateway"
      ? g.manual
      : p.defaultStrategy === "manual"
        ? g.manual
        : active.find((s) => s.id === p.defaultStrategy)?.name || g.manual;
  const exits = unique([
    preferred,
    g.manual,
    ...active.map((s) => s.name),
    ...regions.map((r) => r.name),
    ...(p.other ? [g.other] : []),
    "DIRECT",
    "REJECT",
  ]);
  const groups = [
    // Template-authored switch groups are always kept: they are part of the
    // example config even though no rule points at them.
    { name: g.hermes || "✨ Hermes", type: "select", proxies: exits },
    { name: g.gateway, type: "select", proxies: exits },
    { name: g.manual, type: "select", "include-all": true, filter: allFilter },
  ];
  for (const s of active)
    groups.push({
      name: s.name,
      type: s.type,
      "include-all": true,
      filter: allFilter,
      url: model.testUrl,
      interval: 300,
      timeout: 5000,
      lazy: true,
      ...(s.id === "auto" ? { tolerance: 50 } : {}),
      ...(s.strategy ? { strategy: s.strategy } : {}),
    });
  for (const r of regions)
    groups.push({
      name: r.name,
      type: "select",
      "include-all": true,
      filter: regionFilter([r], model),
      ...(r.icon ? { icon: r.icon } : {}),
    });
  if (p.other)
    groups.push({
      name: g.other,
      type: "select",
      "include-all": true,
      filter: regionFilter([], model, { other: true }),
    });
  const optionsList = unique([
    g.gateway,
    ...regions.map((r) => r.name),
    ...(p.other ? [g.other] : []),
    "REJECT",
    "DIRECT",
  ]);
  const apps = sortByOrder(
    model.apps.filter((a) => p.apps.includes(a.id)),
    p.order.apps,
  );
  for (const app of apps) {
    // Author-authored switch/entry groups (e.g. ✨ Hermes) are already emitted
    // as core groups above. Emitting them again would create a duplicate group
    // name; their chosen exit is applied to the core group below instead.
    if (app.entry) continue;
    const policy = p.appPolicy[app.id];
    const target =
      policy === "direct"
        ? "DIRECT"
        : policy === "reject"
          ? "REJECT"
          : policy === "region:OTHER"
            ? g.other
            : policy.startsWith("region:")
              ? regions.find((r) => r.id === policy.slice(7)).name
              : g.gateway;
    groups.push({
      name: app.name,
      type: "select",
      proxies: app.firstProxyDirect
        ? unique(["DIRECT", target, ...optionsList])
        : unique([target, ...optionsList]),
      ...(app.icon ? { icon: app.icon } : {}),
    });
  }
  const selected = model.orderedRules.filter(
    (r) =>
      (!r.app || p.apps.includes(r.app)) &&
      (!r.module || p.modules.includes(r.module)),
  );
  const rules = unique(
    [
      ...selected.filter((r) => r.module === "private"),
      ...selected.filter((r) => r.module !== "private"),
    ]
      .map((r) => r.rule)
      .concat("MATCH," + g.final),
  );
  if (selected.some((r) => r.rule.split(",")[2] === g.ports))
    groups.push({ name: g.ports, type: "select", proxies: optionsList });
  groups.push({
    name: g.china || "🏯 China",
    type: "select",
    proxies: unique(["DIRECT", ...optionsList]),
  });
  groups.push({
    name: g.final,
    type: "select",
    proxies: [g.gateway],
  });
  // Switch/entry groups shown on the APP page (e.g. ✨ Hermes) map to a core
  // group that already exists. Apply the user's chosen exit to that core
  // group's first proxy so the picker actually controls the generated YAML.
  for (const app of apps.filter((a) => a.entry)) {
    const core = groups.find((x) => x.name === app.name);
    const policy = p.appPolicy[app.id];
    if (!core || !policy || policy === "proxy") continue;
    const exit =
      policy === "direct"
        ? "DIRECT"
        : policy === "reject"
          ? "REJECT"
          : policy === "region:OTHER"
            ? g.other
            : policy.startsWith("region:")
              ? regions.find((r) => r.id === policy.slice(7))?.name
              : null;
    if (exit && core.proxies.includes(exit))
      core.proxies = unique([exit, ...core.proxies.filter((x) => x !== exit)]);
  }
  const entries = await Promise.all(
    p.providers.map(async (v, i) => [
      "P" + (i + 1) + " " + v.name,
      {
        type: "http",
        url: v.url,
        path: "./providers/yggdrasil-" + (await hash(v.url)) + ".yaml",
        interval: 86400,
        proxy: "DIRECT",
        override: { "additional-prefix": "[P" + (i + 1) + "] " },
        "health-check": {
          enable: true,
          url: model.testUrl,
          interval: 300,
          lazy: true,
          timeout: 5000,
          "expected-status": 204,
        },
      },
    ]),
  );
  const providers = new Set([
    ...rules
      .filter((r) => r.startsWith("RULE-SET,"))
      .map((r) => r.split(",")[1]),
    // Keep every rule provider authored in the template whose module is on,
    // even when its rule is commented out there (e.g. Cargo Downloads).
    ...model.providerModules
      .filter((x) => p.modules.includes(x.module))
      .map((x) => x.name),
  ]);
  const inlineNames = new Set();
  const inline = options.inlineProxies?.flatMap((nodes, i) => {
    const kept = new Set(
      classifyNodes(
        nodes.map((node, id) => ({ id, name: node.name })),
        model,
      )
        .filter(
          (node) =>
            p.countries.includes(node.region) ||
            (p.other && node.region === "OTHER"),
        )
        .map((node) => node.id),
    );
    return nodes
      .filter((_, id) => kept.has(id))
      .map((node) => {
        const base = `[P${i + 1}] ${node.name}`;
        let name = base,
          suffix = 2;
        while (inlineNames.has(name)) name = base + " · " + suffix++;
        inlineNames.add(name);
        return { ...node, name };
      });
  });
  if (inline && !inline.length)
    fail("所选地区当前没有可用节点，请重新选择地区。", "countries");
  const config = {
    "mixed-port": p.port,
    "allow-lan": p.allowLan,
    mode: "rule",
    "log-level": "info",
    "unified-delay": true,
    "geodata-mode": true,
    "geo-auto-update": true,
    "geo-update-interval": 24,
    "geox-url": {
      geoip:
        "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip.dat",
      geosite:
        "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat",
    },
    profile: { "store-selected": true },
    ...(inline
      ? { proxies: inline }
      : { "proxy-providers": Object.fromEntries(entries) }),
    "proxy-groups": groups,
    ...(providers.size
      ? {
          "rule-providers": Object.fromEntries(
            model.providerModules
              .filter((x) => providers.has(x.name))
              .map((x) => [x.name, x.value]),
          ),
        }
      : {}),
    rules,
  };
  assertReferences(config);
  // Render by editing the author's template in place: preserves all section
  // banners, inline comments, flow-style one-liners and GEOSITE/GEOIP rules.
  // Falls back to a parse of the built config if a template is unavailable.
  const template = model.templateText;
  const yaml = template
    ? renderFromTemplate(template, config, p, model)
    : parseConfigFallback(config, p, model);
  return {
    yaml,
    config,
    profile: p,
    filename: filename(p.title),
    summary: {
      providers: p.providers.length,
      apps: apps.length,
      regions: regions.length + (p.other ? 1 : 0),
      groups: groups.length,
      rules: rules.length,
      bytes: new TextEncoder().encode(yaml).length,
    },
  };
}
// Used only when a caller supplies a catalog without templateText (legacy /
// synthetic models). The normal path always renders the real template.
function parseConfigFallback(config, p, model) {
  return (
    "# Ratatoskr · " +
    p.title +
    "\n# Yggdrasil catalog " +
    model.version +
    " | Mihomo / Clash Meta\n" +
    stringify(config, { lineWidth: 0, aliasDuplicateObjects: false })
  );
}

export function assertReferences(config) {
  const names = config["proxy-groups"].map((g) => g.name);
  if (new Set(names).size !== names.length)
    throw Error("Duplicate group names");
  const valid = new Set([...names, "DIRECT", "REJECT"]);
  for (const g of config["proxy-groups"])
    for (const p of g.proxies || [])
      if (!valid.has(p) || p === g.name) throw Error("Invalid group reference");
  for (const rule of config.rules) {
    const p = rule.split(",");
    if (p.at(-1) === "no-resolve") p.pop();
    if (!valid.has(p.at(-1))) throw Error("Invalid rule target");
    if (
      p[0] === "RULE-SET" &&
      !Object.hasOwn(config["rule-providers"] || {}, p[1])
    )
      throw Error("Missing rule provider");
  }
}
