## Ratatoskr 主配置

Ratatoskr 是 Yggdrasil 项目的核心成品：一份面向 Mihomo / OpenClash 的主配置模板，把浏览器插件版 AdGuard 广告拦截、GeoSite / GeoIP 精准分流与多策略出口编排，收敛进一份可持续自动更新的 YAML 配置。

> 版本 `{{TAG}}` · 发布于 {{DATE}}

---

### 核心亮点

- **浏览器插件级广告拦截** — 内置 AdGuard 浏览器插件版规则订阅，约 **32.0 万** 条拦截域名；由 GitHub Actions 懒加载同步，仅在上游规则变化时拉取正文，低资源占用、确定性输出。
- **Geo 轻量分流** — 域名交给 GeoSite、IP 交给 GeoIP，配置本体约 **28 KB**，规则编排清晰、易维护。
- **五大出口策略** — 手动切换 / 自动选择 / 故障转移 / 一致性哈希负载均衡 / 轮询下载均衡，覆盖不同连接需求。
- **应用与地区目录** — ChatGPT、Claude、Telegram、Spotify、Steam 等应用策略组，港 / 台 / 日 / 韩 / 新 / 美等地区节点分组，面板中配有专属图标。
- **自动化交付** — 规则源、路由意图、出口策略与节点来源分层维护，配置工坊可按需组装个人配置。

### 下载

| 文件 | 说明 |
| :--- | :--- |
| [`ratatoskr-template.yaml`](https://github.com/yakasuka/yggdrasil/releases/download/{{TAG}}/ratatoskr-template.yaml) | 日常主配置（本 Release 附件） |

**固定直链**（始终指向最新版本，可直接导入客户端）：

```
https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml
```

- **SHA-256**：`{{SHA256}}`
- **文件大小**：见附件详情

### 快速开始

1. 确认已取得相应授权，条款见 [LICENSE](https://github.com/yakasuka/yggdrasil/blob/main/LICENSE)。
2. 下载上方附件或导入固定直链到 Mihomo / OpenClash 客户端。
3. 填入自己的节点订阅，按应用或地区选择出口并执行延迟测试。

> 使用前请阅读文档中的 [许可与反馈](https://github.com/yakasuka/yggdrasil/blob/main/docs/zh-CN.md#许可与反馈) 一节。

### 本次更新

{{CHANGELOG}}

### 文档与链接

- [中文指南](https://github.com/yakasuka/yggdrasil/blob/main/docs/zh-CN.md) · [English](https://github.com/yakasuka/yggdrasil/blob/main/docs/en.md)
- [配置工坊部署](https://github.com/yakasuka/yggdrasil/blob/main/docs/DEPLOYMENT.md) · [项目主页](https://yakasuka.github.io/yggdrasil/) · [源码仓库](https://github.com/yakasuka/yggdrasil)

### 更新机制

每次推送 `v*` 标签或手动运行 **Publish core config to Releases** 工作流，都会就地更新本 Release 的附件、校验值与说明，无需重新创建 Release。

---

<sub>All Rights Reserved · 使用前须取得书面许可 · Yggdrasil × Ratatoskr</sub>
