// Self-contained owner dashboard served by the backend at
// /config-builder/dashboard. It carries no secrets or node data: credentials
// are held in an HttpOnly cookie by the Pages Function, and all config data is
// fetched from the admin API at runtime.
//
// Two tools live here: the subscription-link manager (list/delete) and the
// front-end configuration editor, which edits the Ratatoskr YAML template the
// whole configurator is derived from.
//
// Visual language mirrors the configurator: dark-first palette, glass header,
// caustic gradient hero, breathing dots, pill controls and soft elevation.
// Kept self-contained (inline style/script) so it stays CSP-compatible with
// `style-src 'unsafe-inline'; script-src 'unsafe-inline'`.

const STYLE = `
:root{
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue","PingFang SC","Segoe UI Emoji","Apple Color Emoji",sans-serif;
  font-size:16px;color-scheme:dark;
  --page:#111113;--surface:#1c1c1e;--soft:#252527;--input:#161618;
  --ink:#f5f5f7;--muted:#b4b4bb;--line:#ffffff17;--accent:#80baff;
  --action:#0071e3;--tint:#80baff12;--selected-line:#80baff70;
  --glass:#242426d9;--glass-edge:#ffffff26;
  --warning:#e3bc7a;--warning-bg:#e3bc7a0c;
  --danger:#ffb4a8;--danger-bg:#ffb4a810;
  --ok:#6ee7a0;--ok-bg:#6ee7a012;
  --shadow:0 12px 40px -24px #0008;
  --ease:cubic-bezier(.22,1,.36,1);
  --s-2:8px;--s-3:12px;--s-4:16px;--s-5:20px;--s-6:24px;--s-8:32px;
  color:var(--ink);background:var(--page)
}
:root[data-theme="light"]{
  color-scheme:light;
  --page:#f5f5f7;--surface:#fff;--soft:#f5f5f7;--input:#fff;
  --ink:#1d1d1f;--muted:#5f5f66;--line:#00000026;--accent:#005bb5;
  --action:#0071e3;--tint:#0071e314;--selected-line:#0071e385;
  --glass:#ffffffe0;--glass-edge:#ffffffef;
  --warning:#805b19;--warning-bg:#af7d1809;
  --danger:#b73524;--danger-bg:#b7352409;
  --ok:#1a7f37;--ok-bg:#1a7f3712;
  --shadow:0 12px 40px -24px #1d1d1f26
}
*{box-sizing:border-box}
body{margin:0;min-height:100svh;padding:0 0 64px;background:var(--page);color:var(--ink);font-size:.9375rem;-webkit-font-smoothing:antialiased}
.shell{max-width:1192px;margin:0 auto;padding:0 24px}

/* glass header */
.topbar{position:sticky;top:12px;z-index:8;min-height:72px;margin:12px 0 18px;padding:10px 22px;display:flex;align-items:center;justify-content:space-between;gap:20px;border:1px solid var(--glass-edge);border-radius:24px;background:var(--glass);backdrop-filter:blur(24px) saturate(150%);-webkit-backdrop-filter:blur(24px) saturate(150%);box-shadow:0 2px 8px #00000006,var(--shadow)}
.brand{display:flex;align-items:center;gap:11px;font-size:1.125rem;font-weight:650;letter-spacing:-.035em}
.brand-mark{width:38px;height:38px;flex:none;border-radius:12px;background:radial-gradient(circle at 32% 28%,#a4e5ff,#4fa8ff 45%,#0b4d86);box-shadow:inset 0 1px 2px #ffffff80,0 6px 18px -8px #2f8fe0;position:relative}
.brand-mark::after{content:"";position:absolute;inset:9px;border:2px solid #ffffffcc;border-radius:50%;border-top-color:transparent;transform:rotate(28deg)}
.brand small{display:block;margin-top:3px;font-size:.8125rem;font-weight:450;letter-spacing:.015em;color:var(--muted)}
.top-actions{display:flex;align-items:center;gap:10px}
.engine{display:inline-flex;align-items:center;gap:7px;font-size:.75rem;color:var(--muted);padding-right:6px}
.engine i{width:5px;height:5px;border-radius:50%;background:#50a68c;animation:dot-breathe 2.4s ease-in-out infinite}
@keyframes dot-breathe{0%,100%{opacity:1;box-shadow:0 0 0 0 #50a68c80;transform:scale(1)}50%{opacity:.72;box-shadow:0 0 0 5px #50a68c00;transform:scale(1.35)}}

/* controls */
button{font:inherit;cursor:pointer}
.icon-button,.text-button,.button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:36px;padding:7px 14px;border:1px solid var(--line);border-radius:99px;background:var(--surface);color:var(--ink);font-size:.8125rem;transition:background 180ms var(--ease),border-color 180ms var(--ease),transform 180ms var(--ease),color 180ms var(--ease)}
.icon-button{width:38px;padding:0;border-radius:50%}
.icon-button:hover,.text-button:hover,.button:hover{border-color:var(--selected-line);background:var(--tint);color:var(--accent)}
.icon-button:active,.text-button:active,.button:active{transform:scale(.96)}
button.primary{background:var(--action);border-color:transparent;color:#fff;font-weight:600;box-shadow:0 6px 18px -8px #0071e3cc}
button.primary:hover{filter:brightness(1.08);color:#fff}
button.primary:active{transform:scale(.98)}
button:disabled{opacity:.5;cursor:not-allowed;transform:none}
.theme-icon{width:17px;height:17px;flex:none}
.theme-icon svg{width:17px;height:17px;overflow:visible;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
:root[data-theme="light"] .theme-icon .moon{display:none}
:root:not([data-theme="light"]) .theme-icon .sun{display:none}

/* caustic hero */
.hero{position:relative;height:clamp(210px,22vw,268px);margin-bottom:24px;border-radius:28px;overflow:hidden;isolation:isolate;color:#fff;background:#061a2e;box-shadow:var(--shadow)}
.hero::before{content:"";position:absolute;inset:-30%;background:radial-gradient(ellipse at 24% 40%,#4fa8ff66,transparent 33%),radial-gradient(ellipse at 68% 52%,#a4e5ff66,transparent 36%),linear-gradient(145deg,#06152b,#0b3f6b 55%,#071d3a);filter:blur(4px)}
.hero::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,#04111ba8,transparent 72%),linear-gradient(0deg,#0310198f,transparent 65%)}
.hero-meta{position:absolute;z-index:1;top:24px;left:32px;right:32px;display:flex;justify-content:space-between;gap:20px;font-size:.75rem;letter-spacing:.09em;color:#e2f4f0bf}
.hero-meta span:first-child{display:flex;align-items:center;gap:8px}
.hero-meta i{width:5px;height:5px;border-radius:50%;background:#9de3d4;animation:dot-breathe 2.4s ease-in-out infinite}
.hero-copy{position:absolute;z-index:1;left:40px;right:40px;bottom:34px}
.hero-copy p{margin:0 0 10px;font-size:.75rem;letter-spacing:.06em;color:#d0e8e3}
.hero-copy h1{margin:0;font-size:clamp(1.75rem,3.4vw,2.6rem);font-weight:550;letter-spacing:-.045em;line-height:1.25;text-wrap:balance}

/* tabs */
.tabbar{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:18px}
.tabs{display:inline-flex;gap:4px;padding:4px;border:1px solid var(--line);border-radius:99px;background:var(--soft)}
.tabs button{border:0;background:transparent;padding:8px 18px;border-radius:99px;color:var(--muted);font-size:.8125rem;display:inline-flex;align-items:center;gap:7px;transition:background 180ms var(--ease),color 180ms var(--ease)}
.tabs button:hover{background:transparent;color:var(--ink)}
.tabs button[aria-selected="true"]{background:var(--surface);color:var(--ink);box-shadow:0 1px 3px #0002}
.tabs button svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.tab-status{margin:0;color:var(--muted);font-size:.8125rem}
.logout-wrap{margin-left:auto}
.sub{color:var(--muted)}

/* panels */
.pane-head{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:0 2px 14px}
.pane-head h2{margin:0 0 3px;font-size:1.125rem;font-weight:600;letter-spacing:-.03em}
.pane-head p{margin:0;font-size:.8125rem;color:var(--muted)}
.panel{background:var(--surface);border:1px solid var(--line);border-radius:24px;box-shadow:0 4px 24px #00000003;overflow:hidden}
.scroll{overflow-x:auto}
table{width:100%;border-collapse:collapse;min-width:860px}
th,td{text-align:left;padding:13px 16px;border-bottom:1px solid var(--line);vertical-align:top;font-size:.8125rem}
th{color:var(--muted);font-weight:500;background:var(--soft);white-space:nowrap}
tr:last-child td{border-bottom:0}
tbody tr{transition:background 160ms var(--ease)}
tbody tr:hover{background:var(--tint)}
code{font:12px ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--accent);word-break:break-all}
.badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:.6875rem;border:1px solid var(--line);background:var(--soft)}
.locked{color:var(--warning);border-color:var(--warning-bg);background:var(--warning-bg)}
.open{color:var(--muted)}
.msg{padding:52px 28px;text-align:center;color:var(--muted)}
.err{color:var(--danger)}
.ok{color:var(--ok)}
.actions{white-space:nowrap}
.nowrap{white-space:nowrap}
.danger{color:var(--danger);border-color:var(--danger-bg)}
[hidden]{display:none!important}

/* front-end editor */
.editor{padding:24px}
.summary{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 18px}
.stat{padding:8px 14px;background:var(--soft);border:1px solid var(--line);border-radius:14px;font-size:.75rem;color:var(--muted);display:inline-flex;align-items:baseline;gap:6px;transition:transform 180ms var(--ease),border-color 180ms var(--ease)}
.stat:hover{transform:translateY(-2px);border-color:var(--selected-line)}
.stat b{color:var(--ink);font-weight:650;font-size:.9375rem}
textarea{display:block;width:100%;min-height:460px;resize:vertical;padding:16px 18px;border:1px solid var(--line);border-radius:16px;background:var(--input);color:var(--ink);font:12.5px/1.7 ui-monospace,SFMono-Regular,Consolas,monospace;outline:none;tab-size:2;transition:border-color 180ms var(--ease),box-shadow 180ms var(--ease)}
textarea:focus{border-color:var(--selected-line);box-shadow:0 0 0 3px var(--tint)}
.editor-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:16px 0 0}
.editor-actions .status-inline{margin:0;color:var(--muted)}
.hint{margin:16px 0 0;font-size:.75rem;color:var(--muted);line-height:1.7}
.hint code{color:var(--accent)}
@media(max-width:720px){.shell{padding:0 14px}.topbar{padding:10px 14px}.hero-meta{left:20px;right:20px}.hero-copy{left:24px;right:24px}.engine{display:none}}
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
<title>Yggdrasil 配置管理</title>
<style>${STYLE}</style>
</head>
<body>
<div class="shell">
<header class="topbar">
  <div class="brand"><span class="brand-mark" aria-hidden="true"></span><span>Yggdrasil<small>配置管理中心</small></span></div>
  <div class="top-actions">
    <span class="engine"><i aria-hidden="true"></i>服务在线</span>
    <button id="theme" class="icon-button" type="button" aria-label="切换主题" title="切换主题"><span class="theme-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><g class="sun"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.5 1.5M17.1 17.1l1.5 1.5M18.6 5.4l-1.5 1.5M6.9 17.1l-1.5 1.5"/></g><path class="moon" d="M20 14.5A8.2 8.2 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/></svg></span></button>
    <button id="logout" class="text-button" type="button">退出登录</button>
  </div>
</header>

<section class="hero">
  <div class="hero-meta"><span><i aria-hidden="true"></i>OWNER CONSOLE</span><span>YGGDRASIL · CONFIG STUDIO</span></div>
  <div class="hero-copy"><p>管理订阅链接 · 编辑驱动整个配置工坊的模板</p><h1>配置管理</h1></div>
</section>

<div class="tabbar">
  <div class="tabs" role="tablist">
    <button id="tab-configs" role="tab" aria-selected="true" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h11M8 12h11M8 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></svg>订阅链接</button>
    <button id="tab-front" role="tab" aria-selected="false" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="m4 12 8 4 8-4M4 17l8 4 8-4"/></svg>前端配置</button>
  </div>
  <span class="tab-status" id="status"></span>
  <div class="logout-wrap"><button id="refresh" class="button" type="button">刷新列表</button></div>
</div>

<section id="pane-configs" role="tabpanel" aria-labelledby="tab-configs">
  <div class="pane-head"><div><h2>订阅链接</h2><p>已生成的配置与访问凭证，可在此删除。</p></div></div>
  <div class="panel"><div class="scroll"><div class="msg" id="body">正在加载…</div></div></div>
</section>

<section id="pane-front" role="tabpanel" aria-labelledby="tab-front" hidden>
  <div class="pane-head">
    <div><h2>前端配置</h2><p>编辑 Ratatoskr YAML 模板——应用、地区、出口与规则的唯一数据源。</p></div>
    <span class="badge" id="fi-source">载入中…</span>
  </div>
  <div class="panel editor">
    <div class="summary" id="fi-summary"></div>
    <textarea id="fi-text" spellcheck="false" aria-label="YAML 模板内容" placeholder="正在载入模板…"></textarea>
    <div class="editor-actions">
      <button id="fi-save" class="primary" type="button">保存并生效</button>
      <button id="fi-reset" type="button">放弃草稿</button>
      <button id="fi-reload" type="button">重新载入</button>
      <span class="tab-status status-inline" id="fi-status"></span>
    </div>
    <p class="hint">保存会校验模板能否正确生成配置；校验通过后，配置工坊下次打开即读取新内容。草稿由定时任务（也可手动触发）提交进仓库的 <code>resources/template/ratatoskr-template.yaml</code>。</p>
  </div>
</section>
</div>
<script>
(function(){
"use strict";
var CFG=${boot};
var body=document.getElementById("body");
var status=document.getElementById("status");
var themeKey="yggdrasil:config-builder:theme";
var lifetimes={"3h":"3 小时","7d":"7 天","30d":"30 天","forever":"永久"};
try{var saved=localStorage.getItem(themeKey);if(saved==="light"||saved==="dark")document.documentElement.dataset.theme=saved}catch(e){}
function applyTheme(theme){
  document.documentElement.dataset.theme=theme;
  document.getElementById("theme").setAttribute("aria-label",theme==="light"?"切换到深色":"切换到浅色");
}
applyTheme(document.documentElement.dataset.theme||(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"));
document.getElementById("theme").addEventListener("click",function(){
  var next=document.documentElement.dataset.theme==="light"?"dark":"light";
  applyTheme(next);try{localStorage.setItem(themeKey,next)}catch(e){}
});
function el(tag,text){var n=document.createElement(tag);if(text!=null)n.textContent=text;return n}
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
  if(!rows.length){body.className="msg";body.appendChild(el("div","还没有生成任何配置。"));return}
  body.className="";
  var table=el("table"),head=el("thead"),hr=el("tr");
  ["配置名称","访问","生成时间","到期时间","有效期","订阅链接","操作"].forEach(function(h){hr.appendChild(el("th",h))});
  head.appendChild(hr);table.appendChild(head);
  var tb=el("tbody");
  rows.forEach(function(row){
    var tr=el("tr");
    tr.appendChild(el("td",row.token));
    var access=el("td"),badge=el("span",row.hasPwd?"需口令":"公开");
    badge.className="badge "+(row.hasPwd?"locked":"open");
    access.appendChild(badge);tr.appendChild(access);
    var created=el("td",stamp(row.createdAt));created.className="nowrap";tr.appendChild(created);
    var expires=el("td",expiry(row));expires.className="nowrap";tr.appendChild(expires);
    tr.appendChild(el("td",validity(row)));
    var link=el("td"),code=el("code",linkFor(row));link.appendChild(code);tr.appendChild(link);
    var act=el("td");act.className="actions";
    var del=el("button","删除");del.className="danger";del.type="button";
    del.addEventListener("click",function(){
      if(!window.confirm("确定删除配置 “"+row.token+"”？此操作不可撤销。"))return;
      del.disabled=true;
      fetch(CFG.adminPath,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:row.id})})
      .then(function(r){if(!r.ok)throw Error("删除失败 ("+r.status+")");return r.json()})
      .then(function(){load()})
      .catch(function(e){status.className="err";status.textContent=e.message;del.disabled=false});
    });
    act.appendChild(del);tr.appendChild(act);
    tb.appendChild(tr);
  });
  table.appendChild(tb);body.appendChild(table);
}
function load(){
  status.className="tab-status";status.textContent="加载中…";
  fetch(CFG.adminPath,{headers:{"Cache-Control":"no-store"}})
  .then(function(r){if(r.status===401)throw Error("登录已过期，请重新登录。");if(!r.ok)throw Error("读取失败 ("+r.status+")");return r.json()})
  .then(function(d){status.textContent="共 "+(d.configs||[]).length+" 条配置";render(d.configs||[])})
  .catch(function(e){body.className="msg err";body.textContent=e.message;status.textContent=""});
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
tabConfigs.addEventListener("click",function(){showTab("configs")});
tabFront.addEventListener("click",function(){showTab("front");loadFront()});

/* ---- front-end template editor ---- */
var fiText=document.getElementById("fi-text");
var fiStatus=document.getElementById("fi-status");
var fiSource=document.getElementById("fi-source");
var fiSummary=document.getElementById("fi-summary");
var fiDirty=false;
function fiMsg(text,cls){fiStatus.className="tab-status status-inline"+(cls?" "+cls:"");fiStatus.textContent=text||""}
function renderSummary(s){
  fiSummary.textContent="";
  if(!s)return;
  var items=[["地区",s.regions],["应用",s.apps],["规则",s.rules],["策略",s.strategies],["版本",s.version]];
  items.forEach(function(pair){
    var box=el("div","stat"),v=el("b",pair[1]==null?"—":String(pair[1]));
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
    fiSource.className="badge "+(draft?"locked":"open");
    renderSummary(d.summary);
    fiMsg("");
  })
  .catch(function(e){fiMsg(e.message,"err")});
}
fiText.addEventListener("input",function(){fiDirty=true;fiMsg("有未保存的修改","err")});
document.getElementById("fi-reload").addEventListener("click",function(){fiDirty=false;loadFront()});
document.getElementById("fi-reset").addEventListener("click",function(){
  if(!window.confirm("放弃当前草稿，恢复为仓库中的版本？"))return;
  fiMsg("正在放弃…");
  fetch(CFG.frontInfoPath,{method:"DELETE"})
  .then(function(r){if(!r.ok)throw Error("操作失败 ("+r.status+")");fiDirty=false;return loadFront()})
  .then(function(){fiMsg("已恢复仓库版本","ok")})
  .catch(function(e){fiMsg(e.message,"err")});
});
document.getElementById("fi-save").addEventListener("click",function(){
  // textarea normalises CRLF to LF on read; the template ships as CRLF, so
  // restore it before saving or the derived version hash would differ from
  // the committed file and raise a false "version mismatch" in the frontend.
  var text=fiText.value.replace(/\\r\\n/g,"\\n").replace(/\\n/g,"\\r\\n");
  if(!text.trim()){fiMsg("模板内容不能为空","err");return}
  fiMsg("校验并保存中…");
  var btn=this;btn.disabled=true;
  fetch(CFG.frontInfoPath,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:text})})
  .then(function(r){return r.json().then(function(d){return {ok:r.ok,d:d}})})
  .then(function(res){
    if(!res.ok)throw Error(res.d.error||("保存失败"));
    fiDirty=false;
    renderSummary(res.d.summary);
    fiSource.textContent="草稿 · "+(res.d.updatedAt?stamp(res.d.updatedAt):"刚刚");
    fiSource.className="badge locked";
    fiMsg("已保存并生效","ok");
  })
  .catch(function(e){fiMsg(e.message,"err")})
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
