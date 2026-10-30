# Ratatoskr 配置服务

GitHub Pages 承载五步配置向导，Cloudflare Worker 接收所选内容并生成 Mihomo YAML，KV 保存有有效期的加密快照。客户端通过私密 HTTPS 链接持续拉取配置；机场节点与 Geo 数据由 Mihomo 自行更新。

## 部署

在仓库根目录执行，需 Node.js 22 或更新版本，以及有 Workers / KV 权限的 Cloudflare 账号：

```sh
npm ci
npm run build
npm test
npx wrangler login
npx wrangler kv namespace create SUBSCRIPTIONS --config worker/wrangler.jsonc
```

将返回的 namespace ID 填入 [wrangler.jsonc](wrangler.jsonc) 的 `kv_namespaces[0].id`，替换 `REPLACE_WITH_KV_NAMESPACE_ID`，再部署：

```sh
npm run worker:deploy
```

如账号包含多个账户，在 `worker/wrangler.jsonc` 中增加实际的 `account_id`。KV ID 和 Account ID 不是密钥；OAuth 凭据、API Token 不得提交进仓库。

将部署返回的 `https://yggdrasil-subscriptions.<你的子域>.workers.dev` 写入 [前端配置](../builder/config.json)：

```json
{
  "apiBase": "https://yggdrasil-subscriptions.<你的子域>.workers.dev"
}
```

提交并推送 `builder/`、编译资源及其配置，GitHub Pages 从仓库根目录发布。向导地址为 `https://yakasuka.github.io/yggdrasil/builder/`。使用自己的域名时，同步调整 Worker 的 `ALLOWED_ORIGINS`（多个来源用英文逗号分隔）；填来源 origin，不包含 `/yggdrasil/` 路径。

未填写 `apiBase` 时，网页仍可预览和下载 YAML，但会明确禁用「生成订阅链接」。网页不会把临时文件地址当作订阅链接。

## 接口

| 路径 | 用途 |
| --- | --- |
| `GET /api/health` | 检查 KV 绑定和配置目录版本 |
| `POST /api/profiles` | 校验选项，生成并加密保存 YAML，返回订阅地址与到期时间 |
| `GET /s/<id>/<secret>.yaml` | 解密并返回 Mihomo 配置；客户端无需额外请求头 |

生成接口每 IP 每分钟最多 10 次；请求体上限 64 KiB，最多 10 个机场，每类最多 100 个自定义域名。错误响应不回显机场 URL。有效期可选 30、90 或 365 天，到期后 KV 自动删除。KV 是最终一致的存储，链接刚生成时其他地区的边缘节点可能需短暂等待后才能读到。

每条链接包含 256 位随机密钥，配置使用 AES-GCM 加密后保存，密钥不写入 KV。**任何持有完整链接的人都可以读取配置和机场订阅地址**，请像管理机场订阅一样保管它。服务处理生成请求时会接触明文，部署者仍须可信。请勿在监控、日志或分析工具中采集请求体和完整订阅路径；默认关闭 Worker observability。

订阅保存的是生成时的配置快照。修改网页选项后需要重新生成链接；更新规则编排代码不会重写旧链接。节点订阅、Geo 数据和选中的远程规则源仍按生成配置中的间隔更新。此服务不代拉机场 URL，也不转换 Base64 通用节点订阅；请使用 Mihomo / Clash 格式机场订阅。

## 本地开发

```sh
npm run worker:dev -- --local --port 8787 --var ALLOWED_ORIGINS:http://localhost:8765
python3 -m http.server 8765
```

临时将 `builder/config.json` 的 `apiBase` 设置为 `http://localhost:8787`，打开 `http://localhost:8765/builder/`。发布前恢复线上地址，勿提交 localhost。Wrangler 本地 KV 数据在 `.wrangler/` 中，已被 Git 忽略。

前端源代码在 [web/app.js](../web/app.js)，共享生成器在 [shared/compiler.js](../shared/compiler.js)。应用与规则目录从 `ratatoskr.yaml`、24 地区筛选从 `Ratatosk-Eb.yaml` 提取，仅提取公开规则元数据，**不提取原文件的 `proxy-providers` 或 `proxies`**。修改模板或前端后执行 `npm run build`，同步提交 `shared/catalog.json` 与 `builder/app.js`。前后端使用同一生成器和目录版本，修改生成器后也需重新部署 Worker。

生成配置包含混合端口和分流策略，DNS / TUN / 系统代理由客户端配置。输出面向 Mihomo / Clash Meta，不代表支持其他内核格式。
