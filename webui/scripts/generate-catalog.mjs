import fs from "node:fs";
import crypto from "node:crypto";
import { parse } from "yaml";

const repositoryRoot = new URL("../../", import.meta.url);
const catalogPath = new URL("../shared/catalog.json", import.meta.url);
const main = parse(
  fs.readFileSync(new URL("ratatoskr.yaml", repositoryRoot), "utf8"),
  { merge: true },
);
const expanded = parse(
  fs.readFileSync(new URL("Ratatosk-Eb.yaml", repositoryRoot), "utf8"),
  {
    merge: true,
  },
);
const definitions = [
  ["HK", "香港", "🇭🇰", "🌆", "FilterHK"],
  ["TW", "台湾", "🇹🇼", "🧋", "FilterTW"],
  ["MO", "澳门", "🇲🇴", "🎰", "FilterMO"],
  ["JP", "日本", "🇯🇵", "⛩️", "FilterJP"],
  ["KR", "韩国", "🇰🇷", "🎤", "FilterKR"],
  ["SG", "新加坡", "🇸🇬", "🏙️", "FilterSG"],
  ["TH", "泰国", "🇹🇭", "🐘", "FilterTH"],
  ["MY", "马来西亚", "🇲🇾", "🌺", "FilterMY"],
  ["VN", "越南", "🇻🇳", "🍜", "FilterVN"],
  ["PH", "菲律宾", "🇵🇭", "🏝️", "FilterPH"],
  ["ID", "印度尼西亚", "🇮🇩", "🌋", "FilterID"],
  ["IN", "印度", "🇮🇳", "🪷", "FilterIN"],
  ["AU", "澳大利亚", "🇦🇺", "🦘", "FilterAU"],
  ["US", "美国", "🇺🇸", "🗽", "FilterUS"],
  ["CA", "加拿大", "🇨🇦", "🍁", "FilterCA"],
  ["GB", "英国", "🇬🇧", "💂", "FilterUK"],
  ["DE", "德国", "🇩🇪", "🍺", "FilterDE"],
  ["FR", "法国", "🇫🇷", "🗼", "FilterFR"],
  ["NL", "荷兰", "🇳🇱", "🌷", "FilterNL"],
  ["CH", "瑞士", "🇨🇭", "🏔️", "FilterCH"],
  ["RU", "俄罗斯", "🇷🇺", "🪆", "FilterRU"],
  ["TR", "土耳其", "🇹🇷", "🧿", "FilterTR"],
  ["BR", "巴西", "🇧🇷", "⚽", "FilterBR"],
  ["AR", "阿根廷", "🇦🇷", "🧉", "FilterAR"],
];
const regions = definitions.map(([id, label, flag, name, key]) => {
  if (typeof expanded[key] !== "string")
    throw Error("Missing region filter: " + key);
  return { id, label, flag, name, filter: expanded[key] };
});
const reserved = new Set([
  "🎚️ 节点选择",
  "🚀 手动切换",
  "🏁 Final",
  "🏮",
  "🌌",
  "🔌 特殊端口",
  ...regions.map((x) => x.name),
]);
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
const apps = main["proxy-groups"]
  .filter((g) => g.type === "select" && !reserved.has(g.name))
  .map((g) => {
    const rules = main.rules.filter((r) => r.split(",")[2] === g.name);
    return {
      id: rules[0]?.split(",")[1] || g.name,
      name: g.name,
      label: g.name.replace(/^[^\p{L}\p{N}]+/u, "").trim(),
      category: category(g.name),
      icon: g.icon || "",
      rules,
      direct: g.proxies?.[0] === "DIRECT",
    };
  })
  .filter((a) => a.rules.length);
const providerModules = Object.entries(main["rule-providers"]).map(
  ([name, value]) => ({
    name,
    value,
    module:
      main.rules
        .find((r) => r.startsWith("RULE-SET," + name + ","))
        ?.split(",")[2] === "DIRECT"
        ? "direct-extra"
        : /Port|端口/i.test(name)
          ? "ports"
          : "proxy-extra",
  }),
);
const appNames = new Set(apps.map((x) => x.name));
const baseRules = main.rules
  .filter((r) => !appNames.has(r.split(",")[2]) && !r.startsWith("MATCH,"))
  .map((rule) => {
    const [type, key] = rule.split(",");
    let module;
    if (key === "private") module = "private";
    else if (type === "RULE-SET")
      module = providerModules.find((p) => p.name === key)?.module;
    else if (key === "cn" || key === "google-cn") module = "china";
    else if (key === "gfw") module = "gfw";
    else module = "game-direct";
    if (!module) throw Error("Unclassified rule: " + rule);
    return { rule, module };
  });
const orderedRules = main.rules
  .filter((r) => !r.startsWith("MATCH,"))
  .map((rule) => {
    const app = apps.find((a) => a.name === rule.split(",")[2]);
    return app ? { rule, app: app.id } : baseRules.find((r) => r.rule === rule);
  });
const catalog = {
  schema: 1,
  testUrl: "https://www.gstatic.com/generate_204",
  cleanFilter: main.FilterAll,
  regions,
  apps,
  baseRules,
  orderedRules,
  providerModules,
  modules: [
    {
      id: "china",
      label: "国内直连",
      description: "中国大陆域名、IP 与可直连的国内服务。",
      default: true,
    },
    {
      id: "game-direct",
      label: "游戏下载直连",
      description: "国内游戏资源、公共 Tracker 与游戏类直连规则。",
      default: true,
    },
    {
      id: "gfw",
      label: "通用代理",
      description: "使用 GeoSite 通用代理分类承接常见境外服务。",
      default: true,
    },
    {
      id: "direct-extra",
      label: "直连规则补充",
      description: "额外的直连域名、IP 与端口规则集。",
      default: true,
    },
    {
      id: "proxy-extra",
      label: "代理规则补充",
      description: "额外的代理域名和 IP 规则集。",
      default: true,
    },
    {
      id: "ports",
      label: "特殊端口分流",
      description: "为特殊端口生成单独的出口策略组。",
      default: false,
    },
  ],
};
catalog.version = crypto
  .createHash("sha256")
  .update(JSON.stringify(catalog))
  .digest("hex")
  .slice(0, 12);
fs.mkdirSync(new URL("./", catalogPath), { recursive: true });
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
console.log(
  "Catalog: " +
    apps.length +
    " apps, " +
    regions.length +
    " regions; no source subscriptions included.",
);
