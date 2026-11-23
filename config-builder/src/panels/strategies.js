import { strategyView } from "../strategy-catalog.js";
import { esc, title, notice } from "../ui.js";
import { gridHTML, toolbarHTML, librarySectionHTML } from "../widget-cards.js";

export function strategiesPanel(ctx) {
  const automatic = strategyView().filter(
    (s) => !s.fixed && ctx.profile.strategies.includes(s.id),
  ).map((s) => s.name);
  const hasRegions = (ctx.profile.countries || []).length > 0 || ctx.profile.other;
  const members = [
    "🚀 手动切换",
    ...automatic,
    ...(hasRegions ? ["已保留的地区节点"] : []),
    "DIRECT",
  ];

  return (
    title(
      "让节点，按你的方式连接。",
      "节点选择与手动切换始终保留；所有规则统一从「节点选择」进入。",
    ) +
    `<div class="widget-editor-root">` +
    toolbarHTML("strategy", ctx) +
    `<div class="choice-grid" data-widget-grid="strategy">${gridHTML("strategy", ctx)}</div>` +
    librarySectionHTML("strategy", ctx) +
    `</div>` +
    `<div class="default-exit"><div class="default-exit-head"><span>默认出口</span><strong>🎚️ 节点选择</strong></div><p>所有 APP 与规则默认从这里进入。在客户端的「节点选择」里切换一次，即可更换全部节点的出口，无需再做其他设置。</p><div class="default-exit-chips">${members.map((m) => `<span>${esc(m)}</span>`).join("")}</div></div>` +
    notice(
      "上面列出的项目就是客户端「节点选择」里可切换的出口。自动策略使用同一延迟检测地址并启用统一延迟，轮询分配只作用于新连接。",
    )
  );
}
