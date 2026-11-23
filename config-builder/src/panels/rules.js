import { catalog, moduleView, ruleModules, sortByOrder } from "../../shared/compiler.js";
import { esc, checked, title, notice } from "../ui.js";
import { displayOrder, widgetAttrs, removeBadge } from "../widget-mode.js";
export function rulesPanel(ctx) {
  const present = ruleModules(catalog);
  const count = (id) => catalog.orderedRules.filter((r) => r.module === id).length;
  // Iterate the modules actually present in the template and resolve display
  // text per ID. A module newly added to the template still gets a card via
  // moduleView's generic fallback instead of being filtered out.
  const modules = sortByOrder(
    present.map((id) => moduleView(id, catalog)),
    displayOrder("module", ctx.profile),
  );
  return (
    title(
      "挑选，生长所需的枝叶。",
      "规则模块来自 Ratatoskr 示例模板。按需启用，未启用的规则组及其规则集不会写入配置。",
    ) +
    `<div class="toolbar"><span class="muted">${modules.length} 个规则模块</span><div class="toolbar-actions"><button class="text-button" data-modules="all">全部启用</button><button class="text-button" data-modules="none">全部关闭</button></div></div>` +
    `<div class="choice-grid" data-widget-grid="module">${modules
      .map(
        (m) =>
          `<label class="choice"${widgetAttrs("module", m.id)}><input type="checkbox" data-module="${esc(m.id)}"${checked(ctx.profile.modules.includes(m.id))}><span><strong>${esc(m.symbol)} ${esc(m.label)}</strong><small>${esc(m.description)} · ${count(m.id)} 条规则</small></span>${removeBadge("module", m.id)}</label>`,
      )
      .join("")}</div>` +
    notice(
      "规则按模板自上而下的顺序命中，首次命中即停止——条目顺序决定最终出口，这条链固定在 YAML 中、不会因拖动而改变。长按进入编辑模式后可拖动卡片、按 A→Z 排序或恢复默认；这只会调整模块展示与配置里的组顺序。APP 分流规则始终跟随上一步选择，默认策略组、最终出口与手动切换不受规则模块影响。",
      true,
    )
  );
}
