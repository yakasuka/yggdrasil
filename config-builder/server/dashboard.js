// Self-contained owner dashboard served by the backend at
// /config-builder/dashboard. It carries no secrets or node data: credentials
// are held in an HttpOnly cookie by the Pages Function, and all config data is
// fetched from the admin API at runtime.
//
// Two tools live here: the subscription-link manager (list/delete) and the
// front-end configuration editor, which edits the Ratatoskr YAML template the
// whole configurator is derived from.
//
// The visual language is the configurator's own stylesheet, loaded at module
// init from src/styles.css (see styleSheet()). Appending a small set of
// dashboard-only rules that reuse the same CSS variables keeps the two pages
// visually identical without duplicating 45 KB of design tokens by hand.

import { readFileSync } from "node:fs";

// The configurator stylesheet is the single source of truth for the palette,
// glass surfaces, hero, buttons and motion. Reading it from disk means the
// dashboard can never drift from the builder after a redesign. The CSP allows
// `style-src 'unsafe-inline'`, so an injected <style> is fine.
function styleSheet() {
  try {
    const url = new URL("../src/styles.css", import.meta.url);
    return readFileSync(url, "utf8").replace(/^\uFEFF?@charset[^;]+;\s*/i, "");
  } catch {
    return ""; // Layout still works via the fallback rules below.
  }
}

// Rules the builder does not need (subscription table, tab strip, YAML editor)
// but expressed only with the builder's variables so the look stays identical.
const DASH_ONLY = `
body{padding-bottom:64px}
.dash-main{max-width:1240px;margin:auto;padding:24px 24px 0}
.dash-tabs{display:inline-flex;gap:4px;padding:4px;border:1px solid var(--line);border-radius:99px;background:var(--soft)}
.dash-tabs button{border:0;background:transparent;padding:9px 18px;border-radius:99px;color:var(--muted);font-size:.8125rem;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:background 180ms var(--ease),color 180ms var(--ease)}
.dash-tabs button:hover{background:transparent;color:var(--ink)}
.dash-tabs button[aria-selected="true"]{background:var(--surface);color:var(--ink);box-shadow:0 1px 3px #0002}
.dash-tabs button svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.dash-bar{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin:0 0 18px}
.dash-status{color:var(--muted);font-size:.8125rem}
.dash-hero-copy p{margin:0 0 12px;font-size:.8125rem;letter-spacing:.06em;color:#d0e8e3}
.dash-hero-copy h2{margin:0;font-size:clamp(1.625rem,3vw,2.5rem);font-weight:550;letter-spacing:-.045em;line-height:1.3;text-wrap:balance}
.dash-section{margin:0 0 18px}
.dash-section .panel-description{margin-bottom:0}
.dash-card{border:1px solid var(--line);border-radius:24px;background:var(--surface);box-shadow:0 4px 24px #00000003;overflow:hidden}
.dash-scroll{overflow-x:auto}
.dash-table{width:100%;border-collapse:collapse;min-width:880px}
.dash-table th,.dash-table td{text-align:left;padding:13px 16px;border-bottom:1px solid var(--line);vertical-align:top;font-size:.8125rem}
.dash-table th{color:var(--muted);font-weight:500;background:var(--soft);white-space:nowrap}
.dash-table tr:last-child td{border-bottom:0}
.dash-table tbody tr{transition:background 160ms var(--ease)}
.dash-table tbody tr:hover{background:var(--tint)}
.dash-table code{font:12px ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--accent);word-break:break-all}
.dash-table .nowrap{white-space:nowrap}
.dash-table .actions{white-space:nowrap}
.dash-msg{padding:52px 28px;text-align:center;color:var(--muted)}
.dash-badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:.6875rem;border:1px solid var(--line);background:var(--soft);color:var(--muted)}
.dash-badge.locked{color:var(--warning);border-color:var(--warning-bg);background:var(--warning-bg)}
.dash-badge.open{color:var(--muted)}
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
.dash-err{color:var(--danger)}
.dash-ok{color:var(--ok)}
button.danger{color:var(--danger);border-color:var(--danger-bg)}
.dash-editor{padding:26px 30px}
.dash-summary{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 18px}
.dash-stat{padding:8px 14px;background:var(--soft);border:1px solid var(--line);border-radius:14px;font-size:.75rem;color:var(--muted);display:inline-flex;align-items:baseline;gap:6px;transition:transform 180ms var(--ease),border-color 180ms var(--ease)}
.dash-stat:hover{transform:translateY(-2px);border-color:var(--selected-line)}
.dash-stat b{color:var(--ink);font-weight:650;font-size:.9375rem}
.dash-editor textarea{display:block;width:100%;min-height:460px;resize:vertical;padding:16px 18px;border:1px solid var(--line);border-radius:16px;background:var(--input);color:var(--ink);font:12.5px/1.7 ui-monospace,SFMono-Regular,Consolas,monospace;outline:none;tab-size:2;transition:border-color 180ms var(--ease),box-shadow 180ms var(--ease)}
.dash-editor textarea:focus{border-color:var(--selected-line);box-shadow:0 0 0 3px var(--tint)}
.dash-editor .dash-bar{margin:16px 0 0}
.dash-hint{margin:16px 0 0;font-size:.75rem;color:var(--muted);line-height:1.7}
.dash-hint code{color:var(--accent)}
@media(max-width:720px){.dash-main{padding:18px 14px 0}.dash-hero-copy{left:24px;right:24px}.site-header{padding-inline:14px}}
`;

// Everything dynamic is injected through a JSON-serialised config object and
// rendered with textContent, so a configuration name can never inject markup.
export function dashboardHTML({
  linkBase = "",
  adminPath = "/api/admin/configs",
  frontInfoPath = "/api/admin/frontinfo",
  catalogPath = "/api/catalog",
} = {}) {
  // JSON.stringify alone does not escape '<', so an untrusted link base could
  // close the inline <script> tag. Encode angle brackets as JSON unicode
  // escapes, which parse back to the same string inside JavaScript.
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
</head>
<body>
<script>
(function(){try{var t=localStorage.getItem("yggdrasil:config-builder:theme");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}})();
</script>
<header class="site-header">
  <div class="brand"><span class="brand-mark" aria-hidden="true"></span><span>Yggdrasil<small>config dashboard</small></span></div>
  <div class="header-links">
    <span class="engine"><i aria-hidden="true"></i>服务在线</span>
    <div class="appearance-tools" aria-label="外观设置">
      <button class="theme-toggle button secondary" id="theme-toggle" type="button" aria-label="切换到浅色模式" title="切换主题"><span aria-hidden="true" id="theme-toggle-icon" class="theme-icon"><svg viewBox="0 0 24 24" class="theme-icon-svg"><g class="theme-icon-sun"><circle cx="12" cy="12" r="4.1"/><path class="theme-icon-rays" d="M12 2.4v2.3M12 19.3v2.3M2.4 12h2.3M19.3 12h2.3M5.2 5.2 6.8 6.8M17.2 17.2 18.8 18.8M5.2 18.8 6.8 17.2M17.2 6.8 18.8 5.2"/></g><path class="theme-icon-moon" d="M20.3 14.9A8.5 8.5 0 0 1 9.1 3.7a8.5 8.5 0 1 0 11.2 11.2Z"/></svg></span><span id="theme-toggle-label">浅色</span></button>
    </div>
    <button class="button secondary" id="logout" type="button">退出登录</button>
  </div>
</header>

<main class="dash-main">
  <section class="caustic-hero" aria-label="配置管理">
    <div class="caustic-meta"><span><i aria-hidden="true"></i>RATATOSKR · CONFIG STUDIO</span><span>自由生长，生生不息。</span></div>
    <div class="caustic-copy dash-hero-copy"><div><p>管理订阅链接 · 编辑驱动整个配置工坊的模板</p><h2>配置管理</h2></div></div>
  </section>

  <div class="dash-bar">
    <div class="dash-tabs" role="tablist">
      <button id="tab-configs" role="tab" aria-selected="true" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h11M8 12h11M8 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></svg>订阅链接</button>
      <button id="tab-front" role="tab" aria-selected="false" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="m4 12 8 4 8-4M4 17l8 4 8-4"/></svg>前端配置</button>
    </div>
    <span class="dash-status" id="status"></span>
    <div style="margin-left:auto"><button class="button secondary" id="refresh" type="button">刷新列表</button></div>
  </div>

  <section id="pane-configs" role="tabpanel" aria-labelledby="tab-configs">
    <div class="dash-section"><h2 class="panel-title" style="font-size:1.25rem;margin-bottom:4px">订阅链接</h2><p class="panel-description">已生成的配置与访问凭证，可在此删除。</p></div>
    <div class="dash-card"><div class="dash-scroll"><div class="dash-msg" id="body">正在加载…</div></div></div>
  </section>

  <section id="pane-front" role="tabpanel" aria-labelledby="tab-front" hidden>
    <div class="dash-section" style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap">
      <div><h2 class="panel-title" style="font-size:1.25rem;margin-bottom:4px">前端配置</h2><p class="panel-description">编辑 Ratatoskr YAML 模板——应用、地区、出口与规则的唯一数据源。</p></div>
      <span class="dash-badge" id="fi-source">载入中…</span>
    </div>
    <div class="dash-card dash-editor">
      <div class="dash-summary" id="fi-summary"></div>
      <textarea id="fi-text" spellcheck="false" aria-label="YAML 模板内容" placeholder="正在载入模板…"></textarea>
      <div class="dash-bar">
        <button class="button primary" id="fi-save" type="button">保存并生效</button>
        <button class="button secondary" id="fi-reset" type="button">放弃草稿</button>
        <button class="button secondary" id="fi-reload" type="button">重新载入</button>
        <span class="dash-status" id="fi-status" style="margin:0"></span>
      </div>
      <p class="dash-hint">保存会校验模板能否正确生成配置；校验通过后，配置工坊下次打开即读取新内容。草稿由定时任务（也可手动触发）提交进仓库的 <code>resources/template/ratatoskr-template.yaml</code>。</p>
    </div>
  </section>
</main>
<div class="dash-toast" id="toast" role="status" aria-live="polite"></div>

<script>
(function(){
"use strict";
var CFG=${boot};
var body=document.getElementById("body");
var status=document.getElementById("status");
var themeKey="yggdrasil:config-builder:theme";
var lifetimes={"3h":"3 小时","7d":"7 天","30d":"30 天","forever":"永久"};
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
function stamp(value){
  if(!value)return "—";
  var d=new Date(value);
  return isNaN(d.getTime())?String(value):d.toLocaleString("zh-CN",{hour12:false});
}
function validity(row){
  if(row.lifetime&&lifetimes[row.lifetime])return lifetimes[row.lifetime];
  if(row.lifetime==="forever"||(!row.expiresAt&&row.createdAt))return "永久";
  if(row.createdAt&&row.expiresAt){
    var days=Math.round((new Date(row.expiresAt)-new Date(row.createdAt))/86400000);
    return days>0?days+" 天":"—";
  }
  return "—";
}
function expiry(row){return row.expiresAt?stamp(row.expiresAt):"永久"}
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
    var empty=el("div"),emptyClass="dash-empty";
    empty.className=emptyClass;
    empty.appendChild(el("strong","还没有生成任何配置"));
    var tip=el("p");tip.appendChild(document.createTextNode("配置由订阅工坊生成。"));
    var a=el("a","打开配置工坊");a.href="../";tip.appendChild(document.createTextNode(" "));tip.appendChild(a);
    empty.appendChild(tip);body.appendChild(empty);return;
  }
  body.className="";
  var table=el("table"),head=el("thead"),hr=el("tr");
  table.className="dash-table";
  ["配置名称","访问","生成时间","到期时间","有效期","订阅链接","操作"].forEach(function(h){hr.appendChild(el("th",h))});
  head.appendChild(hr);table.appendChild(head);
  var tb=el("tbody");
  rows.forEach(function(row){
    var tr=el("tr");
    tr.appendChild(el("td",row.token));
    var access=el("td"),badge=el("span",row.hasPwd?"需口令":"公开");
    badge.className="dash-badge "+(row.hasPwd?"locked":"open");
    access.appendChild(badge);tr.appendChild(access);
    var created=el("td",stamp(row.createdAt));created.className="nowrap";tr.appendChild(created);
    var expires=el("td",expiry(row));expires.className="nowrap";tr.appendChild(expires);
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
    act.appendChild(del);tr.appendChild(act);
    tb.appendChild(tr);
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

/* ---- tab switching ---- */
var tabConfigs=document.getElementById("tab-configs");
var tabFront=document.getElementById("tab-front");
var paneConfigs=document.getElementById("pane-configs");
var paneFront=document.getElementById("pane-front");
function showTab(which){
  var configs=which==="configs";
  tabConfigs.setAttribute("aria-selected",configs?"true":"false");
  tabFront.setAttribute("aria-selected",configs?"false":"true");
  paneConfigs.hidden=!configs;
  paneFront.hidden=configs;
}
window.addEventListener("beforeunload",function(e){
  if(!fiDirty)return;
  e.preventDefault();e.returnValue="";
});
tabConfigs.addEventListener("click",function(){
  if(fiDirty&&!window.confirm("前端模板有未保存的修改，切换后将丢失。确定继续？"))return;
  showTab("configs");
});
tabFront.addEventListener("click",function(){showTab("front");loadFront()});

/* ---- front-end template editor ---- */
var fiText=document.getElementById("fi-text");
var fiStatus=document.getElementById("fi-status");
var fiSource=document.getElementById("fi-source");
var fiSummary=document.getElementById("fi-summary");
var fiDirty=false;
function fiMsg(text,cls){fiStatus.className="dash-status"+(cls?" "+cls:"");fiStatus.textContent=text||""}
function renderSummary(s){
  fiSummary.textContent="";
  if(!s)return;
  var items=[["地区",s.regions],["应用",s.apps],["规则",s.rules],["策略",s.strategies],["版本",s.version]];
  items.forEach(function(pair){
    var box=el("div");box.className="dash-stat";var v=el("b",pair[1]==null?"—":String(pair[1]));
    box.appendChild(document.createTextNode(pair[0]+" "));box.appendChild(v);
    fiSummary.appendChild(box);
  });
}
function loadFront(){
  fiMsg("读取模板中…");
  fetch(CFG.frontInfoPath,{headers:{"Cache-Control":"no-store"}})
  .then(function(r){if(r.status===401)throw Error("登录已过期，请重新登录。");if(!r.ok)throw Error("读取失败 ("+r.status+")");return r.json()})
  .then(function(d){
    if(!fiDirty)fiText.value=d.text||"";
    var draft=d.source==="draft";
    fiSource.textContent=draft?("草稿 · "+(d.updatedAt?stamp(d.updatedAt):"")):"仓库版本";
    fiSource.className="dash-badge "+(draft?"locked":"open");
    renderSummary(d.summary);
    fiMsg("");
  })
  .catch(function(e){fiMsg(e.message,"dash-err")});
}
fiText.addEventListener("input",function(){fiDirty=true;fiMsg("有未保存的修改","dash-err")});
document.getElementById("fi-reload").addEventListener("click",function(){fiDirty=false;loadFront()});
document.getElementById("fi-reset").addEventListener("click",function(){
  if(!window.confirm("放弃当前草稿，恢复为仓库中的版本？"))return;
  fiMsg("正在放弃…");
  fetch(CFG.frontInfoPath,{method:"DELETE"})
  .then(function(r){if(!r.ok)throw Error("操作失败 ("+r.status+")");fiDirty=false;return loadFront()})
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
    fiDirty=false;
    renderSummary(res.d.summary);
    fiSource.textContent="草稿 · "+(res.d.updatedAt?stamp(res.d.updatedAt):"刚刚");
    fiSource.className="dash-badge locked";
    fiMsg("已保存并生效","dash-ok");
  })
  .catch(function(e){fiMsg(e.message,"dash-err")})
  .finally(function(){btn.disabled=false});
});

document.getElementById("refresh").addEventListener("click",load);
document.getElementById("logout").addEventListener("click",function(){
  fetch("/config-builder/dashboard/logout",{method:"POST"}).then(function(){location.href="/config-builder/dashboard"});
});
load();
})();
</script>
</body>
</html>`;
}
