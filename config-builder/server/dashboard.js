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

function styleSheet() {
  try {
    const url = new URL("../src/styles.css", import.meta.url);
    return readFileSync(url, "utf8").replace(/^\uFEFF?@charset[^;]+;\s*/i, "");
  } catch {
    return "";
  }
}

// Dashboard-only rules. They use only the builder's CSS variables so the look
// stays identical: step rail, stat chips, card edit affordance, modal, and the
// subscription table.
const DASH_ONLY = `
body{padding-bottom:40px}
.brand-logo-fallback{width:40px;height:40px;border-radius:11px;flex:none;display:grid;place-items:center;background:linear-gradient(145deg,#7fd4ff,#0a63b8);box-shadow:inset 0 1px 0 #ffffff66}
.brand-logo-fallback::after{content:"✳";color:#fff;font-size:1.15rem}
.step-button[aria-current="step"]{border-color:var(--selected-line);background:var(--tint)}
.dash-stat{padding:7px 13px;background:var(--soft);border:1px solid var(--line);border-radius:14px;font-size:.75rem;color:var(--muted);display:inline-flex;align-items:baseline;gap:6px;transition:transform 180ms var(--ease),border-color 180ms var(--ease)}
.dash-stat:hover{transform:translateY(-2px);border-color:var(--selected-line)}
.dash-stat b{color:var(--ink);font-weight:650;font-size:.9375rem}
.dash-section-title{margin:26px 0 2px;font-size:.75rem;font-weight:600;letter-spacing:.12em;color:var(--muted);text-transform:uppercase}
.dash-section-title:first-child{margin-top:4px}
.dash-editor .app-card{cursor:pointer}
.dash-editor .app-card:hover{border-color:var(--selected-line);background:var(--tint)}
.dash-editor .app-card label{cursor:pointer}
.dash-edit-act{margin-left:auto;flex:0 0 auto;width:24px;height:24px;display:grid;place-items:center;border:1px solid var(--line);border-radius:7px;color:var(--muted);background:var(--soft)}
.dash-editor .app-card:hover .dash-edit-act{color:var(--accent);border-color:var(--selected-line)}
.dash-edit-act svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.dash-editor .region-bar,.dash-editor .choice{cursor:pointer}
.dash-editor .region-bar:hover,.dash-editor .choice:hover{border-color:var(--selected-line);background:var(--tint)}
.dash-editor .choice{min-height:0;padding:14px 16px}
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
.dash-link{display:inline-flex;align-items:center;gap:8px;max-width:100%}
.dash-link code{word-break:break-all}
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
(()=>{try{document.documentElement.dataset.theme=localStorage.getItem("yggdrasil:config-builder:theme")==="light"?"light":"dark"}catch{document.documentElement.dataset.theme="dark"}})();
</script>
</head>
<body>
<header class="site-header">
  <div class="brand">
    <img class="brand-logo" src="/assets/favicon.png" alt="" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">
    <span class="brand-logo-fallback" style="display:none" aria-hidden="true"></span>
    <span>Yggdrasil<small>config dashboard</small></span>
  </div>
  <div class="header-links">
    <span class="engine"><i aria-hidden="true"></i>服务在线</span>
    <div class="appearance-tools" aria-label="外观设置">
      <button class="theme-toggle button secondary" id="theme-toggle" type="button" aria-label="切换到浅色模式" title="切换主题"><span aria-hidden="true" id="theme-toggle-icon" class="theme-icon"><svg viewBox="0 0 24 24" class="theme-icon-svg"><g class="theme-icon-sun"><circle cx="12" cy="12" r="4.1"/><path class="theme-icon-rays" d="M12 2.4v2.3M12 19.3v2.3M2.4 12h2.3M19.3 12h2.3M5.2 5.2 6.8 6.8M17.2 17.2 18.8 18.8M5.2 18.8 6.8 17.2M17.2 6.8 18.8 5.2"/></g><path class="theme-icon-moon" d="M20.3 14.9A8.5 8.5 0 0 1 9.1 3.7a8.5 8.5 0 1 0 11.2 11.2Z"/></svg></span><span id="theme-toggle-label">浅色</span></button>
    </div>
    <button class="button secondary" id="logout" type="button">退出登录</button>
  </div>
</header>

<main class="layout">
  <section class="caustic-hero" aria-label="配置管理">
    <canvas id="caustic-water" class="caustic-fallback" aria-hidden="true"></canvas>
    <div class="caustic-meta"><span><i aria-hidden="true"></i>RATATOSKR · CONFIG STUDIO</span><span>自由生长，生生不息。</span></div>
    <div class="caustic-copy"><div><p>管理订阅链接 · 编辑驱动整个配置工坊的信息</p><h2>配置管理</h2></div></div>
  </section>

  <aside class="journey" aria-label="工具导航">
    <div class="eyebrow">OWNER CONSOLE</div>
    <h1>控制台</h1>
    <p class="intro">配置工坊由一份模板生长而来。<br/>在这里打理它。</p>
    <nav id="steps" aria-label="工具步骤">
      <button class="step-button" data-step="front" aria-current="step" type="button"><span class="step-number">1</span><span><strong>前端配置</strong><small>应用 · 地区 · 出口 · 规则</small></span></button>
      <button class="step-button" data-step="configs" type="button"><span class="step-number">2</span><span><strong>订阅链接</strong><small>生成与访问权限</small></span></button>
    </nav>
    <div class="journey-note"><span aria-hidden="true">✳</span><div><strong>一处修改，处处生长。</strong><p>保存后立即生效，并由定时任务写回仓库。</p></div></div>
  </aside>

  <section class="workspace" id="workspace" tabindex="-1" aria-label="配置面板">
    <div class="panel-top">
      <span id="step-caption" class="eyebrow">FRONTEND CONFIGURATION</span>
      <span class="chip">RATATOSKR</span>
      <div class="panel-actions">
        <button class="button secondary" id="fi-reload" type="button" title="重新载入">↻ 重新载入</button>
        <button class="button secondary" id="fi-reset" type="button">放弃草稿</button>
      </div>
    </div>
    <div class="service-status" id="service-settings" data-state="ready" role="status">
      <span class="status-dot" aria-hidden="true"></span>
      <span id="fi-source">读取中…</span>
    </div>

    <div id="panel-front">
      <div class="dash-summary" id="fi-summary"></div>
      <h3 class="dash-section-title">应用分流</h3>
      <div class="app-grid" id="fi-apps"><span class="muted">载入中…</span></div>
      <h3 class="dash-section-title">地区节点</h3>
      <div class="region-bars" id="fi-regions"><span class="muted">载入中…</span></div>
      <h3 class="dash-section-title">出口策略</h3>
      <div class="choice-grid" id="fi-strategies"><span class="muted">载入中…</span></div>
      <h3 class="dash-section-title">规则模块</h3>
      <div class="choice-grid" id="fi-rules"><span class="muted">载入中…</span></div>
      <details class="dash-source">
        <summary>高级 · 直接编辑 YAML 模板</summary>
        <textarea id="fi-text" spellcheck="false" aria-label="YAML 模板内容" placeholder="正在载入模板…"></textarea>
        <div class="panel-actions" style="margin-top:12px">
          <button class="button primary" id="fi-save" type="button">应用源码</button>
          <span class="dash-status dash-ok" id="fi-status" style="margin:0"></span>
        </div>
      </details>
    </div>

    <div id="panel-configs" hidden>
      <div class="service-status" data-state="ready" role="status"><span class="status-dot" aria-hidden="true"></span><span id="status"></span></div>
      <h3 class="dash-section-title">已生成的配置</h3>
      <div class="dash-scroll"><div class="dash-msg" id="body">正在加载…</div></div>
    </div>

    <footer class="wizard-footer">
      <button class="button secondary" id="add-app" type="button">＋ 添加应用</button>
      <span id="progress-note" class="muted"></span>
      <span style="flex:1"></span>
      <button class="button primary" id="refresh" type="button">刷新列表</button>
    </footer>
  </section>
</main>

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

/* ---- step navigation ---- */
var panelFront=document.getElementById("panel-front");
var panelConfigs=document.getElementById("panel-configs");
var caption=document.getElementById("step-caption");
var stepButtons=[].slice.call(document.querySelectorAll(".step-button"));
function showStep(which){
  var front=which==="front";
  panelFront.hidden=!front;panelConfigs.hidden=front;
  stepButtons.forEach(function(b){if(b.dataset.step===which)b.setAttribute("aria-current","step");else b.removeAttribute("aria-current")});
  caption.textContent=front?"FRONTEND CONFIGURATION":"SUBSCRIPTION LINKS";
  if(!front)load();
}
window.addEventListener("beforeunload",function(e){
  if(!fiDirty)return;
  e.preventDefault();e.returnValue="";
});
stepButtons.forEach(function(b){b.addEventListener("click",function(){
  var current=document.querySelector('.step-button[aria-current="step"]');
  if(current===b)return;
  if(fiDirty&&!window.confirm("前端模板有未保存的修改，切换后将丢失。确定继续？"))return;
  showStep(b.dataset.step)
})});

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
  var groups={};
  (cat.apps||[]).forEach(function(a){(groups[a.category||"其他服务"]=groups[a.category||"其他服务"]||[]).push(a)});
  Object.keys(groups).forEach(function(catName){
    var heading=el("div",catName);heading.className="category-heading";heading.setAttribute("data-category",catName);
    host.appendChild(heading);
    groups[catName].forEach(function(a){
      var card=document.createElement("div");
      card.className="app-card"+(a.entry?" app-card--entry":"");
      card.setAttribute("role","button");card.tabIndex=0;
      card.setAttribute("aria-label","编辑 "+a.label);
      card.innerHTML='<label>'+iconImg(a.icon,"",a.label.slice(0,1))+'<span>'+esc(a.label)+'</span></label>'+
        (a.entry?'<span class="entry-tag">入口</span>':'')+
        '<span class="dash-edit-act">'+EDIT_SVG+'</span>';
      function open(){openEditor({kind:"app",item:a})}
      card.addEventListener("click",open);
      card.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();open()}});
      host.appendChild(card);
    });
  });
}
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
function renderCatalog(cat,summary){
  if(!cat)return;
  state.catalog=cat;
  summaryStats(summary);
  renderApps(cat);renderRegions(cat);renderStrategies(cat);renderRules(cat);
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
  w.appendChild(el("label",label));w.appendChild(control);return w;
}
function input(value,type){var i=document.createElement("input");i.type=type||"text";i.value=value||"";return i}
function select(options,value){
  var s=document.createElement("select");
  options.forEach(function(o){var op=document.createElement("option");op.value=o[0];op.textContent=o[1];if(o[0]===value)op.selected=true;s.appendChild(op)});
  return s;
}
function closeModal(){modal.hidden=true;editCtx=null}
function openEditor(ctx){
  editCtx=ctx;modalTitle.textContent=({app:"编辑应用",region:"编辑地区",strategy:"编辑出口策略"})[ctx.kind]||"编辑";
  modalBody.textContent="";
  var item=ctx.item,f={};
  if(ctx.kind==="app"){
    f.label=field("显示名称",input(item.label));modalBody.appendChild(f.label);
    f.icon=field("图标 URL",input(item.icon));modalBody.appendChild(f.icon);
    var cats=[];if(state.catalog)state.catalog.apps.forEach(function(a){if(cats.indexOf(a.category)<0)cats.push(a.category)});
    if(cats.indexOf(item.category)<0)cats.unshift(item.category);
    f.category=field("分类",select(cats.map(function(c){return [c,c]}),item.category));modalBody.appendChild(f.category);
    f.exit=field("默认出口",select([["proxy","跟随代理 / 节点选择"],["DIRECT","直连 DIRECT"]],item.firstProxyDirect?"DIRECT":"proxy"));modalBody.appendChild(f.exit);
  }else if(ctx.kind==="region"){
    f.label=field("显示名称",input(item.label));modalBody.appendChild(f.label);
    f.flag=field("旗帜 Emoji",input(item.flag));modalBody.appendChild(f.flag);
    f.icon=field("图标 URL",input(item.icon));modalBody.appendChild(f.icon);
  }else if(ctx.kind==="strategy"){
    f.label=field("显示名称",input(item.label));modalBody.appendChild(f.label);
    f.description=field("说明",input(item.description));modalBody.appendChild(f.description);
    f.icon=field("图标 URL",input(item.icon));modalBody.appendChild(f.icon);
  }
  editCtx.fields=f;
  modalRemove.hidden=false;
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
document.getElementById("fi-modal-apply").addEventListener("click",function(){
  if(!editCtx||editCtx.kind==="add")return;
  var f=editCtx.fields,ops=[],item=editCtx.item;
  var name=editCtx.kind==="region"?(item.groupName||item.name):item.name;
  if(editCtx.kind==="app"){
    ops.push({kind:"meta",name:name,fields:{label:f.label.value.trim(),category:f.category.value}});
    ops.push({kind:"icon",name:name,value:f.icon.value.trim()});
    ops.push({kind:"exit",name:name,value:f.exit.value});
  }else if(editCtx.kind==="region"){
    ops.push({kind:"meta",name:name,fields:{label:f.label.value.trim(),flag:f.flag.value.trim()}});
    ops.push({kind:"icon",name:name,value:f.icon.value.trim()});
  }else if(editCtx.kind==="strategy"){
    ops.push({kind:"meta",name:name,fields:{label:f.label.value.trim(),description:f.description.value.trim()}});
    ops.push({kind:"icon",name:name,value:f.icon.value.trim()});
  }
  sendOps(ops);
});
modalRemove.addEventListener("click",function(){
  if(!editCtx)return;
  if(editCtx.kind==="add"){closeModal();return}
  var name=editCtx.kind==="region"?(editCtx.item.groupName||editCtx.item.name):editCtx.item.name;
  if(!window.confirm("从模板中移除 “"+name+"”？相关规则会一并注释掉。"))return;
  sendOps([{kind:"remove",name:name}]);
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
  Object.keys(f).forEach(function(k){modalBody.appendChild(f[k])});
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
  ["配置名称","访问","生成时间","到期时间","有效期","订阅链接","操作"].forEach(function(h){hr.appendChild(el("th",h))});
  head.appendChild(hr);table.appendChild(head);
  var tb=el("tbody");
  rows.forEach(function(row){
    var tr=el("tr");tr.appendChild(el("td",row.token));
    var access=el("td"),badge=el("span",row.hasPwd?"需口令":"公开");
    badge.className="dash-badge "+(row.hasPwd?"locked":"open");
    access.appendChild(badge);tr.appendChild(access);
    var created=el("td",stamp(row.createdAt));created.className="nowrap";tr.appendChild(created);
    var expires=el("td",row.expiresAt?stamp(row.expiresAt):"永久");expires.className="nowrap";tr.appendChild(expires);
    tr.appendChild(el("td",validity(row)));
    var link=el("td"),url=linkFor(row),wrap=el("span"),code=el("code",url);
    wrap.className="dash-link";wrap.appendChild(code);
    if(!(row.hasPwd&&!row.pwd))wrap.appendChild(copyButton(url));
    link.appendChild(wrap);tr.appendChild(link);
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
load();
loadFront();
})();
</script>
</body>
</html>`;
}
