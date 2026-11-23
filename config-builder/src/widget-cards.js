// Single definition of a widget card's markup, shared by the panels (initial
// render) and the editor (incremental add/remove without a full re-render).
// The unified widget model has NO checkbox: a card's presence on the grid IS
// its enabled state; disabled widgets live in the always-visible library.

import { catalog, moduleView } from "../shared/compiler.js";
import { selectableRegions } from "../shared/preview.js";
import { strategyView } from "./strategy-catalog.js";
import { esc, selected } from "./ui.js";
import {
  activeOrder,
  disabledIds,
  widgetAttrs,
  removeBadge,
  libraryItem as libraryItemHTML,
} from "./widget-mode.js";

// Control attributes kept on the card root so existing delegated handlers and
// tests can still locate a widget by its data-{region,strategy,app,module} id.
const CONTROL = {
  region: "region",
  strategy: "strategy",
  app: "app",
  module: "module",
};

function regionCard(id, ctx) {
  const all = selectableRegions(catalog, ctx.inspection);
  const r = all.find((x) => x.id === id);
  if (!r) return "";
  const flag = r.icon
    ? `<img class="region-flag" src="${esc(r.icon)}" alt="" decoding="async" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'flag',textContent:'${esc(r.flag)}'}))">`
    : `<span class="flag" aria-hidden="true">${esc(r.flag)}</span>`;
  return `<div class="region-bar"${widgetAttrs("region", id)} data-region="${esc(id)}">${flag}<span class="region-name">${esc(r.label)}</span><small class="region-count${r.count ? "" : " is-empty"}" title="${r.count ? `${r.count} 个节点` : "订阅中暂无节点"}">${r.count}</small>${removeBadge("region", id)}</div>`;
}

function strategyCard(id, ctx) {
  const s = strategyView().find((x) => x.id === id);
  if (!s) return "";
  const on = s.fixed || ctx.profile.strategies.includes(id);
  return `<div class="choice${s.fixed ? " fixed" : ""}${on ? " is-on" : ""}"${widgetAttrs("strategy", id, { fixed: !!s.fixed })} data-strategy="${esc(id)}">${s.icon ? `<img class="choice-icon" src="${esc(s.icon)}" alt="" decoding="async" onerror="this.hidden=true">` : ""}<span><strong>${esc(s.name)}</strong>${s.fixed ? `<span class="choice-badge">始终保留</span>` : ""}<small>${esc(s.description)}</small></span>${removeBadge("strategy", id, !!s.fixed)}</div>`;
}

function appCard(id, ctx) {
  const a = catalog.apps.find((x) => x.id === id);
  if (!a) return "";
  const regions = selectableRegions(catalog, ctx.inspection).filter((r) =>
    r.id === "OTHER" ? ctx.profile.other : ctx.profile.countries.includes(r.id),
  );
  const options = [
    ["proxy", "跟随代理"],
    ...regions.map((r) => ["region:" + r.id, r.label]),
    ["reject", "Reject"],
    ["direct", "Direct"],
  ];
  return `<div class="app-card${a.entry ? " app-card--entry" : ""}" data-app-card="${esc(a.label.toLowerCase())}" data-category-item="${esc(a.category)}"${widgetAttrs("app", id)} data-app="${esc(id)}"><div class="app-card-main">${a.icon ? `<img src="${esc(a.icon)}" alt="" decoding="async" onerror="this.hidden=true">` : ""}<span>${esc(a.label)}</span>${a.entry ? `<small class="entry-tag">策略入口</small>` : ""}</div><select data-policy="${esc(id)}" aria-label="${esc(a.label)} 默认出口">${options.map(([value, label]) => `<option value="${esc(value)}"${selected((ctx.profile.appPolicy[id] || "proxy") === value)}>${esc(label)}</option>`).join("")}</select>${a.entry ? `<small class="entry-hint">模板中的全部节点开关，暂未绑定规则</small>` : ""}${removeBadge("app", id)}</div>`;
}

function moduleCard(id, ctx) {
  const m = moduleView(id, catalog);
  const count = catalog.orderedRules.filter((r) => r.module === id).length;
  return `<div class="choice"${widgetAttrs("module", id)} data-module="${esc(id)}"><span><strong>${esc(m.symbol)} ${esc(m.label)}</strong><small>${esc(m.description)} · ${count} 条规则</small></span>${removeBadge("module", id)}</div>`;
}

const BUILDERS = {
  region: regionCard,
  strategy: strategyCard,
  app: appCard,
  module: moduleCard,
};

export function cardHTML(kind, id, ctx) {
  return BUILDERS[kind]?.(id, ctx) || "";
}

// Grid cards: enabled widgets in saved display order. APP keeps its category
// headings so the grouped layout and search filtering stay intact.
export function gridHTML(kind, ctx) {
  if (kind === "app") {
    const active = new Set(activeOrder("app", ctx.profile));
    return [...new Set(catalog.apps.map((a) => a.category))]
      .map(
        (cat) =>
          `<div class="category-heading" data-category="${esc(cat)}">${esc(cat)}</div>` +
          catalog.apps
            .filter((a) => a.category === cat && active.has(a.id))
            .map((a) => cardHTML("app", a.id, ctx))
            .join(""),
      )
      .join("");
  }
  return activeOrder(kind, ctx.profile)
    .map((id) => cardHTML(kind, id, ctx))
    .join("");
}

// The library is ALWAYS visible: every disabled widget with a "+" to add back.
export function libraryHTML(kind, ctx) {
  const disabled = disabledIds(kind, ctx.profile);
  return disabled.length
    ? disabled.map((id) => libraryItemHTML(kind, id)).join("")
    : "";
}

// Toolbar. The idle state is deliberately quiet — just a hint and a small
// "编辑" entry (long-press on a card works too). All editing controls (sort,
// remove, library, jiggle) only appear once edit mode is entered, matching
// the iOS home-screen model: clean by default, editable on demand.
export function toolbarHTML(kind, ctx) {
  if (!ctx.widgetEditing)
    return (
      `<div class="widget-editor-bar widget-editor-bar--idle">` +
      `<span class="widget-editor-hint">长按卡片，或点“编辑”整理布局</span>` +
      `<button type="button" class="widget-enter-edit" data-widget-enter>编辑</button>` +
      `</div>`
    );
  return (
    `<div class="widget-editor-bar">` +
    `<span class="widget-editor-hint">拖动排序 · 点 <b>−</b> 移除 · 下方组件库点 <b>＋</b> 加回</span>` +
    `<div class="widget-editor-actions">` +
    `<button type="button" class="widget-sort-button" data-widget-sort="alpha" title="按名称首字母排序">A→Z</button>` +
    `<button type="button" class="widget-sort-button" data-widget-sort="default" title="恢复模板默认顺序">默认</button>` +
    `<button type="button" class="widget-jiggle-button is-active" data-widget-done><span aria-hidden="true">✓</span> 完成</button>` +
    `</div></div>`
  );
}

// Component library section (markup + heading + empty state). It lives in the
// DOM in both states so incremental updates stay simple, but CSS hides it
// outside edit mode — exactly like iOS's widget gallery.
export function librarySectionHTML(kind, ctx) {
  const disabled = disabledIds(kind, ctx.profile);
  return (
    `<div class="widget-library" data-widget-library-panel="${kind}">` +
    `<div class="widget-library-head"><strong>组件库</strong><small>点击 ＋ 添加回网格</small><span class="widget-library-count" data-library-count>${disabled.length}</span></div>` +
    `<div class="widget-library-grid" data-library-grid>${
      disabled.length
        ? disabled.map((id) => libraryItemHTML(kind, id)).join("")
        : `<p class="widget-library-empty" data-library-empty>所有组件都在网格里了。</p>`
    }</div></div>`
  );
}

export { CONTROL };
