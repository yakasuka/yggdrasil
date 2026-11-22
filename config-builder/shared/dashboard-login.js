// Standalone sign-in screen for the owner dashboard. Served by the Cloudflare
// Pages Function at /config-builder/dashboard when no admin session cookie is
// present, so the browser never shows a native Basic Auth dialog.

const STYLE = `
:root{color-scheme:light dark;--page:#f5f5f7;--surface:#fff;--soft:#f5f5f7;--input:#fff;--ink:#1d1d1f;--muted:#6e6e73;--line:#00000026;--accent:#005bb5;--action:#0071e3;--tint:#0071e314;--selected-line:#0071e385;--danger:#b73524;--danger-bg:#b7352409}
@media(prefers-color-scheme:dark){:root{color-scheme:dark;--page:#111113;--surface:#1c1c1e;--soft:#252527;--input:#161618;--ink:#f5f5f7;--muted:#a1a1a7;--line:#ffffff17;--accent:#80baff;--action:#0071e3;--tint:#80baff12;--selected-line:#80baff70;--danger:#ffb4a8;--danger-bg:#ffb4a810}}
*{box-sizing:border-box}
body{margin:0;min-height:100svh;display:grid;place-items:center;padding:24px;background:var(--page);color:var(--ink);font:14px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}
.card{width:min(420px,100%);padding:32px;border:1px solid var(--line);border-radius:20px;background:var(--surface);box-shadow:0 12px 40px -24px #0003}
.eyebrow{font-size:11px;letter-spacing:.12em;color:var(--muted)}
h1{margin:10px 0 6px;font-size:22px;font-weight:600;letter-spacing:-.03em}
p{margin:0 0 22px;color:var(--muted);font-size:13px}
label{display:block;margin:0 0 14px;font-size:12px;font-weight:550}
input{display:block;width:100%;margin-top:7px;padding:12px 14px;border:1px solid var(--selected-line);border-radius:11px;background:var(--input);color:var(--ink);font:inherit;outline:none}
input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--tint)}
button{width:100%;margin-top:8px;padding:12px 20px;border:1px solid transparent;border-radius:99px;background:var(--action);color:#fff;font:inherit;font-weight:600;cursor:pointer}
button:disabled{opacity:.6;cursor:wait}
.err{margin:12px 0 0;color:var(--danger);background:var(--danger-bg);padding:10px 12px;border-radius:10px;font-size:12px}
.err[hidden]{display:none}
.back{display:inline-block;margin-top:18px;color:var(--accent);text-decoration:none;font-size:12px}
`;

export function dashboardLoginHTML({
  loginPath = "/config-builder/dashboard/login",
  dashboardPath = "/config-builder/dashboard",
  title = "配置管理登录",
} = {}) {
  const boot = JSON.stringify({ loginPath, dashboardPath })
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e");
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="color-scheme" content="light dark">
<title>${title}</title>
<style>${STYLE}</style>
</head>
<body>
<main class="card">
<div class="eyebrow">YGGDRASIL · CONFIG STUDIO</div>
<h1>${title}</h1>
<p>使用管理员账号登录，查看与维护已生成的订阅配置。</p>
<form id="login" autocomplete="on">
<label>管理员账号<input id="username" name="username" type="text" autocomplete="username" required autofocus></label>
<label>密码<input id="password" name="password" type="password" autocomplete="current-password" required></label>
<button id="submit" type="submit">登录</button>
<p class="err" id="error" role="alert" hidden></p>
</form>
<a class="back" href="../">← 返回配置工坊</a>
</main>
<script>
(function(){
"use strict";
var CFG=${boot};
var form=document.getElementById("login");
var error=document.getElementById("error");
var submit=document.getElementById("submit");
form.addEventListener("submit",function(event){
  event.preventDefault();
  error.hidden=true;submit.disabled=true;
  fetch(CFG.loginPath,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({username:document.getElementById("username").value,password:document.getElementById("password").value})})
  .then(function(r){if(r.ok)return r.json();return r.json().then(function(d){throw Error((d&&d.error)||("登录失败 ("+r.status+")"))})})
  .then(function(){location.href=CFG.dashboardPath})
  .catch(function(e){error.textContent=e.message||"登录失败，请重试。";error.hidden=false;submit.disabled=false});
});
})();
</script>
</body>
</html>`;
}
