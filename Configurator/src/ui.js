export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const checked = (value) => (value ? " checked" : "");
export const selected = (value) => (value ? " selected" : "");
export const title = (heading, description) =>
  `<h2 class="panel-title">${heading}</h2><p class="panel-description">${description}</p>`;
export const notice = (text, warning = false) =>
  `<div class="notice${warning ? " warning" : ""}"><span aria-hidden="true">${warning ? "◌" : "✳"}</span><p>${text}</p></div>`;
export function bytes(value) {
  if (value === null || value === undefined) return "未提供";
  let n = value,
    i = 0;
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  while (n >= 1024 && i < 4) {
    n /= 1024;
    i++;
  }
  return n.toFixed(i ? 1 : 0) + " " + units[i];
}
export function usageCards(providers = []) {
  return `<div class="usage-grid">${providers.map((p, i) => `<div class="usage-card"><strong>[P${i + 1}] ${esc(p.name)}</strong><span>${p.usage ? `${bytes(p.usage.remaining)} 剩余 / ${bytes(p.usage.total)} 总量` : "机场未提供流量信息"}</span>${p.usage ? `<progress max="${Math.max(1, p.usage.total)}" value="${Math.min(p.usage.total, p.usage.used)}" aria-label="${esc(p.name)} 已用流量"></progress><small>已用 ${bytes(p.usage.used)}${p.usage.expire ? ` · 到期 ${new Date(p.usage.expire * 1000).toLocaleDateString("zh-CN")}` : ""}</small>` : ""}</div>`).join("")}</div>`;
}
