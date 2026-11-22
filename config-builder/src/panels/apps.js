import { catalog } from "../../shared/compiler.js";
import { selectableRegions } from "../../shared/preview.js";
import { esc, checked, selected, title, notice } from "../ui.js";
export function appsPanel(ctx) {
  const regions = selectableRegions(catalog, ctx.inspection).filter((r) =>
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
                `<div class="app-card${a.entry ? " app-card--entry" : ""}" data-app-card="${esc(a.label.toLowerCase())}" data-category-item="${esc(cat)}"><label><input type="checkbox" data-app="${esc(a.id)}"${checked(ctx.profile.apps.includes(a.id))}>${a.icon ? `<img src="${esc(a.icon)}" alt="" loading="lazy" onerror="this.hidden=true">` : ""}<span>${esc(a.label)}</span>${a.entry ? `<small class="entry-tag">策略入口</small>` : ""}</label><select data-policy="${esc(a.id)}" aria-label="${esc(a.label)} 默认出口"${ctx.profile.apps.includes(a.id) ? "" : " disabled"}>${options.map(([value, label]) => `<option value="${esc(value)}"${selected((ctx.profile.appPolicy[a.id] || "proxy") === value)}>${esc(label)}</option>`).join("")}</select>${a.entry ? `<small class="entry-hint">模板中的全部节点开关，暂未绑定规则</small>` : ""}</div>`,
            )
            .join(""),
      )
      .join("")}</div>` +
    notice(
      "APP、地区与策略入口均来自 Ratatoskr 模板，模板里写了的都会显示。Hermes 属于 AI 一类；带「策略入口」标记的是模板中的无规则开关组，可以选择默认出口。「🌌 Others」是地区类别（规则国家之外的节点），在「地区节点」页勾选，不属于 APP。规则集模块可在下一步「规则模块」中勾选。",
    )
  );
}
