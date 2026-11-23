// Front-end-owned display catalog for the strategy step.
//
// Everything in this file is presentation only: labels, descriptions and icon
// paths. The authoritative ITEM LIST comes from the derived catalog (the YAML
// template); the STRATEGY_VIEW table below is a curated display overlay keyed
// by id. A strategy added to the template is shown automatically with fallback
// text, so this file only needs editing when you want to POLISH its copy/icon.
//
// `id` values are the contract with the backend. The compiler maps them to the
// actual proxy-group names from the selected template when it converts a
// profile into YAML.

import { catalog, CORE_STRATEGY_IDS } from "../shared/compiler.js";

// Curated front-end copy for the known strategies. Keyed by id so the list
// order/content is owned by the catalog, not by this table.
const VIEW_BY_ID = {
  gateway: {
    id: "gateway",
    name: "🎚️ 节点选择",
    label: "节点选择",
    description: "所有规则的统一出口，在这里切换一次即可更换全部节点。",
    icon: "../assets/icons/switch.png",
    iconName: "switch",
    fixed: true,
  },
  manual: {
    id: "manual",
    name: "🚀 手动切换",
    label: "手动切换",
    description: "汇集全部节点，手动挑选具体出口。",
    icon: "../assets/icons/proxy.png",
    iconName: "rocket",
    fixed: true,
  },
  auto: {
    name: "⚡ 自动选择",
    label: "自动选择",
    description: "按统一延迟挑选当前最快的节点。",
    icon: "../assets/icons/yggdrasil.png",
    iconName: "bolt",
  },
  fallback: {
    name: "🔯 故障转移",
    label: "故障转移",
    description: "按节点顺序使用下一个可用出口。",
    icon: "../assets/icons/fallback.png",
    iconName: "shuffle",
  },
  balanced: {
    name: "🔮 负载均衡",
    label: "一致性哈希",
    description: "同一目标尽量保持相同出口。",
    icon: "../assets/icons/global.png",
    iconName: "balance",
  },
  download: {
    name: "📦 下载均衡",
    label: "轮询分配",
    description: "把不同连接分散到多个节点。",
    icon: "../assets/icons/tracking.png",
    iconName: "layers",
  },
};

const humanize = (id) =>
  String(id).replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * The ordered strategy cards for a given catalog. Two select groups are fixed;
 * every automatic strategy present in the template is included. For each item
 * front-end copy wins, then template-authored copy, then a generic fallback.
 */
export function strategyView(model = catalog) {
  const fixed = CORE_STRATEGY_IDS.map((id) => VIEW_BY_ID[id]).filter(Boolean);
  const automatic = (model.strategies || []).map((s) => {
    const view = VIEW_BY_ID[s.id] || {};
    return {
      id: s.id,
      name: view.name || s.label || s.name || humanize(s.id),
      label: view.label || s.label || humanize(s.id),
      description: view.description || s.description || "来自示例模板的自动策略组。",
      // Template icons are absolute CDN URLs; front-end ones are relative
      // asset paths. Both render the same way in an <img>.
      icon: view.icon || s.icon || "",
      iconName: view.iconName || "bolt",
    };
  });
  return [...fixed, ...automatic];
}

// Legacy export kept for callers/tests that need the static table. New UI code
// should use strategyView() so template additions appear automatically.
export const STRATEGY_VIEW = [
  VIEW_BY_ID.gateway,
  VIEW_BY_ID.manual,
  VIEW_BY_ID.auto,
  VIEW_BY_ID.fallback,
  VIEW_BY_ID.balanced,
  VIEW_BY_ID.download,
].map((s) => ({ ...s }));

export const FIXED_STRATEGY_IDS = STRATEGY_VIEW.filter((s) => s.fixed).map(
  (s) => s.id,
);
