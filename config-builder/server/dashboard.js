// Self-contained owner dashboard served by the backend at
// /config-builder/dashboard. It carries no secrets or node data: credentials
// are held in an HttpOnly cookie by the Pages Function, and all config data is
// fetched from the admin API at runtime.

const STYLE = `
:root{color-scheme:light;--page:#f5f5f7;--surface:#fff;--soft:#f5f5f7;--input:#fff;--ink:#1d1d1f;--muted:#6e6e73;--line:#00000026;--accent:#005bb5;--action:#0071e3;--tint:#0071e314;--selected-line:#0071e385;--danger:#b73524;--danger-bg:#b7352409}
:root[data-theme="dark"]{color-scheme:dark;--page:#111113;--surface:#1c1c1e;--soft:#252527;--input:#161618;--ink:#f5f5f7;--muted:#a1a1a7;--line:#ffffff17;--accent:#80baff;--tint:#80baff12;--selected-line:#80baff70;--danger:#ffb4a8;--danger-bg:#ffb4a810}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;--page:#111113;--surface:#1c1c1e;--soft:#252527;--input:#161618;--ink:#f5f5f7;--muted:#a1a1a7;--line:#ffffff17;--accent:#80baff;--tint:#80baff12;--selected-line:#80baff70;--danger:#ffb4a8;--danger-bg:#ffb4a810}}
*{box-sizing:border-box}
body{margin:0;min-height:100svh;padding:32px 20px;background:var(--page);color:var(--ink);font:14px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}
.wrap{max-width:1200px;margin:0 auto}
.top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:22px}
.eyebrow{font-size:11px;letter-spacing:.12em;color:var(--muted)}
h1{font-size:22px;font-weight:600;margin:8px 0 4px;letter-spacing:-.03em}
.sub{color:var(--muted);margin:0;font-size:13px}
.bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:18px}
button,select{font:inherit;cursor:pointer;border:1px solid var(--selected-line);background:var(--surface);color:var(--ink);padding:8px 14px;border-radius:10px}
button:hover{border-color:var(--accent);background:var(--tint);color:var(--accent)}
button:disabled{opacity:.5;cursor:not-allowed}
.danger{color:var(--danger)}
.danger:hover{border-color:var(--danger);color:var(--danger);background:var(--danger-bg)}
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
.actions{white-space:nowrap}
.nowrap{white-space:nowrap}
@media(max-width:720px){body{padding:18px 12px}.top{flex-direction:column}}
`;

// Everything dynamic is injected through a JSON-serialised config object and
// rendered with textContent, so a configuration name can never inject markup.
export function dashboardHTML({ linkBase = "", adminPath = "/api/admin/configs" } = {}) {
  // JSON.stringify alone does not escape '<', so an untrusted link base could
  // close the inline <script> tag. Encode angle brackets as JSON unicode
  // escapes, which parse back to the same string inside JavaScript.
  const boot = JSON.stringify({ linkBase, adminPath })
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
<div class="top"><div><div class="eyebrow">YGGDRASIL · CONFIG STUDIO</div><h1>配置管理</h1><p class="sub">列出并删除本服务已生成的订阅配置。</p></div><button id="theme" type="button">切换主题</button></div>
<div class="bar"><button id="refresh" type="button">刷新</button><span class="sub" id="status" style="margin:0"></span><button id="logout" type="button" style="margin-left:auto">退出登录</button></div>
<div class="panel"><div class="scroll"><div class="msg" id="body">正在加载…</div></div></div>
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
