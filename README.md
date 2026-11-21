<p align="center">
  <img src="assets/favicon.png" width="104" alt="Yggdrasil" />
</p>

<h1 align="center">Yggdrasil</h1>

<p align="center">
  Mihomo 配置与订阅工具<br />
  以 Ratatoskr 为核心配置，组合节点、规则与策略，生成个人配置。
</p>

<p align="center">
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

## 文档 / Documentation

<p align="center">
  <a href="docs/zh-CN.md"><strong>简体中文指南</strong></a>　·　<a href="docs/en.md"><strong>English Guide</strong></a>
</p>

完整文档为单一文件，涵盖项目架构、配置选择、快速开始、自定义扩展、常见问题、贡献者与许可条款。

### 其他资源

- [Ratatoskr 主配置](resources/template/ratatoskr-template.yaml) · [Release 下载](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml)
- [部署指南](config-builder/docs/DEPLOYMENT.md) · [实现路径](config-builder/docs/IMPLEMENTATION.md) · [图标来源](assets/icons/macosicons/README.md)
- [配置工坊 README](config-builder/README.md)
