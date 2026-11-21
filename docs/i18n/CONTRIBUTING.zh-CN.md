# 贡献指南

<p align="center">
  <a href="README.zh-CN.md">项目介绍</a> ·
  <a href="QUICKSTART.zh-CN.md">快速开始</a> ·
  <a href="CONTRIBUTING.zh-CN.md">贡献指南</a> ·
  <a href="CONTRIBUTORS.zh-CN.md">贡献者</a> ·
  <a href="FAQ.zh-CN.md">常见问题</a>
</p>

---

## 参与方式

欢迎通过 Issues 反馈问题、申请授权或提出建议。提交问题请附客户端与内核版本、所用配置和预期分流结果，并移除订阅令牌与节点凭据。

## 开发命令

配置工坊前端与共享模板编译器位于 `config-builder/`：

```sh
npm --prefix config-builder ci
npm --prefix config-builder run build
npm --prefix config-builder test
npm --prefix config-builder run service:dev
```

本地服务地址为 `http://localhost:8788/config-builder/`。

## 仓库结构

| 路径 | 职责 |
| :--- | :--- |
| `resources/template/` | 核心配置模板 |
| `resources/rules/` | 规则数据，按来源归类（adguard / aethersailor / download） |
| `config-builder/` | 配置工坊前端、共享编译器与订阅服务 |
| `scripts/rules/` | 规则抓取与同步脚本（懒更新） |
| `scripts/endpoints/` | 旧版 `/merge`、`/sub` 接口 |
| `docs/i18n/` | 多语言 wiki 文档 |

## 新增应用或地区

编辑静态目录 [catalog.json](../../config-builder/shared/catalog.json)，重新构建后页面目录与后端模板会随之更新。完整数据流见 [实现路径](../../config-builder/docs/IMPLEMENTATION.md)。

## 规则更新

规则脚本按懒更新原则运行：通过 ETag / Last-Modified 条件探测，仅在内容变化时拉取正文。两个 GitHub Actions 工作流分别处理 AdGuard 桌面规则与 Aethersailor 规则同步，部署方式见 [部署指南](../../config-builder/docs/DEPLOYMENT.md)。

## 文档

多语言文档位于 `docs/i18n/`。每种语言包含 README、QUICKSTART、CONTRIBUTING、CONTRIBUTORS、FAQ 五个章节。新增语言时复制一套并按下述命名：

```text
README.<语言代码>.md
QUICKSTART.<语言代码>.md
CONTRIBUTING.<语言代码>.md
CONTRIBUTORS.<语言代码>.md
FAQ.<语言代码>.md
```

语言代码采用 BCP 47 规范，如 `zh-CN`、`en`、`pt-BR`。
