// Single definition of a widget card's markup, shared by the panels (initial
// render) and the editor (incremental add/remove without a full re-render).
// The unified widget model has NO checkbox: a card's presence on the grid IS
// its enabled state; disabled widgets live in the always-visible library.

import { catalog, moduleView } from "../shared/compiler.js";
import { selectableRegions } from "../shared/preview.js";
import { strategyView } from "./strategy-catalog.js";
import { esc, selected } from "./ui.js";
import { uiIcon } from "./icons.js";
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

// Policy option glyphs, all in the project's crisp inline-SVG icon language.
// Fixed exits get a stable SVG; regions keep their coloured flag (a meaningful
// country marker, not one of the "ugly" generic emoji) with an SVG fallback.
function policyGlyph(value, region) {
  if (value === "proxy") return uiIcon("switch");
  if (value === "reject") return uiIcon("ban");
  if (value === "direct") return uiIcon("arrow");
  if (region) {
    return region.flag
      ? `<span class="policy-flag" aria-hidden="true" data-emoji="${esc(region.flag)}">${esc(region.flag)}</span>`
      : uiIcon("globe");
  }
  return uiIcon("globe");
}

// Shared exit option list ([value, label, glyph HTML]) used by both the
// per-card pill menu and the batch bar, so they never drift apart.
export function appExitOptions(ctx) {
  const regions = selectableRegions(catalog, ctx.inspection).filter((r) =>
    r.id === "OTHER" ? ctx.profile.other : ctx.profile.countries.includes(r.id),
  );
  return [
    ["proxy", "跟随代理", policyGlyph("proxy")],
    ...regions.map((r) => ["region:" + r.id, r.label, policyGlyph("region:" + r.id, r)]),
    ["reject", "Reject", policyGlyph("reject")],
    ["direct", "Direct", policyGlyph("direct")],
  ];
}

function appCard(id, ctx) {
  const a = catalog.apps.find((x) => x.id === id);
  if (!a) return "";
  const options = appExitOptions(ctx);
  const current = ctx.profile.appPolicy[id] || "proxy";
  const active = options.find(([value]) => value === current) || options[0];
  const pills = options
    .map(
      ([value, label, glyph]) =>
        `<button type="button" class="policy-pill${value === current ? " is-active" : ""}" data-policy-option="${esc(value)}" role="option" aria-selected="${value === current}"><span class="policy-pill-glyph" aria-hidden="true">${glyph}</span><span>${esc(label)}</span></button>`,
    )
    .join("");
  // The WHOLE card is the trigger: tapping anywhere opens the exit popover.
  // Unlike the earlier "icon + name only" face, the card now ALSO shows the
  // current exit as a small persistent pill (glyph + short name), so the
  // routing is visible at a glance without opening the menu. The hidden
  // <select> stays the single data source for the compiler/share pipeline.
  return `<div class="app-card app-card--policy${a.entry ? " app-card--entry" : ""}" data-app-card="${esc(a.label.toLowerCase())}" data-category-item="${esc(a.category)}"${widgetAttrs("app", id)} data-app="${esc(id)}" data-policy-picker data-policy-trigger role="button" tabindex="0" aria-haspopup="listbox" aria-expanded="false" aria-label="${esc(a.label)} · 默认出口 ${esc(active[1])}"><span class="app-card-main"><span class="app-card-icon">${a.icon ? `<img src="${esc(a.icon)}" alt="" decoding="async" onerror="this.hidden=true">` : `<span class="app-card-icon-fallback" aria-hidden="true">${esc(a.label.slice(0, 1))}</span>`}</span><span class="app-card-label">${esc(a.label)}</span><span class="policy-current" data-policy-current><span class="policy-current-glyph" aria-hidden="true">${active[2]}</span><span class="policy-current-label">${esc(active[1])}</span></span></span><div class="policy-menu" data-policy-menu role="listbox" hidden>${pills}</div><select class="policy-native" data-policy="${esc(id)}" aria-label="${esc(a.label)} 默认出口" tabindex="-1" aria-hidden="true">${options.map(([value, label]) => `<option value="${esc(value)}"${selected(current === value)}>${esc(label)}</option>`).join("")}</select>${removeBadge("app", id)}</div>`;
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
  if (!ctx.widgetEditing) {
    const multi =
      kind === "app"
        ? `<button type="button" class="widget-sort-button" data-app-multi title="批量选择 APP：拖过即选中，可一键设置出口">${uiIcon("select-all")} 批量</button>`
        : "";
    return (
      `<div class="widget-editor-bar widget-editor-bar--idle">` +
      `<span class="widget-editor-hint">长按卡片，或点“编辑”整理布局</span>` +
      `<div class="widget-editor-actions">${multi}` +
      `<button type="button" class="widget-enter-edit" data-widget-enter>编辑</button>` +
      `</div></div>`
    );
  }
  const multi =
    kind === "app"
      ? `<button type="button" class="widget-sort-button" data-app-multi title="批量选择 APP：拖过即选中，可一键设置出口">${uiIcon("select-all")} 批量</button>`
      : "";
  return (
    `<div class="widget-editor-bar">` +
    `<span class="widget-editor-hint">拖动排序 · 点 <b>−</b> 移除 · 下方组件库点 <b>＋</b> 加回</span>` +
    `<div class="widget-editor-actions">` +
    multi +
    `<button type="button" class="widget-sort-button" data-widget-sort="alpha" title="按名称首字母排序">A→Z</button>` +
    `<button type="button" class="widget-sort-button" data-widget-sort="default" title="恢复模板默认顺序">默认</button>` +
    `<button type="button" class="widget-jiggle-button is-active" data-widget-done><span aria-hidden="true">✓</span> 完成</button>` +
    `</div></div>`
  );
}

// Batch-select action bar for the APP grid. Shown only while a multi-select
// gesture is active. The exit capsules reuse appExitOptions() so they stay in
// lock-step with the per-card menu; clicking one applies it to every selected
// card. The select-all icon button selects every visible (unfiltered) card.
export function appBatchBarHTML(ctx) {
  const options = appExitOptions(ctx);
  const exits = options
    .map(
      ([value, label, glyph]) =>
        `<button type="button" class="batch-exit" data-batch-exit="${esc(value)}" title="把选中 APP 设为 ${esc(label)}"><span class="batch-exit-glyph" aria-hidden="true">${glyph}</span><span>${esc(label)}</span></button>`,
    )
    .join("");
  return (
    `<div class="app-batchbar" data-app-batchbar hidden>` +
    `<div class="app-batchbar-top">` +
    `<button type="button" class="batch-select-all" data-batch-select-all title="全选 / 取消全选">${uiIcon("select-all")}<span>全选</span></button>` +
    `<span class="batch-count" data-batch-count>已选 0 个</span>` +
    `<button type="button" class="batch-remove" data-batch-remove title="从网格移除选中 APP">${uiIcon("ban")}<span>移除</span></button>` +
    `<button type="button" class="batch-done" data-batch-done>${uiIcon("check")}<span>完成</span></button>` +
    `</div>` +
    `<div class="app-batchbar-exits" role="group" aria-label="批量设置默认出口">${exits}</div>` +
    `</div>`
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
