import { STRATEGIES } from "../../shared/compiler.js";
import { esc, checked, selected, title, notice } from "../ui.js";
export function strategiesPanel(ctx) {
  return (
    title(
      "让节点，按你的方式连接。",
      "选择需要保留的四种自动策略。手动选择始终保留，也是默认代理出口。",
    ) +
    `<div class="choice-grid">${STRATEGIES.map((s) => `<label class="choice"><input type="checkbox" data-strategy="${s.id}"${checked(ctx.profile.strategies.includes(s.id))}><span><strong>${s.label}</strong><small>${s.description}</small></span></label>`).join("")}</div><label class="inline-field"><span>默认代理策略<small>APP 选择「跟随代理」时使用</small></span><select id="default-strategy"><option value="manual"${selected(ctx.profile.defaultStrategy === "manual")}>手动选择</option>${STRATEGIES.filter(
      (s) => ctx.profile.strategies.includes(s.id),
    )
      .map(
        (s) =>
          `<option value="${s.id}"${selected(ctx.profile.defaultStrategy === s.id)}>${esc(s.label)}</option>`,
      )
      .join("")}</select></label>` +
    notice(
      "自动策略使用同一延迟检测地址，并启用统一延迟。轮询分配新连接，不拆分单条连接。",
    )
  );
}
