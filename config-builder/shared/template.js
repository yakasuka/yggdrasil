import { parse } from "yaml";
const category = (name) =>
  /OpenAI|Anthropic|AI/.test(name)
    ? "AI 与开发"
    : /OKX|Binance|Bybit|Crypto/.test(name)
      ? "数字资产"
      : /YouTube|Netflix|Hulu|Prime|HBO|Disney|Twitch|Spotify|Bilibili|Entertainment/.test(
            name,
          )
        ? "影音娱乐"
        : /Steam|Epic|TapTap/.test(name)
          ? "游戏与下载"
          : /Telegram|Discord|Chat|Social|Meta|TikTok|𝕏/.test(name)
            ? "社交与通信"
            : "其他服务";
export async function catalogFromTemplate(text) {
  const t = parse(text, { merge: true, maxAliasCount: 100 });
  const meta = t?.["x-configurator"];
  if (
    meta?.schema !== 1 ||
    !Array.isArray(t["proxy-groups"]) ||
    !Array.isArray(t.rules)
  )
    throw Error("模板结构不受支持。");
  if (
    new Set(t["proxy-groups"].map((g) => g.name)).size !==
    t["proxy-groups"].length
  )
    throw Error("模板包含重复策略组名。");
  if (typeof t.FilterAll !== "string")
    throw Error("模板需要 FilterAll 节点筛选规则。");
  try {
    new RegExp(
      t.FilterAll.replaceAll("(?i)", "").replaceAll("(?i:", "(?:"),
      "i",
    );
  } catch {
    throw Error("FilterAll 需要兼容浏览器解析。");
  }
  const groups = meta.groups;
  for (const key of ["gateway", "manual", "final", "other", "ports"])
    if (typeof groups?.[key] !== "string") throw Error("模板缺少核心策略组。");
  const regions = t["proxy-groups"]
    .filter((g) => g["x-configurator"]?.kind === "region")
    .map((g) => {
      const m = g["x-configurator"];
      if (
        !/^[A-Z0-9_-]{2,16}$/.test(m.id) ||
        m.id === "OTHER" ||
        typeof m.id !== "string" ||
        typeof m.label !== "string" ||
        !m.label ||
        !g.filter
      )
        throw Error("地区需要唯一 ID、label 和 filter。");
      return {
        id: m.id,
        label: m.label,
        flag: m.flag || "🌐",
        name: g.name,
        filter: g.filter,
        icon: g.icon || "",
      };
    });
  if (
    !regions.length ||
    new Set(regions.map((r) => r.id)).size !== regions.length ||
    new Set(regions.map((r) => r.name)).size !== regions.length
  )
    throw Error("地区目录为空或有重复项。");
  for (const r of regions) {
    try {
      new RegExp(
        r.filter.replaceAll("(?i)", "").replaceAll("(?i:", "(?:"),
        "i",
      );
    } catch {
      throw Error("地区正则需要兼容浏览器解析。");
    }
  }
  const strategies = t["proxy-groups"]
    .filter((g) => g["x-configurator"]?.kind === "strategy")
    .map((g) => ({
      id: g["x-configurator"].id,
      name: g.name,
      icon: g.icon || "",
    }));
  const reserved = new Set([
    ...Object.values(groups),
    ...regions.map((r) => r.name),
    ...strategies.map((s) => s.name),
    "🏮",
  ]);
  const apps = t["proxy-groups"]
    .filter((g) => g.type === "select" && !reserved.has(g.name))
    .map((g) => {
      const rules = t.rules.filter((r) => r.split(",")[2] === g.name);
      const m = g["x-configurator"] || {};
      return {
        id: m.id || rules[0]?.split(",")[1],
        name: g.name,
        label: m.label || g.name.replace(/^[^\p{L}\p{N}]+/u, "").trim(),
        category: m.category || category(g.name),
        icon: g.icon || "",
        rules,
      };
    })
    .filter((a) => a.rules.length);
  if (
    apps.some((a) => typeof a.id !== "string" || !a.id) ||
    new Set(apps.map((a) => a.id)).size !== apps.length
  )
    throw Error("APP 需要唯一 ID。");
  const appNames = new Map(apps.map((a) => [a.name, a.id]));
  const providerModules = Object.entries(t["rule-providers"] || {}).map(
    ([name, value]) => ({
      name,
      value,
      module:
        t.rules
          .find((r) => r.startsWith("RULE-SET," + name + ","))
          ?.split(",")[2] === "DIRECT"
          ? "direct-extra"
          : /Port|端口/i.test(name)
            ? "ports"
            : "proxy-extra",
    }),
  );
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
      if (!module) throw Error("存在无法分类的规则。");
      return { rule, module };
    });
  const model = {
    schema: 2,
    source: "resources/template/ratatoskr-template.yaml",
    testUrl: meta.testUrl || "https://www.gstatic.com/generate_204",
    cleanFilter: t.FilterAll,
    groups,
    regions,
    strategies,
    apps,
    orderedRules,
    baseRules: orderedRules.filter((r) => r.module),
    providerModules,
  };
  model.version = Array.from(
    new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(JSON.stringify(model)),
      ),
    ),
  )
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);
  return model;
}
