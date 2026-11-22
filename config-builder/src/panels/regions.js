import { esc, checked, title, notice, usageCards, latencyPill, latencyLegend } from "../ui.js";
import { catalog } from "../../shared/compiler.js";
import { selectableRegions } from "../../shared/preview.js";
export function regionsPanel(ctx) {
  // Every template region is selectable, even when the subscription has no
  // nodes for it. The live inspection only supplies the displayed node count.
  const regions = selectableRegions(catalog, ctx.inspection),
    nodes = ctx.inspection?.nodes || [],
    withNodes = regions.filter((r) => r.count > 0).length;
  return (
    title(
      "只保留，你拥有的世界。",
      ctx.preview
        ? "这里按模板列出全部可选地区，可提前决定保留哪些；填写订阅后会显示实际节点数。"
        : "这里列出模板的全部地区。即使订阅里没有对应节点也可以勾选——勾选只决定默认出口，所有地区都会作为选项写入配置。",
    ) +
    usageCards(ctx.inspection?.providers) +
    ((ctx.inspection?.providers || []).some((p) => p.skipped)
      ? notice(
          `有 ${(ctx.inspection.providers || []).reduce((sum, p) => sum + (p.skipped || 0), 0)} 条节点无法转换，已跳过；其余节点可继续使用。`,
          true,
        )
      : "") +
    `<div class="toolbar"><span class="muted">${nodes.length} 个节点 · ${regions.length} 个可选地区（${withNodes} 个有节点）</span><div class="toolbar-actions"><button class="text-button" data-regions="all">全部保留</button><button class="text-button" data-regions="none">全部取消</button></div></div><div class="region-bars">${regions.map((r) => `<label class="region-bar"><input type="checkbox" data-region="${r.id}"${checked(r.id === "OTHER" ? ctx.profile.other : ctx.profile.countries.includes(r.id))}>${r.icon ? `<img class="region-flag" src="${esc(r.icon)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'flag',textContent:'${esc(r.flag)}'}))">` : `<span class="flag" aria-hidden="true">${esc(r.flag)}</span>`}<span class="region-name">${esc(r.label)}</span><small class="region-count${r.count ? "" : " is-empty"}" title="${r.count ? `${r.count} 个节点` : "订阅中暂无节点，仍可勾选"}">${r.count}</small></label>`).join("")}</div>` +
    notice(
      ctx.preview
        ? "预览模式下不显示节点与连接耗时；填写订阅并解析后会出现实际节点。"
        : "地区根据节点名称匹配；未识别到节点的地区仍可勾选并写入配置。耗时由服务器通过节点代理请求测试地址测得，与 url-test 自动选择组口径一致。",
    ) +
    `<details><summary>查看节点与连接耗时（${nodes.length}）</summary><div class="latency-legend"><span>延迟状态</span>${latencyLegend()}</div><div class="node-table-wrap"><table class="node-table"><thead><tr><th>节点</th><th>地区</th><th>连接耗时（url-test）</th></tr></thead><tbody>${nodes.map((n) => `<tr><td>[P${n.provider + 1}] ${esc(n.name)}</td><td>${esc(regions.find((r) => r.id === n.region)?.label || "其他地区")}</td><td data-latency="${n.id}">${latencyPill(n.latencyMs)}</td></tr>`).join("")}</tbody></table></div></details>`
  );
}
