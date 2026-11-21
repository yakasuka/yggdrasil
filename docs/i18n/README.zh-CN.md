<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Yggdrasil 项目标识" />
</p>

<h1 align="center">Yggdrasil</h1>

<p align="center">
  Mihomo 配置与订阅工具 · 以 Ratatoskr 为核心模板
</p>

<p align="center">
  <a href="https://wiki.metacubex.one/"><img src="https://img.shields.io/badge/Core-Mihomo-3282B8?style=flat-square" alt="内核：Mihomo" /></a>
  <a href="https://github.com/yakasuka/yggdrasil/releases/latest"><img src="https://img.shields.io/badge/Release-v1.0.0-537A5A?style=flat-square" alt="最新版本" /></a>
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/License-Permission_Required-C4A25A?style=flat-square" alt="使用前须取得书面许可" /></a>
</p>

<p align="center">
  <a href="README.zh-CN.md">项目介绍</a> ·
  <a href="QUICKSTART.zh-CN.md">快速开始</a> ·
  <a href="CONTRIBUTING.zh-CN.md">贡献指南</a> ·
  <a href="CONTRIBUTORS.zh-CN.md">贡献者</a> ·
  <a href="FAQ.zh-CN.md">常见问题</a>
</p>

---

## 语言 / Language

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja-JP.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [हिन्दी](README.hi.md) · [Nederlands](README.nl.md) · [Italiano](README.it.md)

---

## 项目是什么

**Yggdrasil 是应用与工具集合，Ratatoskr 是其中的核心配置。** Yggdrasil 提供配置工坊、模板解析、配置生成与订阅交付；Ratatoskr 定义 Mihomo 的应用规则、地区目录、节点筛选和策略组。

配置工坊读取 Ratatoskr 模板中的目录与规则，将用户选择的节点和出口组合成个人 YAML。这样模板既是可直接使用的配置基础，也是应用目录与生成器共同遵循的数据来源。

```text
订阅 / 节点文件 → 配置工坊 → Ratatoskr 模板 → 个人 Mihomo 配置
```

**Yggdrasil 负责组织、生成与交付；Ratatoskr 是抵达使用者手中的配置本体。**

## 核心特性

- **桌面级广告拦截。** 内置 AdGuard Windows 桌面规则订阅，约 316,005 条拦截域名，跟随官方上游自动更新、按需拉取。
- **Geo 轻量分流。** GeoSite / GeoIP 承载分类数据，主配置本体约 28 KB，规则意图清晰可读。
- **五大出口策略。** 手动切换、自动选择、故障转移、一致性哈希负载均衡、轮询下载均衡。
- **应用与地区目录。** ChatGPT、Claude、Telegram、Spotify、Steam 等应用策略组，港 / 台 / 日 / 韩 / 新 / 美等地区分组，附专属图标。
- **自动化交付。** 规则只有变化时才拉取正文，低资源占用、确定性输出；Release 提供固定直链与 SHA-256 校验。

## 配置选择

主配置从 [Release 下载](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml)，或直接使用仓库中的 [ratatoskr-template.yaml](../../resources/template/ratatoskr-template.yaml)。

| 需求 | 入口 |
| :--- | :--- |
| 日常主配置 | Release 固定直链 / 仓库模板文件 |
| 可视化生成个人配置 | [配置工坊](https://yakasuka.github.io/yggdrasil/config-builder/) |
| 完整文档与说明 | [快速开始](QUICKSTART.zh-CN.md) |

## 许可与反馈

**All Rights Reserved · 使用前须取得书面许可。** 原创内容的运行、修改、再分发、公开部署及商业使用须事先取得权利人书面许可，个人与非商业用途同样适用。完整条款见 [LICENSE](../../LICENSE)。第三方素材遵循各自许可。

通过 [Issues](https://github.com/yakasuka/yggdrasil/issues) 反馈问题或申请授权，提交时请移除订阅令牌与节点凭据。

---

<p align="center"><sub>Yggdrasil × Ratatoskr · 配置工具与核心模板协同工作。</sub></p>
