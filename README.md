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
  <a href="docs/i18n/README.zh-CN.md"><img src="https://img.shields.io/badge/Rules-GeoSite%20%2B%20GeoIP-537A5A?style=flat-square" alt="GeoSite and GeoIP" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Permission_Required-C4A25A?style=flat-square" alt="Permission required" /></a>
</p>

---

## 文档 / Documentation

完整文档按**语言 + 章节**组织，位于 [`docs/i18n/`](docs/i18n/)。每种语言包含五个章节：项目介绍、快速开始、贡献指南、贡献者、常见问题。

| 语言 | 项目介绍 | 快速开始 | 贡献指南 | 贡献者 | 常见问题 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 简体中文 | [README](docs/i18n/README.zh-CN.md) | [快速开始](docs/i18n/QUICKSTART.zh-CN.md) | [贡献](docs/i18n/CONTRIBUTING.zh-CN.md) | [贡献者](docs/i18n/CONTRIBUTORS.zh-CN.md) | [FAQ](docs/i18n/FAQ.zh-CN.md) |
| English | [README](docs/i18n/README.en.md) | [Quick start](docs/i18n/QUICKSTART.en.md) | [Contributing](docs/i18n/CONTRIBUTING.en.md) | [Contributors](docs/i18n/CONTRIBUTORS.en.md) | [FAQ](docs/i18n/FAQ.en.md) |
| 日本語 | [README](docs/i18n/README.ja-JP.md) | [クイックスタート](docs/i18n/QUICKSTART.ja-JP.md) | [貢献](docs/i18n/CONTRIBUTING.ja-JP.md) | [貢献者](docs/i18n/CONTRIBUTORS.ja-JP.md) | [FAQ](docs/i18n/FAQ.ja-JP.md) |
| 한국어 | [README](docs/i18n/README.ko.md) | [빠른 시작](docs/i18n/QUICKSTART.ko.md) | [기여](docs/i18n/CONTRIBUTING.ko.md) | [기여자](docs/i18n/CONTRIBUTORS.ko.md) | [FAQ](docs/i18n/FAQ.ko.md) |
| Deutsch | [README](docs/i18n/README.de.md) | [Quickstart](docs/i18n/QUICKSTART.de.md) | [Beitragen](docs/i18n/CONTRIBUTING.de.md) | [Mitwirkende](docs/i18n/CONTRIBUTORS.de.md) | [FAQ](docs/i18n/FAQ.de.md) |
| Français | [README](docs/i18n/README.fr.md) | [Démarrage](docs/i18n/QUICKSTART.fr.md) | [Contribuer](docs/i18n/CONTRIBUTING.fr.md) | [Contributeurs](docs/i18n/CONTRIBUTORS.fr.md) | [FAQ](docs/i18n/FAQ.fr.md) |
| Español | [README](docs/i18n/README.es.md) | [Inicio rápido](docs/i18n/QUICKSTART.es.md) | [Contribuir](docs/i18n/CONTRIBUTING.es.md) | [Colaboradores](docs/i18n/CONTRIBUTORS.es.md) | [FAQ](docs/i18n/FAQ.es.md) |
| Português (BR) | [README](docs/i18n/README.pt-BR.md) | [Início rápido](docs/i18n/QUICKSTART.pt-BR.md) | [Contribuir](docs/i18n/CONTRIBUTING.pt-BR.md) | [Colaboradores](docs/i18n/CONTRIBUTORS.pt-BR.md) | [FAQ](docs/i18n/FAQ.pt-BR.md) |
| Русский | [README](docs/i18n/README.ru.md) | [Быстрый старт](docs/i18n/QUICKSTART.ru.md) | [Участие](docs/i18n/CONTRIBUTING.ru.md) | [Участники](docs/i18n/CONTRIBUTORS.ru.md) | [FAQ](docs/i18n/FAQ.ru.md) |
| العربية | [README](docs/i18n/README.ar.md) | [البدء السريع](docs/i18n/QUICKSTART.ar.md) | [المساهمة](docs/i18n/CONTRIBUTING.ar.md) | [المساهمون](docs/i18n/CONTRIBUTORS.ar.md) | [FAQ](docs/i18n/FAQ.ar.md) |
| فارسی | [README](docs/i18n/README.fa.md) | [شروع سریع](docs/i18n/QUICKSTART.fa.md) | [مشارکت](docs/i18n/CONTRIBUTING.fa.md) | [مشارکت کنندگان](docs/i18n/CONTRIBUTORS.fa.md) | [FAQ](docs/i18n/FAQ.fa.md) |
| Türkçe | [README](docs/i18n/README.tr.md) | [Hızlı başlangıç](docs/i18n/QUICKSTART.tr.md) | [Katkı](docs/i18n/CONTRIBUTING.tr.md) | [Katkıda bulunanlar](docs/i18n/CONTRIBUTORS.tr.md) | [FAQ](docs/i18n/FAQ.tr.md) |
| Tiếng Việt | [README](docs/i18n/README.vi.md) | [Bắt đầu nhanh](docs/i18n/QUICKSTART.vi.md) | [Đóng góp](docs/i18n/CONTRIBUTING.vi.md) | [Người đóng góp](docs/i18n/CONTRIBUTORS.vi.md) | [FAQ](docs/i18n/FAQ.vi.md) |
| ไทย | [README](docs/i18n/README.th.md) | [เริ่มต้นอย่างรวดเร็ว](docs/i18n/QUICKSTART.th.md) | [การมีส่วนร่วม](docs/i18n/CONTRIBUTING.th.md) | [ผู้มีส่วนร่วม](docs/i18n/CONTRIBUTORS.th.md) | [FAQ](docs/i18n/FAQ.th.md) |
| Bahasa Indonesia | [README](docs/i18n/README.id.md) | [Mulai cepat](docs/i18n/QUICKSTART.id.md) | [Berkontribusi](docs/i18n/CONTRIBUTING.id.md) | [Kontributor](docs/i18n/CONTRIBUTORS.id.md) | [FAQ](docs/i18n/FAQ.id.md) |
| हिन्दी | [README](docs/i18n/README.hi.md) | [त्वरित शुरुआत](docs/i18n/QUICKSTART.hi.md) | [योगदान](docs/i18n/CONTRIBUTING.hi.md) | [योगदानकर्ता](docs/i18n/CONTRIBUTORS.hi.md) | [FAQ](docs/i18n/FAQ.hi.md) |
| Nederlands | [README](docs/i18n/README.nl.md) | [Snelstart](docs/i18n/QUICKSTART.nl.md) | [Bijdragen](docs/i18n/CONTRIBUTING.nl.md) | [Bijdragers](docs/i18n/CONTRIBUTORS.nl.md) | [FAQ](docs/i18n/FAQ.nl.md) |
| Italiano | [README](docs/i18n/README.it.md) | [Avvio rapido](docs/i18n/QUICKSTART.it.md) | [Contribuire](docs/i18n/CONTRIBUTING.it.md) | [Collaboratori](docs/i18n/CONTRIBUTORS.it.md) | [FAQ](docs/i18n/FAQ.it.md) |

---

### 其他资源

- [Ratatoskr 主配置](resources/template/ratatoskr-template.yaml) · [Release 下载](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml)
- [部署指南](config-builder/docs/DEPLOYMENT.md) · [实现路径](config-builder/docs/IMPLEMENTATION.md) · [图标来源](assets/icons/macosicons/README.md)
- [配置工坊 README](config-builder/README.md)
