import "./styles.css";
import {
  catalog,
  defaults,
  compile,
  normalize,
  normalizeProviders,
  STRATEGIES,
} from "../shared/compiler.js";
import {
  parseNodes,
  publicInspection,
  MAX_SUBSCRIPTION_BYTES,
} from "../shared/nodes.js";
import { filename } from "../shared/profile.js";
import { SERVICE_ROUTES, serviceOrigin, subscriptionURL } from "./service.js";
import { esc, usageCards } from "./ui.js";
import { sourcesPanel } from "./panels/sources.js";
import { regionsPanel } from "./panels/regions.js";
import { strategiesPanel } from "./panels/strategies.js";
import { appsPanel } from "./panels/apps.js";
import { reviewPanel, resultPanel } from "./panels/review.js";
const $ = (s) => document.querySelector(s);
const steps = [
  ["订阅来源", "连接你的机场"],
  ["地区节点", "仅保留需要的地区"],
  ["节点策略", "默认手动选择"],
  ["APP 分流", "为应用指定地区"],
  ["最终确认", "让 Ratatoskr 出发"],
];
const ctx = {
  profile: defaults(),
  files: new Map(),
  inspection: null,
  service: "checking",
  search: "",
  phase: "idle",
  probeDone: 0,
};
let step = 0,
  furthest = 0,
  busy = false,
  apiBase = "",
  revision = 0,
  result = null,
  inspectionController,
  probeController;
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
      ([label, desc], i) =>
        `<button class="step-button${i < step ? " done" : ""}" data-step="${i}"${i === step ? ' aria-current="step"' : ""}${i > furthest || busy ? " disabled" : ""}><span class="step-number">${i < step ? "✓" : String(i + 1).padStart(2, "0")}</span><span><strong>${label}</strong><small>${desc}</small></span></button>` +
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
async function checkService() {
  try {
    const settings = await fetch("./config.json", { cache: "no-store" }).then(
      (r) => r.json(),
    );
    apiBase = serviceOrigin(settings.apiBase) || "";
    if (!apiBase) {
      ctx.service = "unconfigured";
      return;
    }
    const response = await fetch(apiBase + SERVICE_ROUTES.status, {
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!response.ok) throw Error();
    const health = await response.json();
    ctx.service = !health.ready
      ? "offline"
      : health.version !== catalog.version
        ? "mismatch"
        : "ready";
  } catch {
    ctx.service = "offline";
  } finally {
    if (!busy) render();
  }
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
  if (!local && ctx.service !== "ready") {
    error(
      "在线解析尚未连接。请为每个机场导入 Mihomo 节点文件，或连接解析服务后重试。",
    );
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
    let inspection;
    if (local) {
      const records = await Promise.all(
        providers.map(async (p, i) => ({
          name: p.name,
          nodes: parseNodes(await ctx.files.get(i).text(), i),
          usage: null,
        })),
      );
      inspection = publicInspection(records, catalog, { tcp: false });
    } else {
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
    const output = await compile({
      ...ctx.profile,
      title: ctx.profile.title || "未命名",
    });
    if (step !== 4 || rev !== revision) return;
    $("#rule-count").textContent = output.summary.rules;
    $("#file-name").textContent = ctx.profile.title
      ? filename(ctx.profile.title)
      : "名字-ratatoskr.yaml";
    $("#file-size").textContent =
      `${(output.summary.bytes / 1024).toFixed(1)} KiB · ${output.summary.groups} 个策略组`;
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
    const output = await compile(ctx.profile),
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
  if (el.dataset.nodeFile !== undefined) {
    const file = el.files[0];
    if (file && file.size > MAX_SUBSCRIPTION_BYTES) {
      error("节点文件超过 2 MiB。");
      return;
    }
    if (file) ctx.files.set(Number(el.dataset.nodeFile), file);
    else ctx.files.delete(Number(el.dataset.nodeFile));
    invalidate();
    return;
  }
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
    ctx.files.clear();
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
      $("#yaml-preview").textContent = (await compile(ctx.profile)).yaml;
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
