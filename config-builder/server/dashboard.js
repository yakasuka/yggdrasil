// Self-contained owner dashboard served by the backend at
// /config-builder/dashboard. It carries no secrets or node data: credentials
// come from the browser's HTTP Basic session, and all config data is fetched
// from the same-origin admin API at runtime.

const STYLE = `
:root{color-scheme:dark;--bg:#06100c;--panel:#0c1a14;--line:#1d3327;--text:#d8e6dd;--muted:#8aa694;--accent:#4ade80;--danger:#f87171}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:14px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif;padding:32px 20px}
.wrap{max-width:960px;margin:0 auto}
h1{font-size:20px;font-weight:600;margin:0 0 4px}
.sub{color:var(--muted);margin:0 0 24px;font-size:13px}
.bar{display:flex;gap:10px;align-items:center;margin-bottom:16px}
button{font:inherit;cursor:pointer;border:1px solid var(--line);background:var(--panel);color:var(--text);padding:7px 14px;border-radius:8px}
button:hover{border-color:var(--accent)}
button:disabled{opacity:.5;cursor:not-allowed}
.danger{border-color:#5a2626;color:var(--danger)}
.danger:hover{border-color:var(--danger)}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;padding:11px 14px;border-bottom:1px solid var(--line);vertical-align:top;font-size:13px}
th{color:var(--muted);font-weight:500;background:#0a1510}
tr:last-child td{border-bottom:0}
code{font:12px ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--accent);word-break:break-all}
.badge{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;border:1px solid var(--line)}
.locked{color:#fbbf24;border-color:#5c4616}
.open{color:var(--muted)}
.msg{padding:28px;text-align:center;color:var(--muted)}
.err{color:var(--danger)}
.actions{white-space:nowrap}
@media(max-width:720px){th:nth-child(3),td:nth-child(3){display:none}}
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
<title>Yggdrasil 配置管理</title>
<style>${STYLE}</style>
</head>
<body>
<div class="wrap">
<h1>配置管理</h1>
<p class="sub">列出并删除本服务已生成的订阅配置。需要管理员凭据。</p>
<div class="bar">
<button id="refresh" type="button">刷新</button>
<span class="sub" id="status" style="margin:0"></span>
</div>
<div class="panel">
<div class="msg" id="body">正在加载…</div>
</div>
</div>
<script>
(function(){
"use strict";
var CFG = ${boot};
var body = document.getElementById("body");
var status = document.getElementById("status");
function el(tag, text){var n=document.createElement(tag);if(text!=null)n.textContent=text;return n}
function linkFor(row){
  // Old password-protected records were created before the plaintext was
  // stored, so their real password is unrecoverable. Show an honest note
  // instead of an empty pwd= link that would 404.
  if(row.hasPwd && !row.pwd) return "旧配置：当时未记录口令，无法重建链接（删除后可重建）";
  var parts = CFG.linkBase + "?token=" + encodeURIComponent(row.token);
  if(row.hasPwd) parts += "&pwd=" + encodeURIComponent(row.pwd);
  return parts;
}
function render(rows){
  body.textContent="";
  if(!rows.length){body.className="msg";body.appendChild(el("div","还没有生成任何配置。"));return}
  body.className="";
  var table=el("table"), head=el("thead"), hr=el("tr");
  ["配置名称","访问","订阅链接","操作"].forEach(function(h){hr.appendChild(el("th",h))});
  head.appendChild(hr);table.appendChild(head);
  var tb=el("tbody");
  rows.forEach(function(row){
    var tr=el("tr");
    tr.appendChild(el("td",row.token));
    var access=el("td"), badge=el("span",row.hasPwd?"需口令":"公开");
    badge.className="badge "+(row.hasPwd?"locked":"open");
    access.appendChild(badge);tr.appendChild(access);
    var link=el("td"), code=el("code",linkFor(row));link.appendChild(code);tr.appendChild(link);
    var act=el("td");act.className="actions";
    var del=el("button","删除");del.className="danger";del.type="button";
    del.addEventListener("click",function(){
      if(!window.confirm("确定删除配置 “"+row.token+"”？此操作不可撤销。"))return;
      del.disabled=true;
      fetch(CFG.adminPath,{method:"DELETE",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id:row.id})})
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
  .then(function(r){if(r.status===401)throw Error("凭据无效，请刷新页面重新登录。");if(!r.ok)throw Error("读取失败 ("+r.status+")");return r.json()})
  .then(function(d){status.textContent="共 "+(d.configs||[]).length+" 条配置";render(d.configs||[])})
  .catch(function(e){body.className="msg err";body.textContent=e.message;status.textContent=""});
}
document.getElementById("refresh").addEventListener("click",load);
load();
})();
</script>
</body>
</html>`;
}
