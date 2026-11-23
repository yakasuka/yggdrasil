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

// Latency health tiers, shared by the initial table render and the live
// url-test update so both show the same colour-coded capsule.
//   null / no probe -> 未检测 · grey
//   < 150ms        -> 顺畅   · green
//   < 400ms        -> 良好   · blue
//   < 800ms        -> 堵塞   · amber
//   >= 800ms       -> 超时   · red
// Normalise to a real number first: the probe response can carry latency as a
// numeric string, and Number.isFinite("120") is false — which used to drop
// every measured node into the grey "未检测" bucket with no colour at all.
export const toLatencyNumber = (ms) => {
  if (typeof ms === "number") return ms;
  if (typeof ms === "string" && ms.trim() !== "") {
    const n = Number(ms);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};
export function latencyTone(ms) {
  const n = toLatencyNumber(ms);
  if (n === null || !Number.isFinite(n))
    return { tone: "idle", label: "未检测" };
  if (n < 150) return { tone: "good", label: "顺畅" };
  if (n < 400) return { tone: "ok", label: "良好" };
  if (n < 800) return { tone: "congested", label: "堵塞" };
  return { tone: "timeout", label: "超时" };
}
export function latencyPill(ms) {
  const n = toLatencyNumber(ms);
  const { tone, label } = latencyTone(n);
  const value = Number.isFinite(n) ? `${Math.round(n)} ms` : "—";
  return `<span class="latency-pill latency-pill--${tone}" title="${label}"><i aria-hidden="true"></i><b>${value}</b><small>${label}</small></span>`;
}
export const latencyLegend = () =>
  ["good", "ok", "congested", "timeout"]
    .map(
      (tone) =>
        `<span class="latency-pill latency-pill--${tone}"><i aria-hidden="true"></i>${latencyTone({ good: 80, ok: 300, congested: 600, timeout: 1200 }[tone]).label}</span>`,
    )
    .join("");
export const title = (heading, description) =>
  `<h2 class="panel-title">${heading}</h2><p class="panel-description">${description}</p>`;
export const notice = (text, warning = false) =>
  `<div class="notice${warning ? " warning" : ""}"><span aria-hidden="true">${warning ? "⚠" : "✳"}</span><p>${text}</p></div>`;
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
