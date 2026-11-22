import {
  mkdir,
  writeFile,
  readdir,
  copyFile,
  rm,
  stat,
} from "node:fs/promises";

const root = new URL("../", import.meta.url);
const repository = new URL("../", root);
const output = new URL("worker/gateway/dist/", root);

function serviceBaseURL() {
  const value = (process.env.SERVICE_BASE_URL || "").trim();
  if (!value) return "";
  let url;
  try {
    url = new URL(value);
  } catch {
    throw Error("SERVICE_BASE_URL 必须是完整的 http(s) 地址。");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw Error("SERVICE_BASE_URL 只能是不含路径与参数的源地址。");
  return url.origin;
}

const service = serviceBaseURL();

async function copy(source, destination) {
  await mkdir(new URL("./", destination), { recursive: true });
  await copyFile(source, destination);
}
async function images(source, destination) {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.isDirectory())
      await images(
        new URL(entry.name + "/", source),
        new URL(entry.name + "/", destination),
      );
    else if (entry.isFile() && /\.(png|ico|svg|webp)$/.test(entry.name))
      await copy(new URL(entry.name, source), new URL(entry.name, destination));
  }
}

// /merge and /sub are only link relays on the static hosts. The token is
// forwarded to the self-hosted backend, which is the only place that reads
// node data. No node, token or private repository content is stored here.
function relayPage(kind) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta name="yggdrasil:service" content="${service}">
<title>Yggdrasil · ${kind}</title>
<style>
:root{color-scheme:light dark}body{margin:0;min-height:100vh;display:grid;place-items:center;
font:16px/1.7 system-ui,-apple-system,"Segoe UI",sans-serif;background:#f5f6f8;color:#1b1d21}
main{max-width:32rem;padding:2rem}h1{font-size:1.35rem;margin:0 0 .75rem}p{color:#5c6470;margin:.4rem 0}
code{background:#e8eaee;padding:.1rem .35rem;border-radius:.3rem}
@media (prefers-color-scheme:dark){body{background:#14161a;color:#eceff3}p{color:#a4acb8}code{background:#282c33}}
</style>
</head>
<body>
<main>
<h1>正在前往订阅服务…</h1>
<p>本页是静态跳转，不读取、不缓存、不展示任何节点内容。订阅由自建服务直接返回。</p>
<p>目标接口：<code>/${kind}?token=…</code></p>
<p><a id="open" href="#">如未自动跳转，点此打开</a></p>
<p id="hint"></p>
</main>
<script>
(async () => {
  const declared = document.querySelector('meta[name="yggdrasil:service"]').content.trim();
  let raw = declared;
  if (!raw) {
    try {
      const response = await fetch(new URL('../service.json', location.href), {cache:'no-store', credentials:'omit'});
      if (response.ok) raw = (await response.json()).service || '';
    } catch {}
  }
  let base = '';
  try {
    const u = new URL(raw);
    if (u.protocol === 'http:' || u.protocol === 'https:') base = u.origin;
  } catch {}
  if (!base) {
    document.getElementById('hint').textContent = '尚未配置自建服务地址：请设置 SERVICE_BASE_URL 后重新构建，或编辑同目录的 service.json。';
    return;
  }
  const query = new URLSearchParams(location.search).toString();
  const target = base + '/${kind}' + (query ? '?' + query : '');
  document.getElementById('open').href = target;
  location.replace(target);
})();
</script>
</body>
</html>
`;
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

// Publish an explicit set of browser files; never copy the repository wholesale.
for (const [source, destination] of [
  ["index.html", "index.html"],
  ["config-builder/index.html", "config-builder/index.html"],
  ["config-builder/assets/app.js", "config-builder/assets/app.js"],
  ["config-builder/assets/app.css", "config-builder/assets/app.css"],
])
  await copy(new URL(source, repository), new URL(destination, output));
for (const path of ["assets/"])
  await images(new URL(path, repository), new URL(path, output));

// Identical relay pages for both hosts. The repository-root copies are what
// GitHub Pages publishes, so they are only rewritten when an address is
// actually configured: an unconfigured local build must not erase a deployed
// address.
for (const kind of ["merge", "sub"]) {
  await mkdir(new URL(`${kind}/`, output), { recursive: true });
  await writeFile(new URL(`${kind}/index.html`, output), relayPage(kind));
  if (service) {
    await mkdir(new URL(`${kind}/`, repository), { recursive: true });
    await writeFile(new URL(`${kind}/index.html`, repository), relayPage(kind));
  }
}

// A single plain-URL file lets both relay pages discover the backend without
// rebuilding. It contains no credential and no node data.
const descriptor = JSON.stringify({ service }, null, 2) + "\n";
await writeFile(new URL("service.json", output), descriptor);
const existing = await stat(new URL("service.json", repository)).then(
  () => true,
  () => false,
);
if (service || !existing)
  await writeFile(new URL("service.json", repository), descriptor);

// Cloudflare Pages rewrite/redirect rules. GitHub Pages uses the directory
// index.html directly (/merge/ and /sub/ also work there).
await writeFile(
  new URL("_redirects", output),
  [
    "/merge /merge/index.html 200",
    "/sub /sub/index.html 200",
    "/config-builder /config-builder/ 308",
    "/builder /config-builder/ 308",
    "/builder/ /config-builder/ 308",
    "/webui /config-builder/ 308",
    "/webui/ /config-builder/ 308",
    "/Configurator /config-builder/ 308",
    "/Configurator/ /config-builder/ 308",
    "",
  ].join("\n"),
);

console.log(
  `Static frontend built for Cloudflare Pages and GitHub Pages (no _worker.js).` +
    (service ? `\nService base: ${service}` : "\nService base: set via the yggdrasil:service meta tag."),
);
