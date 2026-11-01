import { esc, checked, title, notice, usageCards } from "../ui.js";
export function regionsPanel(ctx) {
  const regions = ctx.inspection?.regions || [],
    nodes = ctx.inspection?.nodes || [];
  return (
    title(
      "只保留，你拥有的世界。",
      "这里仅列出订阅中实际识别到的地区。取消某个地区后，所有节点策略都会排除该地区。",
    ) +
    usageCards(ctx.inspection?.providers) +
    ((ctx.inspection?.providers || []).some((p) => p.skipped)
      ? notice(
          `有 ${(ctx.inspection.providers || []).reduce((sum, p) => sum + (p.skipped || 0), 0)} 条节点无法转换，已跳过；其余节点可继续使用。`,
          true,
        )
      : "") +
    `<div class="toolbar"><span class="muted">${nodes.length} 个节点 · ${regions.length} 个地区</span><div class="toolbar-actions"><button class="text-button" data-regions="all">全部保留</button><button class="text-button" data-regions="none">全部取消</button></div></div><div class="region-grid">${regions.map((r) => `<label class="region-choice"><input type="checkbox" data-region="${r.id}"${checked(r.id === "OTHER" ? ctx.profile.other : ctx.profile.countries.includes(r.id))}><span class="flag" aria-hidden="true">${esc(r.flag)}</span><span>${esc(r.label)} <small>${r.count}</small></span></label>`).join("")}</div>` +
    notice(
      "地区根据节点名称匹配。TCP 连接耗时从服务器测量，不代表经过代理隧道后的实际访问延迟。",
    ) +
    `<details><summary>查看节点与连接耗时（${nodes.length}）</summary><div class="node-table-wrap"><table class="node-table"><thead><tr><th>节点</th><th>地区</th><th>TCP 连接耗时</th></tr></thead><tbody>${nodes.map((n) => `<tr><td>[P${n.provider + 1}] ${esc(n.name)}</td><td>${esc(regions.find((r) => r.id === n.region)?.label || "其他地区")}</td><td data-latency="${n.id}">${n.latencyMs === null || n.latencyMs === undefined ? "未检测" : n.latencyMs + " ms"}</td></tr>`).join("")}</tbody></table></div></details>`
  );
}
