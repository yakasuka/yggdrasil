import { catalog } from "../../shared/compiler.js";
import { esc, title, notice } from "../ui.js";
import { gridHTML, toolbarHTML, librarySectionHTML, appBatchBarHTML } from "../widget-cards.js";
import { activeOrder } from "../widget-mode.js";

export function appsPanel(ctx) {
  const active = activeOrder("app", ctx.profile).length;
  return (
    title(
      "每个 APP，都有自己的去向。",
      "默认启用全部 APP，并跟随上一步选择的代理策略。也可以为 APP 固定一个已保留的地区。",
    ) +
    `<div class="toolbar"><input type="search" id="app-search" placeholder="搜索 APP" value="${esc(ctx.search)}" aria-label="搜索 APP"><span class="muted">${active} 个已启用</span><div class="toolbar-actions"><button class="text-button" data-apps="all">全部启用</button><button class="text-button" data-apps="none">全部移除</button></div></div>` +
    `<div class="widget-editor-root">` +
    toolbarHTML("app", ctx) +
    appBatchBarHTML(ctx) +
    `<div class="app-grid" data-widget-grid="app">${gridHTML("app", ctx)}</div>` +
    librarySectionHTML("app", ctx) +
    `</div>` +
    notice(
      "APP、地区与策略入口均来自 Ratatoskr 模板，分类由模板中的 x-category 声明决定。带「策略入口」标记的是无规则开关组，可选择默认出口。「🌌 Others」是地区类别，在「地区节点」页保留。规则集模块在下一步保留。",
    )
  );
}
