# config-builder · 自建后端部署指南

本文面向 [yakasuka/yggdrasil](https://github.com/yakasuka/yggdrasil) 的维护者与获得授权的部署者。仓库不包含真实域名、凭据或机场订阅。示例中的 `api.example.com` 必须替换为你自己的地址。

## 1. 最终架构

```text
浏览器 / Mihomo 客户端
   │
   ├─ 页面：Cloudflare Pages 或 GitHub Pages（纯静态文件，功能完全一致）
   │        /config-builder/  向导（订阅来源 → 地区 → 策略 → APP → 规则模块 → 确认）
   │        service.json      后端地址（仅一个 URL，无凭据）
   │
   └─ 数据：自建 Node 服务（唯一的节点数据来源，公开 API）
            /api/status /api/inspect /api/preview /api/subscriptions
            /api/latency /api/endpoints /api/presets
            /config-builder?token=<名称>[&pwd=<口令>]  唯一订阅链接，内联返回 YAML
            server/data/  加密记录
```

服务是**公开 API**：用户在页面填入自己的机场 / 自建节点订阅地址，选择地区、策略、APP 与规则模块，创建订阅后得到一条以配置名称（可选加访问口令）为凭据的链接 `/config-builder?token=guagua`，可直接放进任意 Mihomo / Clash Meta 客户端；浏览器打开时以 `text/plain` 内联显示 YAML，不触发下载。配置由 `shared/template-render.js` **在模板 `ratatoskr-template.yaml` 原文上定点编辑**生成：完整保留分区注释、flow 单行格式、锚点与 `GEOSITE`/`GEOIP` 客户端规则，节点通过 `proxy-providers` 引用机场原始订阅地址由客户端直接远程拉取，不内联节点、不写 `geox-url`。旧的 `/subscription/<id>/<key>.yaml` 链接已彻底移除。

没有共享 TOKEN、不读私有 GitHub 仓库。默认的规则与模板来自仓库示例 `resources/template/ratatoskr-template.yaml` 的同源快照 `shared/catalog.json`。

Cloudflare 托管静态文件，**外加两个仅做透明反向代理的 Pages Functions**：`functions/config-builder.js` 与 `functions/config-builder/status.js`（共享逻辑在 `config-builder/shared/pages-proxy.js`，由仓库根 `_routes.json` 限定只在这两条路径激活）。它们只把带 `token` 的订阅请求 `fetch` 到自建后端、原样回传 YAML/流量 JSON——**不做重定向、不解析、不存储任何节点数据**，因此不会因识别节点内容而误封账号。若不接受任何 Functions，可删除 `functions/` 与 `_routes.json`，此时公开链接需改回后端直链（把 `yggdrasil:public` meta 指向后端域名）。`worker/` 目录的节点解析、编译、加密等逻辑是**被 `server/` 直接 import 的普通模块**；`worker/gateway/index.js` 是弃用的旧 CF 网关，仅用于历史回归测试，任何构建都不会打包它，不要部署。

旧的 `/merge`、`/sub` 私有仓库链路（TOKEN + GH_TOKEN + 静态跳转页 + CF Functions）已完全移除。

## 2. 部署后端

### 2.1 配置

```sh
cd config-builder
npm ci
cp server/.env.example server/.env
```

编辑 `server/.env`（真实 `.env` 已被 `.gitignore` 排除）：

| 变量 | 作用 | 建议 |
| --- | --- | --- |
| `HOST` / `PORT` | 监听地址 | `127.0.0.1` / `8788`，由 Nginx 反代 |
| `DATA_DIR` | 加密记录目录 | `./server/data`，已加入 `.gitignore`，务必持久化备份；分享码与其中的 `.preset-key` 也在这里 |
| `PRESET_TTL` | 分享码有效期（秒） | 默认 `0` 表示永久有效；设置后过期自动清理 |
| `PUBLIC_BASE_URL` | **生成订阅链接的对外源地址** | 填 `https://api.example.com`，否则链接会用内网 Host |
| `TRUST_PROXY` | 是否信任 `X-Forwarded-*` | 前面有反代时设为 `true` |
| `ALLOWED_ORIGINS` | 允许调用 API 的前端源，逗号分隔 | `https://yggdrasil-afx.pages.dev,https://yakasuka.github.io` |
| `ADMIN_USERS` | 管理后台与 API 的 Basic 账号，逗号分隔 `用户:密码` | 例如 `admin:change-me`；留空则禁用管理端 |
| `PUBLIC_LINK_BASE` | 管理后台里展示的订阅链接前缀（含挂载路径） | `https://yggdrasil-afx.pages.dev/config-builder`；留空则用后端自身地址 |
| `TEMPLATE_URL` | `bundled`（用 `shared/catalog.json`，仓库示例模板快照）或带 `x-configurator` 元数据的远程模板 | 默认 `bundled` |
| `TCP_PROBE_ENABLED` | 可选 TCP 检测 | 默认 `false`，需要时设 `true` |

`ALLOWED_ORIGINS` 留空时允许任意来源（服务日志会提示 `cors: open`）；上线前务必填成自己的两个静态站域名。`GET /api/status` 返回 `cors: restricted | open`，可用于核对。

**没有需要保密的共享凭据**。新订阅的对外凭据是用户在「配置名称」里填写的 token（3–60 位字母、数字、`_` 或 `-`，空格转 `-`，不区分大小写），外加确认页可选的 1–64 位访问口令；口令参与存储键派生（SHA-256 摘要，明文不落盘），同名配置配不同口令即可共存，同名同口令返回 409。服务端把「名称 + 口令」映射到内部随机 128 位 ID 与独立 256 位密钥，密钥不落盘。口令会原样出现在链接里，不是私密密码，把整条链接当作凭据保管；不带口令的历史链接继续有效。旧的 `/subscription/<id>/<key>.yaml` 路由已移除。`service.json`、静态文件与 workflow 里都只有公开 URL。

**管理后台：** 设置 `ADMIN_USERS` 后，浏览器打开 `https://<后端域名>/config-builder/dashboard` 并用同一组 Basic 账号密码登录，即可列出全部配置（名称、是否带口令、创建/过期时间、可复制的订阅链接）并删除任意配置——带口令的配置也能删（按内部 id 定位，无需明文口令）。它复用 `GET/DELETE /api/admin/configs`，不配置 `ADMIN_USERS` 时后台与接口都返回 401，且不在前端或 `/api/endpoints` 中暴露。Nginx 需把 `/config-builder/dashboard` 一起反代到后端（常规路径反代已覆盖）。

若从旧的私有仓库链路迁移：删除 CF 项目里的 `TOKEN`、`GH_TOKEN`、`SERVICE_TOKEN` 变量，下线旧的独立 Worker（`worker/wrangler.jsonc` 含 KV 绑定，已弃用，不要执行 `worker:deploy`），也不要保留任何读取节点正文的旧 Pages Functions。当前唯一需要的是仓库根 `functions/` 下的两个透明代理函数；CF Git 集成部署会自动识别它们，无需手动配置 KV 或环境变量。两个静态站的 `service.json` / `SERVICE_BASE_URL` 都指向同一个后端域名。

### 2.2 运行

直接运行：

```sh
npm run server          # 或 node server/index.js
curl http://127.0.0.1:8788/api/status
```

systemd（把仓库放在 `/opt/yggdrasil-service`，服务单元见 `deploy/yggdrasil.service`）：

```sh
sudo cp ../deploy/yggdrasil.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now yggdrasil
journalctl -u yggdrasil -f
```

Docker（构建上下文为**仓库根目录**）：

```sh
docker build -f deploy/Dockerfile -t yggdrasil-service .
docker run -d --name yggdrasil -p 8788:8788 \
  --env-file config-builder/server/.env \
  -e HOST=0.0.0.0 -e PORT=8788 \
  -v yggdrasil-data:/app/config-builder/server/data \
  yggdrasil-service
```

TLS 建议放在前面，见 [deploy/nginx.conf.example](../../deploy/nginx.conf.example)。反代后设置 `PUBLIC_BASE_URL=https://api.example.com` 与 `TRUST_PROXY=true`，后端只监听 8788。

## 3. 部署两个静态前端

### 3.1 Cloudflare Pages（纯静态）

在 **Workers & Pages → 创建应用 → Pages → 连接 Git** 中选择仓库：

| 设置 | 填写内容 |
| --- | --- |
| Project name | 与 `config-builder/wrangler.jsonc` 的 `name` 一致 |
| Production branch | `main` |
| Framework preset | `None` |
| Root directory | `config-builder` |
| Build command | `npm ci && npm run build && npm test` |
| Build output directory | `worker/gateway/dist` |
| Environment variable | `NODE_VERSION=22`、`SERVICE_BASE_URL=https://api.example.com` |

`SERVICE_BASE_URL` 在 CF Pages 项目里配置**一次**即可：构建时注入前端 bundle 与 `service.json`。不要创建 KV namespace、不要绑定 `SUBSCRIPTIONS`、不要执行 `worker:deploy` 或 `worker:dev`。`config-builder/wrangler.jsonc` 已移除 `kv_namespaces`；发布包里也没有 `_worker.js`。若 CF 项目部署的是**仓库根目录**，把 `SERVICE_BASE_URL` 同样加进该项目的变量。

### 3.2 GitHub Pages（仓库根目录）

GitHub Pages 发布的是仓库根目录，不是 `worker/gateway/dist`。仓库已包含：

- `config-builder/index.html` + `config-builder/assets/app.js|css`：向导（与 CF 同一份 bundle）；
- `service.json`：`{"service":"https://api.example.com"}`，前端在 meta 为空时读取它。

在 GitHub 仓库设置 repository variable `SERVICE_BASE_URL=https://api.example.com`。之后 [sync-static.yml](../../.github/workflows/sync-static.yml) 会在源码变更时重新构建、测试并提交上述静态文件；也可手动 `workflow_dispatch`。本地等价操作：

```sh
cd config-builder
SERVICE_BASE_URL=https://api.example.com npm run build
npm test
cd .. && git add config-builder/index.html config-builder/assets/app.js config-builder/assets/app.css service.json && git commit
```

只想快速改地址、不想重新构建时，直接编辑仓库根 `service.json`（页面加载时动态读取）或 `config-builder/index.html` 的 `<meta name="yggdrasil:service">`。这两个文件都只含一个公开 URL，不含凭据。

### 3.3 两套前端如何保持一致

- 同一个 `assets/app.js`，同一套 `SERVICE_ROUTES`，同一个后端地址；
- 前端所有请求经 `src/config.js` 的 `apiFetch()` 发出，`credentials: "omit"`；
- `/api/status` 校验后端 `version` 与前端 catalog 版本，不一致时向导停止；
- 订阅、预览、下载链接都由后端返回，静态站不代管、不缓存、不改写。

## 4. 订阅调用链路

后端 `/api/endpoints` 会吐出全部公开链接模板：

```json
{
  "service": "https://api.example.com",
  "create": "https://api.example.com/api/subscriptions",
  "config": "https://api.example.com/config-builder",
  "config": "https://api.example.com/config-builder",
  "preset": "https://api.example.com/api/presets",
  "frontends": ["https://yggdrasil-afx.pages.dev", "https://yakasuka.github.io"]
}
```

流程：

1. 页面加载时 `/api/status` 探测后端；未就绪则向导停止并提示重试。
2. 用户填入机场订阅地址 → `/api/inspect` 由后端解析、只返回脱敏节点清单；可选 `/api/latency` 做服务端 TCP 建连耗时。
3. 用户选择地区、策略、APP 与规则模块 → `/api/preview` 生成完整 YAML 供预览 / 下载。
4. 「生成订阅链接」→ `POST /api/subscriptions`，后端把选择与节点快照 AES-GCM 加密写入 `server/data/`，并把配置名称（可选加访问口令）映射到内部随机凭据，返回 `https://api.example.com/config-builder?token=guagua`（填写口令时链接另带 `&pwd=<口令>`；流量接口为 `/config-builder/status?token=guagua[&pwd=<口令>]`）。
5. 把这条链接放进 Mihomo / Clash Meta 客户端，或直接在浏览器打开查看 YAML。每次更新订阅时，后端重新解析机场、刷新节点与流量，按最新模板与用户所选规则模块实时生成配置。

链接本身即凭据：对外是用户选择的配置名称（可加可选访问口令，口令明文写在链接里，请私密传递），对内是随机 128 位 ID + 独立 256 位密钥，不依赖共享 TOKEN。`GET /config-builder/status?token=<名称>[&pwd=<口令>]` 可刷新流量报告。分享问题时务必移除完整链接。

### 分享码

分享码是另一条独立链路：`POST /api/presets` 接收 `{ profile, includeProviders }`，返回 `{ code, url, includeProviders }`；`GET /api/presets/<code>` 取回选择。码为 18 字节随机数转成的 36 位十六进制（144 位熵），本身即访问凭据。服务端只保存字段白名单内的内容，默认剥离机场订阅地址；勾选包含时用服务器本地生成的 AES-256-GCM 密钥加密，密钥文件 `server/data/.preset-key` 权限 `0600`，请勿删除，否则旧分享码无法读取。分享码默认永久有效，可用 `PRESET_TTL` 设置秒数。请求体上限 64 KB，未知地区 / APP / 模块 ID 在导入时按当前 catalog 过滤。

分享码只携带选择，不携带节点或订阅 YAML，也不会替换订阅链接。含机场地址的分享码等于把节点访问能力交出去，应通过私下渠道传递。

GitHub 侧的 [call-service.yml](../../.github/workflows/call-service.yml) 仅做只读冒烟测试：读取 `/api/status` 与 `/api/endpoints`，只输出状态码与链接模板，不保存任何节点内容到仓库或日志。

## 5. 发布后验收

```sh
curl https://api.example.com/api/status
curl https://api.example.com/api/endpoints
```

`/api/status` 应返回 200、`ready: true`、`storage: "self-hosted"`，`service` 与 `endpoints` 是你的公网地址，`cors` 为 `restricted`。页面与接口的 catalog `version` 必须一致。

1. 打开 `https://<CF Pages 域名>/config-builder/` 与 `https://yakasuka.github.io/yggdrasil/config-builder/`，两处都应显示“订阅服务已连接”，且“当前服务”是同一个后端域名。
2. 填入测试订阅，由后端 `/api/inspect` 解析节点与地区。
3. 在「规则模块」步骤切换几个按钮块，预览配置，核对对应规则确实出现 / 消失。
4. 预览并下载 `Example-ratatoskr.yaml`，核对节点、地区去留与 `[P1]` / `[P2]` 标识。
5. 创建订阅，确认 `/api/subscriptions` 返回 201；前端改写后的链接形如 `https://<CF Pages 域名>/config-builder?token=<配置名称>[&pwd=<口令>]`（**无 `/yggdrasil` 层级、无 `.yaml` 后缀**）。用 `curl -I` 检查该链接应返回 **200 而非 302/308**，`Location` 头为空，响应体是 YAML 文本（`Content-Type: text/plain`、`Subscription-Userinfo` 存在）；即 CF 边缘函数就地代理，地址栏始终停在 CF 域名。同名同口令重复创建应返回 409；同名不同口令应各自成功。流量链接 `https://<CF Pages 域名>/config-builder/status?token=…&pwd=…` 同样应为 200 且不跳转。
6. 在确认页生成分享码并在另一浏览器打开静态站，于「订阅来源」页粘贴导入，核对地区 / 策略 / 规则模块一致且机场地址未被带入（除非已勾选包含）；服务日志不应出现分享码内容。
7. 访问静态站的 `/config-builder/wrangler.jsonc`、`/config-builder/src/app.js`、`/_worker.js`，应返回 404；仓库里没有独立的 `_worker.js`（站点只用 `functions/` 下的两个 Pages Functions 做透明代理）。无 token 访问 `/config-builder/` 应正常显示向导页，而非被代理函数拦截。
8. 旧的 `/merge`、`/sub` 应返回 404，静态站不应再有对应跳转页。
9. 用支持相应 Geo 数据的 Mihomo 检查配置：

```sh
mihomo -t -d /path/to/mihomo-data -f /path/to/Example-ratatoskr.yaml
```

绿色部署状态、GitHub 检查通过和业务验收是三件不同的事，需要分别确认。

## 6. 订阅格式、流量与存储

浏览器把机场链接提交给后端 `/api/inspect`，由服务端拉取、解码并只返回脱敏清单；浏览器不直连机场，因此不受 CORS 限制。完整节点只在用户主动预览、下载或持订阅链接拉取时交付。Base64 是编码，不是解密。

服务端使用 `shared/subscription.js` 解析 YAML、JSON、标准或 URL-safe Base64，以及 VMess、SS、SSR、Trojan、VLESS、Hysteria2、TUIC 链接；格式依据正文识别。域名机场用 `fetch()`；公网 IP 与自定义端口在自建环境直接用 Node 的 `fetch()` 读取（不再需要 `cloudflare:sockets`），仍保留 TLS 校验、重定向复查、大小限制与超时；TCP 检测改用 `node:net`。

| 内容 | 当前行为 |
| --- | --- |
| 预览、下载 | 编译完整节点，不把未转换的通用 Base64 源交给 Mihomo |
| 创建订阅 | AES-GCM 加密记录写入 `server/data/`，不依赖 KV |
| 每次拉取 | 读选择 → 刷新机场节点与流量 → 按当前模板与所选规则模块重新生成 YAML |
| 规则模块 | 未启用的规则及其 rule-providers 不写入配置；历史无 `modules` 字段的记录按全部启用处理 |
| 旧记录 | 仍兼容 v2 记录格式 |
| 密钥 | 随机 128 位 ID 与独立 256 位密钥；密钥不落盘 |
| 有效期 | 3 小时 / 7 天 / 30 天 / 永久；过期记录读取时删除并定期清理 |
| 流量 | 来自 `Subscription-Userinfo`；任一机场未报告额度时不伪造合计 |

迁移域名时保留 `server/data/` 与原 `PUBLIC_BASE_URL` 域名可达，否则旧链接找不到记录。完整订阅链接与 YAML 都含敏感访问能力，分享问题时应移除凭据。

## 7. 常见故障

| 现象 | 处理 |
| --- | --- |
| 向导提示“订阅服务未连接” | 核对 `SERVICE_BASE_URL`、meta 标签、`ALLOWED_ORIGINS`、后端 `/api/status` 是否 200 |
| 提示版本不一致 | 前端 `assets/app.js` 与后端 `shared/catalog.json` 不是同一次构建，重新构建并同步两端 |
| 创建订阅返回内网链接 | 未设置 `PUBLIC_BASE_URL`，或反代未透传 `X-Forwarded-Proto/Host` |
| 浏览器请求 403 | 前端 origin 不在 `ALLOWED_ORIGINS`；逗号分隔、只填源地址 |
| 订阅链接返回 404 | 链接已过期、记录被清理，或迁移域名时未保留 `server/data/` |
| 订阅链接跳到后端域名 | `functions/config-builder.js` 未部署，或 `_routes.json` 没把 `/config-builder` 纳入 include；确认仓库根两份文件已推送并由 CF Git 集成部署 |
| 订阅链接跳到 `/config-builder/` 向导页 | 链接带了 token 但函数未激活，或 `yggdrasil:public` meta 仍指向旧域名；检查 meta 是否为 `https://<CF Pages 域名>/config-builder` |
| CF 项目仍显示 KV 绑定 | 部署的是旧项目；当前架构不需要 KV，`worker/wrangler.jsonc` 已弃用不要部署 |
| 页面正常但 CF 仍告警 | 检查是否还有旧的独立 Worker 在返回节点；当前 Pages Functions 只做透明代理，不读取节点正文 |

排查日志前先移除机场 URL、节点密码和完整订阅链接。

## 8. 维护资料

- [项目 README](../README.md) · [完整实现路径](IMPLEMENTATION.md) · [服务文件说明](../worker/README.md)
- [server/.env.example](../server/.env.example) · [deploy/yggdrasil.service](../../deploy/yggdrasil.service) · [deploy/Dockerfile](../../deploy/Dockerfile) · [deploy/nginx.conf.example](../../deploy/nginx.conf.example)
- [sync-static.yml](../../.github/workflows/sync-static.yml) · [call-service.yml](../../.github/workflows/call-service.yml)

平台界面、权限与限制可能变化，后续以官方文档与实际配置为准，并同步更新本指南。
