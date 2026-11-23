// iOS-like widget edit mode. Long-press empty space in a picker to make its
// cards jiggle, tap the red minus to remove one (it flies into the library),
// tap + to reopen the library and add a widget back, and drag to reorder.
//
// This module only owns DOM gestures + chrome; the pure state changes live in
// widget-mode.js and are covered by tests. Handlers are delegated on document
// so they survive the wizard's full innerHTML re-renders.

import {
  WIDGET_KINDS,
  disabledIds,
  enabledIds,
  widgetLabel,
  setEnabled,
  moveOrder,
  ORDER_KEY,
} from "./widget-mode.js";
import { esc } from "./ui.js";
import { catalog } from "../shared/compiler.js";
import { renderEmoji } from "./emoji.js";

// Which wizard step owns which widget group (see `steps` in app.js).
export const STEP_WIDGET = {
  1: "region",
  2: "strategy",
  3: "app",
  4: "module",
};

const LONG_PRESS_MS = 480;
let pressTimer = 0;
let pressStart = null;

// Chrome injected while editing: a floating "完成" pill and a "+ 添加组件"
// button. The widget library opens as a sheet below the toolbar.
export function editorChrome(kind, ctx) {
  if (!ctx.widgetEditing) return "";
  const disabled = disabledIds(kind, ctx.profile, catalog);
  return (
    `<div class="widget-editor-bar"><span class="widget-editor-hint">拖动排序 · 点击 <b>−</b> 移除</span><div class="widget-editor-actions"><button type="button" class="widget-add-button" data-widget-library="${kind}" aria-expanded="${ctx.widgetLibrary === kind}"><span aria-hidden="true">＋</span> 添加组件</button><button type="button" class="widget-done-button" data-widget-done>完成</button></div></div>` +
    (ctx.widgetLibrary === kind
      ? `<div class="widget-library" data-widget-library-panel="${kind}"><div class="widget-library-head"><strong>组件库</strong><small>点击添加回网格</small><button type="button" class="widget-library-close" data-widget-library-close aria-label="关闭组件库">×</button></div>${
          disabled.length
            ? `<div class="widget-library-grid">${disabled
                .map((id) => {
                  const w = widgetLabel(kind, id, catalog);
                  return `<button type="button" class="widget-library-item" data-widget-add="${kind}" data-id="${esc(id)}">${w.icon ? `<img src="${esc(w.icon)}" alt="" decoding="async" onerror="this.hidden=true">` : `<span aria-hidden="true">${esc(w.text)}</span>`}<span>${esc(w.label)}</span><b aria-hidden="true">＋</b></button>`;
                })
                .join("")}</div>`
            : `<p class="widget-library-empty">所有组件都在网格里了。</p>`
        }</div>`
      : "")
  );
}

// Called after every render(): mark the panel as editable and inject chrome.
export function decorate(kind, ctx, panelEl) {
  if (!panelEl) return;
  panelEl.classList.toggle("is-widget-editing", !!ctx.widgetEditing);
  const grid = panelEl.querySelector(`[data-widget-grid="${kind}"]`);
  if (grid) {
    grid.classList.toggle("is-editing", !!ctx.widgetEditing);
    const on = new Set(enabledIds(kind, ctx.profile));
    grid.querySelectorAll("[data-widget]").forEach((card) => {
      // In edit mode only enabled cards live on the grid; the disabled ones
      // move to the + library (this is what makes "remove" hide the card).
      card.classList.toggle(
        "is-library-only",
        !!ctx.widgetEditing && !on.has(card.dataset.id),
      );
      if (ctx.enterWidgetId && card.dataset.id === ctx.enterWidgetId) {
        card.classList.add("widget-enter");
        setTimeout(() => card.classList.remove("widget-enter"), 500);
      }
      if (card.hasAttribute("data-widget-fixed")) return;
      if (ctx.widgetEditing) card.setAttribute("draggable", "true");
      else card.removeAttribute("draggable");
    });
  }
  // Consume the one-shot enter animation marker after it has been applied.
  ctx.enterWidgetId = null;
  // Remove stale chrome from the previous render, then append fresh.
  panelEl.querySelector(".widget-editor-root")?.remove();
  if (!ctx.widgetEditing) return;
  const root = document.createElement("div");
  root.className = "widget-editor-root";
  root.innerHTML = editorChrome(kind, ctx);
  panelEl.append(root);
  renderEmoji(root);
}

function cancelPress() {
  clearTimeout(pressTimer);
  pressTimer = 0;
  pressStart = null;
}

function currentKind(ctx, step) {
  return STEP_WIDGET[step] || null;
}

// Bind the document-level delegates once. `api` supplies {ctx, getStep,
// render, changed, toast}. Returns a disposer (rarely used).
export function bind(api) {
  const { ctx, getStep, render, changed, toast } = api;

  // Long-press on empty panel space enters edit mode. We ignore interactive
  // elements so a normal tap still toggles a checkbox / opens a select.
  document.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const kind = currentKind(ctx, getStep());
    if (!kind || ctx.widgetEditing) return;
    const panel = document.querySelector("#panel");
    if (!panel || !panel.contains(e.target)) return;
    if (e.target.closest("button, input, select, a, .notice, details")) return;
    pressStart = { x: e.clientX, y: e.clientY };
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      pressTimer = 0;
      if (!pressStart) return;
      ctx.widgetEditing = true;
      ctx.widgetLibrary = null;
      render();
      toast?.("编辑模式：拖动排序，点 − 移除，点 ＋ 添加");
    }, LONG_PRESS_MS);
  });
  const abortPress = (e) => {
    if (
      pressStart &&
      (Math.abs(e.clientX - pressStart.x) > 10 ||
        Math.abs(e.clientY - pressStart.y) > 10)
    )
      cancelPress();
  };
  document.addEventListener("pointermove", abortPress);
  document.addEventListener("pointerup", cancelPress);
  document.addEventListener("pointercancel", cancelPress);

  // Click delegate for editor chrome (done / library / add / close / remove).
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const kind = currentKind(ctx, getStep());

    if (btn.hasAttribute("data-widget-done")) {
      ctx.widgetEditing = false;
      ctx.widgetLibrary = null;
      render();
      return;
    }
    if (btn.dataset.widgetLibrary) {
      ctx.widgetLibrary = ctx.widgetLibrary === btn.dataset.widgetLibrary ? null : btn.dataset.widgetLibrary;
      render();
      return;
    }
    if (btn.hasAttribute("data-widget-library-close")) {
      ctx.widgetLibrary = null;
      render();
      return;
    }
    if (btn.dataset.widgetAdd) {
      const k = btn.dataset.widgetAdd,
        id = btn.dataset.id;
      if (setEnabled(k, id, true, ctx.profile, catalog)) {
        ctx.profile.order = ctx.profile.order || {};
        ctx.enterWidgetId = id; // play the pop-in animation on the new card
        changed();
        render();
        toast?.(`已添加「${widgetLabel(k, id, catalog).label}」`);
      }
      return;
    }
    if (btn.dataset.widgetRemove && kind) {
      // The badge sits inside the <label> card; without this the label's
      // default action re-checks the box we just switched off.
      e.preventDefault();
      e.stopPropagation();
      const k = btn.dataset.widgetRemove,
        id = btn.dataset.id;
      const card = btn.closest("[data-widget]");
      if (setEnabled(k, id, false, ctx.profile, catalog)) {
        changed();
        if (card) {
          card.classList.add("is-removing");
          setTimeout(() => render(), 220);
        } else render();
      }
      return;
    }
  });

  // HTML5 drag-and-drop reordering, delegated on dragstart/dragover/drop.
  let draggingId = null;
  document.addEventListener("dragstart", (e) => {
    const card = e.target.closest("[data-widget]");
    if (!card || !ctx.widgetEditing || card.hasAttribute("data-widget-fixed")) {
      e.preventDefault();
      return;
    }
    draggingId = card.dataset.id;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", draggingId);
    card.classList.add("is-dragging");
  });
  document.addEventListener("dragover", (e) => {
    const hovered = e.target.closest("[data-widget]");
    if (!hovered || !draggingId) return;
    e.preventDefault();
    const grid = hovered.parentElement;
    const dragEl = grid.querySelector(`[data-id="${CSS.escape(draggingId)}"]`);
    if (!dragEl || dragEl === hovered) return;
    // APP cards are grouped by category; keep reordering within one group so a
    // dropped card never jumps sections on the next render.
    if (
      dragEl.dataset.categoryItem !== undefined &&
      dragEl.dataset.categoryItem !== hovered.dataset.categoryItem
    )
      return;
    const rect = hovered.getBoundingClientRect();
    const after = e.clientX > rect.left + rect.width / 2;
    // Insert the dragged card before/after the hovered one based on pointer.
    grid.insertBefore(dragEl, after ? hovered.nextSibling : hovered);
  });
  document.addEventListener("dragend", (e) => {
    const card = e.target.closest("[data-widget]");
    card?.classList.remove("is-dragging");
    if (!draggingId) return;
    const kind = currentKind(ctx, getStep());
    if (kind) {
      const grid = document.querySelector(`[data-widget-grid="${kind}"]`);
      if (grid) {
        const ids = [...grid.querySelectorAll("[data-widget]")].map(
          (c) => c.dataset.id,
        );
        ctx.profile.order = {
          ...ctx.profile.order,
          [ORDER_KEY[kind]]: ids,
        };
        changed();
      }
    }
    draggingId = null;
  });

  // Esc exits edit mode.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && ctx.widgetEditing) {
      ctx.widgetEditing = false;
      ctx.widgetLibrary = null;
      render();
    }
  });
}
