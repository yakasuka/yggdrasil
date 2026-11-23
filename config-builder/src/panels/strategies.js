import { strategyView } from "../strategy-catalog.js";
import { esc, checked, title, notice } from "../ui.js";

export function strategiesPanel(ctx) {
  const STRATEGY_VIEW = strategyView();
  const card = (s) => {
    const on = s.fixed || ctx.profile.strategies.includes(s.id);
    return `<label class="choice${s.fixed ? " fixed" : ""}"><input type="checkbox" data-strategy="${s.id}"${checked(on)}${s.fixed ? " disabled" : ""}>${s.icon ? `<img class="choice-icon" src="${esc(s.icon)}" alt="" decoding="async" onerror="this.hidden=true">` : ""}<span><strong>${esc(s.name)}</strong>${s.fixed ? `<span class="choice-badge">始终保留</span>` : ""}<small>${esc(s.description)}</small></span></label>`;
  };
  // 所有规则统一走「节点选择」；这个组里能选什么取决于上面的勾选。
  const automatic = STRATEGY_VIEW.filter(
    (s) => !s.fixed && ctx.profile.strategies.includes(s.id),
  ).map((s) => s.name);
  const hasRegions = (ctx.profile.countries || []).length > 0 || ctx.profile.other;
  const members = [
    "🚀 手动切换",
    ...automatic,
    ...(hasRegions ? ["已勾选的地区节点"] : []),
    "DIRECT",
  ];

  return (
    title(
      "让节点，按你的方式连接。",
      "节点选择与手动切换始终保留；所有规则统一从「节点选择」进入。",
    ) +
    `<div class="choice-grid">${STRATEGY_VIEW.map(card).join("")}</div>` +
    `<div class="default-exit"><div class="default-exit-head"><span>默认出口</span><strong>🎚️ 节点选择</strong></div><p>所有 APP 与规则默认从这里进入。在客户端的「节点选择」里切换一次，即可更换全部节点的出口，无需再做其他设置。</p><div class="default-exit-chips">${members.map((m) => `<span>${esc(m)}</span>`).join("")}</div></div>` +
    notice(
      "上面列出的项目就是客户端「节点选择」里可切换的出口。自动策略使用同一延迟检测地址并启用统一延迟，轮询分配只作用于新连接。",
    )
  );
}
