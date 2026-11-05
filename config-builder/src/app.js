import "./styles.css";
import "./motion.css";
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
  probeService,
} from "./service.js";
import { esc } from "./ui.js";
import {
  sourcesPanel,
  providerCard,
  removeProviderButton,
} from "./panels/sources.js";
import { regionsPanel } from "./panels/regions.js";
import { strategiesPanel } from "./panels/strategies.js";
import { appsPanel } from "./panels/apps.js";
import { reviewPanel, resultPanel } from "./panels/review.js";
const $ = (s) => document.querySelector(s);
const steps = ["订阅来源", "地区节点", "节点策略", "APP 分流", "最终确认"];
// The page and the subscription service are always deployed together. All
// parsing, preview, download and subscription creation happen in the service.
const apiBase = location.origin;
const ctx = {
  profile: defaults(),
  inspection: null,
  service: "checking",
  serviceMessage: "正在检查订阅服务…",
  search: "",
  phase: "idle",
  probeDone: 0,
};
let step = 0,
  furthest = 0,
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
  if (step === 4) {
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
  furthest = 0;
  changed();
  renderNav();
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
  const phase =
    ctx.phase === "loading"
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
    button.disabled = i > furthest || busy;
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
  const final = step === 4;
  const ready = ctx.service === "ready";
  $("#back").disabled = busy || step === 0;
  $("#download").hidden = !final;
  $("#download").disabled = busy || !ready;
  $("#next").disabled = busy || !ready;
  $("#next").innerHTML = busy
    ? ctx.phase === "loading"
      ? "正在解析…"
      : "正在生成…"
    : final
      ? "生成订阅链接 ↗"
      : step === 0
        ? "解析并继续 →"
        : "下一步 →";
  $("#progress-note").textContent = final
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
function render() {
  renderNav();
  $("#step-caption").textContent =
    `STEP ${String(step + 1).padStart(2, "0")} / 05`;
  $("#panel").innerHTML = panels[step](ctx);
  clearError();
  footer();
  filterApps();
  if (step === 4) {
    updateSummary();
    if (result) $("#result-area").innerHTML = resultPanel(result);
  }
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
function validateStep() {
  if (step === 1 && !ctx.profile.countries.length && !ctx.profile.other) {
    error("至少保留一个有节点的地区。");
    return false;
  }
  return true;
}
function navigate(next) {
  step = next;
  furthest = Math.max(furthest, next);
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
  $("#service-label").textContent = {
    checking: "正在检查订阅服务",
    ready: "订阅服务已连接",
    offline: "订阅服务未连接",
    mismatch: "订阅服务版本不一致",
  }[ctx.service];
  $("#service-description").textContent = ctx.serviceMessage;
  $("#service-settings").dataset.state = ctx.service;
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
      status = await probeService(apiBase, catalog.version);
    } catch {
      status = {
        state: "offline",
        message: "订阅服务暂不可用，请稍后重试或联系维护者。",
      };
    }
    if (ticket !== serviceRevision) return status;
    ctx.service = status.state;
    ctx.serviceMessage = status.message;
    if (!busy && step === 4) render();
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
    const response = await fetch(apiBase + SERVICE_ROUTES.inspect, {
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
    ctx.profile.countries = inspection.regions
      .filter((r) => r.id !== "OTHER")
      .map((r) => r.id);
    ctx.profile.other = inspection.regions.some((r) => r.id === "OTHER");
    resetPolicies();
    busy = false;
    navigate(1);
    if (inspection.capabilities.tcp) probeAll(providers, rev);
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
      const response = await fetch(apiBase + SERVICE_ROUTES.probe, {
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
      if (step === 1)
        for (const item of data.nodes) {
          const cell = document.querySelector(`[data-latency="${item.id}"]`);
          if (cell)
            cell.textContent =
              item.latencyMs === null ? "未检测" : item.latencyMs + " ms";
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
    if (step !== 4 || rev !== revision) return;
    $("#rule-count").textContent = output.summary.rules;
    $("#file-name").textContent = ctx.profile.title
      ? filename(ctx.profile.title)
      : "名字-ratatoskr.yaml";
    $("#file-size").textContent = `节点在生成时写入 · ${output.summary.groups} 个策略组`;
  } catch (e) {
    if (step === 4 && rev === revision)
      $("#file-size").textContent = "请检查配置选择";
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
    const response = await fetch(apiBase + SERVICE_ROUTES.create, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
      signal: AbortSignal.timeout(90000),
    });
    const data = await response.json();
    if (!response.ok) throw Error(data.error || "订阅暂时无法生成。");
    if (rev !== revision) return;
    result = { ...data, url: subscriptionURL(data.url, apiBase) };
    result.usageUrl = result.url.replace(/\.yaml$/, "/status");
    celebrate($("#next"));
    $("#result-area").innerHTML = resultPanel(result);
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
  const response = await fetch(apiBase + SERVICE_ROUTES.preview, {
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
document.addEventListener("input", (e) => {
  const el = e.target;
  if (el.dataset.provider !== undefined) {
    ctx.profile.providers[Number(el.dataset.provider)][el.dataset.key] =
      el.value;
    invalidate();
  }
  if (el.id === "profile-title") {
    ctx.profile.title = el.value;
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
    resetPolicies();
    changed();
  }
  if (el.dataset.strategy) {
    toggle(ctx.profile.strategies, el.dataset.strategy, el.checked);
    if (!ctx.profile.strategies.includes(ctx.profile.defaultStrategy))
      ctx.profile.defaultStrategy = "manual";
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
  if (el.dataset.policy) {
    ctx.profile.appPolicy[el.dataset.policy] = el.value;
    changed();
  }
  const mapping = {
    "default-strategy": "defaultStrategy",
    lifetime: "lifetime",
    "allow-lan": "allowLan",
  };
  if (mapping[el.id]) {
    ctx.profile[mapping[el.id]] =
      el.type === "checkbox" ? el.checked : el.value;
    changed();
  }
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
  if (el.id === "next") {
    if (step === 0) await resolveSources();
    else if (step === 4) await generate();
    else if (validateStep()) navigate(step + 1);
  }
  if (el.id === "back" && step > 0) navigate(step - 1);
  if (el.dataset.step !== undefined) {
    const next = Number(el.dataset.step);
    if (next < step || validateStep()) navigate(next);
  }
  if (el.id === "add-provider") {
    if (busy || ctx.profile.providers.length >= 10) return;
    ctx.profile.providers.push({ name: "", url: "" });
    invalidate();
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
    slot.classList.add("is-removing");
    slot.setAttribute("aria-hidden", "true");
    slot
      .querySelectorAll("input,button")
      .forEach((input) => (input.disabled = true));
    invalidate();
    syncProviderCards();
    revealCard(slot, true);
    $("#add-provider").focus({ preventScroll: true });
  }
  if (el.dataset.regions) {
    ctx.profile.countries =
      el.dataset.regions === "all"
        ? ctx.inspection.regions
            .filter((r) => r.id !== "OTHER")
            .map((r) => r.id)
        : [];
    ctx.profile.other =
      el.dataset.regions === "all" &&
      ctx.inspection.regions.some((r) => r.id === "OTHER");
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
      const response = await fetch(result.usageUrl, {
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw Error();
      const data = await response.json();
      result = { ...result, ...data };
      $("#result-area").innerHTML = resultPanel(result);
    } catch {
      toast("流量暂时无法刷新，请稍后重试");
      el.disabled = false;
    }
  }
});
render();
checkService();
