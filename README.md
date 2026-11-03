<div align="center">

<img src="assets/yggdrasil-mark.png" width="176" alt="Yggdrasil brand mark" />

# Yggdrasil

### Mihomo 配置与订阅工具

以 **Ratatoskr** 为核心配置与共享模板，管理节点、分流策略并生成个人配置。

[简体中文指南](docs/zh-CN.md)　·　[English guide](docs/en.md)　·　[打开配置工坊](https://yakasuka.github.io/yggdrasil/config-builder/)

<br />

[![Mihomo](https://img.shields.io/badge/Core-Mihomo-3282B8?style=flat-square)](https://wiki.metacubex.one/)
[![Geo rules](https://img.shields.io/badge/Rules-GeoSite%20%2B%20GeoIP-537A5A?style=flat-square)](docs/zh-CN.md#配置能力)
[![License](https://img.shields.io/badge/License-Permission%20Required-C4A25A?style=flat-square)](LICENSE)

</div>

---

<table>
<tr>
<td align="center" width="25%"><h3>01 · 使用配置</h3><a href="https://yakasuka.github.io/yggdrasil/config-builder/">打开配置工坊</a><br /><sub>导入订阅、选择策略、生成 YAML</sub></td>
<td align="center" width="25%"><h3>02 · 了解架构</h3><a href="docs/zh-CN.md#项目架构">Yggdrasil × Ratatoskr</a><br /><sub>应用、模板与配置如何协作</sub></td>
<td align="center" width="25%"><h3>03 · 选择配置</h3><a href="docs/zh-CN.md#配置选择">浏览配置目录</a><br /><sub>Ratatoskr、Eb 与网络栈参考</sub></td>
<td align="center" width="25%"><h3>04 · 参与维护</h3><a href="docs/zh-CN.md#开发与部署">开发与部署</a><br /><sub>构建、部署、实现路径</sub></td>
</tr>
</table>

## 项目概览

Yggdrasil 是配置工坊与生成流程所在的应用；**Ratatoskr 是核心 Mihomo 配置，也是应用和地区目录的唯一模板来源。** 配置工坊读取模板，将所选节点、地区和出口组合为个人 YAML 配置。

```text
Subscription / node file → Config Builder → Ratatoskr template → Personal Mihomo YAML
```

Ratatoskr 组织应用分流、Geo 规则、地区筛选和节点策略；Yggdrasil 提供界面与构建流程，让这些配置更容易选择、组合和维护。

## 图标与策略概览

应用和地区图标用于快速识别 Mihomo 面板中的策略组。主配置支持下列节点策略：

<div align="center">

<img src="assets/icons/chatgpt.png" width="48" alt="ChatGPT" />&nbsp;
<img src="assets/icons/claude.png" width="48" alt="Claude" />&nbsp;
<img src="assets/icons/telegram.png" width="48" alt="Telegram" />&nbsp;
<img src="assets/icons/spotify.png" width="48" alt="Spotify" />&nbsp;
<img src="assets/icons/steam.png" width="48" alt="Steam" />&nbsp;
<img src="assets/icons/hk.png" width="48" alt="Hong Kong" />&nbsp;
<img src="assets/icons/jp.png" width="48" alt="Japan" />&nbsp;
<img src="assets/icons/us.png" width="48" alt="United States" />

<br />

<sub>AI · 通信 · 音乐 · 游戏 · 地区分组</sub>

</div>

### 节点策略

| 策略 | 图标 | 作用 |
| :--- | :---: | :--- |
| 手动切换 | 🚀 | 直接选择使用的节点 |
| 自动选择 | ♻️ | 根据 URL 测试结果自动选择节点 |
| 故障转移 | 🔯 | 按顺序使用首个可用节点 |
| 负载均衡 | 🔮 | 一致性哈希让同一目标尽量保持相同出口 |
| 下载均衡 | 📦 | 轮询分配新连接 |

<div align="center">
<img src="assets/icons/switch.png" width="36" alt="Proxy selection icon" />&nbsp;
<img src="assets/icons/proxy.png" width="36" alt="Manual proxy icon" />&nbsp;
<img src="assets/icons/fallback.png" width="36" alt="Failover icon" />&nbsp;
<img src="assets/icons/tracking.png" width="36" alt="Routing icon" />&nbsp;
<img src="assets/icons/global.png" width="36" alt="Download balancing icon" />
<br /><sub>主配置中的策略组图标</sub>
</div>

## 快速导航

| 入口 | 内容 |
| :--- | :--- |
| [中文项目指南](docs/zh-CN.md) | 项目架构、配置能力、配置选择、工坊使用、维护说明与许可 |
| [English overview](docs/en.md) | 英文项目介绍与使用、维护指南 |
| [配置工坊](https://yakasuka.github.io/yggdrasil/config-builder/) | 从订阅或节点文件生成个人配置 |
| [实现路径](config-builder/docs/IMPLEMENTATION.md) | 从界面追踪到模板、生成器和服务 |
| [部署指南](config-builder/docs/DEPLOYMENT.md) | Pages、Worker、KV 部署和检查 |
| [素材与署名](assets/README.md) | 品牌标识、图标来源、预览和署名 |

<div align="center">

**Yggdrasil × Ratatoskr** · 应用与核心配置协同工作

</div>
