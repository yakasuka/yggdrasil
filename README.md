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
  <a href="https://yakasuka.github.io/yggdrasil/">项目主页</a>　·　<a href="https://yakasuka.github.io/yggdrasil/config-builder/">配置工坊</a>　·　<a href="docs/DEPLOYMENT.md">部署指南</a>
</p>

<!-- SEO: keywords, positioning and key facts. Keep in sync with resources/scripts/repo-metadata.mjs and index.html. -->
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
- [部署指南](docs/DEPLOYMENT.md) · [实现路径](docs/IMPLEMENTATION.md) · [图标来源](assets/icons/macosicons/README.md) · [配置工坊 README](config-builder/README.md)

### 目录结构

```text
.github/workflows/   CI：规则同步、静态站构建、Release、后端冒烟测试
assets/             站点首页与配置工坊共用的图标、图片
config-builder/     配置工坊：静态前端 + Node 后端 + 测试 + 部署模板
docs/               项目级文档：中文 / English / 部署指南 / 实现路径
functions/          Cloudflare Pages 边缘代理（订阅、流量、管理后台）
resources/          Ratatoskr 模板、规则源与自动化脚本（元数据、规则生成）
sponsor/            打赏页静态资源
index.html          项目主页（GitHub Pages 根）
service.json        静态站指向后端的地址（必须在仓库根）
_redirects / _routes.json / robots.txt / sitemap.xml
                    Cloudflare Pages 路由与 SEO 文件（必须在仓库根）
```

`index.html`、`assets/`、`config-builder/`、`sponsor/`、`functions/` 与根级路由文件由 GitHub Pages / Cloudflare Pages 直接读取，路径不可更改；其他内容按用途归类，后端部署模板已收进 `config-builder/deploy/`。

### 赞助支持

如果 Yggdrasil 帮到了你，可以用一杯咖啡支持后续维护。点击下方链接，选择 **微信 / 支付宝 / PayPal** 任意方式打赏：

<pre><code><a href="https://yakasuka.github.io/yggdrasil/sponsor/">https://yakasuka.github.io/yggdrasil/sponsor/</a>  →  打开打赏页面</code></pre>

### 贡献者

<p align="center">
  <a href="https://github.com/yakasuka"><img src="https://avatars.githubusercontent.com/u/39859629?v=4" width="40" height="40" alt="yakasuka" /></a>&nbsp;
  <a href="https://github.com/codex"><img src="https://avatars.githubusercontent.com/u/267193182?v=4" width="40" height="40" alt="Codex" /></a>&nbsp;
  <a href="https://github.com/claude"><img src="https://avatars.githubusercontent.com/u/81847?v=4" width="40" height="40" alt="Claude" /></a>&nbsp;
  <a href="https://github.com/cursoragent"><img src="https://avatars.githubusercontent.com/u/199161495?v=4" width="40" height="40" alt="Cursor Agent" /></a>&nbsp;
  <a href="https://github.com/EaibeeKitajima"><img src="https://avatars.githubusercontent.com/u/105159380?v=4" width="40" height="40" alt="Eaibee Kitajima" /></a>&nbsp;
  <a href="https://github.com/tobyxdd"><img src="https://avatars.githubusercontent.com/u/1414953?v=4" width="40" height="40" alt="tobyxdd" /></a>&nbsp;
  <a href="https://github.com/Zephyruso"><img src="https://avatars.githubusercontent.com/u/176294927?v=4" width="40" height="40" alt="Zephyruso" /></a>&nbsp;
  <a href="https://github.com/Dreamacro"><img src="https://avatars.githubusercontent.com/u/8615343?v=4" width="40" height="40" alt="Dreamacro" /></a>&nbsp;
  <a href="https://github.com/Aethersailor"><img src="https://avatars.githubusercontent.com/u/22260104?v=4" width="40" height="40" alt="Aethersailor" /></a>&nbsp;
  <a href="https://github.com/Fndroid"><img src="https://avatars.githubusercontent.com/u/16091562?v=4" width="40" height="40" alt="Fndroid" /></a>&nbsp;
  <a href="https://github.com/apps/github-actions"><img src="https://avatars.githubusercontent.com/in/15368?v=4" width="40" height="40" alt="github-actions[bot]" /></a>&nbsp;
  <a href="https://github.com/apps/dependabot"><img src="https://avatars.githubusercontent.com/in/29110?v=4" width="40" height="40" alt="dependabot[bot]" /></a>
</p>

<p align="center"><sub>项目由 yakasuka 主导维护，AI 助手、自动化机器人与开源社区的上游作者共同参与。</sub></p>

### 致谢 / 上游项目

本项目的内核、规则与界面建立在以下开源成果之上，谨此致谢：

| 上游项目 | 作者 / 组织 | 在本项目中的作用 |
| :--- | :--- | :--- |
| [Mihomo](https://github.com/MetaCubeX/mihomo) | [MetaCubeX](https://github.com/MetaCubeX) | 配置所面向的核心内核 |
| [Hysteria](https://github.com/apernet/hysteria) | [tobyxdd](https://github.com/tobyxdd) | Hysteria2 协议支持 |
| [AdGuard Filters](https://github.com/AdguardTeam/AdguardFilters) | [AdGuardTeam](https://github.com/AdguardTeam) | 桌面级广告拦截规则来源 |
| [zashboard](https://github.com/Zephyruso/zashboard) | [Zephyruso](https://github.com/Zephyruso) | 面板界面参考 |
| [Custom OpenClash Rules](https://github.com/Aethersailor/Custom_OpenClash_Rules) | [Aethersailor](https://github.com/Aethersailor) | 自定义分流规则来源 |
| [ACL4SSR](https://github.com/ACL4SSR/ACL4SSR) | [ACL4SSR](https://github.com/ACL4SSR) | 规则分类与组织方式参考 |
| [Clash 配置生态](https://github.com/Dreamacro) | [Dreamacro](https://github.com/Dreamacro) | Clash 配置生态奠基（原仓库已归档） |
| [Clash for Android](https://github.com/Fndroid) | [Fndroid](https://github.com/Fndroid) | 客户端生态参考（原仓库已归档） |
| [macOSicons](https://macosicons.com/) | 见[图标来源表](assets/icons/macosicons/README.md) | 策略组图标素材 |

<p align="center"><sub>以上均为各自上游项目的作品，权利归原作者所有；本项目仅作引用与整合。</sub></p>
