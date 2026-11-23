import { catalog, moduleView, ruleModules } from "../../shared/compiler.js";
import { esc, checked, notice } from "../ui.js";
export function rulesPanel(ctx) {
  const present = ruleModules(catalog);
  const count = (id) => catalog.orderedRules.filter((r) => r.module === id).length;
  // Iterate the modules actually present in the template and resolve display
  // text per ID. A module newly added to the template still gets a card via
  // moduleView's generic fallback instead of being filtered out.
  const modules = present.map((id) => moduleView(id, catalog));
  return (
    title(
      "挑选，生长所需的枝叶。",
      "规则模块来自 Ratatoskr 示例模板。按需启用，未启用的规则组及其规则集不会写入配置。",
    ) +
    `<div class="toolbar"><span class="muted">${modules.length} 个规则模块</span><div class="toolbar-actions"><button class="text-button" data-modules="all">全部启用</button><button class="text-button" data-modules="none">全部关闭</button></div></div>` +
    `<div class="choice-grid">${modules
      .map(
        (m) =>
          `<label class="choice"><input type="checkbox" data-module="${esc(m.id)}"${checked(ctx.profile.modules.includes(m.id))}><span><strong>${esc(m.symbol)} ${esc(m.label)}</strong><small>${esc(m.description)} · ${count(m.id)} 条规则</small></span></label>`,
      )
      .join("")}</div>` +
    notice(
      "APP 分流规则始终跟随上一步的选择。默认策略组、最终出口与手动切换不受规则模块影响，始终可用。",
    )
  );
}
