import { esc, title, notice, usageCards, latencyPill, latencyLegend } from "../ui.js";
import { catalog } from "../../shared/compiler.js";
import { selectableRegions } from "../../shared/preview.js";
import { activeOrder } from "../widget-mode.js";
import { gridHTML, toolbarHTML, librarySectionHTML } from "../widget-cards.js";

export function regionsPanel(ctx) {
  // Widget model: the grid holds only the enabled regions (presence == on).
  // Disabled ones live in the always-visible component library. The node
  // count still comes from the live inspection for every known region.
  const allRegions = selectableRegions(catalog, ctx.inspection),
    active = activeOrder("region", ctx.profile),
    nodes = ctx.inspection?.nodes || [],
    withNodes = active.filter((id) => allRegions.find((r) => r.id === id)?.count > 0).length;
  return (
    title(
      "只保留，你拥有的世界。",
      ctx.preview
        ? "把你要保留的地区留在网格里，其余可在下方组件库随时加回；填写订阅后会显示实际节点数。"
        : "网格中的地区会写入配置。即使订阅里没有对应节点也可以保留——是否保留只决定默认出口的候选。",
    ) +
    usageCards(ctx.inspection?.providers) +
    ((ctx.inspection?.providers || []).some((p) => p.skipped)
      ? notice(
          `有 ${(ctx.inspection.providers || []).reduce((sum, p) => sum + (p.skipped || 0), 0)} 条节点无法转换，已跳过；其余节点可继续使用。`,
          true,
        )
      : "") +
    `<div class="toolbar"><span class="muted">${nodes.length} 个节点 · ${active.length} 个保留地区（${withNodes} 个有节点）</span><div class="toolbar-actions"><button class="text-button" data-regions="all">全部保留</button><button class="text-button" data-regions="none">全部移除</button></div></div>` +
    `<div class="widget-editor-root">` +
    toolbarHTML("region", ctx) +
    `<div class="region-bars" data-widget-grid="region">${gridHTML("region", ctx)}</div>` +
    librarySectionHTML("region", ctx) +
    `</div>` +
    notice(
      ctx.preview
        ? "预览模式下不显示节点与连接耗时；填写订阅并解析后会出现实际节点。"
        : "地区根据节点名称匹配；未识别到节点的地区仍可保留并写入配置。耗时由服务器通过节点代理请求测试地址测得，与 url-test 自动选择组口径一致。",
    ) +
    `<details><summary>查看节点与连接耗时（${nodes.length}）</summary><div class="latency-legend"><span>延迟状态</span>${latencyLegend()}</div><div class="node-table-wrap"><table class="node-table"><thead><tr><th>节点</th><th>地区</th><th>连接耗时（url-test）</th></tr></thead><tbody>${nodes.map((n) => `<tr><td>[P${n.provider + 1}] ${esc(n.name)}</td><td>${esc(allRegions.find((r) => r.id === n.region)?.label || "其他地区")}</td><td data-latency="${n.id}">${latencyPill(n.latencyMs)}</td></tr>`).join("")}</tbody></table></div></details>`
  );
}
