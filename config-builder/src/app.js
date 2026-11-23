import "./styles.css";
import "./motion.css";
import "./widget-editor.css";
// Shared site footer (single definition used by the landing page too). Bundled
// in so the wizard works wherever its own assets/app.js is served.
import "../../assets/site-footer.js";
import "./theme.js";
import "./caustics.js";
import { progressCursor, enterPanel, revealCard, celebrate } from "./motion.js";
import {
  catalog,
  defaults,
  compile,
  normalize,
  normalizeProviders,
} from "../shared/compiler.js";
import { filename } from "../shared/profile.js";
import {
  SERVICE_ROUTES,
  subscriptionURL,
  usageURL,
  probeService,
  fetchCatalog,
} from "./service.js";
import {
  serviceBase,
  discoverService,
  apiFetch,
  publicLinkBase,
} from "./config.js";
import { esc, latencyPill } from "./ui.js";
import { renderEmoji } from "./emoji.js";
import {
  sourcesPanel,
  providerCard,
  removeProviderButton,
} from "./panels/sources.js";
import { regionsPanel } from "./panels/regions.js";
import { strategiesPanel } from "./panels/strategies.js";
import { appsPanel } from "./panels/apps.js";
import { rulesPanel } from "./panels/rules.js";
import { reviewPanel, resultPanel, shareResult } from "./panels/review.js";
import { applyShare, parseShareCode } from "../shared/share.js";
import { previewInspection, previewRegions } from "../shared/preview.js";
import { createShareCode, fetchShareCode } from "./share.js";
import { bind as bindWidgetEditor, decorate as decorateWidgetEditor, STEP_WIDGET } from "./widget-editor.js";
const $ = (s) => document.querySelector(s);
const steps = [
  "订阅来源",
  "地区节点",
  "节点策略",
  "APP 分流",
  "规则模块",
  "最终确认",
];
const FINAL_STEP = steps.length - 1;
// The page is a static asset on Cloudflare Pages / GitHub Pages. All parsing,
// preview, download and subscription creation happen on the self-hosted
// service; the returned subscription link also points straight at that host.
// The service origin is resolved per call, so service.json can be discovered
// after the first paint.
const ctx = {
  profile: defaults(),
  inspection: null,
  service: "checking",
  serviceMessage: "正在检查订阅服务…",
  search: "",
  phase: "idle",
  probeDone: 0,
  share: { code: "", includeProviders: false },
  importSelection: null,
  linkPwd: "",
  preview: false,
  // Once the user touches the region pickers, a later subscription parse
  // must not discard their choices — even regions with no live nodes.
  selectedRegions: false,
  // iOS-style widget editing state (transient UI, not part of the profile).
  widgetEditing: false,
  widgetLibrary: null,
};
let step = 0,
  busy = false,
  revision = 0,
  result = null,
  inspectionController,
  probeController;
let serviceRevision = 0;
let pointToStep;
const panels = [
  sourcesPanel,
  regionsPanel,
  strategiesPanel,
  appsPanel,
  rulesPanel,
  reviewPanel,
];
function error(text) {
  $("#error").textContent = text;
  $("#error").hidden = false;
}
function clearError() {
  $("#error").hidden = true;
}
function changed() {
  revision++;
  result = null;
  clearError();
  if (step === FINAL_STEP) {
    $("#result-area").replaceChildren();
    updateSummary();
  }
}
function invalidate() {
  inspectionController?.abort();
  probeController?.abort();
  ctx.inspection = null;
  ctx.phase = "idle";
  ctx.probeDone = 0;
  changed();
  renderNav();
}
function renderPreview() {
  const banner = $("#preview-banner");
  if (!banner) return;
  banner.hidden = !ctx.preview;
}
function enterPreview({ stay = false } = {}) {
  ctx.preview = true;
  ctx.inspection = previewInspection(catalog);
  ctx.phase = "idle";
  probeController?.abort();
  ctx.probeDone = 0;
  const chosen = ctx.profile.countries.filter((id) =>
    catalog.regions.some((r) => r.id === id),
  );
  ctx.profile.countries = chosen.length
    ? chosen
    : previewRegions(catalog).filter((id) => id !== "OTHER");
  ctx.selectedRegions = true;
  clearError();
  if (!stay) navigate(1);
  else render();
}
function leavePreview() {
  if (!ctx.preview) return;
  ctx.preview = false;
  ctx.inspection = null;
  ctx.phase = "idle";
  changed();
  navigate(0);
}
function syncProviderCards() {
  const slots = $("#provider-list").querySelectorAll(
    ".provider-slot:not(.is-removing)",
  );
  slots.forEach((slot, i) => {
    slot.querySelector(".card-heading > span").textContent =
      `PROVIDER ${String(i + 1).padStart(2, "0")}`;
    slot
      .querySelectorAll("[data-provider]")
      .forEach((input) => (input.dataset.provider = String(i)));
    let remove = slot.querySelector("[data-remove]");
    if (slots.length === 1) remove?.remove();
    else {
      if (!remove) {
        slot
          .querySelector(".card-heading")
          .insertAdjacentHTML("beforeend", removeProviderButton(i));
        remove = slot.querySelector("[data-remove]");
      }
      remove.dataset.remove = String(i);
      remove.setAttribute("aria-label", `移除第 ${i + 1} 个机场`);
    }
  });
  $("#add-provider span").textContent = `${slots.length} / 10`;
  $("#add-provider").disabled = slots.length >= 10;
}
function renderNav() {
  const phase = ctx.preview
    ? "预览模式 · 尚未解析节点"
    : ctx.phase === "loading"
      ? "正在解析…"
      : ctx.phase === "error"
        ? "解析未完成"
        : ctx.inspection
          ? `${ctx.inspection.nodes.length} 个节点${ctx.inspection.capabilities.tcp ? " · 已测 " + ctx.probeDone : ""}`
          : "等待解析";
  if (!pointToStep) {
    $("#steps").innerHTML = steps
      .map(
        (label, i) =>
          `<button class="step-button" data-step="${i}"><span><strong>${label}</strong></span></button>` +
          (i === 0
            ? `<div class="parse-step" aria-disabled="true" data-phase="${ctx.phase}"><span aria-hidden="true">${ctx.phase === "ready" ? "✓" : "⋯"}</span><div><strong>解析节点</strong><small>${esc(phase)}</small></div></div>`
            : ""),
      )
      .join("");
    pointToStep = progressCursor($("#steps"));
  }
  const parsing = step === 0 && ctx.phase === "loading";
  for (const button of $("#steps").querySelectorAll("[data-step]")) {
    const i = Number(button.dataset.step);
    button.disabled = busy;
    button.classList.toggle("done", i < step);
    if (i === step && !parsing) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  }
  const parse = $("#steps .parse-step");
  parse.dataset.phase = ctx.phase;
  parse.querySelector("small").textContent = phase;
  parse.querySelector(":scope > span").textContent =
    ctx.phase === "ready" ? "✓" : "⋯";
  parse.classList.toggle("is-current", parsing);
  pointToStep(
    parsing ? parse : $("#steps").querySelector(`[data-step="${step}"]`),
  );
}
function footer() {
  const final = step === FINAL_STEP;
  const ready = ctx.service === "ready" && !ctx.preview;
  $("#back").disabled = busy || step === 0;
  $("#download").hidden = !final || !ready;
  $("#download").disabled = busy || !ready;
  $("#next").disabled = busy || (final && !ready);
  $("#skip-sources").hidden = busy || step !== 0 || ctx.preview;
  $("#next").innerHTML = busy
    ? ctx.phase === "loading"
      ? "正在解析…"
      : "正在生成…"
    : final
      ? "生成订阅链接 ↗"
      : step === 0
        ? ctx.service === "ready"
          ? "解析并继续 →"
          : "先配置其他步骤 →"
        : "下一步 →";
  $("#progress-note").textContent = ctx.preview
    ? "预览模式：填写订阅后可生成"
    : final
      ? "配置按当前选择生成"
      : "只保留你需要的枝叶。";
  document.querySelector(".wizard-footer").dataset.final = String(final);
  renderService();
  if ($("#add-provider"))
    $("#add-provider").disabled = busy || ctx.profile.providers.length >= 10;
  $("#panel")
    .querySelectorAll("[data-remove]")
    .forEach((button) => (button.disabled = busy));
}
function showResult() {
  $("#result-area").innerHTML = resultPanel(result);
  renderEmoji($("#result-area"));
}
function render() {
  renderPreview();
  renderNav();
  $("#step-caption").textContent =
    `STEP ${String(step + 1).padStart(2, "0")} / ${String(steps.length).padStart(2, "0")}`;
  $("#panel").innerHTML = panels[step](ctx);
  renderEmoji($("#panel"));
  clearError();
  footer();
  filterApps();
  if (step === FINAL_STEP) {
    updateSummary();
    if (result) showResult();
  }
  if (STEP_WIDGET[step]) decorateWidgetEditor(STEP_WIDGET[step], ctx, $("#panel"));
}
function filterApps() {
  document
    .querySelectorAll("[data-app-card]")
    .forEach(
      (el) =>
        (el.hidden = !el.dataset.appCard.includes(ctx.search.toLowerCase())),
    );
  document
    .querySelectorAll("[data-category]")
    .forEach(
      (el) =>
        (el.hidden = ![
          ...document.querySelectorAll("[data-category-item]"),
        ].some(
          (c) => c.dataset.categoryItem === el.dataset.category && !c.hidden,
        )),
    );
}
function toggle(list, value, on) {
  const i = list.indexOf(value);
  if (on && i < 0) list.push(value);
  else if (!on && i >= 0) list.splice(i, 1);
}
function resetPolicies() {
  for (const [id, value] of Object.entries(ctx.profile.appPolicy))
    if (
      value.startsWith("region:") &&
      !(value === "region:OTHER"
        ? ctx.profile.other
        : ctx.profile.countries.includes(value.slice(7)))
    )
      delete ctx.profile.appPolicy[id];
}
function goToStep(next) {
  // Later steps can be explored before a subscription is parsed. Enter the
  // preview first so region policies and app routing have real choices.
  if (next > 0 && !ctx.inspection && !ctx.preview)
    enterPreview({ stay: true });
  navigate(next);
}
function navigate(next) {
  if (next !== step) {
    ctx.widgetEditing = false;
    ctx.widgetLibrary = null;
  }
  step = next;
  render();
  enterPanel($("#panel"));
  $("#workspace").focus({ preventScroll: true });
  $("#workspace").scrollIntoView({
    block: "start",
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
}
function renderService() {
  const status = $("#service-settings");
  $("#service-label").textContent = {
    checking: "连接中",
    ready: "服务正常",
    offline: "服务未连接",
    mismatch: "版本不一致",
  }[ctx.service];
  status.dataset.state = ctx.service;
  // The full explanation is available on hover / to screen readers, but the
  // backend address and endpoint list are deliberately not shown in the page.
  status.title = ctx.serviceMessage;
  status.setAttribute("aria-label", `订阅服务：${ctx.serviceMessage}`);
  $("#retry-service").disabled = busy || ctx.service === "checking";
}
function checkService() {
  const ticket = ++serviceRevision;
  ctx.service = "checking";
  ctx.serviceMessage = "正在检查订阅服务…";
  renderService();
  return (async () => {
    let status;
    try {
      status = await probeService(serviceBase(), catalog.version);
    } catch {
      status = {
        state: "offline",
        message: "订阅服务暂不可用，请稍后重试或联系维护者。",
      };
    }
    if (ticket !== serviceRevision) return status;
    ctx.service = status.state;
    ctx.serviceMessage = status.message;
    if (!busy && step === FINAL_STEP) render();
    else footer();
    return status;
  })();
}
async function resolveSources() {
  if (busy || ctx.service !== "ready") return;
  let providers;
  try {
    providers = normalizeProviders(ctx.profile.providers);
  } catch (e) {
    error(e.message);
    return;
  }
  busy = true;
  ctx.phase = "loading";
  clearError();
  renderNav();
  footer();
  const rev = revision;
  inspectionController = new AbortController();
  try {
    const response = await apiFetch(SERVICE_ROUTES.inspect, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providers }),
      signal: AbortSignal.any([
        inspectionController.signal,
        AbortSignal.timeout(90000),
      ]),
    });
    const inspection = await response.json();
    if (!response.ok) throw Error(inspection.error || "解析暂时不可用。");
    if (rev !== revision) return;
    if (inspection.providers.some((p) => p.error))
      throw Error(
        inspection.providers
          .filter((p) => p.error)
          .map((p) => `${p.id}：${p.error}`)
          .join(" "),
      );
    if (!inspection.nodes.length || !inspection.regions.length)
      throw Error("订阅中没有识别到可用节点。");
    ctx.inspection = inspection;
    ctx.phase = "ready";
    ctx.preview = false;
    if (ctx.importSelection) {
      // Every template region is a valid option, so restore shared choices
      // as-is instead of dropping regions the importer has no nodes for.
      ctx.profile.countries = ctx.importSelection.countries;
      ctx.profile.other = ctx.importSelection.other;
      ctx.importSelection = null;
      ctx.selectedRegions = true;
    } else if (!ctx.selectedRegions) {
      // Only seed from the subscription before the user has chosen anything.
      // Once they pick regions, re-parsing must never discard their picks —
      // a region with zero live nodes is still intentionally selectable.
      ctx.profile.countries = inspection.regions
        .filter((r) => r.id !== "OTHER")
        .map((r) => r.id);
      ctx.profile.other = inspection.regions.some((r) => r.id === "OTHER");
    }
    resetPolicies();
    busy = false;
    navigate(1);
    // Always measure node latency after parsing. The service probes node
    // connectivity by default; a service with probing explicitly disabled
    // returns 503 and probeAll simply degrades to "未检测".
    probeAll(providers, rev);
  } catch (e) {
    if (rev === revision) {
      ctx.phase = "error";
      error(
        e.name === "TimeoutError"
          ? "解析超时，请重试。"
          : e.message || "解析失败。",
      );
    }
  } finally {
    busy = false;
    renderNav();
    footer();
  }
}
async function probeAll(providers, rev) {
  probeController?.abort();
  probeController = new AbortController();
  const inspected = ctx.inspection;
  const ids = inspected.nodes.map((n) => n.id);
  for (let i = 0; i < ids.length && ctx.inspection === inspected; i += 10) {
    try {
      const response = await apiFetch(SERVICE_ROUTES.probe, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providers, nodeIds: ids.slice(i, i + 10) }),
        signal: AbortSignal.any([
          probeController.signal,
          AbortSignal.timeout(30000),
        ]),
      });
      if (!response.ok) break;
      const data = await response.json();
      if (ctx.inspection !== inspected) return;
      for (const item of data.nodes) {
        const node = ctx.inspection.nodes.find((n) => n.id === item.id);
        if (node) Object.assign(node, item);
      }
      ctx.probeDone = Math.min(ids.length, i + 10);
      renderNav();
      // Update any latency cells currently in the DOM regardless of which step
      // the user is on — probe results can arrive after they have navigated
      // back, and the node data is already stored on ctx.inspection.
      for (const item of data.nodes) {
        const cell = document.querySelector(`[data-latency="${item.id}"]`);
        if (cell) cell.innerHTML = latencyPill(item.latencyMs);
      }
    } catch {
      break;
    }
  }
}
async function updateSummary() {
  const rev = revision;
  try {
    const output = await compile(
      {
        ...ctx.profile,
        title: ctx.profile.title || "未命名",
      },
      catalog,
    );
    if (step !== FINAL_STEP || rev !== revision) return;
    const card = $("#file-card");
    // Preview mode has no nodes and cannot produce a file. Never show a
    // detached YAML card with a dead "preview" action in that state.
    if (ctx.preview || ctx.service !== "ready") {
      if (card) card.hidden = true;
      return;
    }
    $("#rule-count").textContent = output.summary.rules;
    $("#file-name").textContent = ctx.profile.title
      ? filename(ctx.profile.title)
      : "ratatoskr · 未命名.yaml";
    $("#file-size").textContent = `节点在生成时写入 · ${output.summary.groups} 个策略组`;
    if (card) card.hidden = false;
  } catch (e) {
    if (step === FINAL_STEP && rev === revision) {
      const card = $("#file-card");
      if (card) card.hidden = true;
      $("#rule-count").textContent = "—";
    }
  }
}
async function generate() {
  if (busy || ctx.service !== "ready") return;
  let profile;
  try {
    profile = normalize(ctx.profile);
  } catch (e) {
    error(e.message);
    return;
  }
  busy = true;
  footer();
  renderNav();
  const rev = revision;
  const locked = [...$("#panel").querySelectorAll("input,select,button")];
  const prior = locked.map((el) => el.disabled);
  locked.forEach((el) => (el.disabled = true));
  try {
    const response = await apiFetch(SERVICE_ROUTES.create, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Config-Pwd": ctx.linkPwd,
      },
      body: JSON.stringify(profile),
      signal: AbortSignal.timeout(90000),
    });
    const data = await response.json();
    if (!response.ok) throw Error(data.error || "订阅暂时无法生成。");
    if (rev !== revision) return;
    const publicURL = publicLinkBase();
    result = {
      ...data,
      url: subscriptionURL(data.url, serviceBase(), publicURL),
      usageUrl: usageURL(data.usageUrl, serviceBase(), publicURL),
    };
    celebrate($("#next"));
    showResult();
    $("#result-area").scrollIntoView({
      block: "nearest",
      behavior: matchMedia("(prefers-reduced-motion:reduce)").matches
        ? "instant"
        : "smooth",
    });
  } catch (e) {
    error(e.message || "生成失败，请重试。");
  } finally {
    locked.forEach((el, i) => (el.disabled = prior[i]));
    busy = false;
    footer();
    renderNav();
  }
}
async function download() {
  try {
    const output = await configurationOutput(),
      url = URL.createObjectURL(
        new Blob([output.yaml], { type: "application/yaml" }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = output.filename;
    a.click();
    celebrate($("#download"));
    toast("配置已生成");
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    error(e.message);
  }
}
async function configurationOutput() {
  if (ctx.service !== "ready")
    throw Error("订阅服务未连接，请稍后重试。");
  const profile = normalize(ctx.profile);
  const response = await apiFetch(SERVICE_ROUTES.preview, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
    signal: AbortSignal.timeout(90000),
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error || "配置暂时无法生成。");
  return data;
}
let toastTimer;
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 2500);
}
function shareError(text) {
  const box = $("#share-error");
  if (box) {
    box.textContent = text;
    box.hidden = !text;
  }
  if (text) error(text);
}
function openShareDialog(pane = "import") {
  const dialog = $("#share-dialog");
  if (!dialog) return;
  shareError("");
  const exporting = pane === "export";
  // The two buttons open distinct panes, not one combined menu. Show only the
  // requested one and tailor the heading/caption so each mode reads cleanly.
  const importPane = $("#import-pane");
  const exportPane = $("#export-pane");
  if (importPane) importPane.hidden = exporting;
  if (exportPane) exportPane.hidden = !exporting;
  const eyebrow = $("#share-eyebrow");
  if (eyebrow)
    eyebrow.textContent = exporting ? "SHARE CONFIGURATION" : "IMPORT CONFIGURATION";
  const title = $("#share-title");
  if (title) title.textContent = exporting ? "分享配置" : "导入配置";
  const intro = $("#share-intro");
  if (intro)
    intro.textContent = exporting
      ? "生成分享码后可发给他人导入；生成需要通过订阅服务。"
      : "粘贴分享码或分享链接即可载入配置；读取需要通过订阅服务。";
  const checkbox = $("#share-providers");
  if (checkbox) checkbox.checked = ctx.share.includeProviders;
  const box = $("#share-result");
  if (box) box.innerHTML = shareResult(ctx.share);
  const target = dialog.querySelector(
    exporting ? "#create-share" : "#share-code-input",
  );
  dialog.showModal();
  target?.focus({ preventScroll: true });
}
async function createShare() {
  if (busy || ctx.service !== "ready") {
    shareError("订阅服务未连接，请稍后重试。");
    return;
  }
  const button = $("#create-share");
  if (button) button.disabled = true;
  clearError();
  shareError("");
  try {
    const data = await createShareCode(ctx.profile, ctx.share.includeProviders);
    ctx.share = { code: data.code, includeProviders: data.includeProviders };
    const box = $("#share-result");
    if (box) box.innerHTML = shareResult(ctx.share);
    toast("分享码已生成");
  } catch (e) {
    shareError(e.message || "分享码生成失败。");
  } finally {
    if (button) button.disabled = false;
  }
}
async function importShare() {
  if (busy || ctx.service !== "ready") {
    shareError("订阅服务未连接，请稍后重试。");
    return;
  }
  const code = parseShareCode($("#share-code-input")?.value);
  if (!code) {
    shareError("分享码格式不正确，请粘贴 36 位分享码或完整分享链接。");
    return;
  }
  const button = $("#import-share");
  if (button) button.disabled = true;
  clearError();
  shareError("");
  try {
    const data = await fetchShareCode(code);
    ctx.profile = applyShare(ctx.profile, data.profile, catalog);
    // Parsing resets the region selection to "all"; remember what the shared
    // code chose so it can be restored once the current nodes are inspected.
    ctx.importSelection = {
      countries: [...ctx.profile.countries],
      other: ctx.profile.other,
    };
    ctx.share = { code: "", includeProviders: false };
    ctx.linkPwd = "";
    const ready = ctx.profile.providers.some(
      (p) => p.name.trim() && p.url.trim(),
    );
    invalidate();
    if (!ready && !ctx.preview) enterPreview({ stay: true });
    navigate(0);
    $("#share-dialog")?.close();
    toast(
      data.includeProviders
        ? "配置已导入，含机场订阅地址"
        : "配置已导入，可先配置其他步骤；填写订阅后即可解析节点",
    );
    if (ready) void resolveSources();
  } catch (e) {
    shareError(e.message || "分享码读取失败。");
  } finally {
    if (button) button.disabled = false;
  }
}
document.addEventListener("input", (e) => {
  const el = e.target;
  if (el.dataset.provider !== undefined) {
    ctx.profile.providers[Number(el.dataset.provider)][el.dataset.key] =
      el.value;
    if (ctx.preview) changed();
    else invalidate();
  }
  if (el.id === "profile-title") {
    ctx.profile.title = el.value;
    changed();
  }
  if (el.id === "config-pwd") {
    ctx.linkPwd = el.value;
    changed();
  }
  if (el.id === "port") {
    ctx.profile.port = el.value;
    changed();
  }
  if (el.id === "app-search") {
    ctx.search = el.value;
    filterApps();
  }
});
document.addEventListener("change", (e) => {
  const el = e.target;
  if (el.dataset.region) {
    if (el.dataset.region === "OTHER") ctx.profile.other = el.checked;
    else toggle(ctx.profile.countries, el.dataset.region, el.checked);
    ctx.selectedRegions = true;
    resetPolicies();
    changed();
  }
  if (el.dataset.strategy) {
    toggle(ctx.profile.strategies, el.dataset.strategy, el.checked);
    if (!ctx.profile.strategies.includes(ctx.profile.defaultStrategy))
      ctx.profile.defaultStrategy = "gateway";
    changed();
    render();
  }
  if (el.dataset.app) {
    toggle(ctx.profile.apps, el.dataset.app, el.checked);
    ctx.profile.appsMode =
      ctx.profile.apps.length === catalog.apps.length ? "all" : "custom";
    changed();
    render();
  }
  if (el.dataset.module) {
    toggle(ctx.profile.modules, el.dataset.module, el.checked);
    changed();
  }
  if (el.dataset.policy) {
    ctx.profile.appPolicy[el.dataset.policy] = el.value;
    changed();
  }
  const mapping = {
    lifetime: "lifetime",
    "allow-lan": "allowLan",
  };
  if (mapping[el.id]) {
    ctx.profile[mapping[el.id]] =
      el.type === "checkbox" ? el.checked : el.value;
    changed();
  }
  if (el.id === "share-providers") {
    ctx.share.includeProviders = el.checked;
    changed();
  }
});

// Capsule policy picker (APP cards). The native <select> stays hidden as the
// data source; these handlers drive the visible trigger + pill popover and
// funnel every choice back through the select's `change` event so the existing
// profile/compiler pipeline needs no changes.
function closePolicyPickers(except) {
  for (const picker of document.querySelectorAll("[data-policy-picker]")) {
    if (picker === except) continue;
    picker.classList.remove("is-open");
    picker.setAttribute("aria-expanded", "false");
    const menu = picker.querySelector("[data-policy-menu]");
    if (menu) menu.hidden = true;
  }
}
document.addEventListener("click", (e) => {
  // The pill lives INSIDE the whole-card trigger, so resolve it first.
  const pill = e.target.closest("[data-policy-option]");
  if (pill) {
    const picker = pill.closest("[data-policy-picker]");
    const select = picker.querySelector("select[data-policy]");
    const value = pill.dataset.policyOption;
    if (select && select.value !== value) {
      select.value = value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    // The card face shows only the app name now; the chosen exit is reflected
    // by the highlighted capsule plus the card's accessible label.
    const label = pill.querySelector("span:last-child")?.textContent || "";
    picker.setAttribute("aria-label", `${picker.dataset.app || ""} · 默认出口 ${label}`.trim());
    for (const p of picker.querySelectorAll("[data-policy-option]")) {
      const on = p === pill;
      p.classList.toggle("is-active", on);
      p.setAttribute("aria-selected", String(on));
    }
    closePolicyPickers();
    return;
  }
  // The remove "−" badge also sits on the card; never open the menu for it —
  // widget-editor.js owns that click (and layout editing in general).
  if (e.target.closest("[data-widget-remove]")) return;
  const trigger = e.target.closest("[data-policy-trigger]");
  if (trigger) {
    if (ctx.widgetEditing) return;
    const picker = trigger.closest("[data-policy-picker]") || trigger;
    const willOpen = !picker.classList.contains("is-open");
    closePolicyPickers(picker);
    picker.classList.toggle("is-open", willOpen);
    picker.setAttribute("aria-expanded", String(willOpen));
    const menu = picker.querySelector("[data-policy-menu]");
    if (menu) menu.hidden = !willOpen;
    return;
  }
  if (!e.target.closest("[data-policy-picker]")) closePolicyPickers();
});
// Keyboard parity for the whole-card button (role=button).
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closePolicyPickers();
    return;
  }
  if (e.key !== "Enter" && e.key !== " ") return;
  const card = e.target.closest?.("[data-policy-trigger]");
  if (!card || ctx.widgetEditing) return;
  e.preventDefault();
  card.click();
});

document.addEventListener("click", async (e) => {
  const el = e.target.closest("button");
  if (!el || el.disabled) return;
  if (el.id === "retry-service") {
    changed();
    probeController?.abort();
    await checkService();
    return;
  }
  if (el.id === "open-import") {
    openShareDialog("import");
    return;
  }
  if (el.id === "open-share") {
    openShareDialog("export");
    return;
  }
  if (el.id === "close-share") {
    $("#share-dialog")?.close();
    return;
  }
  if (el.id === "skip-sources") {
    enterPreview();
    return;
  }
  if (el.id === "leave-preview") {
    leavePreview();
    return;
  }
  if (el.id === "import-share") {
    await importShare();
    return;
  }
  if (el.id === "create-share") {
    await createShare();
    return;
  }
  if (el.id === "copy-share") {
    try {
      await navigator.clipboard.writeText(ctx.share.code);
      toast("分享码已复制");
    } catch {
      $("#share-code")?.select();
      toast("请选择并复制分享码");
    }
    return;
  }
  if (el.id === "next") {
    if (step === 0) {
      if (ctx.service === "ready") await resolveSources();
      else enterPreview();
    } else if (step === FINAL_STEP) await generate();
    else goToStep(step + 1);
  }
  if (el.id === "back" && step > 0) navigate(step - 1);
  if (el.dataset.step !== undefined) goToStep(Number(el.dataset.step));
  if (el.id === "add-provider") {
    if (busy || ctx.profile.providers.length >= 10) return;
    ctx.profile.providers.push({ name: "", url: "" });
    if (ctx.preview) changed();
    else invalidate();
    const i = ctx.profile.providers.length - 1;
    $("#provider-list").insertAdjacentHTML(
      "beforeend",
      providerCard(ctx.profile.providers[i], i, i + 1),
    );
    syncProviderCards();
    const slot = $("#provider-list").lastElementChild;
    revealCard(slot);
    slot.querySelector("input").focus({ preventScroll: true });
  }
  if (el.dataset.remove !== undefined) {
    if (busy || ctx.profile.providers.length <= 1) return;
    const index = Number(el.dataset.remove),
      slot = el.closest(".provider-slot");
    ctx.profile.providers.splice(index, 1);
    if (ctx.preview) changed();
    slot.classList.add("is-removing");
    slot.setAttribute("aria-hidden", "true");
    slot
      .querySelectorAll("input,button")
      .forEach((input) => (input.disabled = true));
    if (!ctx.preview) invalidate();
    syncProviderCards();
    revealCard(slot, true);
    $("#add-provider").focus({ preventScroll: true });
  }
  if (el.dataset.regions) {
    // "全部保留" covers every template region, not just those with nodes.
    ctx.profile.countries =
      el.dataset.regions === "all"
        ? catalog.regions.map((r) => r.id)
        : [];
    ctx.profile.other = el.dataset.regions === "all";
    ctx.selectedRegions = true;
    resetPolicies();
    changed();
    render();
  }
  if (el.dataset.apps) {
    ctx.profile.apps =
      el.dataset.apps === "all" ? catalog.apps.map((a) => a.id) : [];
    ctx.profile.appsMode = el.dataset.apps === "all" ? "all" : "custom";
    changed();
    render();
  }
  if (el.dataset.modules) {
    ctx.profile.modules =
      el.dataset.modules === "all"
        ? [...new Set(catalog.orderedRules.filter((r) => r.module).map((r) => r.module))]
        : [];
    changed();
    render();
  }
  if (el.id === "show-preview") {
    try {
      $("#yaml-preview").textContent = (await configurationOutput()).yaml;
      $("#preview").showModal();
    } catch (e) {
      error(e.message);
    }
  }
  if (el.id === "close-preview") $("#preview").close();
  if (el.id === "download") await download();
  if (el.id === "copy-result") {
    try {
      await navigator.clipboard.writeText(result.url);
      toast("订阅链接已复制");
    } catch {
      $("#result-url").select();
      toast("请选择并复制链接");
    }
  }
  if (el.id === "refresh-usage") {
    el.disabled = true;
    try {
      const response = await apiFetch(result.usageUrl, {
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw Error();
      const data = await response.json();
      result = { ...result, ...data };
      showResult();
    } catch {
      toast("流量暂时无法刷新，请稍后重试");
      el.disabled = false;
    }
  }
});
// The bundled catalog is a build-time snapshot. Before the first paint, ask
// the service for the catalog it actually compiled against (derived from the
// live template). Mutating in place keeps every `import { catalog }` reference
// in sync, so all pickers, categories, rules and icons follow the config file
// — additions and deletions included — without a frontend rebuild. On any
// failure we keep the bundled snapshot and degrade gracefully.
async function syncCatalogFromService() {
  try {
    const remote = await fetchCatalog(serviceBase());
    if (!remote) return;
    // Reuse the exact same object identity so all importers observe the update.
    for (const key of Object.keys(catalog)) delete catalog[key];
    Object.assign(catalog, remote);
    // Refresh derived profile fields so ids removed from the template no
    // longer linger and ids added by it appear. "all" modes mirror the catalog
    // exactly; custom selections keep only ids that still exist.
    const fresh = defaults(catalog);
    const keep = (list, known) =>
      (list || []).filter((id) => known.includes(id));
    ctx.profile.apps =
      ctx.profile.appsMode === "all"
        ? fresh.apps
        : keep(ctx.profile.apps, fresh.apps);
    // Modules have no separate mode field: a fresh load starts with all of
    // them. Mirror the authoritative list so template edits are reflected.
    ctx.profile.modules = fresh.modules;
    ctx.profile.strategies = keep(ctx.profile.strategies, fresh.strategies);
    ctx.profile.countries = keep(ctx.profile.countries, fresh.countries);
    ctx.profile.appPolicy = { ...ctx.profile.appPolicy };
    for (const id of Object.keys(ctx.profile.appPolicy))
      if (!catalog.apps.some((a) => a.id === id)) delete ctx.profile.appPolicy[id];
  } catch {
    /* keep bundled catalog */
  }
}

renderEmoji(document.body);
bindWidgetEditor({
  ctx,
  getStep: () => step,
  render,
  changed,
  toast,
  // Widget board changes replace the old checkbox `change` handler's work.
  onStateChange(kind, id, on) {
    if (kind === "region") resetPolicies();
    if (kind === "app") {
      // filterApps re-renders visibility (including the category headings).
      filterApps();
    }
  },
});
// Resolve service.json (if the address was not baked into the bundle) first,
// then sync the authoritative catalog, then paint once with the final data.
void (async () => {
  await discoverService();
  await syncCatalogFromService();
  render();
  await checkService();
})();
