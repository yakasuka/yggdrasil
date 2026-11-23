// iOS-like widget board for the four picker groups.
//
// Unified model (no second state to keep in sync):
//   - a card's presence on the grid == it is enabled
//   - idle state is a clean board with a quiet "编辑" entry (long-press works
//     too); entering edit mode reveals the minus badges, sort buttons and the
//     component library, and makes the cards wobble like iOS home-screen icons
//   - exiting edit mode ("完成" / Esc) hides all of that again but KEEPS the
//     result: a removed card stays removed, because profile state is the truth
//   - DRAG-TO-REORDER always works, in edit mode or not — like iOS widgets,
//     moving a card never requires entering the wobble mode
//   - remove / add / sort / drag mutate the profile and update the DOM in
//     place with FLIP animations; there is no full `render()` flash
//
// Pure state changes live in widget-mode.js (unit-tested). This module owns
// DOM gestures + chrome; handlers are delegated on document so they survive
// the wizard's occasional full re-renders.

import {
  disabledIds,
  enabledIds,
  widgetLabel,
  setEnabled,
  sortWidgets,
  libraryItem,
  ORDER_KEY,
} from "./widget-mode.js";
import { gridHTML } from "./widget-cards.js";
import { catalog } from "../shared/compiler.js";
import { renderEmoji } from "./emoji.js";

// Which wizard step owns which widget group (see `steps` in app.js).
export const STEP_WIDGET = {
  1: "region",
  2: "strategy",
  3: "app",
  4: "module",
};

const LONG_PRESS_MS = 420;
let pressTimer = 0;
let pressStart = null;

// Panels render the toolbar + grid + library themselves (present on first
// paint, testable as pure HTML). decorate only applies transient UI state:
// jiggle class and the one-shot pop-in for a just-added widget.
export function decorate(kind, ctx, panelEl) {
  if (!panelEl) return;
  const grid = panelEl.querySelector(`[data-widget-grid="${kind}"]`);
  panelEl.classList.toggle("is-widget-editing", !!ctx.widgetEditing);
  if (grid) {
    grid.classList.toggle("is-editing", !!ctx.widgetEditing);
    if (ctx.enterWidgetId) {
      const card = grid.querySelector(`[data-id="${CSS.escape(ctx.enterWidgetId)}"]`);
      if (card) {
        card.classList.add("widget-enter");
        setTimeout(() => card.classList.remove("widget-enter"), 520);
      }
    }
  }
  ctx.enterWidgetId = null;
}

// --- FLIP ------------------------------------------------------------------
// Snapshot the position of every card + library item in a grid group.
function snapshot(root, kind) {
  const map = new Map();
  root
    .querySelectorAll(`[data-widget-grid="${kind}"] [data-widget], [data-widget-library-panel="${kind}"] [data-widget-add]`)
    .forEach((el) => map.set(el, el.getBoundingClientRect()));
  return map;
}

// Animate elements from their old boxes to their new ones. Removed elements
// (no longer in the DOM) get a fade-out ghost; new elements fade in.
function flip(root, kind, before, { duration = 320 } = {}) {
  const grid = root.querySelector(`[data-widget-grid="${kind}"]`);
  const lib = root.querySelector(`[data-widget-library-panel="${kind}"]`);
  const targets = [
    ...(grid?.querySelectorAll("[data-widget]") || []),
    ...(lib?.querySelectorAll("[data-widget-add]") || []),
  ];
  for (const el of targets) {
    const old = before.get(el);
    const now = el.getBoundingClientRect();
    if (!old) {
      el.animate(
        [
          { opacity: 0, transform: "scale(.72) translateY(8px)" },
          { opacity: 1, transform: "none" },
        ],
        { duration, easing: "cubic-bezier(.22,1,.36,1)" },
      );
      continue;
    }
    const dx = old.left - now.left,
      dy = old.top - now.top;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
    el.animate(
      [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
      { duration, easing: "cubic-bezier(.22,1,.36,1)" },
    );
  }
}

// Repaint a whole grid+library region from the profile (used by sort and bulk
// actions where card contents change, not just order).
function repaint(root, kind, ctx, before) {
  const grid = root.querySelector(`[data-widget-grid="${kind}"]`);
  const libGrid = root.querySelector(`[data-widget-library-panel="${kind}"] [data-library-grid]`);
  if (!grid || !libGrid) return;
  grid.innerHTML = gridHTML(kind, ctx);
  libGrid.innerHTML = disabledIds(kind, ctx.profile, catalog)
    .map((id) => libraryItem(kind, id, catalog))
    .join("");
  const empty = root.querySelector(`[data-widget-library-panel="${kind}"] [data-library-empty]`);
  if (empty) empty.remove();
  if (!libGrid.children.length)
    libGrid.insertAdjacentHTML("beforeend", `<p class="widget-library-empty" data-library-empty>所有组件都在网格里了。</p>`);
  const count = root.querySelector(`[data-widget-library-panel="${kind}"] [data-library-count]`);
  if (count) count.textContent = String(disabledIds(kind, ctx.profile, catalog).length);
  renderEmoji(grid);
  renderEmoji(libGrid);
  flip(root, kind, before);
}

// Refresh the toolbar count text without touching the cards.
function refreshCount(root, kind, ctx) {
  const count = root.querySelector(`[data-widget-library-panel="${kind}"] [data-library-count]`);
  if (count) count.textContent = String(disabledIds(kind, ctx.profile, catalog).length);
  const toolbar = document.querySelector("#panel .toolbar .muted");
  if (!toolbar) return;
  const on = enabledIds(kind, ctx.profile).length;
  if (kind === "region") toolbar.textContent = toolbar.textContent.replace(/\d+ 个保留地区/, `${on} 个保留地区`);
  if (kind === "app") toolbar.textContent = `${on} 个已启用`;
  if (kind === "module") toolbar.textContent = toolbar.textContent.replace(/^\d+/, String(on));
}

function cancelPress() {
  clearTimeout(pressTimer);
  pressTimer = 0;
  pressStart = null;
}

function currentKind(ctx, step) {
  return STEP_WIDGET[step] || null;
}

// The root element that holds both grids for the current step.
function widgetRoot() {
  return document.querySelector("#panel");
}

// Bind the document-level delegates once.
export function bind(api) {
  const { ctx, getStep, render, changed, toast, onStateChange } = api;
  // Apply the same side effects the old checkbox `change` handler carried,
  // now that state changes flow through the widget board instead.
  const afterState = (kind, id, on) => {
    if (kind === "region") {
      ctx.selectedRegions = true;
      onStateChange?.("region", id, on);
    } else if (kind === "strategy") {
      if (!ctx.profile.strategies.includes(ctx.profile.defaultStrategy))
        ctx.profile.defaultStrategy = "gateway";
      onStateChange?.("strategy", id, on);
    } else {
      onStateChange?.(kind, id, on);
    }
  };

  // Long-press empty grid space toggles the playful jiggle state. It no longer
  // gates any capability — it is purely cosmetic now.
  document.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const kind = currentKind(ctx, getStep());
    if (!kind || ctx.widgetEditing) return;
    const panel = document.querySelector("#panel");
    if (!panel || !panel.contains(e.target)) return;
    // Batch multi-select owns all pointer gestures on the APP grid while its
    // mode is active; long-press-to-edit must not fire mid brush stroke.
    if (panel.classList.contains("is-app-multi")) return;
    if (e.target.closest("button, input, select, a, .notice, details, .widget-library")) return;
    pressStart = { x: e.clientX, y: e.clientY, kind };
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      pressTimer = 0;
      if (!pressStart || pressStart.kind !== kind) return;
      ctx.widgetEditing = true;
      render();
      toast?.("已进入编辑模式：可抖动整理、移除、排序与加回");
    }, LONG_PRESS_MS);
  });
  document.addEventListener("pointermove", (e) => {
    if (pressStart && (Math.abs(e.clientX - pressStart.x) > 10 || Math.abs(e.clientY - pressStart.y) > 10)) cancelPress();
  });
  document.addEventListener("pointerup", cancelPress);
  document.addEventListener("pointercancel", cancelPress);

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    // APP batch mode owns all clicks on the grid; never let an inner button
    // (policy pill / remove badge) leak through to edit-mode actions.
    if (document.querySelector("#panel")?.classList.contains("is-app-multi")) return;
    const kind = currentKind(ctx, getStep());
    const root = widgetRoot();

    // Enter / exit edit mode. "完成" only exits mode — it never touches the
    // profile, so a card removed earlier stays removed after leaving.
    if (btn.hasAttribute("data-widget-enter")) {
      ctx.widgetEditing = true;
      render();
      toast?.("已进入编辑模式：可抖动整理、移除、排序与加回");
      return;
    }
    if (btn.hasAttribute("data-widget-done")) {
      ctx.widgetEditing = false;
      render();
      toast?.("已退出编辑模式");
      return;
    }
    if (btn.dataset.widgetSort && kind) {
      const before = snapshot(root, kind);
      sortWidgets(kind, btn.dataset.widgetSort, ctx.profile, catalog);
      changed();
      repaint(root, kind, ctx, before);
      toast?.(btn.dataset.widgetSort === "alpha" ? "已按名称首字母排序" : "已恢复模板默认顺序");
      return;
    }
    // Add from the library: move the item into the grid, animate both sides.
    if (btn.dataset.widgetAdd && kind) {
      const k = btn.dataset.widgetAdd,
        id = btn.dataset.id;
      const before = snapshot(root, k);
      if (setEnabled(k, id, true, ctx.profile, catalog)) {
        changed();
        afterState(k, id, true);
        ctx.enterWidgetId = id;
        repaint(root, k, ctx, before);
        refreshCount(root, k, ctx);
        toast?.(`已添加「${widgetLabel(k, id, catalog).label}」`);
      }
      return;
    }
    // Remove from the grid: card flies to the library, which is already open.
    if (btn.dataset.widgetRemove && kind) {
      e.preventDefault();
      e.stopPropagation();
      const k = btn.dataset.widgetRemove,
        id = btn.dataset.id;
      const before = snapshot(root, k);
      if (setEnabled(k, id, false, ctx.profile, catalog)) {
        changed();
        afterState(k, id, false);
        repaint(root, k, ctx, before);
        refreshCount(root, k, ctx);
        toast?.(`已移除「${widgetLabel(k, id, catalog).label}」 · 可在组件库加回`);
      }
      return;
    }
  });

  // Drag-to-reorder: FLIP each swap so cards glide instead of teleporting.
  let draggingId = null;
  document.addEventListener("dragstart", (e) => {
    const card = e.target.closest("[data-widget]");
    // In APP batch mode the brush gesture replaces drag-to-reorder; cards are
    // marked draggable=false on enter, but guard here too for safety.
    if (document.querySelector("#panel")?.classList.contains("is-app-multi")) {
      e.preventDefault();
      return;
    }
    // Fixed ("always on") cards are draggable too — only deletion is locked.
    if (!card) {
      e.preventDefault();
      return;
    }
    draggingId = card.dataset.id;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", draggingId);
    card.classList.add("is-dragging");
    // The browser's default drag snapshot includes the card's box-shadow and
    // the square pseudo-element corners, which shows up as an ugly four-corner
    // frame. Build a clean, rounded drag image from a light clone instead.
    const ghost = card.cloneNode(true);
    ghost.classList.remove("is-dragging");
    ghost.classList.add("drag-ghost");
    ghost.removeAttribute("id");
    ghost.style.position = "fixed";
    ghost.style.top = "-10000px";
    ghost.style.left = "-10000px";
    ghost.style.width = card.offsetWidth + "px";
    ghost.style.margin = "0";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, card.offsetWidth / 2, card.offsetHeight / 2);
    // Remove after the snapshot is taken (next task, after dragstart returns).
    setTimeout(() => ghost.remove(), 0);
  });
  document.addEventListener("dragover", (e) => {
    const hovered = e.target.closest("[data-widget]");
    if (!hovered || !draggingId) return;
    e.preventDefault();
    const grid = hovered.parentElement;
    const dragEl = grid.querySelector(`[data-id="${CSS.escape(draggingId)}"]`);
    if (!dragEl || dragEl === hovered) return;
    if (dragEl.dataset.categoryItem !== undefined && dragEl.dataset.categoryItem !== hovered.dataset.categoryItem) return;
    const before = snapshot(widgetRoot(), currentKind(ctx, getStep()));
    const rect = hovered.getBoundingClientRect();
    const after = e.clientX > rect.left + rect.width / 2;
    grid.insertBefore(dragEl, after ? hovered.nextSibling : hovered);
    flip(widgetRoot(), currentKind(ctx, getStep()), before, { duration: 200 });
  });
  document.addEventListener("dragend", (e) => {
    e.target.closest("[data-widget]")?.classList.remove("is-dragging");
    if (!draggingId) return;
    const kind = currentKind(ctx, getStep());
    if (kind) {
      const grid = document.querySelector(`[data-widget-grid="${kind}"]`);
      if (grid) {
        const ids = [...grid.querySelectorAll("[data-widget]")].map((c) => c.dataset.id);
        ctx.profile.order = { ...ctx.profile.order, [ORDER_KEY[kind]]: ids };
        changed();
      }
    }
    draggingId = null;
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && ctx.widgetEditing) {
      ctx.widgetEditing = false;
      render();
    }
  });
}
