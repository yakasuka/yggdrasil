<p align="center">
  <img src="assets/favicon.png" width="104" alt="Yggdrasil" />
</p>

<h1 align="center">Yggdrasil</h1>

<p align="center">
  Mihomo 配置与订阅工具<br />
  以 Ratatoskr 为核心配置，组合节点、规则与策略，生成个人配置。
</p>

<p align="center">
  <a href="docs/zh-CN.md">简体中文</a>　·　<a href="docs/en.md">English</a><br />
  <a href="https://yakasuka.github.io/yggdrasil/">项目主页</a>　·　<a href="https://yakasuka.github.io/yggdrasil/config-builder/">配置工坊</a>　·　<a href="config-builder/docs/DEPLOYMENT.md">部署指南</a>
</p>

<!-- SEO: keywords, positioning and key facts. Keep in sync with scripts/repo-metadata.mjs and index.html. -->
<details>
<summary><strong>为什么选择 Yggdrasil / Ratatoskr？</strong></summary>

Yggdrasil 是一套面向 **Mihomo / Clash / OpenClash / Clash Verge** 的配置与订阅工具，以 **Ratatoskr** 为核心模板。它把节点订阅、规则源与出口策略分层组织，通过可视化配置工坊生成个人 YAML，并用 GitHub Actions 懒加载自动更新规则。

- **桌面级广告拦截**：内置 AdGuard Windows 桌面规则订阅，约 **316,005** 条拦截域名，跟随官方上游自动更新。
- **Geo 轻量分流**：GeoSite / GeoIP 承载分类数据，主配置本体约 **28 KB**。
- **五大出口策略**：手动切换、自动选择、故障转移、一致性哈希负载均衡、轮询下载均衡。
- **应用与地区目录**：ChatGPT、Claude、Telegram、Spotify、Steam 等应用策略组，港 / 台 / 日 / 韩 / 新 / 美等地区分组。
- **自动化交付**：规则变化才拉取正文，低资源占用、确定性输出；Release 提供固定直链与 SHA-256 校验。

关键词：Mihomo 配置 · Clash 订阅 · OpenClash 规则 · Ratatoskr · AdGuard 广告拦截 · GeoSite GeoIP 分流 · YAML 配置生成器 · 订阅转换 · 代理策略组。

</details>

<p align="center">
  <a href="https://wiki.metacubex.one/"><img src="https://img.shields.io/badge/Core-Mihomo-3282B8?style=flat-square" alt="Mihomo" /></a>
  <a href="docs/zh-CN.md"><img src="https://img.shields.io/badge/Rules-GeoSite%20%2B%20GeoIP-537A5A?style=flat-square" alt="GeoSite and GeoIP" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Permission_Required-C4A25A?style=flat-square" alt="Permission required" /></a>
</p>

---

**Yggdrasil 是应用与配置工具，Ratatoskr 是核心配置模板。** 配置工坊读取 Ratatoskr 的应用、地区与策略定义，将你的选择组装为 Mihomo YAML。一个负责组织和生成，一个定义实际的分流与节点策略。

<p align="center">
  <strong>订阅 / 节点</strong>　→　<strong>配置工坊</strong>　→　<strong>Ratatoskr 模板</strong>　→　<strong>个人配置</strong>
</p>

### 应用与地区

<p align="center">
  <img src="assets/icons/chatgpt.png" width="52" alt="ChatGPT" />&nbsp;
  <img src="assets/icons/claude.png" width="52" alt="Claude" />&nbsp;
  <img src="assets/icons/telegram.png" width="52" alt="Telegram" />&nbsp;
  <img src="assets/icons/spotify.png" width="52" alt="Spotify" />&nbsp;
  <img src="assets/icons/steam.png" width="52" alt="Steam" />&nbsp;
  <img src="assets/icons/hk.png" width="52" alt="Hong Kong" />&nbsp;
  <img src="assets/icons/jp.png" width="52" alt="Japan" />&nbsp;
  <img src="assets/icons/us.png" width="52" alt="United States" />
</p>

<p align="center"><sub>应用策略组与地区节点组使用专属图标，方便在 Mihomo 面板中辨认出口。</sub></p>

### 节点策略

<p align="center">
  🚀 手动切换　 ♻️ 自动选择　 🔯 故障转移　 🔮 负载均衡　 📦 下载均衡
</p>

主模板另为策略组配置图标：

<p align="center">
  <img src="assets/icons/switch.png" width="38" alt="节点选择" />&nbsp;
  <img src="assets/icons/proxy.png" width="38" alt="手动节点" />&nbsp;
  <img src="assets/icons/fallback.png" width="38" alt="故障转移" />&nbsp;
  <img src="assets/icons/tracking.png" width="38" alt="负载均衡" />&nbsp;
  <img src="assets/icons/global.png" width="38" alt="下载均衡" />
</p>

---

### 浏览项目

- [中文指南：架构、规则、配置选择与使用说明](docs/zh-CN.md)　·　[English guide](docs/en.md)
- [Ratatoskr 主配置](resources/template/ratatoskr-template.yaml) · [Release 下载](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml)
- [部署指南](config-builder/docs/DEPLOYMENT.md) · [实现路径](config-builder/docs/IMPLEMENTATION.md) · [图标来源](assets/icons/macosicons/README.md) · [配置工坊 README](config-builder/README.md)

### 贡献者

<p align="center">
  <a href="https://github.com/yakasuka"><img src="https://avatars.githubusercontent.com/u/39859629?v=4" width="40" alt="yakasuka" /></a>&nbsp;
  <a href="https://github.com/codex"><img src="https://avatars.githubusercontent.com/u/267193182?v=4" width="40" alt="Codex" /></a>&nbsp;
  <a href="https://github.com/claude"><img src="https://avatars.githubusercontent.com/u/81847?v=4" width="40" alt="Claude" /></a>&nbsp;
  <a href="https://github.com/EaibeeKitajima"><img src="https://avatars.githubusercontent.com/u/105159380?v=4" width="40" alt="Eaibee Kitajima" /></a>&nbsp;
  <a href="https://github.com/apps/github-actions"><img src="https://avatars.githubusercontent.com/in/15368?v=4" width="40" alt="github-actions[bot]" /></a>&nbsp;
  <a href="https://github.com/apps/dependabot"><img src="https://avatars.githubusercontent.com/in/29110?v=4" width="40" alt="dependabot[bot]" /></a>
</p>

<p align="center"><sub>项目由 yakasuka 主导维护，AI 助手与自动化机器人共同参与配置、脚本、文档与依赖维护。</sub></p>
