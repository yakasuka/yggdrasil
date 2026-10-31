# Ratatoskr 配置服务

网页继续托管在 GitHub Pages。公开订阅入口使用独立的 Pages 网关，通过 Service Binding 调用内部配置服务；配置服务使用 KV 保存加密快照。没有自有域名也可使用部署后分配的 `项目名.pages.dev` 地址。

```text
GitHub Pages 引导页
    ↓ /api/status、/api/subscriptions
公开服务网关（pages.dev 或自有域名）
    ↓ Service Binding，内部调用
配置服务 + KV
    ↓
客户端从公开网关的 /subscription/<id>/<secret>.yaml 拉取配置
```

内部目录保留 `worker/`。`wrangler.jsonc` 关闭 `workers_dev` 与 `preview_urls`，配置服务不开放默认公网入口；前端通过 JS 中的公开路径映射访问网关。网关仅开放指定接口，不提供内部接口别名或源码文件路径。

## 部署

在仓库根目录执行，需要 Node.js 22 或更新版本：

```sh
cd Configurator
npm ci
npm run build
npm test
npx wrangler login
npx wrangler kv namespace create SUBSCRIPTIONS --config worker/wrangler.jsonc
```

登录账号须具备 Workers、KV 和 Pages 的部署权限。将返回的 KV namespace ID 写入 [wrangler.jsonc](wrangler.jsonc)，替换 `REPLACE_WITH_KV_NAMESPACE_ID`。随后先部署内部服务，再创建、部署公开入口：

```sh
npm run worker:deploy
npx wrangler pages project create ratatoskr-relay --production-branch main
npm run service:deploy -- --branch main
```

若该项目名已被占用，选择其他可用名称，同步修改 [网关配置](gateway/wrangler.jsonc) 的 `name`。若 Pages 项目已存在，跳过创建步骤。网关配置的 `services[].service` 必须与内部服务的 `name` 一致；两个项目须在同一账户下。

部署后，在 Pages 项目中取得**实际的生产域名**，写入 [前端配置](../config.json) 的 `apiBase`。填写服务 origin，例如 `https://<实际项目名>.pages.dev`，不带路径、查询参数或用户凭据。使用稳定的生产域名，不使用某次部署的临时预览域名。前端会拒绝默认后端域名及不匹配的订阅链接。

配置服务不需要填写公网地址，也不应为它重新开启默认公网入口。公开网关负责将创建结果转换为自己的 `/subscription/…` 地址，订阅文件同样通过网关返回。未来使用自有域名时，将其绑定到公开网关，再更新 `apiBase` 即可。

`apiBase` 未填写时，页面仅提供预览和文件下载，不会生成虚假订阅地址。修改源码后重新构建并提交前端资源。GitHub Pages 继续从仓库根目录发布，页面入口为 `https://yakasuka.github.io/yggdrasil/Configurator/`。

## 公开接口

| 路径 | 用途 |
| --- | --- |
| `GET /api/status` | 检查配置服务是否可用 |
| `POST /api/inspect` | 解析用户机场的实际节点、地区和流量 |
| `POST /api/latency` | 对解析到的节点进行可选 TCP 建连检测 |
| `POST /api/subscriptions` | 创建加密配置快照，返回公开订阅地址 |
| `GET /subscription/<id>/<secret>.yaml` | 按最新模板返回 YAML 和机场流量头 |
| `GET /subscription/<id>/<secret>/status` | 刷新 Token 持有者的流量报告 |

公开路径集中维护在 [service-routes.js](../shared/service-routes.js)。内部接口由 [gateway/index.js](gateway/index.js) 转接，浏览器不直接访问内部服务。页面中的服务提示只描述可用状态，不链接到部署文档。

生成接口保留每 IP 每分钟 10 次限流；请求体上限 64 KiB，最多 10 个机场，规则由模板固定维护，不接受用户自定义。Token 可选 3 小时 / 7 天 / 30 天 / 永久；有限期 Token 到期自动删除，永久 Token 不设置过期选项。KV 是最终一致存储，新建链接在不同边缘节点间可能短暂延迟。

每条链接包含 256 位随机密钥，配置使用 AES-GCM 加密保存，密钥不写入 KV。**持有完整链接即可读取配置和机场订阅地址**，请妥善保管。服务处理生成请求时会接触明文，部署者须可信；不要在日志或监控中记录请求体和完整订阅路径，默认关闭内部服务 observability。

订阅保存加密后的用户选择，拉取时按最新 Ratatoskr-Template.yaml 重新生成；修改网页选项需重新生成链接。机场节点、Geo 数据和远程规则源由 Mihomo 更新。服务不转换 Base64 通用订阅，请使用 Mihomo / Clash 格式节点订阅。

## 本地开发

三个终端分别运行：

```sh
# 终端一：仓库根目录，启动内部服务
npm --prefix Configurator run worker:dev -- --local --port 8787 --var ALLOWED_ORIGINS:http://localhost:8765

# 终端二：仓库根目录，启动公开网关
npm --prefix Configurator run service:dev

# 终端三：仓库根目录，启动前端
python3 -m http.server 8765
```

Wrangler 将网关的 `PROFILE_SERVICE` 绑定到正在本地运行的 `yggdrasil-subscriptions` 服务。将 `Configurator/config.json` 的 `apiBase` 临时设为 `http://localhost:8788`，打开 `http://localhost:8765/Configurator/`。发布前恢复生产地址，不提交 localhost。生成文件在 `worker/gateway/dist/`，本地数据在 `.wrangler/`，均已被 Git 忽略。

前端源码在 [src/](../src/)，共用生成器在 [compiler.js](../shared/compiler.js)。应用与规则目录从根目录模板提取，不提取模板内的 `proxy-providers` 或 `proxies`。修改生成逻辑后重新部署内部服务；修改转接逻辑后重新部署网关。生成配置的 DNS / TUN / 系统代理由客户端管理。

维护参考：[Pages Service Bindings](https://developers.cloudflare.com/pages/functions/bindings/#service-bindings)、[Pages Advanced mode](https://developers.cloudflare.com/pages/functions/advanced-mode/)。公开源码仓库中的文件仍可查看；此架构隔离的是运行中的内部服务，不将 JS 路径改写当作源码保密措施。

详细数据流、Token 更新机制、模板扩展和网络检测边界见 [实现路径](../docs/IMPLEMENTATION.md)。本次只提交准备代码，不进行 Cloudflare 部署。
