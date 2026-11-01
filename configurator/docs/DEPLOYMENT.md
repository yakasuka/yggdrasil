# Configurator · Cloudflare 部署指南与故障复盘

本文面向 [yakasuka/yggdrasil](https://github.com/yakasuka/yggdrasil) 的维护者与获得授权的部署者。仓库保留通用配置，不包含部署者的账户 ID、真实 KV namespace ID、机场订阅或访问密钥。项目使用范围见根目录 [LICENSE](../../LICENSE)。

## 1. 最终架构

```text
浏览器 / Mihomo 客户端
        │ HTTPS
        ▼
同一个 Cloudflare Pages 项目
  ├─ /Configurator/                 配置向导
  ├─ /api/status                    健康检查
  ├─ /api/inspect                    节点与流量清单
  ├─ /api/preview                    完整 YAML 预览与下载
  ├─ /api/subscriptions              创建订阅
  ├─ /subscription/<id>/<secret>.yaml
  └─ SUBSCRIPTIONS → KV             加密的用户选择与 YAML 快照
```

Pages Functions 直接运行应用并访问 KV。标准部署只需要一个 Pages 项目和一个 KV namespace；`worker/index.js` 保留为兼容的独立 Worker 入口，当前方案无需部署它，也无需创建 `PROFILE_SERVICE` 服务绑定。

公开链接使用自己的 Pages 域名或自有域名。`/Configurator/config.json` 按请求域名自动返回同源 `apiBase`，无需填写 `workers.dev` 地址。GitHub Pages 仍可承载静态向导；无法在静态站内执行 Functions 或连接 KV。

## 2. 先填写部署模板

创建或选择自己的 KV namespace，然后修改 [Configurator/wrangler.jsonc](../wrangler.jsonc)：

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "yggdrasil-configurator",
  "pages_build_output_dir": "./worker/gateway/dist",
  "compatibility_date": "2026-10-01",
  "kv_namespaces": [
    { "binding": "SUBSCRIPTIONS", "id": "REPLACE_WITH_KV_NAMESPACE_ID" },
  ],
}
```

- `name` 改为自己实际使用的 Pages 项目名；仓库中的名称仅为示例。
- `id` 替换为自己 KV namespace 的 ID。它是资源标识，不能拿其他账户的 ID 直接使用。
- `binding` 保持 `SUBSCRIPTIONS`，代码通过这个名称访问存储。
- 保留 `pages_build_output_dir` 和配置文件位置，避免本地发布与 Git 构建使用不同目录。

配置启用后以 Wrangler 文件为配置来源，线上绑定应与文件保持一致。控制台手动添加的同名绑定不能作为配置文件正确性的替代品，详见 [Pages Wrangler 配置](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)。

`worker/wrangler.jsonc` 是可选独立 Worker 的模板，也保留 `REPLACE_WITH_KV_NAMESPACE_ID`。标准 Pages 部署不用填写它；不要误执行 `worker:deploy`。

## 3. 从 GitHub 网页部署

在 Cloudflare 的 **Workers & Pages → 创建应用 → Pages → 连接 Git** 中选择目标仓库。若是私有仓库，确认 Cloudflare GitHub 安装授权包含该仓库。

| 设置                   | 填写内容                              |
| ---------------------- | ------------------------------------- |
| Project name           | 与 `wrangler.jsonc` 的 `name` 一致    |
| Production branch      | `main`                                |
| Framework preset       | `None`                                |
| Root directory         | `Configurator`                        |
| Build command          | `npm ci && npm run build && npm test` |
| Build output directory | `worker/gateway/dist`                 |
| Environment variable   | `NODE_VERSION=22`                     |

这是 Pages 项目，不需要独立 Worker 的 Deploy command 或 Preview command。如果页面要求填写这些命令，先确认进入的是 Pages 创建流程。正常 Git 集成不需要把 Cloudflare API Token 填入页面构建变量，步骤参考 [官方 Git 集成指南](https://developers.cloudflare.com/pages/get-started/git-integration/)。

发布后核对生产部署确实绑定 KV：绑定名为 `SUBSCRIPTIONS`，目标为自己的 namespace。普通文本环境变量无法代替 KV 绑定；预览部署若启用，也要核对其实际存储绑定，避免测试写入生产数据。绑定机制见 [Pages KV 绑定](https://developers.cloudflare.com/pages/functions/bindings/#kv-namespaces)。

首次验收可先关闭可选 TCP 检测，在 `wrangler.jsonc` 合并字符串变量后发布：

```jsonc
"vars": { "TCP_PROBE_ENABLED": "false" }
```

## 4. 发布后的验收顺序

将下面的 `your-project` 换为自己的真实项目名：

```text
https://your-project.pages.dev/Configurator/
https://your-project.pages.dev/api/status
```

健康接口应返回 200，`ready` 为 `true`，`storage` 为 `kv`。页面与接口的 catalog 版本应一致。使用 **GET** 检查该接口；内部 `/api/health` 不作为公网入口。

接下来完成一次完整业务流程：

1. 填入一个授权使用的测试订阅，确认解析节点和地区。没有 CORS 时允许同源服务代取。
2. 选择地区、策略和 APP，填写配置名称，例如 `Example`；首次选择 3 小时有效期。
3. 预览并下载 `Example-ratatoskr.yaml`，检查完整节点、地区去留和 `[P1]` / `[P2]` 标识。
4. 创建订阅，确认 `/api/subscriptions` 返回 201，并使用响应中实际返回的地址读取 YAML，确认返回 200。
5. 流量以机场实际返回的数据为准；没有报告时应显示未知。
6. 用支持相应 Geo 数据的 Mihomo 检查配置：

```sh
mihomo -t -d /path/to/mihomo-data -f /path/to/Example-ratatoskr.yaml
```

最后访问 `/Configurator/wrangler.jsonc`、`/Configurator/src/app.js`，应返回 404。绿色部署状态、GitHub 检查通过与业务验收是不同结果，需要分别确认。

## 5. 本地开发与手动发布

在仓库根目录执行：

```sh
npm --prefix Configurator ci
npm --prefix Configurator run build
npm --prefix Configurator test
npm --prefix Configurator run service:dev
```

打开 `http://localhost:8788/Configurator/`。本地 Pages 使用本地 KV 模拟存储，不要把本地健康检查当作生产 KV 已连接。

账号状态正常且已经填写项目与 KV 后，可以通过官方 Wrangler 登录并发布：

```sh
cd Configurator
npx wrangler login
npm run build
npm test
npm run service:deploy -- --branch main
```

配置文件固定放在 `Configurator/wrangler.jsonc`。发布命令也在这个目录执行，不再切换到 `worker/gateway`，输出统一为 `worker/gateway/dist`。

仓库提供手动工作流 [Deploy Cloudflare Pages](../../.github/workflows/deploy-cloudflare.yml)，只在 `workflow_dispatch` 时运行。使用前在目标 GitHub 仓库的 Actions Secrets 配置 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`，按官方要求授予目标账户的 Pages 发布权限。未填写 KV 占位符时工作流会阻止发布。该工作流不是默认自动发布链路，启用后仍需验收。

默认自动发布由 Cloudflare Pages 的 Git 集成负责。[Validate Configurator](../../.github/workflows/check.yml) 负责构建、测试和同步生成资源；它本身不代表 Cloudflare 已更新。不要同时把当前业务接到旧独立 Worker 的自动构建上，误把它的成功状态当作 Pages 发布成功。

## 6. 订阅格式、流量与存储

网页先尝试直接读取机场；允许跨域访问时，在浏览器解析。浏览器被 CORS 限制时，通过同源 `/api/inspect` 读取；Base64 解码不能解除 CORS。

浏览器和服务端共用 [shared/subscription.js](../shared/subscription.js)，支持 YAML、JSON、标准或 URL-safe Base64，以及 VMess、SS、SSR、Trojan、VLESS、Hysteria2、TUIC 链接。Base64 是编码，解码需保留 UTF-8 名称。格式识别依据正文，即使响应被标为 `text/html` 也可以解析，不会执行 HTML。

域名机场使用服务端 `fetch()`；公网 IP 与自定义端口由 [worker/ip-fetch.js](../worker/ip-fetch.js) 使用原生 HTTP / TLS 读取。HTTPS 保留证书校验；重定向重新检查目标，连接、响应大小、解压和超时均有限制。不会把原始订阅发送到第三方转换服务。

| 内容         | 当前行为                                                      |
| ------------ | ------------------------------------------------------------- |
| 预览、下载   | 编译完整节点，不让 Mihomo 直接读取未转换的通用 Base64 源      |
| 创建订阅     | KV v3 通过 AES-GCM 加密保存用户选择与完整 YAML 初始快照       |
| 每次拉取     | 读取选择，刷新机场节点和流量，使用当前已部署模板重新生成 YAML |
| 快照更新     | 当前实现不会每次读取后重写 KV 中的初始快照                    |
| 旧记录       | 兼容 KV v2                                                    |
| Token        | 随机 128 位 ID 与独立 256 位密钥；密钥不保存在 KV 中          |
| 有效期       | 3 小时、7 天、30 天、永久；有限期记录设置过期时间             |
| catalog 指纹 | 仅标识模板版本，不能代替订阅 Token                            |
| 流量         | 来自 `Subscription-Userinfo`；任一机场未报告额度时不伪造合计  |

完整订阅链接与生成的 YAML 都包含敏感访问能力，分享问题时应移除凭据。永久表示没有自动过期时间，仍依赖服务、账户与 KV 持续存在。迁移域名时保留相同 namespace 和有效 Token；换到空 namespace 会导致旧链接找不到记录。

可选延迟检测是服务端到节点的 TCP 建连耗时，不等于 ICMP ping、用户本地延迟或完整代理隧道延迟；也不能与 Mihomo 的 `unified-delay` 数值等同。

## 7. 部署困难与最终处理

以下为开发部署中实际遇到的问题及形成的修复，不包含个人账号、私有资源 ID 或真实订阅。

| 现象                                            | 最终处理与判断边界                                                                      |
| ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| Pages 部署成功，向导仍提示在线解析未连接        | 增加 `/api/status`，检查实际模板与 KV，业务验收独立于部署状态                           |
| 健康检查返回“链接不存在”                        | 统一公开路径 `/api/status` 与内部 `/api/health` 的映射                                  |
| 服务绑定存在，调用仍失败                        | 区分绑定缺失、调用异常和上游异常；仅固定健康接口提供有界脱敏诊断                        |
| 独立 Worker 提示 `This script has been killed.` | 核对入口、版本、绑定及日志；未确认平台终止的具体根因，不能直接认定 CPU 超限             |
| 测试工厂与生产入口混杂                          | 工厂移入 `application.js`，生产入口只默认导出 HTTP 处理器；此调整没有单独解决旧服务故障 |
| Pages → 独立 Worker 链路持续不稳定              | Pages 直接运行应用并绑定 KV，移除标准部署对 Service Binding 的依赖                      |
| YAML 订阅可用，Base64 不识别                    | 共用解析器将 Base64 / URI 转成 Mihomo 节点，编译完整 YAML                               |
| 浏览器无法读取机场                              | 保留浏览器优先，遇到 CORS 时同源代取；支持本地节点文件导入                              |
| 公网 IP 加非标准端口的源失败                    | 增加原生 TLS、HTTP 分块、压缩、关闭连接与超时处理，独立回归测试                         |
| Base64 内容被标为 HTML                          | 根据正文识别格式，不依赖响应 MIME                                                       |
| 转换后节点数量减少                              | 核对模板 filter，提示和不保留地区可能按规则被排除，不直接视为解析丢失                   |
| 流量缺失                                        | 源未返回流量头时显示未知，不用 0 代替未报告                                             |
| CLI 发布后 Git 构建目录不一致                   | Wrangler 移到 `Configurator` 根目录，统一输出 `worker/gateway/dist`                     |
| 管理 API 返回 `10000`                           | 核对账户与官方授权范围；读取 Pages 配置所需范围可能同时含管理能力                       |
| 返回 `9109 Invalid access token`                | 核对凭据与账号状态；不能仅凭此码断定普通到期或证明具体暂停原因                          |
| 本地证书链错误                                  | 补充本机受信任 CA，保留 TLS 验证，不关闭全局证书检查                                    |
| 项目发布被 `8000119` 拒绝，或收到审核通知       | 保存错误，走官方支持渠道确认原因；重复登录或重建项目不能代替账号复核                    |

公开错误码：`SERVICE_NOT_BOUND` 表示存储与兼容服务均不可用；`SERVICE_CONNECTION_ERROR` 表示调用抛出异常；`SERVICE_RESPONSE_ERROR` 表示上游返回 5xx，并附 `upstreamStatus`。查看日志前先移除机场 URL、节点密码和完整 Token。

## 8. 实现与验收记录

部署过程最终完成了这些实现，具体文件见 [IMPLEMENTATION.md](IMPLEMENTATION.md)：

1. 统一 Configurator 命名、公开路径和同源配置，保留旧静态入口跳转。
2. 增加健康接口、分层错误码、仅限健康探针的脱敏诊断。
3. 分离测试工厂与生产入口，将业务与 KV 放入同一个 Pages 运行时。
4. 加入浏览器优先拉取、共用 Base64 / URI 解码和文件导入。
5. 将所选地区完整节点写入预览、下载与订阅 YAML，保留 P1/P2。
6. 加入不写 KV 的预览接口、加密 v3 YAML 快照与旧 v2 读取兼容。
7. 兼容公网 IP 与自定义端口的订阅，保留 TLS 验证和地址限制。
8. 统一 Git 与 CLI 发布目录，发布包只包含明确允许的页面资源，附第三方许可证。
9. 保留模板驱动的 APP、国家和规则目录，新增内容通过构建与重新部署生效。

此前在独立部署环境完成过 43 项自动测试、真实 Base64 源在线解析、KV 创建与读取、预览/下载/订阅一致性及 Mihomo 配置校验；旧 v2 记录换域名读取也通过。**这些是实现的验收记录，不代表本仓库模板已经部署为公共在线服务。** 新部署必须使用自己的资源重新执行第 4 节验收。

APP、地区与规则只维护 [Ratatoskr-Template.yaml](../../Ratatoskr-Template.yaml)。修改后运行完整 `npm run build`，提交 `shared/catalog.json` 与 `assets/`，重新部署 Pages，并核对页面目录、健康接口和生产提交版本。只提交模板或看到 GitHub 检查成功，不代表线上模板已经生效。

## 9. 维护资料

- [功能实现路径](IMPLEMENTATION.md)
- [服务文件说明](../worker/README.md)
- [Pages Wrangler 配置](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)
- [Pages Git 集成](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Pages KV 绑定](https://developers.cloudflare.com/pages/functions/bindings/#kv-namespaces)
- [Cloudflare 原生 TCP / TLS 套接字](https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/)
- [Cloudflare 支持](https://developers.cloudflare.com/support/contacting-cloudflare-support/)

平台界面、权限与限制可能变化，后续以官方文档和实际配置为准，并同步更新本指南。
