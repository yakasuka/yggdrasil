import { catalog, STRATEGIES } from "../../shared/compiler.js";
import { filename, LIFETIMES } from "../../shared/profile.js";
import {
  esc,
  checked,
  selected,
  title,
  notice,
  usageCards,
  bytes,
} from "../ui.js";
export function reviewPanel(ctx) {
  const p = ctx.profile,
    regions = (ctx.inspection?.regions || []).filter((r) =>
      r.id === "OTHER" ? p.other : p.countries.includes(r.id),
    );
  return (
    title(
      "你的连接，即将生长。",
      "为配置起个名字，确认所选地区与 APP。下载文件或生成可持续更新的私密订阅链接。",
    ) +
    `<label class="field">配置名称<input id="profile-title" type="text" maxlength="60" value="${esc(p.title)}" placeholder="例如：Eaibee" autocomplete="off"></label><div class="stats"><div class="stat"><strong>${p.providers.length}</strong><span>机场</span></div><div class="stat"><strong>${p.apps.length}</strong><span>APP</span></div><div class="stat"><strong>${regions.length}</strong><span>地区</span></div><div class="stat"><strong id="rule-count">—</strong><span>规则</span></div></div><div class="review-row"><span>默认代理</span><strong>${esc(STRATEGIES.find((s) => s.id === p.defaultStrategy)?.label || "手动选择")}</strong></div><div class="review-row"><span>保留地区</span><strong>${esc(regions.map((r) => r.label).join(" · "))}</strong></div><div class="review-row"><span>最终出口</span><strong>跟随代理</strong></div><label class="inline-field"><span>Token 持续时间</span><select id="lifetime">${LIFETIMES.map((x) => `<option value="${x.id}"${selected(p.lifetime === x.id)}>${x.label}</option>`).join("")}</select></label><details><summary>客户端选项</summary><div><label class="field">混合代理端口<input id="port" type="number" min="1024" max="65535" value="${p.port}"></label><label class="inline-field"><span>允许局域网连接</span><input id="allow-lan" type="checkbox"${checked(p.allowLan)}></label></div></details><div class="file-card"><div class="file-icon">YAML</div><div><strong id="file-name">${esc(p.title ? filename(p.title) : "名字-ratatoskr.yaml")}</strong><small id="file-size">正在组装配置…</small></div><div class="file-actions"><button class="text-button" id="show-preview">预览配置 ↗</button></div></div>` +
    usageCards(ctx.inspection?.providers) +
    (ctx.service === "ready"
      ? notice(
          "订阅服务已连接。Token 在有效期内保持不变，拉取时按最新模板生成配置。",
        )
      : notice("订阅服务暂不可用，请重试连接或联系维护者。", true)) +
    '<div id="result-area"></div>'
  );
}
export function resultPanel(result) {
  return `<div class="result"><h3>你的订阅已就绪。</h3><label class="field">私密订阅链接<input id="result-url" type="text" readonly value="${esc(result.url)}"></label><button id="copy-result" class="button primary">复制订阅链接</button><small>${result.expiresAt ? "有效至 " + new Date(result.expiresAt).toLocaleString("zh-CN") : "永久有效（无自动过期时间）"}。持有链接即可读取配置，请妥善保管。</small><div id="live-usage">${usageCards(result.providers)}</div><button id="refresh-usage" class="text-button">刷新流量</button><small>流量来自机场报告，随订阅拉取或手动刷新更新。${result.usage?.complete ? "总剩余 " + bytes(result.usage.remaining) + " / 总量 " + bytes(result.usage.total) : "部分机场未提供流量，不显示不完整的总额度。"}</small></div>`;
}
