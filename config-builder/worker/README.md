# Ratatoskr 配置服务 · 共享业务模块

**当前生产架构：自建 Node 服务直接运行这些模块，Cloudflare 只发布静态文件。** 入口是 [server/index.js](../server/index.js)，路由与 CORS 在 [server/create-server.js](../server/create-server.js)。部署与验收见 [部署指南](../../docs/DEPLOYMENT.md)。

- `application.js`：节点解析、预览、创建订阅、加密快照、实时更新。被后端以 `createWorker()` 直接调用，不再运行在 Worker 运行时。
- `subscriptions.js`：安全拉取机场订阅、真实流量、可选 TCP 检测。域名用 `fetch()`；自建环境里公网 IP 也由 Node `fetch()` 处理，DNS 与 TCP 由 `server/node-platform.js` 注入。
- `ip-fetch.js`：旧的 Cloudflare 原生套接字客户端，仅保留给历史测试；自建后端不会调用它。
- `public-url.js`：域名和 IP 的统一地址检查。
- `crypto.js`：随机 Token 与 AES-GCM，记录写入 `server/data/` 之前已加密。
- `catalog.js`：模板目录加载，默认使用 `shared/catalog.json`。
- `gateway/index.js`：**已弃用，不参与任何构建或部署**。旧 CF Pages `_worker.js` 网关，仅为历史回归测试保留。不要执行 `worker:deploy` 或 `worker:dev`。
- `index.js`：兼容的独立 Worker 入口，同样不再部署。
- `../wrangler.jsonc`：CF Pages 纯静态项目配置，已移除 KV 绑定。

`npm run worker:dev` / `worker:deploy` / `worker:whoami` 是历史命令，不属于新架构的部署链路。所有订阅链接、`/merge` 与 `/sub` 正文都由自建服务返回；`worker/` 里没有任何对外 HTTP 监听。
