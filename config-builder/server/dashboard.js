// Self-contained owner dashboard served by the backend at
// /config-builder/dashboard. It carries no secrets or node data: credentials
// are held in an HttpOnly cookie by the Pages Function, and all config data is
// fetched from the admin API at runtime.
//
// Two tools live here: the subscription-link manager (list/delete) and the
// front-end configuration editor, which edits the Ratatoskr YAML template the
// whole configurator is derived from.

const STYLE = `
:root{color-scheme:light;--page:#f5f5f7;--surface:#fff;--soft:#f5f5f7;--input:#fff;--ink:#1d1d1f;--muted:#6e6e73;--line:#00000026;--accent:#005bb5;--action:#0071e3;--tint:#0071e314;--selected-line:#0071e385;--danger:#b73524;--danger-bg:#b7352409;--ok:#1a7f37;--ok-bg:#1a7f3712}
:root[data-theme="dark"]{color-scheme:dark;--page:#111113;--surface:#1c1c1e;--soft:#252527;--input:#161618;--ink:#f5f5f7;--muted:#a1a1a7;--line:#ffffff17;--accent:#80baff;--action:#0a84ff;--tint:#80baff12;--selected-line:#80baff70;--danger:#ffb4a8;--danger-bg:#ffb4a810;--ok:#6ee7a0;--ok-bg:#6ee7a012}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;--page:#111113;--surface:#1c1c1e;--soft:#252527;--input:#161618;--ink:#f5f5f7;--muted:#a1a1a7;--line:#ffffff17;--accent:#80baff;--action:#0a84ff;--tint:#80baff12;--selected-line:#80baff70;--danger:#ffb4a8;--danger-bg:#ffb4a810;--ok:#6ee7a0;--ok-bg:#6ee7a012}}
*{box-sizing:border-box}
body{margin:0;min-height:100svh;padding:32px 20px;background:var(--page);color:var(--ink);font:14px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}
.wrap{max-width:1200px;margin:0 auto}
.top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}
.eyebrow{font-size:11px;letter-spacing:.12em;color:var(--muted)}
h1{font-size:22px;font-weight:600;margin:8px 0 4px;letter-spacing:-.03em}
.sub{color:var(--muted);margin:0;font-size:13px}
.bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:18px}
button,select{font:inherit;cursor:pointer;border:1px solid var(--selected-line);background:var(--surface);color:var(--ink);padding:8px 14px;border-radius:10px}
button:hover{border-color:var(--accent);background:var(--tint);color:var(--accent)}
button:disabled{opacity:.5;cursor:not-allowed}
button.primary{background:var(--action);border-color:transparent;color:#fff;font-weight:600}
button.primary:hover{filter:brightness(1.06);color:#fff}
.tabs{display:inline-flex;gap:4px;padding:4px;background:var(--soft);border:1px solid var(--line);border-radius:12px}
.tabs button{border:0;background:transparent;padding:7px 16px;border-radius:9px;color:var(--muted)}
.tabs button:hover{background:transparent;color:var(--ink)}
.tabs button[aria-selected="true"]{background:var(--surface);color:var(--ink);box-shadow:0 1px 3px #0002}
.panel{background:var(--surface);border:1px solid var(--line);border-radius:16px;overflow:hidden}
.scroll{overflow-x:auto}
table{width:100%;border-collapse:collapse;min-width:880px}
th,td{text-align:left;padding:11px 14px;border-bottom:1px solid var(--line);vertical-align:top;font-size:13px}
th{color:var(--muted);font-weight:500;background:var(--soft);white-space:nowrap}
tr:last-child td{border-bottom:0}
code{font:12px ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--accent);word-break:break-all}
.badge{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;border:1px solid var(--line)}
.locked{color:#b7791f;border-color:#b7791f55}
:root[data-theme="dark"] .locked{color:#fbbf24;border-color:#5c4616}
.open{color:var(--muted)}
.msg{padding:28px;text-align:center;color:var(--muted)}
.err{color:var(--danger)}
.ok{color:var(--ok)}
.actions{white-space:nowrap}
.nowrap{white-space:nowrap}
[hidden]{display:none!important}
/* front-end editor */
.editor-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:16px 18px;border-bottom:1px solid var(--line)}
.editor-head .sub{flex:1;min-width:220px}
.editor-body{padding:18px}
textarea{display:block;width:100%;min-height:440px;resize:vertical;padding:14px 16px;border:1px solid var(--line);border-radius:12px;background:var(--input);color:var(--ink);font:12.5px/1.65 ui-monospace,SFMono-Regular,Consolas,monospace;outline:none;tab-size:2}
textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--tint)}
.summary{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px}
.stat{padding:6px 12px;background:var(--soft);border:1px solid var(--line);border-radius:10px;font-size:12px;color:var(--muted)}
.stat b{color:var(--ink);font-weight:600}
.hint{margin:12px 0 0;font-size:12px;color:var(--muted)}
.hint code{color:var(--accent)}
@media(max-width:720px){body{padding:18px 12px}.top{flex-direction:column}}
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
<meta name="color-scheme" content="light dark">
<title>Yggdrasil 配置管理</title>
<style>${STYLE}</style>
</head>
<body>
<div class="wrap">
<div class="top"><div><div class="eyebrow">YGGDRASIL · CONFIG STUDIO</div><h1>配置管理</h1><p class="sub">管理订阅链接，并直接编辑驱动整个配置工坊的 YAML 模板。</p></div><button id="theme" type="button">切换主题</button></div>
<div class="bar">
<div class="tabs" role="tablist"><button id="tab-configs" role="tab" aria-selected="true" type="button">订阅链接</button><button id="tab-front" role="tab" aria-selected="false" type="button">前端配置</button></div>
<span class="sub" id="status" style="margin:0"></span>
<button id="logout" type="button" style="margin-left:auto">退出登录</button>
</div>

<section id="pane-configs" role="tabpanel" aria-labelledby="tab-configs">
<div class="bar"><button id="refresh" type="button">刷新列表</button></div>
<div class="panel"><div class="scroll"><div class="msg" id="body">正在加载…</div></div></div>
</section>

<section id="pane-front" role="tabpanel" aria-labelledby="tab-front" hidden>
<div class="panel">
<div class="editor-head">
<div><div class="eyebrow">RATATOSKR TEMPLATE</div><p class="sub">这份 YAML 是应用、地区、出口与规则唯一的数据源。保存后立即生效，GitHub Action 会把草稿写回仓库。</p></div>
<span class="badge" id="fi-source">载入中…</span>
</div>
<div class="editor-body">
<div class="summary" id="fi-summary"></div>
<textarea id="fi-text" spellcheck="false" aria-label="YAML 模板内容" placeholder="正在载入模板…"></textarea>
<div class="bar" style="margin:14px 0 0">
<button id="fi-save" class="primary" type="button">保存并生效</button>
<button id="fi-reset" type="button">放弃草稿</button>
<button id="fi-reload" type="button">重新载入</button>
<span class="sub" id="fi-status" style="margin:0"></span>
</div>
<p class="hint">保存会校验模板能否正确生成配置；校验通过后，配置工坊下次打开即读取新内容。草稿由定时任务（也可手动触发）提交进仓库的 <code>resources/template/ratatoskr-template.yaml</code>。</p>
</div>
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
  document.getElementById("theme").textContent=theme==="light"?"切换到深色":"切换到浅色";
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
  // Old password-protected records were created before the plaintext was
  // stored, so their real password is unrecoverable. Show an honest note
  // instead of an empty pwd= link that would 404.
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
  status.className="";status.textContent="加载中…";
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
function fiMsg(text,cls){fiStatus.className=cls||"sub";fiStatus.textContent=text||""}
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
  // the committed file and raise a false “version mismatch” in the frontend.
  var text=fiText.value.replace(/\r\n/g,"\n").replace(/\n/g,"\r\n");
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
