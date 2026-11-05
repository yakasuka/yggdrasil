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
  <a href="config-builder/docs/DEPLOYMENT.md">部署并打开配置工坊 →</a>
</p>

<p align="center">
  <a href="https://wiki.metacubex.one/"><img src="https://img.shields.io/badge/Core-Mihomo-3282B8?style=flat-square" alt="Mihomo" /></a>
  <a href="docs/zh-CN.md#配置能力"><img src="https://img.shields.io/badge/Rules-GeoSite%20%2B%20GeoIP-537A5A?style=flat-square" alt="GeoSite and GeoIP" /></a>
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

- [中文指南：架构、规则、配置选择与使用说明](docs/zh-CN.md)
- [English guide](docs/en.md)
- [Ratatoskr 主配置](resources/ratatoskr.yaml) · [地区扩展版](resources/template/ratatosk-Eb.yaml) · [网络栈参考](resources/yggdrasil.yaml)
- [部署指南](config-builder/docs/DEPLOYMENT.md) · [实现路径](config-builder/docs/IMPLEMENTATION.md) · [图标来源](assets/icons/macosicons/README.md)

