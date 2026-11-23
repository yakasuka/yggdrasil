// Self-contained owner dashboard served by the backend at
// /config-builder/dashboard. It carries no secrets or node data: credentials
// are held in an HttpOnly cookie by the Pages Function, and all config data is
// fetched from the admin API at runtime.
//
// Visual language: the configurator's own stylesheet, read from disk at module
// init and injected verbatim (single source of truth). The DOM skeleton mirrors
// config-builder's own page — sticky glass header, caustic hero, journey step
// rail and a solid workspace panel — so the two pages read as one product.
//
// Two tools live here, as journey steps: the graphical front-end information
// editor (apps / regions / strategies / rules, derived from the YAML template)
// and the subscription-link manager. Every graphical edit is a surgical,
// format-preserving patch to the template applied through /api/admin/frontinfo.

import { readFileSync } from "node:fs";

function readAsset(relative) {
  try {
    return readFileSync(new URL(relative, import.meta.url), "utf8")
      .replace(/^\uFEFF?@charset[^;]+;\s*/i, "")
      // A literal closing tag inside an inlined script would terminate the
      // <script> element early (even when it only appears in a JS comment).
      .replace(/<\/script>/gi, "<\\/script>");
  } catch {
    return "";
  }
}

// The exact stylesheet shipped with the configurator (styles.css +
// widget-editor.css + motion.css, prebuilt as assets/app.css). Sharing the
// compiled file — rather than a hand-written approximation — is what makes
// the two pages look like the same product down to the last pixel.
function styleSheet() {
  return readAsset("../assets/app.css") || readAsset("../src/styles.css");
}

// The same WebGL water surface used by the configurator. caustics.js is the
// single source of truth; we lift just its waterSurface() core and drop the
// full-screen intro choreography, which has no place on the dashboard.
function waterScript() {
  const src = readAsset("../src/caustics.js");
  const start = src.indexOf("function waterSurface()");
  const end = src.indexOf("if (canvas && hero && stage)");
  if (start < 0 || end < 0) return "";
  const scope = `var canvas=document.querySelector("#caustic-water"),hero=document.querySelector(".caustic-hero"),stage=null,root=document.documentElement,reduced=matchMedia("(prefers-reduced-motion: reduce)"),morph=null,animatedView=null,transitioning=false;\n`;
  return scope + src.slice(start, end) + "\nwaterSurface();\n";
}

// The shared footer is a custom element with its own Shadow DOM. Inlining its
// source keeps the dashboard self-contained under its strict CSP.
function footerScript() {
  return readAsset("../../assets/site-footer.js");
}

// Only dashboard-specific glue is defined here. Every other rule — cards,
// pills, grids, headers, hero, footer — comes from the builder stylesheet.
const DASH_ONLY = `
.site-header .brand{text-decoration:none}
.header-link{display:inline-flex;align-items:center;gap:5px;padding:0;border:0;background:none;color:var(--muted);font-size:.75rem;cursor:pointer;text-decoration:none;transition:color 180ms var(--ease)}
.header-link:hover{color:var(--accent)}
.header-link svg{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
#steps .step-button>span:not(.step-number){display:block}
#steps .step-button .step-number{display:none}
#steps .step-button small{display:block;margin-top:4px;color:var(--muted);font-size:.75rem;font-weight:400;line-height:1.5}
#steps .step-button[aria-current="step"] strong::before{content:"→ ";color:var(--accent)}
.dash-summary{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px}
.dash-stat{display:inline-flex;align-items:baseline;gap:6px;padding:5px 12px;border:1px solid var(--line);border-radius:99px;background:var(--soft);color:var(--muted);font-size:.6875rem;transition:transform 180ms var(--ease),border-color 180ms var(--ease)}
.dash-stat:hover{transform:translateY(-2px);border-color:var(--selected-line)}
.dash-stat b{color:var(--ink);font-weight:650;font-size:.8125rem}
.app-card[hidden],.region-bar[hidden],.choice[hidden],.category-heading[hidden],.panel-actions[hidden],.service-status[hidden]{display:none}
.dash-scroll::-webkit-scrollbar{height:6px}
.dash-table .dash-badge{white-space:nowrap}
.dash-editor .app-card,.dash-editor .region-bar,.dash-editor .choice{cursor:pointer}
.dash-editor .app-card:hover,.dash-editor .region-bar:hover,.dash-editor .choice:hover{border-color:var(--selected-line);background:var(--tint)}
.dash-edit-act{margin-left:auto;flex:0 0 auto;width:24px;height:24px;display:grid;place-items:center;border:1px solid var(--line);border-radius:7px;color:var(--muted);background:var(--soft)}
.dash-editor .app-card:hover .dash-edit-act{color:var(--accent);border-color:var(--selected-line)}
.dash-edit-act svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.dash-choice-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:10px}
.dash-row-card{display:flex;align-items:center;gap:10px;min-width:0;padding:12px 14px;border:1px solid var(--line);border-radius:13px;background:var(--soft);font-size:.8125rem}
.dash-row-card>span:first-child{min-width:0;flex:1}
.dash-row-card strong{display:block;font-weight:600;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dash-row-card small{display:block;margin-top:3px;color:var(--muted);font-size:.6875rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dash-row-card[role="button"]{cursor:pointer;transition:border-color 160ms var(--ease),background 160ms var(--ease)}
.dash-row-card[role="button"]:hover{border-color:var(--selected-line);background:var(--tint)}
.dash-icon-btn{flex:0 0 auto;width:24px;height:24px;display:grid;place-items:center;padding:0;border:1px solid var(--line);border-radius:7px;background:var(--surface);color:var(--muted);font-size:.75rem;line-height:1;cursor:pointer;transition:color 160ms var(--ease),border-color 160ms var(--ease)}
.dash-icon-btn:hover{color:var(--accent);border-color:var(--selected-line)}
.dash-icon-btn:disabled{opacity:.35;cursor:default}
.dash-rule-list{max-height:460px;overflow:auto;padding-right:4px}
.dash-rule-list::-webkit-scrollbar{width:6px}
.dash-rule-list::-webkit-scrollbar-thumb{background:var(--line);border-radius:99px}
.dash-rule-row{display:flex;align-items:center;gap:8px;padding:9px 12px;margin-bottom:6px;border:1px solid var(--line);border-radius:11px;background:var(--soft);font-size:.75rem}
.dash-rule-row.off{opacity:.5}
.dash-rule-row code{font:12px ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dash-rule-row .dash-rule-type{flex:0 0 auto;padding:2px 7px;border-radius:6px;background:var(--tint);color:var(--accent);font-size:.625rem;font-weight:600}
.dash-spacer{flex:1}
.dash-modal-card textarea{width:100%;min-height:96px;resize:vertical;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--input);color:var(--ink);font:12px/1.6 ui-monospace,SFMono-Regular,Consolas,monospace;outline:none}
.dash-modal-card textarea:focus{border-color:var(--selected-line)}
.dash-modal-card .dash-hint{margin:-6px 0 4px;font-size:.6875rem;line-height:1.6;color:var(--muted)}
.dash-toggle{display:flex;align-items:center;gap:8px;margin:16px 0;font-size:.8125rem;color:var(--ink)}
.dash-toggle input{width:16px;height:16px;accent-color:var(--accent)}
.dash-source{margin-top:26px;border-top:1px solid var(--line);padding-top:18px}
.dash-source summary{cursor:pointer;font-size:.8125rem;color:var(--muted)}
.dash-source textarea{display:block;width:100%;min-height:320px;resize:vertical;margin-top:12px;padding:14px 16px;border:1px solid var(--line);border-radius:14px;background:var(--input);color:var(--ink);font:12px/1.65 ui-monospace,SFMono-Regular,Consolas,monospace;outline:none;tab-size:2}
.dash-source textarea:focus{border-color:var(--selected-line);box-shadow:0 0 0 3px var(--tint)}
.dash-modal{position:fixed;inset:0;z-index:20;display:grid;place-items:center;padding:20px;background:#0009;backdrop-filter:blur(6px)}
.dash-modal[hidden]{display:none}
.dash-modal-card{width:min(460px,100%);max-height:88vh;overflow:auto;padding:26px;border:1px solid var(--glass-edge);border-radius:22px;background:var(--glass);box-shadow:var(--shadow)}
.dash-modal-card .dialog-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.dash-modal-card .field{margin:16px 0}
.dash-modal-card .field label{display:block;margin-bottom:6px;font-size:.75rem;font-weight:550;color:var(--muted)}
.dash-modal-card input,.dash-modal-card select{width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--input);color:var(--ink);font-size:.8125rem;outline:none}
.dash-modal-card input:focus,.dash-modal-card select:focus{border-color:var(--selected-line)}
.dash-modal-actions{display:flex;gap:8px;margin-top:22px;flex-wrap:wrap}
.dash-modal-actions .spacer{flex:1}
.dash-copy{flex:0 0 auto;border:1px solid var(--line);background:var(--soft);color:var(--muted);border-radius:8px;padding:4px 8px;font-size:.6875rem;line-height:1.2;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:color 160ms var(--ease),border-color 160ms var(--ease),background 160ms var(--ease)}
.dash-copy:hover{color:var(--accent);border-color:var(--selected-line);background:var(--tint)}
.dash-copy:active{transform:scale(.96)}
.dash-copy svg{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.dash-link{display:inline-flex;flex-direction:column;align-items:flex-start;gap:4px;max-width:280px}
.dash-link-main{display:inline-flex;align-items:center;gap:8px;max-width:100%}
.dash-link code{word-break:break-all}
.dash-link .dash-link-url{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted);font-size:.6875rem}
.dash-link a{color:var(--accent);text-decoration:none;display:inline-flex;align-items:flex-start;gap:5px;white-space:nowrap}
.dash-link a:hover{text-decoration:underline}
.dash-link a::after{content:"↗";font-size:.75rem;line-height:1.4;opacity:.7}
.step-panel[hidden],.dash-summary[hidden]{display:none}
.dash-toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,16px);z-index:99;padding:10px 18px;border:1px solid var(--line);border-radius:99px;background:var(--surface);color:var(--ink);font-size:.8125rem;box-shadow:0 8px 30px #0003;opacity:0;pointer-events:none;transition:opacity 200ms var(--ease),transform 200ms var(--ease)}
.dash-toast.show{opacity:1;transform:translate(-50%,0)}
.dash-toast.err{color:var(--danger)}
.dash-empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:8px}
.dash-empty strong{font-weight:600;color:var(--ink);font-size:.9375rem}
.dash-empty p{margin:0;font-size:.8125rem;line-height:1.7}
.dash-empty a{color:var(--accent);text-decoration:none}
.dash-empty a:hover{text-decoration:underline}
.dash-table{width:100%;border-collapse:collapse;min-width:820px}
.dash-table th,.dash-table td{text-align:left;padding:13px 16px;border-bottom:1px solid var(--line);vertical-align:top;font-size:.8125rem}
.dash-table th{color:var(--muted);font-weight:500;background:var(--soft);white-space:nowrap}
.dash-table tr:last-child td{border-bottom:0}
.dash-table tbody tr{transition:background 160ms var(--ease)}
.dash-table tbody tr:hover{background:var(--tint)}
.dash-table code{font:12px ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--accent);word-break:break-all}
.dash-table .nowrap{white-space:nowrap}
.dash-scroll{overflow-x:auto}
.dash-msg{padding:48px 24px;text-align:center;color:var(--muted)}
.dash-badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:.6875rem;border:1px solid var(--line);background:var(--soft);color:var(--muted)}
.dash-badge.locked{color:var(--warning);border-color:var(--warning-bg);background:var(--warning-bg)}
.dash-err{color:var(--danger)}
.dash-ok{color:var(--ok)}
button.danger{color:var(--danger);border-color:var(--danger-bg)}
@media(max-width:760px){.site-header{padding-inline:14px}.layout{padding:18px 14px 0}.workspace{padding:24px 18px 0}.journey{position:static}}
`;

export function dashboardHTML({
  linkBase = "",
  adminPath = "/api/admin/configs",
  frontInfoPath = "/api/admin/frontinfo",
  catalogPath = "/api/catalog",
} = {}) {
  const boot = JSON.stringify({ linkBase, adminPath, frontInfoPath, catalogPath })
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e");
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="color-scheme" content="dark light">
<title>config-builder · Yggdrasil</title>
<style>${styleSheet()}\n${DASH_ONLY}</style>
<script>
(()=>{var r=document.documentElement;try{r.dataset.theme=localStorage.getItem("yggdrasil:config-builder:theme")==="light"?"light":"dark"}catch{r.dataset.theme="dark"}r.dataset.intro="skip"})();
</script>
</head>
<body>
<header class="site-header">
  <a class="brand" href="../" aria-label="Yggdrasil 项目首页">
    <img src="/assets/favicon.png" width="40" height="40" alt="" decoding="async">
    <span>Yggdrasil<small>config dashboard</small></span>
  </a>
  <div class="header-links">
    <span class="engine"><i aria-hidden="true"></i>为 “为秩序而生” 而生</span>
    <div class="appearance-tools" aria-label="外观设置">
      <button class="theme-toggle button secondary" id="theme-toggle" type="button" aria-label="切换到浅色模式" title="切换主题"><span aria-hidden="true" id="theme-toggle-icon" class="theme-icon"><svg viewBox="0 0 24 24" class="theme-icon-svg"><g class="theme-icon-sun"><circle cx="12" cy="12" r="4.1"/><path class="theme-icon-rays" d="M12 2.4v2.3M12 19.3v2.3M2.4 12h2.3M19.3 12h2.3M5.2 5.2 6.8 6.8M17.2 17.2 18.8 18.8M5.2 18.8 6.8 17.2M17.2 6.8 18.8 5.2"/></g><path class="theme-icon-moon" d="M20.3 14.9A8.5 8.5 0 0 1 9.1 3.7a8.5 8.5 0 1 0 11.2 11.2Z"/></svg></span><span id="theme-toggle-label">浅色</span></button>
    </div>
    <a class="header-link" href="https://github.com/yakasuka/yggdrasil" target="_blank" rel="noopener noreferrer">GitHub <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></a>
    <button class="header-link" id="logout" type="button">退出登录</button>
  </div>
</header>

<main class="layout">
  <section class="caustic-hero" aria-label="动态水面效果。点击水面产生涟漪">
    <canvas id="caustic-water" aria-hidden="true"></canvas>
    <div class="caustic-meta"><span><i aria-hidden="true"></i> RATATOSKR · CONFIG STUDIO</span><span>自由生长，生生不息。</span></div>
    <div class="caustic-copy"><div><p>管理订阅链接 · 编辑驱动整个配置工坊的信息</p><h2>配置管理</h2></div><a href="#workspace">开始管理 <span aria-hidden="true">↓</span></a></div>
    <div class="caustic-hint">点击水面，感受涟漪 <svg class="hint-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v14M6 12l6 6 6-6"/></svg></div>
  </section>

  <aside class="journey" aria-label="配置进度">
    <div class="eyebrow">YOUR CONFIGURATION</div>
    <h1>从这里开始。</h1>
    <p class="intro">配置工坊由一份模板生长而来。<br/>每一处修改，都有自己的去向。</p>
    <nav id="steps" aria-label="前端配置步骤">
      <button class="step-button" data-step="general" aria-current="step" type="button"><span class="step-number">1</span><span><strong>基础设置</strong><small>端口 · 模式 · 控制</small></span></button>
      <button class="step-button" data-step="apps" type="button"><span class="step-number">2</span><span><strong>应用分流</strong><small>分类 · 图标 · 出口</small></span></button>
      <button class="step-button" data-step="regions" type="button"><span class="step-number">3</span><span><strong>地区节点</strong><small>旗帜 · 匹配规则</small></span></button>
      <button class="step-button" data-step="strategy" type="button"><span class="step-number">4</span><span><strong>出口策略</strong><small>测速 · 核心策略组</small></span></button>
      <button class="step-button" data-step="rules" type="button"><span class="step-number">5</span><span><strong>规则与规则源</strong><small>筛选 · 分流 · 更新</small></span></button>
      <button class="step-button" data-step="configs" type="button"><span class="step-number">6</span><span><strong>订阅链接</strong><small>生成与访问权限</small></span></button>
    </nav>
    <div class="journey-note"><span aria-hidden="true">✳</span><div><strong>一处修改，处处生长。</strong><p>保存后立即生效，并由定时任务写回仓库。</p></div></div>
  </aside>

  <section class="workspace" id="workspace" tabindex="-1" aria-label="配置面板">
    <div class="panel-top">
      <span id="step-caption" class="eyebrow">STEP 01 / 06</span>
      <span class="chip">RATATOSKR</span>
      <div class="panel-actions">
        <button class="icon-text-button" id="fi-reload" type="button" title="重新载入"><span aria-hidden="true">↻</span> 重新载入</button>
        <button class="icon-text-button" id="fi-reset" type="button"><span aria-hidden="true">✕</span> 放弃草稿</button>
      </div>
    </div>
    <div class="service-status" id="service-settings" data-state="ready" role="status">
      <span class="status-dot" aria-hidden="true"></span>
      <span id="fi-source">读取中…</span>
      <button class="status-retry" id="fi-reload-mini" type="button" aria-label="重试连接" title="重试连接">↻</button>
    </div>

    <h2 class="panel-title" id="step-title">先打好地基。</h2>
    <p class="panel-description" id="step-desc">端口、运行模式与控制面板。所有修改都会写回 Ratatoskr 模板，保存后配置工坊立即生效。</p>

    <section class="step-panel" data-panel="general">
      <div class="dash-summary" id="fi-summary"></div>
      <div class="section-label"><span>基础设置</span><small>端口 · 模式 · 日志</small></div>
      <div class="dash-choice-grid dash-editor" id="fi-general"><span class="muted">载入中…</span></div>
      <details class="dash-source">
        <summary>高级 · 直接编辑 YAML 模板</summary>
        <textarea id="fi-text" spellcheck="false" aria-label="YAML 模板内容" placeholder="正在载入模板…"></textarea>
        <div class="panel-actions" style="margin-top:12px">
          <button class="button primary" id="fi-save" type="button">应用源码</button>
          <span class="dash-status dash-ok" id="fi-status" style="margin:0"></span>
        </div>
      </details>
    </section>

    <section class="step-panel" data-panel="apps" hidden>
      <div class="section-label"><span>应用分流</span><small>每个分类一次看清 · 点击卡片编辑</small></div>
      <div class="toolbar"><input type="search" id="app-search" placeholder="搜索 APP" aria-label="搜索 APP"><span class="muted" id="fi-count">载入中…</span><div class="toolbar-actions"><button class="text-button" id="add-app" type="button">＋ 添加应用</button></div></div>
      <div class="app-grid dash-editor" id="fi-apps"><span class="muted">载入中…</span></div>
    </section>

    <section class="step-panel" data-panel="regions" hidden>
      <div class="section-label"><span>地区节点</span><small>旗帜 · 显示名 · 匹配规则</small></div>
      <div class="region-bars dash-editor" id="fi-regions"><span class="muted">载入中…</span></div>
    </section>

    <section class="step-panel" data-panel="strategy" hidden>
      <div class="section-label"><span>出口策略</span><small>测速 URL · 间隔 · 容差 · 出口顺序</small></div>
      <div class="choice-grid dash-editor" id="fi-strategies"><span class="muted">载入中…</span></div>
      <div class="section-label"><span>核心策略组</span><small>入口 · 兜底 · 国内 · 特殊端口</small></div>
      <div class="dash-choice-grid dash-editor" id="fi-core"><span class="muted">载入中…</span></div>
    </section>

    <section class="step-panel" data-panel="rules" hidden>
      <div class="section-label"><span>节点筛选</span><small>净化 · 其他地区 · 地区正则</small></div>
      <div class="dash-choice-grid dash-editor" id="fi-filters"><span class="muted">载入中…</span></div>
      <div class="section-label"><span>规则模块</span><small>来自模板声明</small></div>
      <div class="choice-grid dash-editor" id="fi-rules"><span class="muted">载入中…</span></div>
      <div class="section-label"><span>分流规则</span><small>顺序决定出口 · 可编辑 / 启停 / 移动</small></div>
      <div class="toolbar"><span class="muted" id="fi-rule-count">载入中…</span><div class="toolbar-actions"><button class="text-button" id="add-rule" type="button">＋ 添加规则</button></div></div>
      <div class="dash-rule-list" id="fi-rule-list"><span class="muted">载入中…</span></div>
      <div class="section-label"><span>规则源</span><small>URL · 更新间隔 · 行为</small></div>
      <div class="dash-choice-grid dash-editor" id="fi-providers"><span class="muted">载入中…</span></div>
    </section>

    <section class="step-panel" id="panel-configs" data-panel="configs" hidden>
      <div class="service-status" data-state="ready" role="status"><span class="status-dot" aria-hidden="true"></span><span id="status">加载中…</span><button class="status-retry" id="refresh" type="button" aria-label="重新载入" title="重新载入">↻</button></div>
      <div class="dash-scroll"><div class="dash-msg" id="body">正在加载…</div></div>
    </section>

    <footer class="wizard-footer">
      <button class="button secondary" id="back" type="button">上一步</button>
      <span id="progress-note" class="muted">一处修改，处处生长。</span>
      <button class="button primary" id="next" type="button" data-target="apps">下一步 <span aria-hidden="true">→</span></button>
    </footer>
  </section>
</main>
<site-footer base="/"></site-footer>

<div class="dash-toast" id="toast" role="status" aria-live="polite"></div>

<div class="dash-modal" id="fi-modal" hidden role="dialog" aria-modal="true" aria-labelledby="fi-modal-title">
  <div class="dash-modal-card">
    <div class="dialog-header"><h2 id="fi-modal-title">编辑</h2><button class="icon-button" id="fi-modal-close" type="button" aria-label="关闭">✕</button></div>
    <div id="fi-modal-body"></div>
    <div class="dash-modal-actions">
      <button class="button secondary danger" id="fi-modal-remove" type="button">移除</button>
      <span class="spacer"></span>
      <button class="button secondary" id="fi-modal-cancel" type="button">取消</button>
      <button class="button primary" id="fi-modal-apply" type="button">保存并生效</button>
    </div>
  </div>
</div>

<script>${waterScript()}</script>
<script type="module">${footerScript()}</script>
<script>
(function(){
"use strict";
var CFG=${boot};
var themeKey="yggdrasil:config-builder:theme";
var system=matchMedia("(prefers-color-scheme: light)");
var saved=null;try{var v=localStorage.getItem(themeKey);if(v==="light"||v==="dark")saved=v}catch(e){}
var toggle=document.getElementById("theme-toggle");
function applyTheme(){
  var theme=saved||(system.matches?"light":"dark");
  document.documentElement.dataset.theme=theme;
  var light=theme==="light";
  toggle.setAttribute("aria-label","切换到"+(light?"深色":"浅色")+"模式");
  document.getElementById("theme-toggle-label").textContent=light?"深色":"浅色";
}
system.addEventListener("change",function(){if(!saved)applyTheme()});
toggle.addEventListener("click",function(){
  saved=document.documentElement.dataset.theme==="light"?"dark":"light";
  try{localStorage.setItem(themeKey,saved)}catch(e){}
  applyTheme();
});
applyTheme();

function el(tag,text){var n=document.createElement(tag);if(text!=null)n.textContent=text;return n}
var toast=document.getElementById("toast"),toastTimer=null;
function notify(text,isErr){
  toast.textContent=text;
  toast.className="dash-toast show"+(isErr?" err":"");
  clearTimeout(toastTimer);
  toastTimer=setTimeout(function(){toast.className="dash-toast"},2400);
}
function copyIcon(){
  var s=document.createElementNS("http://www.w3.org/2000/svg","svg");
  s.setAttribute("viewBox","0 0 24 24");s.setAttribute("aria-hidden","true");
  var p=document.createElementNS("http://www.w3.org/2000/svg","path");
  p.setAttribute("d","M9 9h10v10H9zM5 15H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1");
  s.appendChild(p);return s;
}
function copyButton(text,label){
  var b=el("button");b.className="dash-copy";b.type="button";
  b.title=label||"复制订阅链接";b.setAttribute("aria-label",b.title);
  b.appendChild(copyIcon());b.appendChild(el("span","复制"));
  b.addEventListener("click",function(){
    var done=function(){notify("已复制订阅链接");var sp=b.getElementsByTagName("span")[0];if(sp){var old=sp.textContent;sp.textContent="已复制";setTimeout(function(){sp.textContent=old},1500)}};
    var fail=function(){
      // Select the visible link so a plain Ctrl/Cmd+C still works when the
      // Clipboard API is unavailable (e.g. non-secure or restricted contexts).
      var cell=b.closest("td");var code=cell&&cell.getElementsByTagName("code")[0];
      if(code&&window.getSelection){var r=document.createRange();r.selectNodeContents(code);var sel=window.getSelection();sel.removeAllRanges();sel.addRange(r)}
      notify("已选中链接，请按 Ctrl/Cmd+C 复制",true);
    };
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(done).catch(function(){fallbackCopy(text,done,fail)});
    }else fallbackCopy(text,done,fail);
  });
  return b;
}
function fallbackCopy(text,done,fail){
  var ta=el("textarea");ta.value=text;ta.setAttribute("readonly","");
  ta.style.cssText="position:fixed;top:-1000px;opacity:0";
  document.body.appendChild(ta);ta.select();var ok=false;
  try{ok=document.execCommand("copy")}catch(e){}
  document.body.removeChild(ta);ok?done():fail();
}
function stamp(value){if(!value)return "—";var d=new Date(value);return isNaN(d.getTime())?String(value):d.toLocaleString("zh-CN",{hour12:false})}
function esc(value){return String(value==null?"":value).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
var EDIT_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10-10-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>';

/* ---- step navigation: same one-category-at-a-time flow as the builder ---- */
var stepPanels=[].slice.call(document.querySelectorAll(".step-panel"));
var caption=document.getElementById("step-caption");
var stepTitle=document.getElementById("step-title");
var stepDesc=document.getElementById("step-desc");
var progressNote=document.getElementById("progress-note");
var backButton=document.getElementById("back");
var nextButton=document.getElementById("next");
var stepButtons=[].slice.call(document.querySelectorAll(".step-button"));
var stepActions=document.querySelector(".panel-top .panel-actions");
var serviceSettings=document.getElementById("service-settings");
var summaryStrip=document.getElementById("fi-summary");
var STEP_ORDER=["general","apps","regions","strategy","rules","configs"];
var STEP_META={
  general:{title:"先打好地基。",desc:"端口、运行模式与控制面板。所有修改都会写回 Ratatoskr 模板，保存后配置工坊立即生效。",note:"一处修改，处处生长。"},
  apps:{title:"每个 APP，都有自己的去向。",desc:"应用按模板分类展示。点击任意卡片即可修改名称、图标、默认出口与关联规则。",note:"分类清晰，去向明确。"},
  regions:{title:"节点去哪里，由你决定。",desc:"编辑地区旗帜、显示名称与匹配正则。修改会同步到对应策略组与分流规则。",note:"地区即路线。"},
  strategy:{title:"出口，决定每一次连接。",desc:"配置测速 URL、间隔、容差与出口顺序；核心策略组决定入口与兜底。",note:"策略是配置的心脏。"},
  rules:{title:"让流量各得其所。",desc:"节点筛选、规则模块、分流顺序与规则源都在这里，编辑后立即参与配置生成。",note:"顺序决定出口。"},
  configs:{title:"所有订阅，都在这里。",desc:"点击订阅链接可直接查看内容；也可以复制、删除配置。配置由订阅工坊生成。",note:"配置由订阅工坊生成。"}
};
function showStep(which){
  var i=STEP_ORDER.indexOf(which);
  if(i<0)i=0;
  which=STEP_ORDER[i];
  var front=which!=="configs",meta=STEP_META[which];
  stepPanels.forEach(function(p){p.hidden=p.dataset.panel!==which});
  stepButtons.forEach(function(b){if(b.dataset.step===which)b.setAttribute("aria-current","step");else b.removeAttribute("aria-current")});
  caption.textContent="STEP "+String(i+1).padStart(2,"0")+" / "+String(STEP_ORDER.length).padStart(2,"0");
  stepTitle.textContent=meta.title;
  stepDesc.textContent=meta.desc;
  stepActions.hidden=!front;
  serviceSettings.hidden=!front;
  summaryStrip.hidden=which!=="general";
  progressNote.textContent=meta.note;
  backButton.disabled=i===0;
  var last=i===STEP_ORDER.length-1;
  nextButton.dataset.target=last?"general":STEP_ORDER[i+1];
  nextButton.innerHTML=last?'回到第一步 <span aria-hidden="true">↺</span>':'下一步 <span aria-hidden="true">→</span>';
  if(!front)load();
  var ws=document.getElementById("workspace");
  if(ws&&window.scrollY>ws.offsetTop-140)ws.scrollIntoView({behavior:"smooth",block:"start"});
}
window.addEventListener("beforeunload",function(e){
  if(!fiDirty)return;
  e.preventDefault();e.returnValue="";
});
function guardedStep(which){
  var current=document.querySelector('.step-button[aria-current="step"]');
  if(current&&current.dataset.step===which)return;
  if(fiDirty&&!window.confirm("前端模板有未保存的修改，切换后将丢失。确定继续？"))return;
  showStep(which);
}
stepButtons.forEach(function(b){b.addEventListener("click",function(){guardedStep(b.dataset.step)})});
backButton.addEventListener("click",function(){
  var i=STEP_ORDER.indexOf(document.querySelector('.step-button[aria-current="step"]').dataset.step);
  if(i>0)guardedStep(STEP_ORDER[i-1]);
});
nextButton.addEventListener("click",function(){guardedStep(nextButton.dataset.target)});

/* ---- front-end graphical editor ---- */
var state={text:"",catalog:null,source:"repository",updatedAt:null};
var fiDirty=false;
var fiSource=document.getElementById("fi-source");
var fiText=document.getElementById("fi-text");
var fiStatus=document.getElementById("fi-status");
var fiSummary=document.getElementById("fi-summary");
var modal=document.getElementById("fi-modal");
var modalTitle=document.getElementById("fi-modal-title");
var modalBody=document.getElementById("fi-modal-body");
var modalRemove=document.getElementById("fi-modal-remove");
var editCtx=null;
function fiMsg(text,cls){fiStatus.className="dash-status"+(cls?" "+cls:"");fiStatus.textContent=text||""}
function summaryStats(s){
  fiSummary.textContent="";
  if(!s)return;
  [["地区",s.regions],["应用",s.apps],["规则",s.rules],["策略",s.strategies],["版本",s.version]].forEach(function(p){
    var box=el("div");box.className="dash-stat";
    box.appendChild(document.createTextNode(p[0]+" "));
    box.appendChild(el("b",p[1]==null?"—":String(p[1])));
    fiSummary.appendChild(box);
  });
}
function iconImg(url,cls,fallback){
  if(url)return '<img class="'+cls+'" src="'+esc(url)+'" alt="" decoding="async" onerror="this.hidden=true">';
  return '<span class="flag" aria-hidden="true">'+esc(fallback||"✳")+'</span>';
}
function renderApps(cat){
  var host=document.getElementById("fi-apps");host.textContent="";
  var apps=cat.apps||[];
  var count=document.getElementById("fi-count");
  if(count)count.textContent=apps.length+" 个应用 · 点击编辑";
  var groups={};
  apps.forEach(function(a){(groups[a.category||"其他服务"]=groups[a.category||"其他服务"]||[]).push(a)});
  Object.keys(groups).forEach(function(catName){
    var heading=el("div",catName);heading.className="category-heading";heading.setAttribute("data-category",catName);
    host.appendChild(heading);
    groups[catName].forEach(function(a){
      var card=document.createElement("div");
      card.className="app-card app-card--policy"+(a.entry?" app-card--entry":"");
      card.setAttribute("role","button");card.tabIndex=0;
      card.setAttribute("data-app-label",String(a.label||"").toLowerCase());
      card.setAttribute("aria-label","编辑 "+a.label);
      var icon=a.icon
        ? '<img src="'+esc(a.icon)+'" alt="" decoding="async" onerror="this.hidden=true">'
        : '<span class="app-card-icon-fallback">'+esc(String(a.label||"✳").slice(0,1))+'</span>';
      card.innerHTML='<span class="app-card-main"><span class="app-card-icon">'+icon+'</span>'+
        '<span class="app-card-label">'+esc(a.label)+'</span>'+
        '<span class="policy-current"><span class="policy-current-glyph" aria-hidden="true">⇢</span>'+
        '<span class="policy-current-label">'+esc(a.firstProxyDirect?"DIRECT":"节点选择")+'</span></span></span>'+
        (a.entry?'<span class="entry-tag">入口</span>':'')+
        '<span class="dash-edit-act">'+EDIT_SVG+'</span>';
      function open(){openEditor({kind:"app",item:a})}
      card.addEventListener("click",open);
      card.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();open()}});
      host.appendChild(card);
    });
  });
}
var appSearch=document.getElementById("app-search");
appSearch.addEventListener("input",function(){
  var q=appSearch.value.trim().toLowerCase();
  [].forEach.call(document.querySelectorAll("#fi-apps .app-card"),function(card){
    card.hidden=!!q&&(card.getAttribute("data-app-label")||"").indexOf(q)<0;
  });
});
function renderRegions(cat){
  var host=document.getElementById("fi-regions");host.textContent="";
  (cat.regions||[]).forEach(function(r){
    var bar=document.createElement("div");bar.className="region-bar";bar.setAttribute("role","button");bar.tabIndex=0;
    bar.setAttribute("aria-label","编辑地区 "+r.label);
    bar.innerHTML=iconImg(r.icon,"region-flag",r.flag)+'<span class="region-name">'+esc(r.label)+'</span>';
    var open=function(){openEditor({kind:"region",item:r})};
    bar.addEventListener("click",open);
    bar.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();open()}});
    host.appendChild(bar);
  });
}
function renderStrategies(cat){
  var host=document.getElementById("fi-strategies");host.textContent="";
  (cat.strategies||[]).forEach(function(s){
    var c=document.createElement("div");c.className="choice";c.setAttribute("role","button");c.tabIndex=0;
    c.setAttribute("aria-label","编辑出口策略 "+s.label);
    c.innerHTML=(s.icon?'<img class="choice-icon" src="'+esc(s.icon)+'" alt="" decoding="async" onerror="this.hidden=true">':'')+
      '<span><strong>'+esc(s.label)+'</strong><small>'+esc(s.description||s.name)+'</small></span>';
    var open=function(){openEditor({kind:"strategy",item:s})};
    c.addEventListener("click",open);
    c.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();open()}});
    host.appendChild(c);
  });
}
function renderRules(cat){
  var host=document.getElementById("fi-rules");host.textContent="";
  var mods=cat.providerModules||[];
  if(!mods.length){host.appendChild(el("span","muted","模板未声明规则模块（可在源码中查看）"));return}
  mods.forEach(function(m){
    var count=(cat.orderedRules||[]).filter(function(r){return r.module===m.module}).length;
    var c=document.createElement("div");c.className="choice";
    c.innerHTML='<span><strong>'+esc(m.name)+'</strong><small>'+esc(m.module)+' · '+count+' 条规则</small></span>';
    host.appendChild(c);
  });
}
function rowCard(title,subtitle,onOpen){
  var c=document.createElement("div");c.className="dash-row-card";
  c.setAttribute("role","button");c.tabIndex=0;
  var text=document.createElement("span");
  text.innerHTML="<strong>"+esc(title)+"</strong><small>"+esc(subtitle)+"</small>";
  c.appendChild(text);
  var edit=document.createElement("span");edit.className="dash-edit-act";edit.innerHTML=EDIT_SVG;c.appendChild(edit);
  c.addEventListener("click",onOpen);
  c.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();onOpen()}});
  return c;
}
function renderGeneral(cat){
  var host=document.getElementById("fi-general");host.textContent="";
  var g=(cat.editor&&cat.editor.general)||{};
  var open=function(){openEditor({kind:"general"})};
  host.appendChild(rowCard("端口与访问",
    "HTTP "+(g.port??"—")+" · SOCKS "+(g["socks-port"]??"—")+" · "+(g["allow-lan"]?"允许局域网":"仅本机"),open));
  host.appendChild(rowCard("运行模式","mode: "+(g.mode||"—")+" · 日志 "+(g["log-level"]||"—"),open));
  host.appendChild(rowCard("控制面板",(g["external-controller"]||"—")+" · 统一延迟 "+(g["unified-delay"]?"开":"关"),open));
}
function renderCore(cat){
  var host=document.getElementById("fi-core");host.textContent="";
  var groups=(cat.editor&&cat.editor.groups)||[];
  var names=[];
  Object.keys(cat.groups||{}).forEach(function(k){
    var n=cat.groups[k];
    if(typeof n==="string"&&groups.some(function(g){return g.name===n})&&names.indexOf(n)<0)names.push(n);
  });
  names.forEach(function(name){
    var g=groups.find(function(x){return x.name===name});
    host.appendChild(rowCard(name,g.type+" · "+(g.proxies?g.proxies.split(",").length+" 个出口":"无出口列表"),function(){
      openEditor({kind:"core-group",item:g});
    }));
  });
}
function renderFilters(cat){
  var host=document.getElementById("fi-filters");host.textContent="";
  var f=(cat.editor&&cat.editor.filters)||{};
  var items=[
    {id:"all",label:"节点净化 FilterAll",value:f.all||""},
    {id:"others",label:"其他地区 FilterOthers",value:f.others||""}
  ];
  Object.keys(f.regions||{}).forEach(function(id){
    items.push({id:id,label:"地区 "+id,value:f.regions[id]||""});
  });
  items.forEach(function(item){
    host.appendChild(rowCard(item.label,item.value?item.value.slice(0,42)+"…":"未设置",function(){
      openEditor({kind:"filter",item:item});
    }));
  });
}
function ruleParts(rule){
  var parts=String(rule||"").split(",");
  return {type:parts[0]||"GEOSITE",key:parts[1]||"",target:parts[2]||"",extra:parts.slice(3).join(",")};
}
function joinRule(parts){
  return [parts.type,parts.key,parts.target,parts.extra].filter(function(x){return x!== ""&&x!=null}).join(",");
}
function iconButton(symbol,title,onClick,disabled){
  var b=document.createElement("button");b.type="button";b.className="dash-icon-btn";
  b.textContent=symbol;b.title=title;b.setAttribute("aria-label",title);b.disabled=!!disabled;
  b.addEventListener("click",function(e){e.stopPropagation();onClick()});return b;
}
function renderRuleList(cat){
  var host=document.getElementById("fi-rule-list");host.textContent="";
  var rules=(cat.editor&&cat.editor.rules)||[];
  var enabled=rules.filter(function(r){return r.enabled}).length;
  var count=document.getElementById("fi-rule-count");
  if(count)count.textContent=enabled+" / "+rules.length+" 条启用 · 自上而下匹配";
  rules.forEach(function(r,index){
    var row=document.createElement("div");row.className="dash-rule-row"+(r.enabled?"":" off");
    var type=document.createElement("span");type.className="dash-rule-type";type.textContent=r.type;row.appendChild(type);
    var code=document.createElement("code");code.textContent=r.rule;code.title=r.rule;row.appendChild(code);
    row.appendChild(iconButton(r.enabled?"◉":"○",r.enabled?"停用":"启用",function(){
      sendOps([{kind:"rule",rule:r.rule,enabled:!r.enabled}]);
    }));
    row.appendChild(iconButton("✎","编辑规则",function(){openEditor({kind:"rule",item:r,index:index})}));
    var spacer=document.createElement("span");spacer.className="dash-spacer";row.appendChild(spacer);
    row.appendChild(iconButton("↑","上移",function(){sendOps([{kind:"rule-move",rule:r.rule,to:"up"}])}));
    row.appendChild(iconButton("↓","下移",function(){sendOps([{kind:"rule-move",rule:r.rule,to:"down"}])}));
    host.appendChild(row);
  });
}
function renderProviders(cat){
  var host=document.getElementById("fi-providers");host.textContent="";
  (cat.providerModules||[]).forEach(function(m){
    var v=m.value||{};
    host.appendChild(rowCard(m.name,[v.behavior||"—",(v.interval||"—")+"s",m.module||""].join(" · "),function(){
      openEditor({kind:"provider",item:m});
    }));
  });
}
function renderCatalog(cat,summary){
  if(!cat)return;
  state.catalog=cat;
  summaryStats(summary);
  renderGeneral(cat);renderApps(cat);renderRegions(cat);renderStrategies(cat);renderCore(cat);
  renderFilters(cat);renderRules(cat);renderRuleList(cat);renderProviders(cat);
}
function loadFront(){
  fiMsg("读取中…");
  fetch(CFG.frontInfoPath,{headers:{"Cache-Control":"no-store"}})
  .then(function(r){if(r.status===401)throw Error("登录已过期，请重新登录。");if(!r.ok)throw Error("读取失败 ("+r.status+")");return r.json()})
  .then(function(d){
    state.text=d.text||"";state.source=d.source;state.updatedAt=d.updatedAt||null;
    fiText.value=state.text;fiDirty=false;
    var draft=d.source==="draft";
    fiSource.textContent=draft?("草稿 · "+(d.updatedAt?stamp(d.updatedAt):"")):"仓库版本";
    fiSource.className="dash-badge "+(draft?"locked":"open");
    renderCatalog(d.catalog,d.summary);
    document.getElementById("service-settings").setAttribute("data-state","ready");
    fiMsg("");
  })
  .catch(function(e){fiMsg(e.message,"dash-err")});
}

/* ---- graphical edit modal ---- */
function field(label,control){
  var w=document.createElement("div");w.className="field";
  w.appendChild(el("label",label));w.appendChild(control);
  // Return the CONTROL, not its wrapper: every caller reads the value from
  // the field map when building patch ops. Returning the wrapper used to
  // make all graphical saves throw before the request was ever sent.
  control._wrapper=w;return control;
}
function appendField(control){modalBody.appendChild(control._wrapper||control)}
function input(value,type){var i=document.createElement("input");i.type=type||"text";i.value=value==null?"":value;return i}
function checkbox(value){var i=document.createElement("input");i.type="checkbox";i.checked=!!value;return i}
function textarea(value){var t=document.createElement("textarea");t.value=value||"";t.spellcheck=false;return t}
function select(options,value){
  var s=document.createElement("select");
  options.forEach(function(o){var op=document.createElement("option");op.value=o[0];op.textContent=o[1];if(o[0]===value)op.selected=true;s.appendChild(op)});
  return s;
}
function hint(text){var p=document.createElement("p");p.className="dash-hint";p.textContent=text;modalBody.appendChild(p)}
function groupProps(name){
  var groups=(state.catalog&&state.catalog.editor&&state.catalog.editor.groups)||[];
  return groups.find(function(g){return g.name===name})||{};
}
function closeModal(){modal.hidden=true;editCtx=null}
function openEditor(ctx){
  editCtx=ctx;
  var titles={app:"编辑应用",region:"编辑地区",strategy:"编辑出口策略","core-group":"编辑策略组",general:"基础设置",filter:"编辑节点筛选",rule:"编辑分流规则","add-rule":"添加分流规则",provider:"编辑规则源"};
  modalTitle.textContent=titles[ctx.kind]||"编辑";
  modalBody.textContent="";
  var item=ctx.item||{},f={},cat=state.catalog||{},g=groupProps(item.name);
  if(ctx.kind==="app"){
    hint("组名："+item.name+" · 改名需到高级 YAML 中操作，以免断开规则引用。");
    f.label=field("显示名称",input(item.label));appendField(f.label);
    f.icon=field("图标 URL",input(item.icon));appendField(f.icon);
    var cats=[];if(cat.apps)cat.apps.forEach(function(a){if(cats.indexOf(a.category)<0)cats.push(a.category)});
    if(cats.indexOf(item.category)<0)cats.unshift(item.category);
    f.category=field("分类",select(cats.map(function(c){return [c,c]}),item.category));appendField(f.category);
    f.exit=field("默认出口",select([["proxy","跟随代理 / 节点选择"],["DIRECT","直连 DIRECT"]],item.firstProxyDirect?"DIRECT":"proxy"));appendField(f.exit);
    f.proxies=field("出口顺序（逗号分隔）",textarea(g.proxies));appendField(f.proxies);
    if(item.rules&&item.rules.length)hint("关联规则："+item.rules.join("｜")+"（可在下方「分流规则」中修改）");
  }else if(ctx.kind==="region"){
    hint("组名："+(item.groupName||item.name));
    f.label=field("显示名称",input(item.label));appendField(f.label);
    f.flag=field("旗帜 Emoji",input(item.flag));appendField(f.flag);
    f.icon=field("图标 URL",input(item.icon));appendField(f.icon);
    f.filter=field("节点匹配正则",textarea(item.filter));appendField(f.filter);
  }else if(ctx.kind==="strategy"){
    hint("组名："+item.name+" · 类型："+(g.type||item.type));
    f.label=field("显示名称",input(item.label));appendField(f.label);
    f.description=field("说明",input(item.description));appendField(f.description);
    f.icon=field("图标 URL",input(item.icon));appendField(f.icon);
    if(g.url){f.url=field("测速 URL",input(g.url));appendField(f.url)}
    if(g.interval!=null&&g.interval!==""){f.interval=field("测速间隔（秒）",input(g.interval,"number"));appendField(f.interval)}
    if(g.tolerance!=null&&g.tolerance!==""){f.tolerance=field("延迟容差（毫秒）",input(g.tolerance,"number"));appendField(f.tolerance)}
    if(g.strategy){f.strategy=field("均衡策略",select([["consistent-hashing","consistent-hashing"],["round-robin","round-robin"]],g.strategy));appendField(f.strategy)}
    if(g.proxies){f.proxies=field("出口顺序（逗号分隔）",textarea(g.proxies));appendField(f.proxies)}
  }else if(ctx.kind==="core-group"){
    hint("组名："+g.name+" · 类型："+g.type);
    f.proxies=field("出口顺序（逗号分隔）",textarea(g.proxies));appendField(f.proxies);
    if(g.icon){f.icon=field("图标 URL",input(g.icon));appendField(f.icon)}
    if(g.url){f.url=field("测速 URL",input(g.url));appendField(f.url)}
    if(g.interval!=null&&g.interval!==""){f.interval=field("间隔（秒）",input(g.interval,"number"));appendField(f.interval)}
    if(g.tolerance!=null&&g.tolerance!==""){f.tolerance=field("容差（毫秒）",input(g.tolerance,"number"));appendField(f.tolerance)}
  }else if(ctx.kind==="general"){
    var cfg=(cat.editor&&cat.editor.general)||{};
    f.port=field("HTTP 代理端口",input(cfg.port,"number"));appendField(f.port);
    f.socksPort=field("SOCKS5 端口",input(cfg["socks-port"],"number"));appendField(f.socksPort);
    f.allowLan=field("允许局域网连接",checkbox(cfg["allow-lan"]));appendField(f.allowLan);
    f.mode=field("代理模式",select([["rule","rule · 规则分流"],["direct","direct · 全局直连"],["global","global · 全局代理"]],cfg.mode));appendField(f.mode);
    f.logLevel=field("日志级别",select([["debug","debug"],["info","info"],["warning","warning"],["error","error"],["silent","silent"]],cfg["log-level"]));appendField(f.logLevel);
    f.controller=field("REST API 监听地址",input(cfg["external-controller"]));appendField(f.controller);
    f.unifiedDelay=field("统一延迟测速",checkbox(cfg["unified-delay"]));appendField(f.unifiedDelay);
  }else if(ctx.kind==="filter"){
    hint(item.id==="all"?"FilterAll 用于节点净化；改动后请确认策略组 filter 是否仍符合预期。":item.id==="others"?"FilterOthers 排除六大地区与广告关键词，改动后建议同步重生成规则。":"该正则决定哪些节点进入对应地区组。");
    f.value=field("正则表达式",textarea(item.value));appendField(f.value);
  }else if(ctx.kind==="rule"||ctx.kind==="add-rule"){
    var p=ctx.kind==="add-rule"?{type:"GEOSITE",key:"",target:"",extra:""}:ruleParts(item.rule);
    if(ctx.kind==="rule")hint("原规则："+item.rule);
    f.type=field("规则类型",select([["GEOSITE","GEOSITE"],["RULE-SET","RULE-SET"],["GEOIP","GEOIP"],["DOMAIN","DOMAIN"],["IP","IP"],["MATCH","MATCH"]],p.type));appendField(f.type);
    f.key=field("匹配项（如 openai / cn / gfw）",input(p.key));appendField(f.key);
    var targets=["DIRECT","REJECT"],groups=(cat.editor&&cat.editor.groups)||[];
    groups.forEach(function(x){if(targets.indexOf(x.name)<0)targets.push(x.name)});
    if(p.target&&targets.indexOf(p.target)<0)targets.unshift(p.target);
    f.target=field("出口（策略组）",select(targets.map(function(t){return [t,t]}),p.target));appendField(f.target);
    f.extra=field("附加参数（如 no-resolve）",input(p.extra));appendField(f.extra);
    if(ctx.kind==="rule"){f.enabled=field("启用该规则",checkbox(item.enabled));appendField(f.enabled)}
  }else if(ctx.kind==="provider"){
    var v=item.value||{};
    hint("规则源名："+item.name+" · 修改后下一次拉取即生效。");
    f.url=field("规则源 URL",input(v.url));appendField(f.url);
    f.interval=field("更新间隔（秒）",input(v.interval,"number"));appendField(f.interval);
    f.behavior=field("行为",select([["domain","domain"],["classical","classical"],["ipcidr","ipcidr"]],v.behavior));appendField(f.behavior);
    f.format=field("格式",select([["yaml","yaml"],["text","text"]],v.format||"yaml"));appendField(f.format);
    f.type=field("类型",select([["http","http"],["file","file"]],v.type||"http"));appendField(f.type);
  }
  editCtx.fields=f;
  var removable={app:1,region:1,strategy:1,rule:1};
  modalRemove.hidden=!removable[ctx.kind];
  modalRemove.textContent=ctx.kind==="rule"?"移除规则":"移除";
  modal.hidden=false;
}
document.getElementById("fi-modal-close").addEventListener("click",closeModal);
document.getElementById("fi-modal-cancel").addEventListener("click",closeModal);
modal.addEventListener("click",function(e){if(e.target===modal)closeModal()});

function sendOps(ops,onDone){
  fiMsg("正在保存…");
  var btn=document.getElementById("fi-modal-apply");btn.disabled=true;
  fetch(CFG.frontInfoPath,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({ops:ops})})
  .then(function(r){return r.json().then(function(d){return {ok:r.ok,d:d}})})
  .then(function(res){
    if(!res.ok)throw Error(res.d.error||("保存失败 ("+res.d.error+")"));
    state.text=res.d.text||state.text;
    state.source="draft";state.updatedAt=res.d.updatedAt||null;
    renderCatalog(res.d.catalog,res.d.summary);
    fiSource.textContent="草稿 · "+(res.d.updatedAt?stamp(res.d.updatedAt):"刚刚");
    fiSource.className="dash-badge locked";
    fiMsg("已保存并生效","dash-ok");
    closeModal();if(onDone)onDone();
  })
  .catch(function(e){fiMsg(e.message,"dash-err")})
  .finally(function(){btn.disabled=false});
}
function proxyList(value){return String(value||"").replace(/[\\r\\n]+/g,", ").replace(/\\s*,\\s*/g,", ").replace(/^,|,$/g,"").trim()}
function buildOps(){
  var ctx=editCtx,f=ctx.fields,ops=[],item=ctx.item||{};
  var name=ctx.kind==="region"?(item.groupName||item.name):item.name;
  function props(fields){ops.push({kind:"group-props",name:name,fields:fields})}
  if(ctx.kind==="app"){
    ops.push({kind:"meta",name:name,fields:{label:f.label.value.trim(),category:f.category.value}});
    ops.push({kind:"icon",name:name,value:f.icon.value.trim()});
    ops.push({kind:"exit",name:name,value:f.exit.value});
    var proxies=proxyList(f.proxies.value);
    if(proxies)props({proxies:proxies});
  }else if(ctx.kind==="region"){
    ops.push({kind:"meta",name:name,fields:{label:f.label.value.trim(),flag:f.flag.value.trim()}});
    ops.push({kind:"icon",name:name,value:f.icon.value.trim()});
    ops.push({kind:"filter",id:item.id,value:f.filter.value.trim()});
  }else if(ctx.kind==="strategy"||ctx.kind==="core-group"){
    if(f.label)ops.push({kind:"meta",name:name,fields:{label:f.label.value.trim(),description:f.description.value.trim()}});
    if(f.icon)ops.push({kind:"icon",name:name,value:f.icon.value.trim()});
    var fields={};
    if(f.proxies&&proxyList(f.proxies.value))fields.proxies=proxyList(f.proxies.value);
    if(f.url&&f.url.value.trim())fields.url=f.url.value.trim();
    if(f.interval&&Number(f.interval.value)>0)fields.interval=Number(f.interval.value);
    if(f.tolerance&&Number(f.tolerance.value)>0)fields.tolerance=Number(f.tolerance.value);
    if(f.strategy)fields.strategy=f.strategy.value;
    if(Object.keys(fields).length)props(fields);
  }else if(ctx.kind==="general"){
    var port=Number(f.port.value),socks=Number(f.socksPort.value);
    if(!(port>0&&port<65536)){fiMsg("HTTP 端口需在 1–65535 之间","dash-err");return null}
    if(!(socks>0&&socks<65536)){fiMsg("SOCKS5 端口需在 1–65535 之间","dash-err");return null}
    ops.push({kind:"general",fields:{
      port:port,"socks-port":socks,"allow-lan":f.allowLan.checked,
      mode:f.mode.value,"log-level":f.logLevel.value,
      "external-controller":f.controller.value.trim(),"unified-delay":f.unifiedDelay.checked
    }});
  }else if(ctx.kind==="filter"){
    if(!f.value.value.trim()){fiMsg("正则不能为空","dash-err");return null}
    ops.push({kind:"filter",id:item.id,value:f.value.value.trim()});
  }else if(ctx.kind==="rule"||ctx.kind==="add-rule"){
    var type=f.type.value,key=f.key.value.trim(),target=f.target.value.trim(),extra=f.extra.value.trim();
    if(type!=="MATCH"&&(!key||!target)){fiMsg("规则需要匹配项与出口","dash-err");return null}
    var value=[type,key,target,extra].filter(function(x){return x!==""}).join(",");
    if(ctx.kind==="add-rule")ops.push({kind:"rule-add",rule:value});
    else{
      if(!f.enabled.checked)ops.push({kind:"rule",rule:item.rule,enabled:false});
      else if(!item.enabled)ops.push({kind:"rule",rule:item.rule,enabled:true});
      if(value!==item.rule)ops.push({kind:"rule-text",rule:item.rule,value:value});
    }
  }else if(ctx.kind==="provider"){
    var fields2={url:f.url.value.trim(),interval:Number(f.interval.value)||28800,behavior:f.behavior.value,format:f.format.value,type:f.type.value};
    if(!fields2.url){fiMsg("请填写规则源 URL","dash-err");return null}
    ops.push({kind:"provider",name:item.name,fields:fields2});
  }
  return ops;
}
document.getElementById("fi-modal-apply").addEventListener("click",function(){
  if(!editCtx||editCtx.kind==="add")return;
  var ops=buildOps();if(ops&&ops.length)sendOps(ops);
});
modalRemove.addEventListener("click",function(){
  if(!editCtx)return;
  if(editCtx.kind==="add"){closeModal();return}
  if(editCtx.kind==="rule"){
    if(!window.confirm("停用规则 “"+editCtx.item.rule+"”？"))return;
    sendOps([{kind:"rule",rule:editCtx.item.rule,enabled:false}]);return;
  }
  var name=editCtx.kind==="region"?(editCtx.item.groupName||editCtx.item.name):editCtx.item.name;
  if(!window.confirm("从模板中移除 “"+name+"”？相关规则会一并注释掉。"))return;
  sendOps([{kind:"remove",name:name}]);
});
document.getElementById("add-rule").addEventListener("click",function(){
  showStep("front");openEditor({kind:"add-rule"});
});
document.getElementById("add-app").addEventListener("click",function(){
  showStep("front");
  modalTitle.textContent="添加应用";modalBody.textContent="";
  var cats=[];if(state.catalog)state.catalog.apps.forEach(function(a){if(cats.indexOf(a.category)<0)cats.push(a.category)});
  if(!cats.length)cats=["其他服务"];
  var f={
    name:field("组名（含 Emoji，如 🧩 Notion）",input("🧩 ")),
    label:field("显示名称",input("")),
    icon:field("图标 URL",input("")),
    category:field("分类",select(cats.map(function(c){return [c,c]}),cats[0])),
    rule:field("分流规则（如 GEOSITE,notion,🧩 Notion，可留空）",input(""))
  };
  Object.keys(f).forEach(function(k){appendField(f[k])});
  editCtx={kind:"add",fields:f};modalRemove.hidden=true;modal.hidden=false;
});
// The generic apply handler above handles app/region/strategy; add-app needs its own op.
document.getElementById("fi-modal-apply").addEventListener("click",function(){
  if(!editCtx||editCtx.kind!=="add")return;
  var f=editCtx.fields;
  var name=f.name.value.trim();
  if(!name){fiMsg("请填写组名","dash-err");return}
  sendOps([{kind:"add-app",name:name,label:f.label.value.trim(),category:f.category.value,icon:f.icon.value.trim(),rule:f.rule.value.trim()}]);
},true);

fiText.addEventListener("input",function(){fiDirty=true});
document.getElementById("fi-reload").addEventListener("click",function(){loadFront()});
document.getElementById("fi-reset").addEventListener("click",function(){
  if(!window.confirm("放弃当前草稿，恢复为仓库中的版本？"))return;
  fiMsg("正在放弃…");
  fetch(CFG.frontInfoPath,{method:"DELETE"})
  .then(function(r){if(!r.ok)throw Error("操作失败 ("+r.status+")");return loadFront()})
  .then(function(){fiMsg("已恢复仓库版本","dash-ok")})
  .catch(function(e){fiMsg(e.message,"dash-err")});
});
document.getElementById("fi-save").addEventListener("click",function(){
  // textarea normalises CRLF to LF on read; the template ships as CRLF, so
  // restore it before saving or the derived version hash would differ from
  // the committed file and raise a false "version mismatch" in the frontend.
  var text=fiText.value.replace(/\\r\\n/g,"\\n").replace(/\\n/g,"\\r\\n");
  if(!text.trim()){fiMsg("模板内容不能为空","dash-err");return}
  fiMsg("校验并保存中…");
  var btn=this;btn.disabled=true;
  fetch(CFG.frontInfoPath,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:text})})
  .then(function(r){return r.json().then(function(d){return {ok:r.ok,d:d}})})
  .then(function(res){
    if(!res.ok)throw Error(res.d.error||("保存失败"));
    fiMsg("已保存并生效","dash-ok");return loadFront();
  })
  .catch(function(e){fiMsg(e.message,"dash-err")})
  .finally(function(){btn.disabled=false});
});

/* ---- subscription links ---- */
var lifetimes={"3h":"3 小时","7d":"7 天","30d":"30 天","forever":"永久"};
var body=document.getElementById("body");
var status=document.getElementById("status");
function validity(row){
  if(row.lifetime&&lifetimes[row.lifetime])return lifetimes[row.lifetime];
  if(row.lifetime==="forever"||(!row.expiresAt&&row.createdAt))return "永久";
  if(row.createdAt&&row.expiresAt){var days=Math.round((new Date(row.expiresAt)-new Date(row.createdAt))/86400000);return days>0?days+" 天":"—"}
  return "—";
}
function linkFor(row){
  if(row.hasPwd&&!row.pwd)return "旧配置：当时未记录口令，无法重建链接（删除后可重建）";
  var parts=CFG.linkBase+"?token="+encodeURIComponent(row.token);
  if(row.hasPwd)parts+="&pwd="+encodeURIComponent(row.pwd);
  return parts;
}
function render(rows){
  body.textContent="";
  if(!rows.length){
    body.className="dash-msg";
    var empty=el("div");empty.className="dash-empty";
    empty.appendChild(el("strong","还没有生成任何配置"));
    var tip=el("p");tip.appendChild(document.createTextNode("配置由订阅工坊生成。"));
    var a=el("a","打开配置工坊");a.href="../";tip.appendChild(document.createTextNode(" "));tip.appendChild(a);
    empty.appendChild(tip);body.appendChild(empty);return;
  }
  body.className="";
  var table=el("table");table.className="dash-table";
  var head=el("thead"),hr=el("tr");
  ["配置名称","订阅链接","访问","生成时间","到期时间","有效期","操作"].forEach(function(h){hr.appendChild(el("th",h))});
  head.appendChild(hr);table.appendChild(head);
  var tb=el("tbody");
  rows.forEach(function(row){
    var tr=el("tr");tr.appendChild(el("td",row.token));
    // Put the link right after the name so it is visible without scrolling a
    // wide table sideways; the full URL stays available as small text/copy.
    var link=el("td"),url=linkFor(row),wrap=el("span");
    wrap.className="dash-link";
    if(row.hasPwd&&!row.pwd){
      // Legacy record: no password was stored, so no openable link exists.
      wrap.appendChild(el("code",url));
    }else{
      var main=el("span");main.className="dash-link-main";
      var a=el("a");a.href=url;a.target="_blank";a.rel="noopener noreferrer";
      a.title="在新标签打开订阅内容";a.appendChild(el("span","打开订阅内容"));
      main.appendChild(a);main.appendChild(copyButton(url));
      wrap.appendChild(main);
      var preview=el("code",url);preview.className="dash-link-url";preview.title=url;
      wrap.appendChild(preview);
    }
    link.appendChild(wrap);tr.appendChild(link);
    var access=el("td"),badge=el("span",row.hasPwd?"需口令":"公开");
    badge.className="dash-badge "+(row.hasPwd?"locked":"open");
    access.appendChild(badge);tr.appendChild(access);
    var created=el("td",stamp(row.createdAt));created.className="nowrap";tr.appendChild(created);
    var expires=el("td",row.expiresAt?stamp(row.expiresAt):"永久");expires.className="nowrap";tr.appendChild(expires);
    tr.appendChild(el("td",validity(row)));
    var act=el("td");act.className="actions";
    var del=el("button","删除");del.className="danger button secondary";del.type="button";
    del.addEventListener("click",function(){
      if(!window.confirm("确定删除配置 “"+row.token+"”？此操作不可撤销。"))return;
      del.disabled=true;
      fetch(CFG.adminPath,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:row.id})})
      .then(function(r){if(!r.ok)throw Error("删除失败 ("+r.status+")");return r.json()})
      .then(function(){load()})
      .catch(function(e){status.className="dash-status dash-err";status.textContent=e.message;del.disabled=false});
    });
    act.appendChild(del);tr.appendChild(act);tb.appendChild(tr);
  });
  table.appendChild(tb);body.appendChild(table);
}
function load(){
  status.className="dash-status";status.textContent="加载中…";
  fetch(CFG.adminPath,{headers:{"Cache-Control":"no-store"}})
  .then(function(r){if(r.status===401)throw Error("登录已过期，请重新登录。");if(!r.ok)throw Error("读取失败 ("+r.status+")");return r.json()})
  .then(function(d){status.textContent="共 "+(d.configs||[]).length+" 条配置";render(d.configs||[])})
  .catch(function(e){body.className="dash-msg dash-err";body.textContent=e.message;status.textContent=""});
}
document.getElementById("refresh").addEventListener("click",load);
document.getElementById("logout").addEventListener("click",function(){
  fetch("/config-builder/dashboard/logout",{method:"POST"}).then(function(){location.href="/config-builder/dashboard"});
});
showStep("general");
load();
loadFront();
})();
</script>
</body>
</html>`;
}
