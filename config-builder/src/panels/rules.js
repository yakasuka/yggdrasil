import { ruleModules } from "../../shared/compiler.js";
import { title, notice } from "../ui.js";
import { gridHTML, toolbarHTML, librarySectionHTML } from "../widget-cards.js";
import { activeOrder } from "../widget-mode.js";

export function rulesPanel(ctx) {
  const active = activeOrder("module", ctx.profile).length,
    total = ruleModules().length;
  return (
    title(
      "挑选，生长所需的枝叶。",
      "规则模块来自 Ratatoskr 示例模板。按需启用，未启用的规则组及其规则集不会写入配置。",
    ) +
    `<div class="toolbar"><span class="muted">${active} / ${total} 个规则模块已启用</span><div class="toolbar-actions"><button class="text-button" data-modules="all">全部启用</button><button class="text-button" data-modules="none">全部移除</button></div></div>` +
    `<div class="widget-editor-root">` +
    toolbarHTML("module", ctx) +
    `<div class="choice-grid" data-widget-grid="module">${gridHTML("module", ctx)}</div>` +
    librarySectionHTML("module", ctx) +
    `</div>` +
    notice(
      "规则按模板自上而下的顺序命中，首次命中即停止——条目顺序决定最终出口，这条链固定在 YAML 中、不会因拖动而改变。拖动卡片、按 A→Z 排序或恢复默认，只会调整模块展示与配置里的组顺序。APP 分流规则始终跟随上一步选择，默认策略组、最终出口与手动切换不受规则模块影响。",
      true,
    )
  );
}
