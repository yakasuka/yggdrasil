# config-builder · 自建后端部署指南

本文面向 [yakasuka/yggdrasil](https://github.com/yakasuka/yggdrasil) 的维护者与获得授权的部署者。仓库不包含真实域名、Token、私有仓库凭据或机场订阅。示例中的 `api.example.com` 必须替换为你自己的地址。

## 1. 最终架构

```text
浏览器 / Mihomo 客户端
   │
   ├─ 页面：Cloudflare Pages 或 GitHub Pages（纯静态文件，功能完全一致）
   │        /config-builder/  向导
   │        /merge/  /sub/    纯跳转页（只转发 ?token=）
   │        service.json      后端地址（仅一个 URL，无凭据）
   │
   └─ 数据：自建 Node 服务（唯一的节点数据来源）
            /api/status /api/inspect /api/preview /api/subscriptions
            /api/latency /api/endpoints
            /subscription/<id>/<token>.yaml
            /merge?token=  /sub?token=
            server/data/  加密记录
```

Cloudflare **只托管静态文件**：不再有 `_worker.js`、Pages Functions 业务逻辑、KV 绑定，也不再返回任何节点、代理配置或订阅正文。`/merge` 与 `/sub` 的内容由自建服务直接吐给客户端，CF 侧只做一次 302 跳转，因此不会因识别节点内容而误封账号。

`worker/` 目录仍保留节点解析、编译、加密等业务逻辑，但现在是**被 `server/` 直接 import 的普通模块**；`worker/gateway/index.js` 是弃用的旧 CF 网关，仅用于历史回归测试，任何构建都不会打包它，不要部署。

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
| `DATA_DIR` | 加密记录目录 | `./server/data`，已加入 `.gitignore`，务必持久化备份 |
| `PUBLIC_BASE_URL` | **生成订阅链接的对外源地址** | 填 `https://api.example.com`，否则链接会用内网 Host |
| `TRUST_PROXY` | 是否信任 `X-Forwarded-*` | 前面有反代时设为 `true` |
| `ALLOWED_ORIGINS` | 允许调用 API 的前端源，逗号分隔 | `https://yggdrasil-afx.pages.dev,https://yakasuka.github.io` |
| `TOKEN` | `/merge`、`/sub` 的鉴权 Token | 长随机串，由调用方追加到链接 |
| `GH_TOKEN` | 读取私有仓库 `providers.yaml` / `nodes.yaml` | 最小权限的 fine-grained token |
| `PRIVATE_REPO` | 私有仓库 Contents API 基址 | 默认 `yakasuka/yggdrasil-private` |
| `PUBLIC_CONFIG_URL` | `/merge` 使用的公开模板 | 默认指向仓库 `resources/template/ratatoskr-template.yaml` |
| `TEMPLATE_URL` | `bundled`（用 `shared/catalog.json`）或远程模板 | 默认 `bundled` |
| `TCP_PROBE_ENABLED` | 可选 TCP 检测 | 默认 `false`，需要时设 `true` |

`ALLOWED_ORIGINS` 留空时允许任意来源（服务日志会提示 `cors: open`）；上线前务必填成自己的两个静态站域名。`GET /api/status` 返回 `cors: restricted | open`，可用于核对。

**凭据只存在于服务器的 `server/.env`**。`TOKEN` 是 `/merge`、`/sub` 的访问口令，调用方把它拼进订阅 URL 的 `?token=`；`GH_TOKEN` 只在后端向 GitHub API 读取私有仓库时使用，调用方永远看不到。二者**不要**写进 Cloudflare Pages 环境变量、GitHub repository variable、`service.json`、任何静态文件或 workflow 日志；旧 CF 项目里残留的 `TOKEN` / `GH_TOKEN` 变量应删除。GitHub Actions 手动测试用的 `SERVICE_TOKEN` 是同一个 `TOKEN` 的副本，只能存为 repository **secret**。订阅链接 `/subscription/<id>/<key>.yaml` 里的随机 id/key 是另一套创建订阅时生成的凭据，与 `TOKEN` 无关。

#### 从 Cloudflare Workers / Pages Functions 迁移过来

旧架构把 `TOKEN`、`GH_TOKEN` 配在 Cloudflare 项目的环境变量里，由 Worker / Pages Functions 直接读私有仓库并吐出节点正文 —— 这正是被误判的原因。新架构把这些值**全部搬到你自己的服务器**：

| 变量 | 旧位置（删除） | 新位置 |
| --- | --- | --- |
| `TOKEN` | CF Pages / Worker 环境变量 | 服务器 `config-builder/server/.env` |
| `GH_TOKEN` | 同上 | 服务器 `config-builder/server/.env` |
| `PUBLIC_CONFIG_URL`、`PRIVATE_REPO` | 同上 | 服务器 `.env`（也可用内置默认值） |
| `SERVICE_BASE_URL` | 无 | **只放一个公开域名**：CF Pages 项目变量 + GitHub repository variable / `service.json` |

GitHub Pages 是纯静态托管，**没有服务端环境变量，也无法校验 token 或读取私有仓库**；它的 `service.json` 里只有一个后端 URL。所以「两边一样」的正确含义是：**CF 和 GitHub 两边都不持有任何 token，都只指向同一个后端**，由后端统一鉴权、统一吐正文。订阅客户端在两边填的是同一条后端直链 `https://<后端>/merge?token=<TOKEN>` 与 `https://<后端>/sub?token=<TOKEN>`，不需要为 GitHub 侧另外设计一套鉴权。

迁移时必须**下线或重新部署 CF 上旧的 Worker 与 Pages Functions**。`config-builder/worker/wrangler.jsonc` 是旧独立 Worker 配置（含 KV 绑定），已弃用，不要执行 `worker:deploy`；否则旧服务仍会在 CF 上吐节点，误封风险没有消除。用 `curl -I "https://<CF 域名>/sub?token=test"` 验证：应返回 302 且 `Location` 指向你的后端，而不是 200 加 YAML 正文。

### 2.2 运行

直接运行：

```sh
npm run server          # 或 node server/index.js
curl http://127.0.0.1:8788/api/status
```

systemd（把仓库放在 `/opt/yggdrasil`，创建同名用户）：

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

`SERVICE_BASE_URL` 在 CF Pages 项目里配置**一次**即可：构建时注入前端 bundle 与 `merge/`、`sub/` 跳转页，运行时也供 `functions/merge.js` / `functions/sub.js` 做纯 302 跳转。

不要创建 KV namespace、不要绑定 `SUBSCRIPTIONS`、不要执行 `worker:deploy` 或 `worker:dev`。`config-builder/wrangler.jsonc` 已移除 `kv_namespaces`；发布包里也没有 `_worker.js`。若 CF 项目是部署**仓库根目录**（例如 `yggdrasil-afx.pages.dev`），把 `SERVICE_BASE_URL` 同样加进该项目的变量，`functions/` 下的两个文件只做重定向。

### 3.2 GitHub Pages（仓库根目录）

GitHub Pages 发布的是仓库根目录，不是 `worker/gateway/dist`。仓库已包含：

- `config-builder/index.html` + `config-builder/assets/app.js|css`：向导（与 CF 同一份 bundle）；
- `merge/index.html`、`sub/index.html`：纯跳转页；
- `service.json`：`{"service":"https://api.example.com"}`，跳转页在 meta 为空时读取它。

在 GitHub 仓库设置 repository variable `SERVICE_BASE_URL=https://api.example.com`。之后 [sync-static.yml](../../.github/workflows/sync-static.yml) 会在源码变更时重新构建、测试并提交上述静态文件；也可手动 `workflow_dispatch`。本地等价操作：

```sh
cd config-builder
SERVICE_BASE_URL=https://api.example.com npm run build
npm test
cd .. && git add config-builder/index.html config-builder/assets/app.js config-builder/assets/app.css merge sub service.json && git commit
```

只想快速改地址、不想重新构建时，直接编辑仓库根 `service.json`（向导页面加载时动态读取，`merge/` `sub/` 跳转页也读它），或编辑 `config-builder/index.html` 的 `<meta name="yggdrasil:service">`。这两个文件都只含一个公开 URL，不含凭据；CF 侧同样在构建输出目录里生成 `service.json`。

### 3.3 两套前端如何保持一致

- 同一个 `assets/app.js`，同一套 `SERVICE_ROUTES`，同一个后端地址；
- 前端所有请求经 `src/config.js` 的 `apiFetch()` 发出，`credentials: "omit"`；
- `/api/status` 校验后端 `version` 与前端 catalog 版本，不一致时向导停止；
- 订阅、预览、下载链接都由后端返回，静态站不代管、不缓存、不改写。

## 4. merge / sub 调用链路

后端 `/api/endpoints` 会吐出全部公开链接（只含模板，不含 Token）：

```json
{
  "service": "https://api.example.com",
  "merge": "https://api.example.com/merge?token=",
  "sub": "https://api.example.com/sub?token=",
  "subscription": "https://api.example.com/subscription/",
  "frontends": ["https://yggdrasil-afx.pages.dev", "https://yakasuka.github.io"]
}
```

| 入口 | 行为 |
| --- | --- |
| `https://api.example.com/merge?token=<TOKEN>` | 后端读取公开模板 + 私有 `providers.yaml`，注入 `AUTO-PROVIDERS` 标记区后返回配置 |
| `https://api.example.com/sub?token=<TOKEN>` | 后端读取私有 `nodes.yaml`，原样返回订阅 YAML |
| `https://yggdrasil-afx.pages.dev/merge?token=…` | CF Functions 纯 302 到后端，不接触正文 |
| `https://yakasuka.github.io/yggdrasil/merge/?token=…` | GitHub Pages 静态跳转页，转发到后端 |
| `https://yakasuka.github.io/yggdrasil/sub/?token=…` | 同上 |

**订阅客户端请直接填后端直链**（`https://api.example.com/merge?token=…`、`/sub?token=…`，可从页面「服务接口」区或 `/api/endpoints` 复制），这是唯一不经过 CF、也不依赖跳转的调用方式，也是本次改造的目标。

静态站上的 `/merge`、`/sub` 只是旧链接兼容入口：

- Cloudflare 侧：`functions/merge.js` / `sub.js` 发出 HTTP 302，显式保留 `?token=`，订阅客户端可以跟随；前提是该 CF Pages 项目确实部署了仓库根 `functions/` 并配置了 `SERVICE_BASE_URL`。用 `curl -I "https://<CF 域名>/merge?token=test"` 验证：应返回 302 且 `Location` 是带 token 的后端地址。若返回的是 HTML 跳转页，说明 Functions 未生效，此时请改用后端直链。
- GitHub Pages 侧：`merge/index.html`、`sub/index.html` 是纯静态页，靠 JavaScript 跳转。浏览器可用，但 **Mihomo / Clash 等订阅客户端不执行 JavaScript**，无法跟随， GitHub Pages 也不支持服务端 302。因此这里只能作为浏览器书签/文档入口。
- 注意 `_redirects` 不能代替 Functions 转发 token：Cloudflare 的重定向规则不支持查询参数匹配与拼接，且文档明确说明 `_redirects` 不会应用于由 Functions 处理的路由。

Token 只出现在客户端 URL 里，302 响应已设置 `Referrer-Policy: no-referrer`；后端 `/merge`、`/sub` 的正文也强制 `Referrer-Policy: no-referrer`、`Cache-Control: no-store, private`，且**不带任何 CORS 头**（订阅客户端不是浏览器网页，不需要跨源读取）。若希望连 token 都不经过 CF，直接使用后端直链即可。

⚠️ **Token 保护边界**：`merge` 与 `sub` 校验同一个 `TOKEN`，因为 merge 输出中包含 sub 的完整节点信息，二者敏感度相同。但 token 以明文存在于 URL 里，因此会留在订阅客户端配置、浏览器历史、CF 的 HTTP 请求日志与 302 `Location` 头、反代访问日志中 —— **Cloudflare 不会看到节点正文，但会看到 token 字符串**。上线时请用足够长、不可猜测的随机串（不要用单词、年份或项目名），并把曾经公开粘贴、出现在旧链接或日志里的 token 视为已泄露、直接轮换；轮换只需改服务器的 `TOKEN` 并更新客户端订阅 URL，静态站无需改动。排查日志前务必先移除 `?token=` 部分。

GitHub 侧的调用由 [call-service.yml](../../.github/workflows/call-service.yml) 提供：手动触发后读取后端 `/api/endpoints`，并（在配置 `SERVICE_TOKEN` secret 后）请求 `/merge`、`/sub`。工作流只输出 HTTP 状态码与链接模板，**不保存节点内容到仓库或日志**。

`scripts/endpoints/merge.js` 与 `sub.js` 是后端的真实实现，同时保留在 GitHub 仓库中；`functions/merge.js` 与 `sub.js` 只剩跳转，不再包含 `GH_TOKEN`、`nodes.yaml`、`providers.yaml` 或私有仓库地址。

## 5. 发布后验收

```sh
curl https://api.example.com/api/status
curl https://api.example.com/api/endpoints
```

`/api/status` 应返回 200、`ready: true`、`storage: "self-hosted"`，`service` 与 `endpoints` 是你的公网地址，`cors` 为 `restricted`。页面与接口的 catalog `version` 必须一致。

1. 打开 `https://<CF Pages 域名>/config-builder/` 与 `https://yakasuka.github.io/yggdrasil/config-builder/`，两处都应显示“订阅服务已连接”，且“当前服务”是同一个后端域名。
2. 填入授权使用的测试订阅，由后端 `/api/inspect` 解析节点与地区。
3. 预览并下载 `Example-ratatoskr.yaml`，核对节点、地区去留与 `[P1]` / `[P2]` 标识。
4. 创建订阅，确认 `/api/subscriptions` 返回 201，链接以 `https://api.example.com/subscription/` 开头；用该链接读取 YAML 应返回 200，且带 `Subscription-Userinfo`。
5. 访问静态站的 `/config-builder/wrangler.jsonc`、`/config-builder/src/app.js`、`/_worker.js`，应返回 404；确认 CF 构建输出目录里没有 `_worker.js`。
6. 用 `curl -o /dev/null -w "%{http_code}" "https://api.example.com/sub?token=<TOKEN>"` 验证后端吐节点；不带 token 应返回 401。
7. 用支持相应 Geo 数据的 Mihomo 检查配置：

```sh
mihomo -t -d /path/to/mihomo-data -f /path/to/Example-ratatoskr.yaml
```

绿色部署状态、GitHub 检查通过和业务验收是三件不同的事，需要分别确认。

## 6. 订阅格式、流量与存储

浏览器把机场链接提交给后端 `/api/inspect`，由服务端拉取、解码并只返回脱敏清单；浏览器不直连机场，因此不受 CORS 限制。完整节点只在用户主动预览、下载或持 Token 拉取时交付。Base64 是编码，不是解密。

服务端使用 `shared/subscription.js` 解析 YAML、JSON、标准或 URL-safe Base64，以及 VMess、SS、SSR、Trojan、VLESS、Hysteria2、TUIC 链接；格式依据正文识别。域名机场用 `fetch()`；公网 IP 与自定义端口在自建环境直接用 Node 的 `fetch()` 读取（不再需要 `cloudflare:sockets`），仍保留 TLS 校验、重定向复查、大小限制与超时；TCP 检测改用 `node:net`。

| 内容 | 当前行为 |
| --- | --- |
| 预览、下载 | 编译完整节点，不把未转换的通用 Base64 源交给 Mihomo |
| 创建订阅 | AES-GCM 加密记录写入 `server/data/`，不再依赖 KV |
| 每次拉取 | 读选择 → 刷新机场节点与流量 → 按当前模板重新生成 YAML |
| 旧记录 | 仍兼容 v2 记录格式 |
| Token | 随机 128 位 ID 与独立 256 位密钥；密钥不落盘 |
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
| `/merge`、`/sub` 返回 401 | 调用方未追加 `TOKEN`，或 `TOKEN` 与后端配置不一致 |
| `/merge` 返回 502 | 检查 `GH_TOKEN`、`PRIVATE_REPO`、公开模板里的 `AUTO-PROVIDERS` 成对标记 |
| CF 项目仍显示 Functions/KV | 部署的是旧项目或旧产物；确认输出目录为 `worker/gateway/dist` 且无 `_worker.js` |
| 页面正常但 CF 仍告警 | 检查是否还有旧的独立 Worker / Pages Functions 在返回节点；新架构下 CF 只有静态文件和 302 |

排查日志前先移除机场 URL、节点密码和完整 Token。

## 8. 维护资料

- [项目 README](../README.md) · [完整实现路径](IMPLEMENTATION.md) · [服务文件说明](../worker/README.md)
- [server/.env.example](../server/.env.example) · [deploy/yggdrasil.service](../../deploy/yggdrasil.service) · [deploy/Dockerfile](../../deploy/Dockerfile) · [deploy/nginx.conf.example](../../deploy/nginx.conf.example)
- [sync-static.yml](../../.github/workflows/sync-static.yml) · [call-service.yml](../../.github/workflows/call-service.yml)

平台界面、权限与限制可能变化，后续以官方文档与实际配置为准，并同步更新本指南。
