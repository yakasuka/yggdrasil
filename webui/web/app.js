import {
  catalog,
  defaults,
  normalize,
  compile,
  STRATEGIES,
} from "../shared/compiler.js";

const $ = (selector) => document.querySelector(selector);
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const checked = (value) => (value ? " checked" : "");
const selected = (value) => (value ? " selected" : "");
const steps = [
  ["订阅来源", "连接你的机场"],
  ["代理分流", "为应用选择出口"],
  ["规则选择", "组织分流边界"],
  ["地区节点", "展开你的世界"],
  ["生成配置", "让 Ratatoskr 出发"],
];
const state = defaults();
let step = 0,
  furthest = 0,
  search = "",
  regionSearch = "",
  apiBase = "",
  service = "checking",
  busy = false,
  result = null,
  revision = 0;

function title(heading, description) {
  return (
    '<h2 class="panel-title">' +
    heading +
    '</h2><p class="panel-description">' +
    description +
    "</p>"
  );
}
function notice(text, warning = false) {
  return (
    '<div class="notice' +
    (warning ? " warning" : "") +
    '"><span aria-hidden="true">' +
    (warning ? "◌" : "✳") +
    "</span><p>" +
    text +
    "</p></div>"
  );
}
function sourcePanel() {
  return (
    title(
      "一切，从你的订阅开始。",
      "填入机场提供的 Mihomo / Clash 节点订阅。你可以添加多个机场，稍后统一组织节点与分流。",
    ) +
    state.providers
      .map(
        (p, i) =>
          '<div class="provider-card"><div class="card-heading"><span>PROVIDER ' +
          String(i + 1).padStart(2, "0") +
          "</span>" +
          (state.providers.length > 1
            ? '<button class="icon-button" data-remove="' +
              i +
              '" aria-label="移除第 ' +
              (i + 1) +
              ' 个机场">×</button>'
            : "") +
          '</div><div class="fields"><label class="field">机场名称<input type="text" maxlength="40" data-provider="' +
          i +
          '" data-key="name" value="' +
          esc(p.name) +
          '" placeholder="例如：我的机场" autocomplete="off" spellcheck="false"></label><label class="field">节点订阅链接<input type="url" data-provider="' +
          i +
          '" data-key="url" value="' +
          esc(p.url) +
          '" placeholder="https://example.com/subscribe…" autocomplete="off" autocapitalize="off" spellcheck="false"></label></div></div>',
      )
      .join("") +
    '<button class="button add-provider" id="add-provider"' +
    (state.providers.length >= 10 ? " disabled" : "") +
    '>＋ 添加另一个机场 <span class="muted">' +
    state.providers.length +
    " / 10</span></button>" +
    notice(
      "机场链接只在点击「生成订阅链接」时发送到配置服务，以加密形式保存。页面不会将机场链接写入浏览器本地存储。",
    ) +
    '<details><summary>什么样的订阅可以使用？</summary><div class="muted">请使用机场提供的 Mihomo / Clash 格式节点订阅。仅包含 Base64 编码的通用节点链接、HTML 登录页或需要额外验证的地址，请先通过机场提供的格式转换入口转换。向导不会验证机场连通性，节点由客户端拉取。</div></details>'
  );
}
function appsPanel() {
  const categories = [...new Set(catalog.apps.map((a) => a.category))];
  return (
    title(
      "每个应用，都有合适的去向。",
      "先选择连接策略，再展开你常用的应用。未启用的应用交由其余规则与最终出口处理。",
    ) +
    '<div class="section-label">节点策略 <span class="muted">手动切换始终保留</span></div><div class="choice-grid">' +
    STRATEGIES.map(
      (s) =>
        '<label class="choice"><input type="checkbox" data-strategy="' +
        s.id +
        '"' +
        checked(state.strategies.includes(s.id)) +
        "><span><strong>" +
        esc(s.label) +
        "</strong><small>" +
        esc(s.description) +
        '</small></span><span class="choice-symbol" aria-hidden="true">' +
        s.name.split(" ")[0] +
        "</span></label>",
    ).join("") +
    "</div>" +
    '<label class="inline-field"><span>默认代理策略<small>应用选择「跟随代理」时使用</small></span><select id="default-strategy" aria-label="默认代理策略">' +
    [
      ...STRATEGIES.filter((s) => state.strategies.includes(s.id)),
      { id: "manual", label: "手动切换" },
    ]
      .map(
        (s) =>
          '<option value="' +
          s.id +
          '"' +
          selected(state.defaultStrategy === s.id) +
          ">" +
          s.label +
          "</option>",
      )
      .join("") +
    "</select></label>" +
    '<div class="section-label">应用分流 <span class="muted">' +
    state.apps.length +
    " / " +
    catalog.apps.length +
    ' 已启用</span></div><div class="toolbar"><input type="search" id="app-search" value="' +
    esc(search) +
    '" placeholder="搜索应用" aria-label="搜索应用"><div class="toolbar-actions"><button class="text-button" data-apps="all">全部启用</button><button class="text-button" data-apps="none">全部关闭</button></div></div><div class="app-grid">' +
    categories
      .map(
        (category) =>
          '<div class="category-heading" data-category="' +
          esc(category) +
          '">' +
          esc(category) +
          "</div>" +
          catalog.apps
            .filter((a) => a.category === category)
            .map((a) => {
              const enabled = state.apps.includes(a.id),
                policy =
                  state.appPolicy[a.id] || (a.direct ? "direct" : "proxy");
              return (
                '<div class="app-card" data-app-card="' +
                esc(a.label.toLowerCase()) +
                '" data-category-item="' +
                esc(category) +
                '"><label><input type="checkbox" data-app="' +
                esc(a.id) +
                '"' +
                checked(enabled) +
                ">" +
                (a.icon
                  ? '<img src="' +
                    esc(a.icon) +
                    '" alt="" loading="lazy" onerror="this.hidden=true">'
                  : "") +
                "<span>" +
                esc(a.label) +
                '</span></label><select data-policy="' +
                esc(a.id) +
                '" aria-label="' +
                esc(a.label) +
                ' 的默认出口"' +
                (!enabled ? " disabled" : "") +
                '><option value="proxy"' +
                selected(policy === "proxy") +
                '>跟随代理</option><option value="direct"' +
                selected(policy === "direct") +
                '>直连</option><option value="reject"' +
                selected(policy === "reject") +
                ">拦截</option></select></div>"
              );
            })
            .join(""),
      )
      .join("") +
    "</div>" +
    notice(
      "这里设置应用策略组的初始出口。导入后仍可在客户端切换；国内直连等优先规则命中时，按其出口执行。轮询分配新连接，不拆分单条连接。",
    )
  );
}
function rulesPanel() {
  return (
    title(
      "把复杂，留在规则根系里。",
      "GeoSite 与 GeoIP 承载分类数据。按需选择补充模块，让配置本体保持清晰、轻量。",
    ) +
    '<div class="rule-list">' +
    catalog.modules
      .map(
        (m, i) =>
          '<label class="choice"><input type="checkbox" data-rule="' +
          m.id +
          '"' +
          checked(state.rules.includes(m.id)) +
          "><span><strong>" +
          m.label +
          "</strong><small>" +
          m.description +
          '</small></span><span class="muted">0' +
          (i + 1) +
          "</span></label>",
      )
      .join("") +
    "</div>" +
    '<label class="inline-field"><span>最终出口<small>所有规则均未命中时</small></span><select id="fallback" aria-label="最终出口"><option value="proxy"' +
    selected(state.fallback === "proxy") +
    '>跟随代理</option><option value="direct"' +
    selected(state.fallback === "direct") +
    ">直连</option></select></label>" +
    notice(
      "私网直连始终保留。客户端会下载并更新 Geo 数据；关闭补充模块后，其规则源不会写入配置。",
    ) +
    "<details" +
    (Object.values(state.custom).some((x) => x.length) ? " open" : "") +
    '><summary>自定义域名例外</summary><div><p class="muted">每行一个纯域名，包含其子域名。自定义规则位于私网直连之后、其余规则之前，每类最多 100 个。</p><div class="domain-grid">' +
    [
      ["direct", "直连", "example.cn"],
      ["proxy", "代理", "example.com"],
      ["reject", "拦截", "ads.example.com"],
    ]
      .map(
        ([key, label, placeholder]) =>
          '<label class="field">' +
          label +
          '<textarea data-domain="' +
          key +
          '" placeholder="' +
          placeholder +
          '" spellcheck="false">' +
          esc(state.custom[key].join("\n")) +
          "</textarea></label>",
      )
      .join("") +
    "</div></div></details>"
  );
}
function regionsPanel() {
  return (
    title(
      "展开你想抵达的世界。",
      "按机场节点名称识别地区。选中的地区会建立独立策略组，方便在客户端快速切换。",
    ) +
    '<div class="toolbar"><input type="search" id="region-search" value="' +
    esc(regionSearch) +
    '" placeholder="搜索国家或地区" aria-label="搜索国家或地区"><div class="toolbar-actions"><button class="text-button" data-regions="common">常用六区</button><button class="text-button" data-regions="all">全选</button><button class="text-button" data-regions="none">清空</button></div></div>' +
    '<div class="region-grid">' +
    catalog.regions
      .map(
        (r) =>
          '<label class="region-choice" data-region-card="' +
          esc((r.label + " " + r.id).toLowerCase()) +
          '"><input type="checkbox" data-region="' +
          r.id +
          '"' +
          checked(state.countries.includes(r.id)) +
          '><span class="flag" aria-hidden="true">' +
          r.flag +
          "</span><span>" +
          r.label +
          "</span></label>",
      )
      .join("") +
    "</div>" +
    '<label class="choice other-choice"><input type="checkbox" id="other"' +
    checked(state.other) +
    '><span><strong>保留其他地区</strong><small>将未选中的地区与未识别节点放入「其他」组</small></span><span class="choice-symbol" aria-hidden="true">🌐</span></label>' +
    notice(
      "关闭「保留其他地区」后，手动与自动策略只使用所选地区的节点。分组不会创造节点；机场没有对应地区时，该组可能为空。",
    )
  );
}
function serviceNotice() {
  if (service === "ready")
    return notice(
      '<span class="status-dot"></span> 配置服务已连接。生成后获得可供 Mihomo 持续拉取的 HTTPS 订阅链接。',
    );
  if (service === "checking") return notice("正在检查配置服务…");
  const message =
    service === "unconfigured"
      ? '配置服务尚未部署。现在可以预览或下载 YAML；完成 <a href="https://github.com/yakasuka/yggdrasil/blob/main/worker/README.md" target="_blank" rel="noopener noreferrer">Worker + KV 部署</a> 并设置服务地址后，即可生成订阅链接。'
      : service === "mismatch"
        ? "配置服务与页面版本不同。请刷新页面；维护者需同步部署前端和 Worker。"
        : "配置服务暂时无法连接。你可以先下载 YAML，或稍后重试。";
  return notice(
    message +
      ' <button class="text-button" id="retry-service">重新检查</button>',
    true,
  );
}
function finalPanel() {
  return (
    title(
      "你的连接，即将生长。",
      "确认配置内容，为它起个名字。生成后复制订阅链接，添加到支持 Mihomo 的客户端。",
    ) +
    '<label class="field">配置名称<input id="profile-title" type="text" maxlength="60" value="' +
    esc(state.title) +
    '"></label>' +
    '<div class="stats"><div class="stat"><strong>' +
    state.providers.length +
    '</strong><span>机场订阅</span></div><div class="stat"><strong>' +
    state.apps.length +
    '</strong><span>应用分流</span></div><div class="stat"><strong>' +
    state.countries.length +
    '</strong><span>地区分组</span></div><div class="stat"><strong id="rule-count">—</strong><span>分流规则</span></div></div>' +
    '<div class="review-row"><span>节点策略</span><strong>' +
    esc(
      [
        ...STRATEGIES.filter((s) => state.strategies.includes(s.id)).map(
          (s) => s.label,
        ),
        "手动切换",
      ].join(" · "),
    ) +
    '</strong></div><div class="review-row"><span>规则模块</span><strong>' +
    esc(
      catalog.modules
        .filter((m) => state.rules.includes(m.id))
        .map((m) => m.label)
        .join(" · ") || "仅私网与应用分流",
    ) +
    '</strong></div><div class="review-row"><span>地区覆盖</span><strong>' +
    esc(
      catalog.regions
        .filter((r) => state.countries.includes(r.id))
        .map((r) => r.label)
        .join(" · ") + (state.other ? " · 其他" : ""),
    ) +
    "</strong></div>" +
    '<label class="inline-field"><span>订阅有效期<small>到期后重新生成；节点由客户端定期更新</small></span><select id="ttl" aria-label="订阅有效期">' +
    [30, 90, 365]
      .map(
        (d) =>
          '<option value="' +
          d +
          '"' +
          selected(state.ttlDays === d) +
          ">" +
          d +
          " 天</option>",
      )
      .join("") +
    "</select></label>" +
    '<details><summary>客户端选项</summary><div><label class="field">混合代理端口<input id="port" type="number" min="1024" max="65535" value="' +
    state.port +
    '"></label><label class="inline-field"><span>允许局域网连接</span><input id="allow-lan" type="checkbox"' +
    checked(state.allowLan) +
    '></label><p class="muted">DNS、TUN 和系统代理由客户端管理。生成格式为 Mihomo / Clash Meta YAML。</p></div></details>' +
    '<div class="file-card"><div class="file-icon">YAML</div><div><strong>ratatoskr.yaml</strong><small id="file-size">正在组装配置…</small></div><div class="file-actions"><button class="text-button" id="show-preview">预览配置 ↗</button><button class="text-button" id="download">下载 YAML ↓</button></div></div>' +
    '<div id="service-status">' +
    serviceNotice() +
    '</div><div id="result-area"></div>'
  );
}
function showError(message) {
  $("#error").textContent = message;
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
    refreshSummary();
  }
}
function toggle(list, value, on) {
  const index = list.indexOf(value);
  if (on && index < 0) list.push(value);
  if (!on && index >= 0) list.splice(index, 1);
}
function render() {
  $("#steps").innerHTML = steps
    .map(
      ([label, desc], i) =>
        '<button class="step-button' +
        (i < step ? " done" : "") +
        '" data-step="' +
        i +
        '"' +
        (i === step ? ' aria-current="step"' : "") +
        (i > furthest ? " disabled" : "") +
        '><span class="step-number">' +
        (i < step ? "✓" : String(i + 1).padStart(2, "0")) +
        "</span><span><strong>" +
        label +
        "</strong><small>" +
        desc +
        "</small></span></button>",
    )
    .join("");
  $("#step-caption").textContent =
    "STEP " + String(step + 1).padStart(2, "0") + " / 05";
  $("#panel").innerHTML = [
    sourcePanel,
    appsPanel,
    rulesPanel,
    regionsPanel,
    finalPanel,
  ][step]();
  $("#back").disabled = step === 0 || busy;
  $("#next").disabled = busy || (step === 4 && service !== "ready");
  $("#next").innerHTML =
    step === 4
      ? busy
        ? "正在生成…"
        : '生成订阅链接 <span aria-hidden="true">↗</span>'
      : '下一步 <span aria-hidden="true">→</span>';
  $("#progress-note").textContent =
    step < 4 ? "只保留你需要的枝叶。" : "配置按当前选择保存";
  clearError();
  filterCards();
  if (step === 4) {
    refreshSummary();
    renderResult();
  }
}
function filterCards() {
  document
    .querySelectorAll("[data-app-card]")
    .forEach(
      (el) => (el.hidden = !el.dataset.appCard.includes(search.toLowerCase())),
    );
  document
    .querySelectorAll("[data-category]")
    .forEach(
      (el) =>
        (el.hidden = ![
          ...document.querySelectorAll("[data-category-item]"),
        ].some(
          (card) =>
            card.dataset.categoryItem === el.dataset.category && !card.hidden,
        )),
    );
  document
    .querySelectorAll("[data-region-card]")
    .forEach(
      (el) =>
        (el.hidden = !el.dataset.regionCard.includes(
          regionSearch.toLowerCase(),
        )),
    );
}
async function refreshSummary() {
  const rev = revision;
  try {
    const output = await compile(state);
    if (step === 4 && rev === revision) {
      $("#rule-count").textContent = output.summary.rules;
      $("#file-size").textContent =
        (output.summary.bytes / 1024).toFixed(1) +
        " KB · " +
        output.summary.groups +
        " 个策略组 · Geo 数据按需加载";
    }
  } catch (error) {
    if (step === 4 && rev === revision) {
      $("#file-size").textContent = "请检查配置内容";
      showError(error.message);
    }
  }
}
function validateCurrent() {
  try {
    normalize(state);
    return true;
  } catch (error) {
    const fields = [
      ["providers"],
      ["strategies", "apps"],
      ["rules", "custom"],
      ["countries"],
      ["title", "port", "ttlDays"],
    ];
    if (fields[step].includes(error.field) || step === 4 || !error.field) {
      showError(error.message);
      return false;
    }
    return true;
  }
}
function navigate(target) {
  step = target;
  furthest = Math.max(furthest, target);
  render();
  $("#workspace").focus({ preventScroll: true });
  if (matchMedia("(max-width:680px)").matches)
    window.scrollTo({ top: 0, behavior: "instant" });
}
async function checkService() {
  service = "checking";
  if (step === 4) render();
  try {
    const settings = await fetch("./config.json", { cache: "no-store" }).then(
      (r) => {
        if (!r.ok) throw Error();
        return r.json();
      },
    );
    if (!settings.apiBase) {
      service = "unconfigured";
      return;
    }
    const url = new URL(settings.apiBase);
    if (
      url.protocol !== "https:" &&
      !["localhost", "127.0.0.1"].includes(url.hostname)
    )
      throw Error();
    apiBase = url.origin;
    const response = await fetch(apiBase + "/api/health", {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!response.ok) throw Error();
    const health = await response.json();
    service = !health.ready
      ? "offline"
      : health.version !== catalog.version
        ? "mismatch"
        : "ready";
  } catch {
    service = "offline";
  } finally {
    if (step === 4) render();
  }
}
function renderResult() {
  if (!result || step !== 4) return;
  $("#result-area").innerHTML =
    '<div class="result"><h3>已就绪，让 Ratatoskr 出发。</h3><p class="muted">在客户端选择「从 URL 导入」，粘贴下方链接。</p><label class="field">你的私密订阅链接<input id="result-url" type="text" readonly value="' +
    esc(result.url) +
    '" spellcheck="false"></label><button id="copy-result" class="button primary">复制订阅链接</button><small>有效至 ' +
    new Date(result.expiresAt).toLocaleDateString("zh-CN") +
    "。持有链接即可读取配置，包括机场订阅地址，请勿公开分享。修改选项后需重新生成。</small></div>";
}
async function generate() {
  if (busy || service !== "ready" || !validateCurrent()) return;
  busy = true;
  $("#next").disabled = true;
  $("#back").disabled = true;
  $("#next").textContent = "正在生成…";
  // Lock edits during the request so the displayed choices always match the saved snapshot.
  const controls = [
    ...$("#panel").querySelectorAll("input,select,textarea,button"),
    ...$("#steps").querySelectorAll("button"),
  ];
  const previous = controls.map((el) => el.disabled);
  controls.forEach((el) => (el.disabled = true));
  try {
    const response = await fetch(apiBase + "/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalize(state)),
      signal: AbortSignal.timeout(20000),
    });
    const data = await response.json();
    if (!response.ok) throw Error(data.error || "配置生成失败，请稍后重试。");
    const link = new URL(data.url);
    if (link.origin !== apiBase || !link.pathname.startsWith("/s/"))
      throw Error("服务返回的订阅地址无效。");
    result = data;
    renderResult();
    $("#result-area").scrollIntoView({ block: "nearest", behavior: "smooth" });
  } catch (error) {
    showError(
      error.name === "TimeoutError"
        ? "请求超时，请稍后重试。"
        : error.message || "网络暂时不可用，请稍后重试。",
    );
  } finally {
    busy = false;
    controls.forEach((el, i) => (el.disabled = previous[i]));
    $("#back").disabled = false;
    $("#next").disabled = false;
    $("#next").innerHTML = '重新生成链接 <span aria-hidden="true">↗</span>';
  }
}
async function download() {
  try {
    const { yaml } = await compile(state),
      url = URL.createObjectURL(new Blob([yaml], { type: "application/yaml" })),
      a = document.createElement("a");
    a.href = url;
    a.download = "ratatoskr.yaml";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    showError(error.message);
  }
}
let toastTimer;
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 2500);
}
document.addEventListener("input", (event) => {
  const el = event.target;
  if (el.dataset.provider !== undefined) {
    state.providers[Number(el.dataset.provider)][el.dataset.key] = el.value;
    changed();
  }
  if (el.dataset.domain) {
    state.custom[el.dataset.domain] = el.value
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
    changed();
  }
  if (el.id === "app-search") {
    search = el.value;
    filterCards();
  }
  if (el.id === "region-search") {
    regionSearch = el.value;
    filterCards();
  }
  if (el.id === "profile-title") {
    state.title = el.value;
    changed();
  }
  if (el.id === "port") {
    state.port = el.value;
    changed();
  }
});
document.addEventListener("change", (event) => {
  const el = event.target;
  if (el.dataset.strategy) {
    toggle(state.strategies, el.dataset.strategy, el.checked);
    if (!state.strategies.includes(state.defaultStrategy))
      state.defaultStrategy = state.strategies[0] || "manual";
    changed();
    render();
  }
  if (el.dataset.app) {
    toggle(state.apps, el.dataset.app, el.checked);
    changed();
    render();
  }
  if (el.dataset.policy) {
    state.appPolicy[el.dataset.policy] = el.value;
    changed();
  }
  if (el.dataset.rule) {
    toggle(state.rules, el.dataset.rule, el.checked);
    changed();
  }
  if (el.dataset.region) {
    toggle(state.countries, el.dataset.region, el.checked);
    changed();
  }
  const mapping = {
    "default-strategy": "defaultStrategy",
    fallback: "fallback",
    other: "other",
    ttl: "ttlDays",
    "allow-lan": "allowLan",
  };
  if (mapping[el.id]) {
    state[mapping[el.id]] = el.type === "checkbox" ? el.checked : el.value;
    changed();
  }
});
document.addEventListener("click", async (event) => {
  const el = event.target.closest("button");
  if (!el || el.disabled) return;
  if (el.id === "next") {
    if (step === 4) await generate();
    else if (validateCurrent()) navigate(step + 1);
  }
  if (el.id === "back" && step > 0) navigate(step - 1);
  if (el.dataset.step !== undefined) {
    const target = Number(el.dataset.step);
    if (target < step || validateCurrent()) navigate(target);
  }
  if (el.id === "add-provider") {
    state.providers.push({ name: "", url: "" });
    changed();
    render();
    $("#panel")
      .querySelectorAll("[data-key=name]")
      [state.providers.length - 1].focus();
  }
  if (el.dataset.remove !== undefined) {
    state.providers.splice(Number(el.dataset.remove), 1);
    changed();
    render();
  }
  if (el.dataset.apps) {
    state.apps = el.dataset.apps === "all" ? catalog.apps.map((a) => a.id) : [];
    changed();
    render();
  }
  if (el.dataset.regions) {
    state.countries =
      el.dataset.regions === "all"
        ? catalog.regions.map((r) => r.id)
        : el.dataset.regions === "common"
          ? defaults().countries
          : [];
    changed();
    render();
  }
  if (el.id === "show-preview") {
    try {
      $("#yaml-preview").textContent = (await compile(state)).yaml;
      $("#preview").showModal();
    } catch (error) {
      showError(error.message);
    }
  }
  if (el.id === "close-preview") $("#preview").close();
  if (el.id === "download") await download();
  if (el.id === "retry-service") await checkService();
  if (el.id === "copy-result") {
    try {
      await navigator.clipboard.writeText(result.url);
      toast("订阅链接已复制");
    } catch {
      $("#result-url").select();
      toast("请选择并复制链接");
    }
  }
});
render();
checkService();
