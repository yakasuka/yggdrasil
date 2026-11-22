# Yggdrasil · config-builder

**配置工坊** · [部署指南与复盘](docs/DEPLOYMENT.md) · [项目介绍](../README.md) · [完整实现路径](docs/IMPLEMENTATION.md) · [服务准备](worker/README.md)

五步配置：机场订阅 → 解析节点 → 地区节点 → 节点策略 → APP 分流 → 最终确认。“解析节点”是第 1、2 步之间的状态项，不可选择。

## 架构：静态前端 + 自建后端

```text
浏览器（Cloudflare Pages / GitHub Pages，纯静态文件）
        │ 跨源 fetch（只提交机场链接、取回清单与链接）
        ▼
自建 Node 服务  server/index.js  ← 唯一的节点数据来源
  ├─ /api/status                健康检查
  ├─ /api/inspect               节点与流量清单
  ├─ /api/preview               完整 YAML 预览 / 下载
  ├─ /api/subscriptions         创建订阅，直接返回后端链接
  ├─ /api/latency               可选 TCP 检测
  ├─ /api/endpoints             后端吐出所有公开链接
  ├─ /api/presets               分享码：保存 / 读取配置选择
  ├─ /config-builder?token=<名称>[&pwd=<口令>]  唯一订阅链接，浏览器可直接查看
  └─ server/data/               加密记录（替代 Cloudflare KV）
```

服务是公开 API：用户把自己机场 / 自建节点的订阅地址交给后端，在页面选择地区、策略、APP 与规则模块，创建订阅后得到一条以配置名称为凭据的链接 `/config-builder?token=guagua`，可直接放入任意 Mihomo / Clash Meta 客户端，也可粘贴到浏览器直接查看 YAML（不强制下载）。配置由 `shared/template-render.js` 在 `ratatoskr-template.yaml` 原文上定点编辑生成：完整保留分区注释、flow 单行格式、锚点与 `GEOSITE`/`GEOIP` 客户端规则；节点通过 `proxy-providers` 引用机场原始订阅地址，由客户端直接远程拉取，节点更新即时生效，且配置文件不内联节点、不写 `geox-url`。旧的 `/subscription/<id>/<key>.yaml` 链接已彻底移除。没有共享 TOKEN，也不需要私有 GitHub 仓库。

链接里的 `token` 来自用户填写的「配置名称」（3–60 位字母、数字、`_` 或 `-`，空格转 `-`，不区分大小写）。确认页还可填 1–64 位的「访问口令」（可选）：口令参与存储键派生，同名配置配不同口令就能各自保留好记的名字；同名同口令仍返回 409。口令以 SHA-256 摘要参与键名，明文不落盘，但会原样出现在订阅链接里——它不是私密密码，知道链接的人都能读取配置，请只通过私密渠道传递。不带口令的历史链接继续有效。

**分享配置：** 最终确认页可生成一串 36 位十六进制分享码（例如 `fffa18b5ff005bba7a19928f3e8626974ebe`），别人在「订阅来源」页粘贴该码即可导入地区、策略、APP、规则模块与客户端选项。分享码默认**不含机场订阅地址**；只有勾选「同时包含机场订阅地址」才会保存，导入后可直接解析。持有分享码即可读取其中内容，含机场地址时请勿公开传播。分享码与订阅链接是两套独立凭据：前者分享选择，后者读取节点配置。

Cloudflare Pages 与 GitHub Pages **只发布静态资源**：`index.html`、`assets/app.js`、`assets/app.css`、图标和 `service.json`。构建产物中不包含 `_worker.js`、`_routes.json`、KV 绑定或任何读取节点的 Functions 逻辑；CF 不会经手节点内容，也就不会被误判。旧的 `/merge`、`/sub` 私有仓库链路已完全移除。

两套前端共用同一份 `assets/app.js`。后端地址按顺序取自：

1. `config-builder/index.html` 中的 `<meta name="yggdrasil:service" content="…">`；
2. 构建时的 `SERVICE_BASE_URL` 环境变量（注入 bundle 与跳转页）；
3. 仓库根 / 静态站根目录的 `service.json`（`{"service":"https://…"}`，页面加载时动态读取）；
4. 同源（仅用于把页面与 API 反代到同一域名时）。

前三项都不需要重新构建即可切换后端。`merge/index.html` 和 `sub/index.html` 是纯跳转页，同样按 meta → `service.json` 的顺序解析，把 `?token=` 原样转给后端；它们本身不读取、不缓存、不展示节点。

## 目录

```text
config-builder/
├── server/                    # 自建后端：入口、配置、文件存储、路由、Node 适配
│   ├── index.js               # node server/index.js
│   ├── create-server.js       # 公开路由、CORS、链接改写、merge/sub
│   ├── config.js / storage.js / node-platform.js / env-file.js
│   └── .env.example           # 复制为 server/.env 后填写
├── src/                       # 向导：app.js、panels/、config.js、service.js、ui.js
├── shared/                    # 模板解析、节点、编译器、公开路径（前后端共用）
├── worker/                    # 可复用的业务逻辑模块（不再部署为 CF Worker）
├── scripts/                   # 前端构建与统一静态产物生成
├── tests/                     # 测试与测试订阅文件
├── assets/                    # 自动生成的页面资源
├── wrangler.jsonc             # CF Pages 纯静态项目配置（无 KV）
└── docs/DEPLOYMENT.md         # 后端、CF Pages、GitHub Pages 部署与验收
仓库根 deploy/                 # systemd / Docker / Nginx 示例
仓库根 merge/ sub/ service.json # GitHub Pages 的跳转页与服务地址
```

目录数据由 [shared/catalog.json](shared/catalog.json) 静态维护。修改后运行完整 `npm run build`、测试，再同步 `assets/` 与 `shared/catalog.json`。

## 命令

```sh
cd config-builder
npm ci
npm test

# 后端
cp server/.env.example server/.env     # 填 PUBLIC_BASE_URL / ALLOWED_ORIGINS
npm run server                         # http://127.0.0.1:8788

# 前端（两个静态站同一份产物）
SERVICE_BASE_URL=https://api.example.com npm run build
```

`worker/gateway/dist/` 是 Cloudflare Pages 的构建输出目录；GitHub Pages 发布仓库根目录，由 [sync-static.yml](../.github/workflows/sync-static.yml) 把同一批产物提交到 `config-builder/` 和 `service.json`。

## 订阅、存储与链接

浏览器只把机场链接提交给后端 `/api/inspect`，后端拉取、解码后仅返回脱敏清单；预览、下载与持久订阅由后端生成。创建订阅时后端直接返回 `https://<后端域名>/config-builder?token=<配置名称>[&pwd=<口令>]`，链接不经过 CF 或 GitHub Pages，并以 `text/plain` 内联返回 YAML。

KV v3 的 AES-GCM 加密记录改存 `server/data/`（每记录一个文件，按有效期清理）。服务端为每条订阅保留随机 128 位 ID 与独立 256 位密钥，并把「配置名称 + 可选口令」的 SHA-256 摘要映射到这对凭据；口令明文不落盘——没有共享 TOKEN、不读私有仓库。后端 `/api/endpoints` 只返回链接模板，不返回任何凭据。

完整订阅链接与生成的 YAML 都包含敏感访问能力，分享问题时应移除凭据。平台界面与额度可能变化，部署与验收细节见 [部署指南](docs/DEPLOYMENT.md)。
