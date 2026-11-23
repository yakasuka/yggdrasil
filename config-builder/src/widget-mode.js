// iOS-style widget editing for the four picker groups. All logic here is pure
// so it can be unit-tested without a DOM: the panels only need to know which
// ids are enabled/disabled and in what order, and the app wires the gestures.
import { catalog, ruleModules } from "../shared/compiler.js";
import { strategyView } from "./strategy-catalog.js";
import { esc } from "./ui.js";
import { moduleView } from "../shared/compiler.js";

export const WIDGET_KINDS = ["region", "strategy", "app", "module"];

// The saved order key for a kind.
export const ORDER_KEY = {
  region: "regions",
  strategy: "strategies",
  app: "apps",
  module: "modules",
};

// The full set of ids the wizard knows about, in default order.
export function allIds(kind, model = catalog) {
  switch (kind) {
    case "region":
      return [...model.regions.map((r) => r.id), "OTHER"];
    case "strategy":
      return strategyView(model).map((s) => s.id);
    case "app":
      return model.apps.map((a) => a.id);
    case "module":
      return ruleModules(model);
    default:
      return [];
  }
}

// Which ids are currently enabled for a kind, read straight from the profile.
export function enabledIds(kind, profile) {
  switch (kind) {
    case "region":
      return [
        ...profile.countries,
        ...(profile.other ? ["OTHER"] : []),
      ];
    case "strategy":
      return [...new Set([...profile.strategies, "gateway", "manual"])];
    case "app":
      return [...profile.apps];
    case "module":
      return [...profile.modules];
    default:
      return [];
  }
}

// ids present in the catalog but currently switched off -> the "widget
// library" that the + button reveals so a removed card can be added back.
export function disabledIds(kind, profile, model = catalog) {
  const on = new Set(enabledIds(kind, profile));
  return allIds(kind, model).filter((id) => !on.has(id));
}

// The single source of truth for what the grid renders: the enabled ids in
// the user's saved display order. A widget's presence on the grid IS its
// enabled state — there is no second "checked" state to keep in sync.
export function activeOrder(kind, profile, model = catalog) {
  const on = new Set(enabledIds(kind, profile));
  return displayOrder(kind, profile, model).filter((id) => on.has(id));
}

// Ids in the user's saved display order, with any missing/new ids appended.
export function displayOrder(kind, profile, model = catalog) {
  const saved = (profile.order && profile.order[ORDER_KEY[kind]]) || [];
  const rank = new Map(saved.map((id, i) => [id, i]));
  const all = allIds(kind, model);
  return [...all].sort((a, b) => {
    const ai = rank.has(a) ? rank.get(a) : Infinity,
      bi = rank.has(b) ? rank.get(b) : Infinity;
    if (ai === bi) return all.indexOf(a) - all.indexOf(b);
    return ai - bi;
  });
}

// Enable or disable one widget. Mutates `profile`, returns true when changed.
// The two fixed select groups can never be removed from the strategy step.
export function setEnabled(kind, id, on, profile, model = catalog) {
  if (!allIds(kind, model).includes(id)) return false;
  if (kind === "strategy" && (id === "gateway" || id === "manual")) return false;
  const key = ORDER_KEY[kind];
  let list = [...enabledIds(kind, profile)];
  if (kind === "region") {
    if (id === "OTHER") {
      if (profile.other === on) return false;
      profile.other = on;
    } else {
      const before = list.includes(id);
      if (before === on) return false;
      profile.countries = on
        ? [...profile.countries, id]
        : profile.countries.filter((x) => x !== id);
    }
    return true;
  }
  if (kind === "app") {
    const before = list.includes(id);
    if (before === on) return false;
    profile.apps = on
      ? [...profile.apps, id]
      : profile.apps.filter((x) => x !== id);
    profile.appsMode =
      profile.apps.length === model.apps.length ? "all" : "custom";
    return true;
  }
  // strategy / module
  const before = list.includes(id);
  if (before === on) return false;
  profile[key] = on
    ? [...profile[key], id]
    : profile[key].filter((x) => x !== id);
  return true;
}

// Display label + icon for a widget id, used by the "+" widget library.
export function widgetLabel(kind, id, model = catalog) {
  switch (kind) {
    case "region": {
      if (id === "OTHER")
        return { label: "其他地区", icon: model.groups.otherIcon || "", text: "🌐" };
      const r = model.regions.find((x) => x.id === id);
      return { label: r?.label || id, icon: r?.icon || "", text: r?.flag || "🌐" };
    }
    case "strategy": {
      const s = strategyView(model).find((x) => x.id === id);
      return { label: s?.label || id, icon: s?.icon || "", text: "⚡" };
    }
    case "app": {
      const a = model.apps.find((x) => x.id === id);
      return { label: a?.label || id, icon: a?.icon || "", text: "🧩" };
    }
    case "module": {
      const m = moduleView(id, model);
      return { label: m.label, icon: "", text: m.symbol || "🧩" };
    }
    default:
      return { label: id, icon: "", text: "🧩" };
  }
}

// The corner affordances on every card. In the unified widget model the red
// minus is the "remove from grid" action (always available, not edit-gated);
// fixed widgets get a neutral lock instead. The plus is rendered by the
// library item builder, not here.
export function removeBadge(kind, id, fixed = false) {
  if (fixed)
    return `<span class="widget-badge widget-badge--fixed" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2.4"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>`;
  return `<button type="button" class="widget-badge widget-badge--remove" data-widget-remove="${kind}" data-id="${esc(id)}" aria-label="移除 ${esc(id)}" tabindex="-1"><span aria-hidden="true">−</span></button>`;
}

// Build a library item's markup for one disabled widget. Shared by the panel
// (initial render) and the editor (incremental add/remove without re-render).
export function libraryItem(kind, id, model = catalog) {
  const w = widgetLabel(kind, id, model);
  return `<button type="button" class="widget-library-item" data-widget-add="${kind}" data-id="${esc(id)}">${w.icon ? `<img src="${esc(w.icon)}" alt="" decoding="async" onerror="this.hidden=true">` : `<span aria-hidden="true">${esc(w.text)}</span>`}<span>${esc(w.label)}</span><b aria-hidden="true">＋</b></button>`;
}

// Attributes every draggable card carries so the app can delegate drag and
// edit gestures without re-binding listeners on each full re-render.
export function widgetAttrs(kind, id, { fixed = false } = {}) {
  // Dragging works for every card, fixed ones included — the two "always on"
  // strategies can be reordered but never removed. The fixed marker now ONLY
  // guards deletion (lock badge + setEnabled); it does not block dragging.
  return ` data-widget="${kind}" data-id="${esc(id)}" draggable="true"${fixed ? " data-widget-fixed" : ""}`;
}

// Sort all widgets of a kind into one of two canonical orders and persist it.
//   "alpha"   — by display label (locale-aware, so Chinese sorts sensibly)
//   "default" — the template/catalog order, dropping any saved order
// Returns the new order. Used by the edit-mode quick-sort buttons.
export function sortWidgets(kind, mode, profile, model = catalog) {
  const ids = allIds(kind, model);
  let order;
  if (mode === "default") {
    order = ids;
  } else {
    const label = (id) => widgetLabel(kind, id, model).label || id;
    const collator = new Intl.Collator("zh-CN", { numeric: true, sensitivity: "base" });
    order = [...ids].sort((a, b) => collator.compare(label(a), label(b)));
  }
  profile.order = { ...profile.order, [ORDER_KEY[kind]]: order };
  return order;
}

// Reorder: move `id` so it sits immediately before `beforeId` (or at the end
// when beforeId is null). Mutates `profile.order` and returns the new order.
export function moveOrder(kind, id, beforeId, profile, model = catalog) {
  const key = ORDER_KEY[kind];
  const order = displayOrder(kind, profile, model).filter((x) => x !== id);
  const at = beforeId ? order.indexOf(beforeId) : -1;
  if (at < 0) order.push(id);
  else order.splice(at, 0, id);
  profile.order = { ...profile.order, [key]: order };
  return order;
}
