import { esc, title, notice } from "../ui.js";
export function sourcesPanel(ctx) {
  return (
    title(
      "一切，从你的订阅开始。",
      "填入机场名称与 Mihomo / Clash 节点订阅。解析后，按你实际拥有的节点组织地区与分流。",
    ) +
    ctx.profile.providers
      .map(
        (p, i) =>
          `<div class="provider-card"><div class="card-heading"><span>PROVIDER ${String(i + 1).padStart(2, "0")}</span>${ctx.profile.providers.length > 1 ? `<button class="icon-button" data-remove="${i}" aria-label="移除第 ${i + 1} 个机场">×</button>` : ""}</div><div class="fields"><label class="field">机场名称<input type="text" maxlength="40" data-provider="${i}" data-key="name" value="${esc(p.name)}" placeholder="例如：我的机场" autocomplete="off"></label><label class="field">节点订阅链接<input type="url" data-provider="${i}" data-key="url" value="${esc(p.url)}" placeholder="https://example.com/subscribe…" autocomplete="off" spellcheck="false"></label></div><details><summary>导入节点文件，在本地预览</summary><div><label class="field">Mihomo / Clash YAML<input type="file" data-node-file="${i}" accept=".yaml,.yml,.txt"></label><p class="muted">${ctx.files.has(i) ? esc(ctx.files.get(i).name) + " · 已载入" : "在线解析未连接时，可以使用机场导出的节点文件。文件在浏览器中解析，不会上载。"}</p></div></details></div>`,
      )
      .join("") +
    `<button class="button add-provider" id="add-provider"${ctx.profile.providers.length >= 10 ? " disabled" : ""}>＋ 添加另一个机场 <span class="muted">${ctx.profile.providers.length} / 10</span></button>` +
    notice(
      "点击下一步后解析节点与流量信息。机场链接仅用于处理你的配置，不会写入浏览器本地存储。",
    ) +
    (ctx.service !== "ready"
      ? notice(
          "在线解析尚未连接。可以为每个机场导入节点文件，继续在本地选择地区、预览和下载配置。",
          true,
        )
      : "")
  );
}
