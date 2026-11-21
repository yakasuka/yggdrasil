<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Yggdrasil" />
</p>

<h1 align="center">Yggdrasil</h1>

<p align="center">
  Mihomo configuration and subscription tools · Built around the Ratatoskr template
</p>

<p align="center">
  <a href="https://wiki.metacubex.one/"><img src="https://img.shields.io/badge/Core-Mihomo-3282B8?style=flat-square" alt="Core: Mihomo" /></a>
  <a href="https://github.com/yakasuka/yggdrasil/releases/latest"><img src="https://img.shields.io/badge/Release-v1.0.0-537A5A?style=flat-square" alt="Latest release" /></a>
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/License-Permission_Required-C4A25A?style=flat-square" alt="Permission required" /></a>
</p>

<p align="center">
  <a href="README.en.md">Introduction</a> ·
  <a href="QUICKSTART.en.md">Quick start</a> ·
  <a href="CONTRIBUTING.en.md">Contributing</a> ·
  <a href="CONTRIBUTORS.en.md">Contributors</a> ·
  <a href="FAQ.en.md">FAQ</a>
</p>

---

## Language

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja-JP.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [हिन्दी](README.hi.md) · [Nederlands](README.nl.md) · [Italiano](README.it.md)

---

## What is it

**Yggdrasil is the application and tooling; Ratatoskr is its core configuration.** Yggdrasil provides the configuration builder, template parsing, YAML generation, and subscription delivery. Ratatoskr defines the routing rules, region catalog, node filters, and proxy groups.

The builder reads the catalog and rules from the Ratatoskr template, combining selected nodes and outbound strategies into a personal YAML. The template thus serves both as a ready-to-use configuration base and as the shared data source for the catalog and builder.

```text
Subscription / node file → Config Builder → Ratatoskr template → Personal Mihomo YAML
```

**Yggdrasil organizes, generates, and delivers; Ratatoskr is the configuration that reaches the user.**

## Key features

- **Desktop-grade ad blocking.** Includes the AdGuard Windows desktop rule subscription with about 316,000 blocked domains, following the official upstream with lazy, on-change updates.
- **Geo-based lightweight routing.** GeoSite and GeoIP carry classification data; the main configuration is about 28 KB with clear routing intent.
- **Five outbound strategies.** Manual selection, URL-test, failover, consistent-hashing load balancing, and round-robin download balancing.
- **Application and region catalog.** Proxy groups for ChatGPT, Claude, Telegram, Spotify, Steam, and more; region groups for Hong Kong, Taiwan, Japan, Korea, Singapore, the US, with dedicated icons.
- **Automated delivery.** Rule bodies are fetched only when content changes — low resource use and deterministic output. Releases provide a fixed download link and SHA-256 checksum.

## Choose a configuration

Download the main configuration from [Releases](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml) or use [ratatoskr-template.yaml](../../resources/template/ratatoskr-template.yaml) in the repository.

| Need | Entry point |
| :--- | :--- |
| Everyday main configuration | Release fixed link / repository template |
| Generate a personal configuration visually | [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) |
| Full documentation | [Quick start](QUICKSTART.en.md) |

## License and feedback

**All Rights Reserved · Prior written permission required.** Use, operation, modification, redistribution, public deployment, and commercial use of original materials require prior written permission from the rights holder; personal and non-commercial use is included. See [LICENSE](../../LICENSE). Third-party materials remain subject to their own licenses.

Report issues or request permission through [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues). Remove subscription tokens and node credentials from reports.

---

<p align="center"><sub>Yggdrasil × Ratatoskr · configuration tool and core template working together.</sub></p>
