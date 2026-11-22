// Derive the configurator catalog directly from the Ratatoskr YAML template.
// The old shared/catalog.json was a hand-maintained snapshot that drifted away
// from the template (24 regions vs 6, stale rule-set names, missing apps).
// Keeping one source of truth means every edit to the template — regions,
// apps, icons, rules — shows up in the picker automatically.
import { parse } from "yaml";

// The template carries region codes and match patterns but no Chinese label.
// Only the display label lives here; the region list itself always comes from
// the template, so adding/removing a region there is reflected immediately.
const REGION_LABELS = {
  HK: "香港", TW: "台湾", MO: "澳门", JP: "日本", KR: "韩国", SG: "新加坡",
  TH: "泰国", MY: "马来西亚", VN: "越南", PH: "菲律宾", ID: "印度尼西亚",
  IN: "印度", AU: "澳大利亚", US: "美国", CA: "加拿大", GB: "英国",
  DE: "德国", FR: "法国", NL: "荷兰", CH: "瑞士", RU: "俄罗斯",
  TR: "土耳其", BR: "巴西", AR: "阿根廷", OTHER: "其他地区",
};

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
  const t = parse(text, { merge: true, maxAliasCount: 100 });
  if (!Array.isArray(t["proxy-groups"]) || !Array.isArray(t.rules))
    throw Error("模板结构不受支持，缺少 proxy-groups 或 rules。");
  const groups = t["proxy-groups"];
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
  const hermes =
    groups.find((g) => g.name.includes("Hermes"))?.name || "✨ Hermes";
  const china =
    groups.find((g) => g.name.includes("China"))?.name || "🏯 China";
  const core = {
    gateway,
    manual,
    final,
    other: leadingIcon(othersGroup?.name) || "🌌",
    otherGroupName: othersGroup?.name || "🌌 Others",
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
    return {
      id,
      label: REGION_LABELS[id] || id,
      flag: flagFrom(filter),
      // `name` is the short icon used inside the configurator's own generated
      // config. `groupName` is the faithful full name from the template, used
      // by the template renderer to keep the author's original group lines.
      name: leadingIcon(group?.name) || id,
      groupName: group?.name || leadingIcon(group?.name) || id,
      filter,
      icon: group?.icon || "",
    };
  });

  // Automatic strategies are the non-select proxy groups.
  const strategyGroups = groups.filter((g) =>
    ["url-test", "fallback", "load-balance"].includes(g.type),
  );
  const strategies = strategyGroups.map((g) => ({
    id:
      g.type === "url-test"
        ? "auto"
        : g.type === "fallback"
          ? "fallback"
          : g.strategy === "round-robin"
            ? "download"
            : "balanced",
    name: g.name,
    icon: g.icon || "",
  }));

  // Rule sets and their module grouping come straight from rule-providers.
  const providerModules = Object.entries(t["rule-providers"] || {}).map(
    ([name, value]) => {
      const target = t.rules
        .find((r) => r.startsWith("RULE-SET," + name + ","))
        ?.split(",")[2];
      const module =
        target === "DIRECT"
          ? "direct-extra"
          : /Port|端口/i.test(name)
            ? "ports"
            : "proxy-extra";
      return { name, value, module };
    },
  );

  // Apps are select groups that are not core/region/strategy groups and that
  // actually own at least one rule. Everything else is a switch, not an app.
  const reserved = new Set([
    gateway,
    manual,
    final,
    ports,
    hermes,
    china,
    leadingIcon(othersGroup?.name),
    "🏮",
    ...regionGroups.map((g) => g.name),
    ...strategyGroups.map((g) => g.name),
  ]);
  const apps = groups
    .filter((g) => g.type === "select" && !reserved.has(g.name))
    .map((g) => {
      const rules = t.rules.filter((r) => r.split(",")[2] === g.name);
      const meta = g["x-configurator"] || {};
      return {
        id: meta.id || rules[0]?.split(",")[1] || stripIcon(g.name),
        name: g.name,
        label: meta.label || stripIcon(g.name),
        category: meta.category || category(g.name),
        icon: g.icon || "",
        // Preserve the template's initial option (some apps start at DIRECT).
        firstProxyDirect: g.proxies?.[0] === "DIRECT",
        rules,
      };
    })
    .filter((a) => a.rules.length);
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
  };
  model.version = await hash(JSON.stringify(model));
  return model;
}
