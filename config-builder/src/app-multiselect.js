// APP batch multi-select. A Wooting-style "brush" gesture: press on one APP
// card and drag across others; every card the pointer passes over is selected.
// Also supports click-to-toggle, Ctrl/Cmd+A (select all visible), a clickable
// select-all icon, batch exit assignment and batch removal.

// IMPORTANT: multi-select is a MODE, mutually exclusive with the widget
// editor's long-press / drag-reorder and the single-card policy popover.
// While active we add `.is-app-multi` to #panel; those other handlers bail out
// on that class. This single class is the source of truth for the mode.

const state = {
  active: false,
  painting: false,
  // Cards painted by the current gesture are added to this set; used so a
  // brush stroke never toggles a card twice as the pointer re-crosses it.
  stroke: new Set(),
};

function panel() {
  return document.querySelector("#panel");
}
function grid() {
  return document.querySelector('[data-widget-grid="app"]');
}
function bar() {
  return document.querySelector("[data-app-batchbar]");
}
function cards() {
  return grid() ? [...grid().querySelectorAll("[data-widget][data-app]")] : [];
}
function visibleCards() {
  return cards().filter((c) => !c.hidden);
}

function isMulti() {
  // The DOM class alone is not enough: render() replaces #panel.innerHTML but
  // never the panel element's own classes, so a stale class can outlive the
  // mode. Require the internal flag too, and self-heal a stale class.
  if (!state.active && panel()?.classList.contains("is-app-multi")) {
    panel().classList.remove("is-app-multi");
  }
  return !!state.active && !!panel()?.classList.contains("is-app-multi");
}

function setCardSelected(card, on) {
  card.classList.toggle("is-multi-selected", on);
  // Cards are role="button": aria-selected is invalid there and screen readers
  // ignore it. aria-pressed is the correct "toggle button" state.
  card.setAttribute("aria-pressed", String(on));
}

function selectedCards() {
  return cards().filter((c) => c.classList.contains("is-multi-selected"));
}

function refreshCount() {
  const el = document.querySelector("[data-batch-count]");
  if (el) {
    const n = selectedCards().length;
    el.textContent = `已选 ${n} 个`;
  }
  const allBtn = document.querySelector("[data-batch-select-all]");
  if (allBtn) {
    const vis = visibleCards();
    const all = vis.length > 0 && vis.every((c) => c.classList.contains("is-multi-selected"));
    allBtn.classList.toggle("is-active", all);
    allBtn.setAttribute("aria-pressed", String(all));
  }
}

function enter() {
  const g = grid();
  if (!g) return;
  panel()?.classList.add("is-app-multi");
  state.active = true;
  for (const c of cards()) c.setAttribute("draggable", "false");
  const b = bar();
  if (b) b.hidden = false;
  refreshCount();
}

function exit() {
  state.active = false;
  state.painting = false;
  state.stroke.clear();
  panel()?.classList.remove("is-app-multi");
  for (const c of cards()) {
    c.setAttribute("draggable", "true");
    setCardSelected(c, false);
  }
  const b = bar();
  if (b) b.hidden = true;
}

function clearSelection() {
  for (const c of cards()) setCardSelected(c, false);
  state.stroke.clear();
  refreshCount();
}

function selectAll() {
  const vis = visibleCards();
  const all = vis.length > 0 && vis.every((c) => c.classList.contains("is-multi-selected"));
  for (const c of vis) setCardSelected(c, !all);
  refreshCount();
}

function paintTo(target) {
  const card = target?.closest?.("[data-widget][data-app]");
  if (!card || card.hidden || state.stroke.has(card)) return;
  state.stroke.add(card);
  setCardSelected(card, true);
  refreshCount();
}

// Apply an exit value to all selected cards by driving each hidden <select>
// through the same `change` pipeline the single-card picker uses. This keeps
// compile/share/profile logic untouched while updating every visible pill.
function applyExit(value) {
  const selected = selectedCards();
  let first = null;
  let applied = 0;
  for (const card of selected) {
    const select = card.querySelector("select[data-policy]");
    if (!select || select.value === value) continue;
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    first = first || card;
    applied++;
    // Mirror the single-card picker's visual update without opening it.
    const pill = card.querySelector(`[data-policy-option="${CSS.escape(value)}"]`);
    const current = card.querySelector("[data-policy-current]");
    if (pill && current) {
      const glyph = pill.querySelector(".policy-pill-glyph");
      const gt = current.querySelector(".policy-current-glyph");
      const lt = current.querySelector(".policy-current-label");
      const label = pill.querySelector("span:last-child")?.textContent || "";
      if (glyph && gt) gt.innerHTML = glyph.innerHTML;
      if (lt) lt.textContent = label;
      for (const p of card.querySelectorAll("[data-policy-option]")) {
        const on = p === pill;
        p.classList.toggle("is-active", on);
        p.setAttribute("aria-selected", String(on));
      }
      card.setAttribute("aria-label", `${card.dataset.app || ""} · 默认出口 ${label}`.trim());
    }
  }
  refreshCount();
  // Report the number actually changed, not the whole selection (which may
  // already have had this exit set on some cards).
  return { count: applied, changed: !!first };
}

// Remove every selected APP from the grid via the widget editor's own removal
// button, so profile state, ordering and the library panel all stay in sync.
function removeSelected() {
  const ids = selectedCards().map((c) => c.dataset.app);
  // The remove badge's click is owned by the widget editor, which deliberately
  // ignores clicks while `.is-app-multi` is set. Lift the guard for the duration
  // of these synthetic clicks so the full removal pipeline (profile state,
  // ordering, library refresh) still runs, then restore it.
  const root = panel();
  const wasMulti = root?.classList.contains("is-app-multi");
  if (wasMulti) root.classList.remove("is-app-multi");
  for (const id of ids) {
    const badge = document.querySelector(
      `[data-widget-grid="app"] [data-id="${CSS.escape(id)}"] [data-widget-remove]`,
    );
    badge?.click();
  }
  if (wasMulti) root.classList.add("is-app-multi");
  return ids.length;
}

// Bind all document-level delegates once. `api` supplies the host callbacks.
export function bindMultiSelect(api = {}) {
  const { onChanged, toast, onEnter } = api;

  document.addEventListener("click", (e) => {
    const toggle = e.target.closest("[data-app-multi]");
    if (toggle) {
      if (isMulti()) exit();
      else {
        // Batch mode is mutually exclusive with the widget editor's jiggle
        // mode. Let the host drop edit mode first so the two never coexist
        // (which caused a single Escape to close both, and cards to keep
        // wobbling while brushing).
        onEnter?.();
        enter();
        toast?.("批量选择：拖过 APP 即选中，Ctrl/Cmd+A 全选");
      }
      return;
    }
    if (!isMulti()) return;

    if (e.target.closest("[data-batch-done]")) {
      exit();
      toast?.("已退出批量选择");
      return;
    }
    if (e.target.closest("[data-batch-select-all]")) {
      selectAll();
      return;
    }
    if (e.target.closest("[data-batch-remove]")) {
      const n = removeSelected();
      // Removal repaints the grid with fresh cards (draggable=true, no
      // selection state), so leave multi-select mode to keep state coherent.
      exit();
      if (n) {
        onChanged?.();
        toast?.(`已移除 ${n} 个 APP`);
      }
      return;
    }
    const exitBtn = e.target.closest("[data-batch-exit]");
    if (exitBtn) {
      const label = exitBtn.textContent.trim();
      const { count, changed } = applyExit(exitBtn.dataset.batchExit);
      if (changed) onChanged?.();
      toast?.(`已将 ${count} 个 APP 设为 ${label}`);
      return;
    }
    // Click on a card toggles it. The pointerdown/up brush handler below also
    // touches cards, so a plain click is only a toggle when no stroke happened.
    const card = e.target.closest("[data-widget][data-app]");
    if (card && e.target.closest("[data-widget-remove]") === null) {
      if (state.suppressClick) {
        state.suppressClick = false;
        return;
      }
      const on = !card.classList.contains("is-multi-selected");
      setCardSelected(card, on);
      refreshCount();
      return;
    }
  });

  // Brush selection via pointer. Capture phase so we can pre-empt the card's
  // own click-to-open-menu and the widget editor's long-press timer.
  // IMPORTANT: a plain click must still toggle one card. If we paintTo() on
  // pointerdown, the subsequent click handler toggles the same card right back
  // off (the user sees nothing happen). So the origin card is only added once
  // the pointer has genuinely moved past the threshold — a real brush stroke.
  document.addEventListener("pointerdown", (e) => {
    if (!isMulti() || e.button !== 0) return;
    const card = e.target.closest("[data-widget][data-app]");
    if (!card || e.target.closest("[data-widget-remove]")) return;
    e.stopPropagation();
    // Clear any stale suppression left by a prior stroke that ended over a
    // common ancestor (its synthetic click never reached the card handler).
    state.suppressClick = false;
    state.painting = true;
    state.stroke.clear();
    state.startCard = card;
    state.moved = false;
    state.startX = e.clientX;
    state.startY = e.clientY;
  }, true);

  document.addEventListener("pointermove", (e) => {
    if (!isMulti() || !state.painting) return;
    if (!state.moved &&
        (Math.abs(e.clientX - state.startX) > 6 || Math.abs(e.clientY - state.startY) > 6)) {
      state.moved = true;
      paintTo(state.startCard); // first real movement includes the origin card
    }
    if (!state.moved) return;
    e.preventDefault();
    paintTo(document.elementFromPoint(e.clientX, e.clientY));
  }, true);

  const endPaint = () => {
    if (!state.painting) return;
    state.painting = false;
    // A real brush stroke already selected the touched cards; suppress the
    // synthetic click so it doesn't toggle the card we started on. The flag is
    // consumed by the click handler below (or cleared on the next pointerdown),
    // with a same-task timeout as a safety net for clicks landing on ancestors.
    if (state.moved) {
      state.suppressClick = true;
      setTimeout(() => { state.suppressClick = false; }, 0);
    }
  };
  document.addEventListener("pointerup", endPaint, true);
  document.addEventListener("pointercancel", endPaint, true);

  document.addEventListener("keydown", (e) => {
    if (!isMulti()) return;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    // Keyboard users can toggle the focused APP card with Enter / Space. The
    // global card-activation handler deliberately bails out in multi mode, so
    // this is the only keyboard path to select a single card.
    const focusedCard = e.target.closest?.("[data-widget][data-app]");
    if (!typing && focusedCard && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      const on = !focusedCard.classList.contains("is-multi-selected");
      setCardSelected(focusedCard, on);
      refreshCount();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a" && !typing) {
      e.preventDefault();
      selectAll();
    } else if (e.key === "Escape") {
      exit();
      toast?.("已退出批量选择");
    }
  }, true);

  // Full reset used when navigating away / re-rendering the panel. render()
  // only swaps #panel.innerHTML — it does NOT touch the panel element's own
  // class list — so we must strip .is-app-multi here or every widget handler
  // (long-press / remove / library / drag) bails out for the rest of the session
  // after visiting the APP step in batch mode.
  function reset() {
    state.active = false;
    state.painting = false;
    state.suppressClick = false;
    state.stroke.clear();
    panel()?.classList.remove("is-app-multi");
    const b = bar();
    if (b) b.hidden = true;
    for (const c of cards()) c.setAttribute("draggable", "true");
  }

  return { enter, exit, clearSelection, selectAll, isMulti, applyExit, reset };
}
