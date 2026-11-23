// Derive the configurator catalog directly from the Ratatoskr YAML template.
// The old shared/catalog.json was a hand-maintained snapshot that drifted away
// from the template (24 regions vs 6, stale rule-set names, missing apps).
// Keeping one source of truth means every edit to the template — regions,
// apps, icons, rules — shows up in the picker automatically.
import { parse } from "yaml";

// Fallback display labels for region codes. These are only used when the
// template does not author a label via `x-configurator: {label: ...}` on the
// region group. The region LIST always comes from the template's FilterRegions,
// so adding/removing a region there is reflected automatically even if its code
// is unknown here.
const REGION_LABELS = {
  HK: "香港", TW: "台湾", MO: "澳门", JP: "日本", KR: "韩国", SG: "新加坡",
  TH: "泰国", MY: "马来西亚", VN: "越南", PH: "菲律宾", ID: "印度尼西亚",
  IN: "印度", AU: "澳大利亚", US: "美国", CA: "加拿大", GB: "英国",
  DE: "德国", FR: "法国", NL: "荷兰", CH: "瑞士", RU: "俄罗斯",
  TR: "土耳其", BR: "巴西", AR: "阿根廷", OTHER: "其他地区",
};

// Category is derived from the group name only as a last-resort fallback.
// Authored `x-category` on the YAML node always wins, so an APP's placement is
// declared in the template (machine- and human-readable) rather than hard-coded
// here. No name is special-cased — e.g. Hermes is a switch entry and carries
// its own `x-category: 策略入口` in the template.
const category = (name) =>
  /OpenAI|Anthropic|AI/.test(name)
    ? "AI 与开发"
    : /OKX|Binance|Bybit|Crypto|Coin|Cryptocurrency/.test(name)
      ? "数字资产"
      : /YouTube|Netflix|Hulu|Prime|HBO|Disney|Twitch|Spotify|Bilibili|Entertainment|Media|News/.test(name)
        ? "影音娱乐"
        : /Steam|Epic|TapTap|Game/.test(name)
          ? "游戏与下载"
          : /Telegram|Discord|Chat|Social|Meta|TikTok|𝕏|Twitter|Communication/.test(name)
            ? "社交与通信"
            : "其他服务";

// Leading pictograph (one or more graphemes) used as the compact group name.
const leadingIcon = (value) =>
  String(value ?? "")
    .match(/^(\p{Extended_Pictographic}(?:\uFE0F)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F)?)*)\s*/u)?.[1] || "";

const flagFrom = (filter) =>
  String(filter ?? "").match(/[\u{1F1E6}-\u{1F1FF}]{2}/u)?.[0] || "🌐";

const stripIcon = (value) =>
  String(value ?? "")
    .replace(/^(\p{Extended_Pictographic}(?:\uFE0F)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F)?)*)\s*/u, "")
    .trim();

// Read optional author metadata from a YAML node. The template uses flow-style
// one-liners, where nested mappings (`x-configurator: {…}`) are not allowed —
// so flat `x-*` keys are the ergonomic form there. Both shapes are accepted:
//   {name: …, x-label: 法国, x-category: 开发工具}          (flow friendly)
//   {name: …, x-configurator: {label: 法国, category: …}}   (block style)
const X_KEYS = [
  "id", "label", "category", "description", "symbol", "flag",
  "module", "icon", "name",
];
const metaOf = (node) => {
  if (!node || typeof node !== "object") return {};
  const nested = node["x-configurator"];
  const flat = {};
  for (const key of X_KEYS) {
    const value = node["x-" + key];
    if (value !== undefined) flat[key] = value;
  }
  return nested && typeof nested === "object"
    ? { ...flat, ...nested }
    : flat;
};

const hash = async (text) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
    ),
  )
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);

/**
 * Build a schema-2 catalog from raw ratatoskr-template.yaml text.
 * Works in Node (build step / server) and in browsers (no fs dependency).
 */
export async function catalogFromYaml(text) {
  // The template carries a UTF-8 BOM so browsers show the Chinese comments
  // correctly when the raw .yaml is opened (GitHub Pages serves it without a
  // charset). Strip it before handing the text to the parser / catalog so no
  // derived artifact inherits it.
  text = text.replace(/^\uFEFF/, "");
  // Presentational metadata (`@meta` comments) lives OUTSIDE the Clash config
  // lines so the YAML stays clean and the generated config carries no x-*
  // keys. Before parsing, attach each `# @meta {...}` to the proxy-group line
  // immediately below it as x-* fields, so `metaOf()` keeps working unchanged.
  // This is data-driven: no name is special-cased in code.
  const META_COMMENT = /^\s*#\s*@meta\s+(\{.*\})\s*$/;
  const GROUP_LINE = /^\s*-\s*\{/;
  const NAME_IN_LINE = /name\s*:\s*([^,}]+)/;
  const unquote = (s) => s.trim().replace(/^(['"])|(['"])$/g, "");
  const pendingMeta = new Map(); // group name -> @meta object
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(META_COMMENT);
    if (!m) continue;
    let meta;
    try {
      meta = parse(m[1]);
    } catch {
      continue;
    }
    if (!meta || typeof meta !== "object") continue;
    // Scan forward past blank/comment lines to the next flow-map group.
    for (let j = i + 1; j < lines.length; j++) {
      if (!lines[j].trim() || /^\s*#/.test(lines[j])) continue;
      if (!GROUP_LINE.test(lines[j])) break;
      const nameMatch = lines[j].match(NAME_IN_LINE);
      if (nameMatch) pendingMeta.set(unquote(nameMatch[1]), meta);
      break;
    }
  }
  const t = parse(text, { merge: true, maxAliasCount: 100 });
  if (!Array.isArray(t["proxy-groups"]) || !Array.isArray(t.rules))
    throw Error("模板结构不受支持，缺少 proxy-groups 或 rules。");
  const groups = t["proxy-groups"];
  // Apply collected @meta to matching groups as x-* fields, so every
  // downstream `metaOf()` call sees the same shape as inline x-* keys.
  for (const g of groups) {
    const meta = pendingMeta.get(g.name);
    if (meta) for (const [key, value] of Object.entries(meta)) g["x-" + key] = value;
  }
  const named = (name) => groups.find((g) => g.name === name);

  // Core strategy groups are identified by their role in the template, not by
  // a hardcoded index, so renaming/reordering groups in YAML stays safe.
  const gateway =
    named("🎚️ 节点选择")?.name ||
    groups.find(
      (g) =>
        g.type === "select" &&
        Array.isArray(g.proxies) &&
        g.proxies.includes("🚀 手动切换") &&
        g.proxies.includes("🏁 Final"),
    )?.name ||
    "🎚️ 节点选择";
  const manual =
    groups.find((g) => g.name.includes("手动切换"))?.name || "🚀 手动切换";
  const final =
    groups.find((g) => g.name.includes("Final"))?.name || "🏁 Final";
  const ports =
    groups.find((g) => g.name.includes("特殊端口"))?.name || "🔌 特殊端口";
  const othersGroup = groups.find((g) => g.name.includes("Others"));
  // Core switch groups are located by their authored `x-id` first, so the
  // template declares what each group IS instead of the code guessing from its
  // name. Name-based lookup stays only as a fallback for older templates.
  const byId = (id) => groups.find((g) => metaOf(g).id === id);
  const hermes =
    byId("hermes")?.name ||
    groups.find((g) => g.name.includes("Hermes"))?.name ||
    "✨ Hermes";
  const china =
    byId("china")?.name ||
    groups.find((g) => g.name.includes("China"))?.name ||
    "🏯 China";
  const core = {
    gateway,
    manual,
    final,
    other: leadingIcon(othersGroup?.name) || "🌌",
    otherGroupName: othersGroup?.name || "🌌 Others",
    // The template's 🌌 Others group carries its own macOSicons icon. Keep it
    // so the "其他地区" row shows the author's icon instead of a generic globe.
    otherIcon: othersGroup?.icon || "",
    ports,
    hermes,
    china,
  };

  // Regions come from the template's FilterRegions anchors. Each region group
  // references one of these filters; the YAML parser resolves the alias to the
  // same string, so group.filter === filter identifies the matching group.
  const regionDefs = t.FilterRegions || {};
  const regionGroups = [];
  const regions = Object.entries(regionDefs).map(([id, filter]) => {
    const group = groups.find((g) => g.filter === filter);
    if (group) regionGroups.push(group);
    const meta = metaOf(group);
    return {
      id,
      // Template-authored label wins; the built-in table is only a fallback
      // so a brand-new country code still shows something readable.
      label: meta.label || REGION_LABELS[id] || id,
      flag: meta.flag || flagFrom(filter),
      // `name` is the short icon used inside the configurator's own generated
      // config. `groupName` is the faithful full name from the template, used
      // by the template renderer to keep the author's original group lines.
      name: leadingIcon(group?.name) || id,
      groupName: group?.name || leadingIcon(group?.name) || id,
      filter,
      icon: group?.icon || "",
    };
  });

  // Automatic strategies are the non-select proxy groups. Each carries the
  // semantics (type / strategy) the compiler needs plus optional display text
  // authored via `x-configurator`. A NEW strategy group added to the template
  // is therefore fully described by the catalog — no front-end/compiler edit.
  const strategyGroups = groups.filter((g) =>
    ["url-test", "fallback", "load-balance"].includes(g.type),
  );
  const usedStrategyIds = new Set();
  const strategies = strategyGroups.map((g) => {
    const meta = metaOf(g);
    const inferred =
      g.type === "url-test"
        ? "auto"
        : g.type === "fallback"
          ? "fallback"
          : g.strategy === "round-robin"
            ? "download"
            : "balanced";
    // Authored id wins; if a second group of the same type would collide,
    // fall back to a stable id derived from its name.
    let id = meta.id || inferred;
    if (usedStrategyIds.has(id)) id = stripIcon(g.name) || `${inferred}-${usedStrategyIds.size}`;
    usedStrategyIds.add(id);
    return {
      id,
      name: g.name,
      type: g.type,
      ...(g.strategy ? { strategy: g.strategy } : {}),
      icon: meta.icon || g.icon || "",
      label: meta.label || stripIcon(g.name) || id,
      description: meta.description || "来自示例模板的自动策略组。",
    };
  });

  // Rule sets and their module grouping come straight from rule-providers.
  // A provider may author its own module id / display text via
  // `x-configurator: {module, label, description, symbol}`; otherwise we infer
  // the module from the rule target and name so new rule sets still work.
  const providerModules = Object.entries(t["rule-providers"] || {}).map(
    ([name, value]) => {
      const target = t.rules
        .find((r) => r.startsWith("RULE-SET," + name + ","))
        ?.split(",")[2];
      const meta = metaOf(value);
      const module =
        meta.module ||
        (target === "DIRECT"
          ? "direct-extra"
          : /Port|端口/i.test(name)
            ? "ports"
            : "proxy-extra");
      return { name, value, module };
    },
  );

  // Display text for rule modules, authored on rule-providers. Feeds the
  // moduleView() resolver in compiler.js; unknown modules fall back to a
  // generic label there, so nothing is ever dropped from the UI.
  const moduleMeta = {};
  for (const p of providerModules) {
    const meta = metaOf(p.value);
    if (meta.label || meta.description || meta.symbol) {
      moduleMeta[p.module] = { ...(moduleMeta[p.module] || {}), ...meta };
    }
  }

  // Every select group written in the template is selectable, including
  // rule-less switch entries (they are total-node switches the author may wire
  // to a rule later). Only core/region/strategy groups are excluded — they have
  // their own pickers. Classification is data-driven: `x-category` on the group
  // wins; otherwise a rule-less entry defaults to 策略入口, and other groups fall
  // back to the name classifier. No specific name is special-cased in code.
  const reserved = new Set([
    gateway,
    manual,
    final,
    ports,
    china,
    // 🌌 Others is a REGION node group (it selects nodes outside the six
    // filter-defined countries), not an APP switch. It is surfaced on the
    // regions page as the "其他地区" option via core.other, so exclude its
    // full template name from the APP list — matching only the leading icon
    // ("🌌") left "🌌 Others" leaking into the APP picker.
    leadingIcon(othersGroup?.name),
    ...(othersGroup ? [othersGroup.name] : []),
    "🏮",
    ...regionGroups.map((g) => g.name),
    ...strategyGroups.map((g) => g.name),
  ]);
  const apps = groups
    .filter((g) => g.type === "select" && !reserved.has(g.name))
    .map((g) => {
      const rules = t.rules.filter((r) => r.split(",")[2] === g.name);
      const meta = metaOf(g);
      // A rule-less select group is a switch/entry; derive a stable id from its
      // name so it survives in profiles and shares. Category resolution order:
      // authored x-category > (rule-less entry ? 策略入口) > name classifier.
      const isEntry = rules.length === 0;
      const derivedCategory = category(g.name);
      return {
        id: meta.id || rules[0]?.split(",")[1] || stripIcon(g.name),
        name: g.name,
        label: meta.label || stripIcon(g.name),
        category:
          meta.category ||
          (isEntry && derivedCategory === "其他服务"
            ? "策略入口"
            : derivedCategory),
        icon: g.icon || "",
        // Preserve the template's initial option (some apps start at DIRECT).
        firstProxyDirect: g.proxies?.[0] === "DIRECT",
        // `entry` marks author-authored switch groups that have no rule yet.
        // They are selectable in the UI and written verbatim to the YAML.
        ...(isEntry ? { entry: true } : {}),
        rules,
      };
    });
  if (
    apps.some((a) => typeof a.id !== "string" || !a.id) ||
    new Set(apps.map((a) => a.id)).size !== apps.length
  )
    throw Error("APP ID 缺失或重复，请检查模板策略组与规则。");

  const appNames = new Map(apps.map((a) => [a.name, a.id]));
  const orderedRules = t.rules
    .filter((r) => !r.startsWith("MATCH,"))
    .map((rule) => {
      const [type, key, target] = rule.split(",");
      if (appNames.has(target)) return { rule, app: appNames.get(target) };
      const module =
        key === "private"
          ? "private"
          : type === "RULE-SET"
            ? providerModules.find((p) => p.name === key)?.module
            : ["cn", "google-cn"].includes(key)
              ? "china"
              : key === "gfw"
                ? "gfw"
                : "game-direct";
      if (!module) throw Error("存在无法分类的规则：" + rule);
      return { rule, module };
    });

  // Owner-facing view of the raw template. The dashboard needs every editable
  // knob — general settings, raw filters, full group properties, and all rule
  // lines including commented-out ones — while the compiler keeps using the
  // stable schema-2 fields above. Keeping this view additive means no existing
  // consumer has to change when the editor grows a new control.
  const general = {};
  for (const key of [
    "port", "socks-port", "allow-lan", "mode", "log-level",
    "external-controller", "unified-delay",
  ]) {
    if (key in t) general[key] = t[key];
  }
  const editorRules = [];
  let inRules = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^rules:\s*$/.test(line.trim())) { inRules = true; continue; }
    if (inRules && /^\S/.test(line)) break;
    if (!inRules) continue;
    const m = line.match(/^(\s*)(#\s*)?-\s+(.+?)\s*$/);
    if (!m) continue;
    const rule = m[3].trim();
    if (!/^(GEOSITE|RULE-SET|GEOIP|DOMAIN|IP|MATCH)/i.test(rule)) continue;
    const parts = rule.split(",");
    editorRules.push({
      rule,
      type: parts[0],
      key: parts[1] || "",
      target: parts[2] || "",
      extra: parts.slice(3).join(","),
      enabled: !m[2],
    });
  }
  const editor = {
    general,
    filters: {
      all: t.FilterAll || "",
      others: t.FilterOthers || "",
      regions: { ...(t.FilterRegions || {}) },
    },
    groups: groups.map((g) => ({
      name: g.name,
      type: g.type || "",
      proxies: Array.isArray(g.proxies) ? g.proxies.join(", ") : "",
      url: g.url || "",
      interval: g.interval ?? "",
      tolerance: g.tolerance ?? "",
      strategy: g.strategy || "",
      icon: g.icon || "",
      filter: g.filter == null ? "" : String(g.filter),
      includeAll: !!g["include-all"],
    })),
    rules: editorRules,
  };

  const model = {
    schema: 2,
    source: "ratatoskr-template.yaml (derived)",
    // Keep the original template text so compile() can render configs by
    // editing the template in place (comments, anchors, flow style intact)
    // instead of rebuilding the YAML from scratch. No fs needed in workers.
    templateText: text,
    testUrl:
      strategyGroups.find((g) => g.type === "url-test")?.url ||
      "https://www.gstatic.com/generate_204",
    cleanFilter: t.FilterAll,
    groups: core,
    regions,
    strategies,
    apps,
    orderedRules,
    baseRules: orderedRules.filter((r) => r.module),
    providerModules,
    moduleMeta,
    editor,
  };
  model.version = await hash(JSON.stringify(model));
  return model;
}
