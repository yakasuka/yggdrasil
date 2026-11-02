import "./styles.css";
import {
  catalog,
  defaults,
  compile,
  normalize,
  normalizeProviders,
  STRATEGIES,
} from "../shared/compiler.js";
import { publicInspection } from "../shared/nodes.js";
import { filename } from "../shared/profile.js";
import {
  SERVICE_ROUTES,
  serviceOrigin,
  subscriptionURL,
  probeService,
} from "./service.js";
import { esc, usageCards } from "./ui.js";
import { sourcesPanel } from "./panels/sources.js";
import { regionsPanel } from "./panels/regions.js";
import { strategiesPanel } from "./panels/strategies.js";
import { appsPanel } from "./panels/apps.js";
import { reviewPanel, resultPanel } from "./panels/review.js";
import { browserRecords, sourceFailureMessage } from "./subscriptions.js";
const $ = (s) => document.querySelector(s);
const steps = [
  "订阅来源",
  "地区节点",
  "节点策略",
  "APP 分流",
  "最终确认",
];
const ctx = {
  profile: defaults(),
  files: new Map(),
  inspection: null,
  service: "checking",
  serviceMessage: "正在检查订阅服务…",
  search: "",
  phase: "idle",
  probeDone: 0,
  tcp: false,
};
let sourceProxies = null;
let step = 0,
  furthest = 0,
  busy = false,
  apiBase = "",
  revision = 0,
  result = null,
  inspectionController,
  probeController;
const serviceStorageKey =
  "yggdrasil:service-origin:" + new URL(".", location.href).pathname;
let serviceTask = null,
  serviceRevision = 0;
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
  sourceProxies = null;
  ctx.phase = "idle";
  ctx.probeDone = 0;
  furthest = 0;
  changed();
  renderNav();
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
  $("#steps").innerHTML = steps
    .map(
      (label, i) =>
        `<button class="step-button${i < step ? " done" : ""}" data-step="${i}"${i === step ? ' aria-current="step"' : ""}${i > furthest || busy ? " disabled" : ""}><span><strong>${label}</strong></span></button>` +
        (i === 0
          ? `<div class="parse-step" aria-disabled="true" data-phase="${ctx.phase}"><span aria-hidden="true">${ctx.phase === "ready" ? "✓" : "⋯"}</span><div><strong>解析节点</strong><small>${esc(phase)}</small></div></div>`
          : ""),
    )
    .join("");
}
function footer() {
  const final = step === 4;
  $("#back").disabled = busy || step === 0;
  $("#download").hidden = !final;
  $("#download").disabled = busy;
  $("#next").disabled = busy || (final && ctx.service !== "ready");
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
  $("#workspace").focus({ preventScroll: true });
  if (matchMedia("(max-width:680px)").matches)
    window.scrollTo({ top: 0, behavior: "instant" });
}
function renderService() {
  $("#service-label").textContent = {
    checking: "正在检查订阅服务",
    unconfigured: "",
    ready: "订阅服务已连接",
    offline: "订阅服务未连接",
    mismatch: "订阅服务版本不一致",
  }[ctx.service];
  $("#service-description").textContent = ctx.serviceMessage;
  $("#service-settings").dataset.state = ctx.service;
  for (const input of $("#service-form").querySelectorAll("input,button"))
    input.disabled = busy || ctx.service === "checking";
}
function checkService(origin) {
  const ticket = ++serviceRevision;
  ctx.service = "checking";
  ctx.serviceMessage = "正在检查订阅服务…";
  ctx.tcp = false;
  renderService();
  serviceTask = (async () => {
    let target = origin,
      status;
    try {
      if (target === undefined) {
        const response = await fetch("./config.json", {
          cache: "no-store",
          credentials: "omit",
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw Error();
        const settings = await response.json();
        const configured = serviceOrigin(settings.apiBase) || "";
        let saved = "";
        try {
          saved = serviceOrigin(localStorage.getItem(serviceStorageKey)) || "";
        } catch {}
        // A same-origin Pages deployment remains authoritative after migration.
        target =
          configured === location.origin ? configured : saved || configured;
      }
      status = await probeService(target, catalog.version);
    } catch {
      status = {
        state: "offline",
        message: "无法读取服务配置，请重试连接或填写有效的服务地址。",
      };
    }
    if (ticket !== serviceRevision) return status;
    apiBase = target || "";
    ctx.service = status.state;
    ctx.serviceMessage = status.message;
    ctx.tcp = status.tcp === true;
    if (status.state === "ready" && origin !== undefined) {
      try {
        localStorage.setItem(serviceStorageKey, apiBase);
      } catch {}
    }
    $("#service-origin").value = apiBase;
    if (!busy && step === 4) render();
    else footer();
    return status;
  })();
  return serviceTask;
}
async function resolveSources() {
  if (busy) return;
  let providers;
  try {
    providers = normalizeProviders(ctx.profile.providers);
  } catch (e) {
    error(e.message);
    return;
  }
  const local = ctx.files.size === providers.length;
  busy = true;
  ctx.phase = "loading";
  clearError();
  renderNav();
  footer();
  const rev = revision;
  inspectionController = new AbortController();
  try {
    let inspection;
    try {
      const records = await browserRecords(
        providers,
        ctx.files,
        inspectionController.signal,
      );
      sourceProxies = records.map((r) => r.proxies);
      inspection = publicInspection(records, catalog, {
        tcp: !ctx.files.size && ctx.service === "ready" && ctx.tcp,
      });
    } catch (directError) {
      sourceProxies = null;
      if (local || directError.code === "SOURCE_FILE") throw directError;
      if (rev !== revision || inspectionController.signal.aborted) return;
      if (ctx.service === "checking") await serviceTask;
      else if (ctx.service !== "ready" && apiBase) await checkService(apiBase);
      if (rev !== revision || inspectionController.signal.aborted) return;
      if (ctx.service !== "ready")
        throw Error(sourceFailureMessage(directError, ctx.service));
      const response = await fetch(apiBase + SERVICE_ROUTES.inspect, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providers }),
        signal: AbortSignal.any([
          inspectionController.signal,
          AbortSignal.timeout(90000),
        ]),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || "解析暂时不可用。");
      inspection = data;
    }
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
      sourceProxies ? { inlineProxies: sourceProxies } : {},
    );
    if (step !== 4 || rev !== revision) return;
    $("#rule-count").textContent = output.summary.rules;
    $("#file-name").textContent = ctx.profile.title
      ? filename(ctx.profile.title)
      : "名字-ratatoskr.yaml";
    $("#file-size").textContent = sourceProxies
      ? `${(output.summary.bytes / 1024).toFixed(1)} KiB · ${output.summary.groups} 个策略组`
      : `节点在生成时写入 · ${output.summary.groups} 个策略组`;
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
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    error(e.message);
  }
}
async function configurationOutput() {
  const profile = normalize(ctx.profile);
  if (sourceProxies)
    return compile(profile, catalog, { inlineProxies: sourceProxies });
  if (ctx.service === "ready") {
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
  throw Error("请先解析订阅。");
}
let toastTimer;
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 2500);
}
document.addEventListener("submit", async (e) => {
  if (e.target.id !== "service-form") return;
  e.preventDefault();
  if (busy || ctx.service === "checking") return;
  let origin;
  try {
    origin = serviceOrigin($("#service-origin").value);
    if (!origin) throw Error("请先填写订阅服务的公开地址。");
  } catch (e) {
    $("#service-description").textContent = e.message;
    return;
  }
  invalidate();
  step = 0;
  render();
  await checkService(origin);
});
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
  if (el.id === "retry-service" || el.id === "reset-service") {
    if (el.id === "reset-service") {
      invalidate();
      step = 0;
      render();
      try {
        localStorage.removeItem(serviceStorageKey);
      } catch {}
    } else {
      changed();
      probeController?.abort();
    }
    await checkService(
      el.id === "retry-service" ? apiBase || undefined : undefined,
    );
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
    ctx.profile.providers.push({ name: "", url: "" });
    invalidate();
    render();
  }
  if (el.dataset.remove !== undefined) {
    ctx.profile.providers.splice(Number(el.dataset.remove), 1);
    invalidate();
    render();
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
