import { STRATEGY_VIEW } from "../strategy-catalog.js";
import { esc, checked, selected, title, notice } from "../ui.js";

export function strategiesPanel(ctx) {
  const card = (s) => {
    const on = s.fixed || ctx.profile.strategies.includes(s.id);
    return `<label class="choice${s.fixed ? " fixed" : ""}"><input type="checkbox" data-strategy="${s.id}"${checked(on)}${s.fixed ? " disabled" : ""}>${s.icon ? `<img class="choice-icon" src="${esc(s.icon)}" alt="" loading="lazy" onerror="this.hidden=true">` : ""}<span><strong>${esc(s.name)}</strong>${s.fixed ? `<span class="choice-badge">始终保留</span>` : ""}<small>${esc(s.description)}</small></span></label>`;
  };
  // 节点选择是固定入口组，始终是合法的默认出口。
  const options = STRATEGY_VIEW.filter(
    (s) => s.fixed || ctx.profile.strategies.includes(s.id),
  )
    .map(
      (s) =>
        `<option value="${s.id}"${selected(ctx.profile.defaultStrategy === s.id)}>${esc(s.label)}</option>`,
    )
    .join("");

  return (
    title(
      "让节点，按你的方式连接。",
      "节点选择与手动切换始终保留；默认出口决定客户端首次打开时的策略。",
    ) +
    `<div class="choice-grid">${STRATEGY_VIEW.map(card).join("")}</div><label class="inline-field"><span>默认代理策略<small>首次打开客户端时使用</small></span><select id="default-strategy">${options}</select></label>` +
    notice(
      "所有规则默认走「节点选择」，在客户端切换一次即可更换全部节点。这里只决定首次打开时默认选中的策略；自动策略使用同一延迟检测地址并启用统一延迟，轮询分配只作用于新连接。",
    )
  );
}
