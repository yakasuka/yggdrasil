# Ratatoskr 配置服务

生产架构为 **Cloudflare Pages 直接连接 SUBSCRIPTIONS KV**。公开入口同时提供 config-builder 模块和订阅接口，无需独立 Worker 的公网地址或 Service Binding。

- `application.js`：节点解析、预览、创建订阅、加密 KV 快照、实时更新。
- `subscriptions.js`：安全拉取机场订阅、真实流量、可选 TCP 检测。
- `ip-fetch.js`：公网 IP 与自定义端口机场的原生 HTTP / TLS 读取。
- `public-url.js`：域名和 IP 的统一地址检查。
- `crypto.js`：随机 Token 与 AES-GCM。
- `gateway/index.js`：同源公开路由和直接 KV 调用。
- `../wrangler.jsonc`：Pages 项目、KV 绑定与统一输出目录。
- `index.js`：兼容的独立 Worker 入口，当前生产不依赖它。

部署与维护见 [部署指南与故障复盘](../docs/DEPLOYMENT.md)，逐项实现路径见 [IMPLEMENTATION.md](../docs/IMPLEMENTATION.md)。

公开 `/api/inspect` 仅返回节点清单和流量；完整节点只在用户主动预览、下载和持 Token 拉取时交付。KV v3 加密保存用户选择与完整 YAML 快照，并保留 v2 读取兼容。拉取订阅时刷新源节点与流量，不将 Base64 通用订阅直接交给 Mihomo。
