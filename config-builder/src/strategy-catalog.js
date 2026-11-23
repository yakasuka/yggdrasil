// Front-end-owned display catalog for the strategy step.
//
// Everything in this file is presentation only: labels, descriptions and icon
// paths. It is deliberately separate from shared/catalog.json, which is
// derived from the Ratatoskr YAML template by the backend. Editing this file
// changes what the wizard shows on both static hosts after the normal static
// sync; no template regeneration or backend redeploy is involved.
//
// `id` values are the contract with the backend. The compiler maps them to
// the actual proxy-group names from the selected template when it converts a
// profile into YAML.

export const STRATEGY_VIEW = [
  {
    id: "gateway",
    name: "🎚️ 节点选择",
    label: "节点选择",
    description: "所有规则的统一出口，在这里切换一次即可更换全部节点。",
    icon: "../assets/icons/switch.png",
    fixed: true,
  },
  {
    id: "manual",
    name: "🚀 手动切换",
    label: "手动切换",
    description: "汇集全部节点，手动挑选具体出口。",
    icon: "../assets/icons/proxy.png",
    fixed: true,
  },
  {
    id: "auto",
    name: "⚡ 自动选择",
    label: "自动选择",
    description: "按统一延迟挑选当前最快的节点。",
    icon: "../assets/icons/yggdrasil.png",
  },
  {
    id: "fallback",
    name: "🔯 故障转移",
    label: "故障转移",
    description: "按节点顺序使用下一个可用出口。",
    icon: "../assets/icons/fallback.png",
  },
  {
    id: "balanced",
    name: "🔮 负载均衡",
    label: "一致性哈希",
    description: "同一目标尽量保持相同出口。",
    icon: "../assets/icons/global.png",
  },
  {
    id: "download",
    name: "📦 下载均衡",
    label: "轮询分配",
    description: "把不同连接分散到多个节点。",
    icon: "../assets/icons/tracking.png",
  },
];

export const FIXED_STRATEGY_IDS = STRATEGY_VIEW.filter((s) => s.fixed).map(
  (s) => s.id,
);
