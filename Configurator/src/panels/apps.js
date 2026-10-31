import { catalog } from "../../shared/compiler.js";
import { esc, checked, selected, title, notice } from "../ui.js";
export function appsPanel(ctx) {
  const regions = (ctx.inspection?.regions || []).filter((r) =>
    r.id === "OTHER" ? ctx.profile.other : ctx.profile.countries.includes(r.id),
  );
  const options = [
    ["proxy", "跟随代理"],
    ...regions.map((r) => ["region:" + r.id, r.label]),
    ["reject", "Reject"],
    ["direct", "Direct"],
  ];
  return (
    title(
      "每个 APP，都有自己的去向。",
      "默认启用全部 APP，并跟随上一步选择的代理策略。也可以为 APP 固定一个已保留的地区。",
    ) +
    `<div class="toolbar"><input type="search" id="app-search" placeholder="搜索 APP" value="${esc(ctx.search)}" aria-label="搜索 APP"><div class="toolbar-actions"><button class="text-button" data-apps="all">全部启用</button><button class="text-button" data-apps="none">全部关闭</button></div></div><div class="app-grid">${[
      ...new Set(catalog.apps.map((a) => a.category)),
    ]
      .map(
        (cat) =>
          `<div class="category-heading" data-category="${esc(cat)}">${esc(cat)}</div>` +
          catalog.apps
            .filter((a) => a.category === cat)
            .map(
              (a) =>
                `<div class="app-card" data-app-card="${esc(a.label.toLowerCase())}" data-category-item="${esc(cat)}"><label><input type="checkbox" data-app="${esc(a.id)}"${checked(ctx.profile.apps.includes(a.id))}>${a.icon ? `<img src="${esc(a.icon)}" alt="" loading="lazy" onerror="this.hidden=true">` : ""}<span>${esc(a.label)}</span></label><select data-policy="${esc(a.id)}" aria-label="${esc(a.label)} 默认出口"${ctx.profile.apps.includes(a.id) ? "" : " disabled"}>${options.map(([value, label]) => `<option value="${esc(value)}"${selected((ctx.profile.appPolicy[a.id] || "proxy") === value)}>${esc(label)}</option>`).join("")}</select></div>`,
            )
            .join(""),
      )
      .join("")}</div>` +
    notice(
      "APP 列表与地区均来自 Ratatoskr 模板。分流规则和最终出口统一维护，页面不提供规则自定义。",
    )
  );
}
