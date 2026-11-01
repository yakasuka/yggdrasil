# Configurator 实现与维护路径

## 一份模板，前后端共用

唯一目录来源是仓库根目录的 [Ratatoskr-Template.yaml](../../Ratatoskr-Template.yaml)。它不保存个人机场 URL 或节点凭据。

```text
Ratatoskr-Template.yaml
  └─ shared/template.js：解析 APP、地区、固定规则与策略标识
      ├─ scripts/generate-catalog.mjs → shared/catalog.json → 页面列表
      └─ worker/catalog.js → 运行时目录 → shared/compiler.js → 新 YAML
```

向 `main` 推送模板变更后，`.github/workflows/check.yml` 先构建、测试，再自动提交新的目录和浏览器产物，并请求重新构建 GitHub Pages。无需在页面代码维护第二份 APP / 国家列表。自动同步使用仓库的 `GITHUB_TOKEN`，需允许 Actions 写入内容和 Pages；受保护分支若禁止机器人提交，需为该仓库配置合适的规则。

后端运行时每分钟最多重新读取一次公开模板，失败时使用上次成功目录或随包目录。目录变更不要求重新部署后端。若新增节点协议、改变业务逻辑或修改模板结构版本，仍需更新对应代码。

## 每项功能的位置

| 功能 | 实现位置 |
| --- | --- |
| Configurator 名称与页面入口 | `index.html`、根目录首页入口、`webui/index.html` / `builder/index.html` 兼容跳转 |
| 机场名称和订阅输入 | `src/panels/sources.js` |
| 不可选择的“解析节点”状态 | `src/app.js` 的 `renderNav`、`resolveSources` |
| Mihomo YAML 节点解析 / 公开元数据 | `shared/nodes.js` |
| 后端拉取、DNS / 私网限制、体积与重定向限制 | `worker/subscriptions.js` |
| 可选 TCP 连接耗时 | `worker/subscriptions.js` 的 `probeNodes`；`src/app.js` 的 `probeAll` |
| 只展示拥有的地区 | `shared/nodes.js` 的 `regionInventory`、`src/panels/regions.js` |
| 删除地区后所有策略排除相应节点 | `shared/compiler.js` 的 `regionFilter` 与 `compile` |
| 四种自动策略，默认手动 | `shared/compiler.js`、`src/panels/strategies.js` |
| APP 默认全选、按地区设置默认出口 | `src/panels/apps.js`、`shared/compiler.js` 的 `normalize` / `compile` |
| 固定规则、最终出口跟随代理 | `shared/compiler.js`；API 不接受 `rules` / `custom` / `fallback` |
| 用户名-ratatoskr.yaml | `shared/profile.js` 的 `filename`；浏览器下载与服务端响应共用 |
| 预览、底部两个操作按钮 | `src/panels/review.js`、`index.html`、`src/app.js` |
| P1 / P2 来源标识 | `shared/compiler.js` 的 provider key 与 `additional-prefix`；`shared/nodes.js` 的节点 ID |
| 3 小时 / 7 天 / 30 天 / 永久 | `shared/profile.js` 的 `LIFETIMES`、`worker/index.js` |
| 独立随机 Token、加密保存用户选择 | `worker/crypto.js`、`worker/index.js` |
| 相同链接按最新模板生成配置 | `worker/index.js` 读取加密 profile 后调用实时目录与生成器 |
| 机场流量、总量与剩余量 | `shared/nodes.js` 的 `parseUsage` / `aggregateUsage`、`worker/subscriptions.js` 的 `usage` |
| 客户端订阅显示流量 | YAML 响应的 `Subscription-Userinfo`，随每次订阅刷新更新 |
| 页面手动刷新流量 | `/subscription/<id>/<token>/status`、`src/panels/review.js`、`src/app.js` |
| 公开路径、内部服务隔离 | `shared/service-routes.js`、`worker/gateway/index.js` |

## 新增 APP

在模板中加入一个 `select` 策略组，并让规则引用它。生成器会自动识别。`x-configurator` 中的名称 / 分类可选：

```yaml
proxy-groups:
  - name: 🧪 Example
    type: select
    proxies: [🎚️ 节点选择]
    x-configurator:
      kind: app
      category: 其他服务
rules:
  - DOMAIN-SUFFIX,example.com,🧪 Example
```

这是向现有列表追加的示例，不要覆盖整个 `proxy-groups` 或 `rules`。规则顺序仍决定匹配结果。未提供 ID 时，从首条规则的匹配值推导；也可通过 `x-configurator.id` 提供稳定 ID。默认“全部 APP”模式的旧 Token 会自动包含新 APP；用户手动取消部分 APP 后，保留其自选列表。

## 新增地区

在同一个模板的 `proxy-groups` 里追加地区组，填写唯一 ID、显示名称、图标标记和名称匹配正则：

```yaml
- name: 🥝
  type: select
  include-all: true
  filter: '(?i)(?:🇳🇿|新西兰|New Zealand|\bNZ\b)'
  x-configurator:
    kind: region
    id: NZ
    label: 新西兰
    flag: 🇳🇿
```

地区正则需使用浏览器可兼容的正则结构；支持 `(?i)` 大小写标记。解析到相应节点时，页面自动显示新地区。没有对应节点则不显示。地区按名称判断，不代表实际落地 IP；名称同时匹配多个地区时，按模板地区顺序识别。

“其他地区”只包含未匹配任何模板地区的节点。保留“其他”不会重新纳入用户取消的已知地区。

## Token 与目录版本

`# Yggdrasil catalog a11f4771ebf4` 中的字符串是公开目录的内容指纹，同一模板会被所有用户共用，既不唯一到用户，也不适合作为凭据。

个人链接使用随机 128 位记录 ID 和独立 256 位 Token。Token 同时用于 AES-GCM 解密，KV 不保存明文 Token。KV 保存加密后的用户选择与机场 URL，不固定保存生成时的 YAML；读取时用最新模板重新生成。修改页面选择需创建新链接，已保存的选择保持不变。

3 小时、7 天、30 天使用 KV 自动过期，并在读取时再次检查时间；永久模式不设置过期选项。永久表示无自动失效时间，不代表服务本身永远在线。删除对应 KV 记录即可撤销链接。持有完整链接即可读取配置与机场地址。

## 解析、流量与延迟的边界

- 后端请求机场使用 Mihomo User-Agent，接收 Mihomo / Clash YAML。非 YAML 通用 Base64 / URI 订阅需使用机场提供的 Mihomo 格式入口；当前不做跨内核节点协议转换。
- 只将节点名称、来源 ID、地区和检测结果返回页面，不返回节点密码。节点来源与凭据仍由客户端从用户填写的机场订阅获取。
- 每份订阅最多 2 MiB / 2000 节点；最多 10 个机场。公开地址与 DNS 解析检查、跳转复查、超时及并发限制用于约束服务端请求。部署运行环境也应仅允许公共网络出站访问。
- 流量取机场真实的 `Subscription-Userinfo` 响应头。缺失时显示“未提供”；多个机场有任一缺失时，不将部分额度当成整体总量。机场是否提供流量头、是否更新及时，由机场决定。
- 订阅客户端在拉取配置时收到更新的流量头；页面也可手动刷新。不是按网络数据包即时更新的计费系统。
- Cloudflare 运行时没有 ICMP ping 接口。可选检测使用 `cloudflare:sockets` 测量服务端到节点的 TCP 建连时间；不包含代理握手，也不代表完整隧道的可用性或延迟。页面明确显示 TCP 连接耗时，失败或不支持的节点保持“未检测”。
- TCP 检测以每批最多 10 个节点进行，后台完成后更新页面；内部服务的 `TCP_PROBE_ENABLED` 控制开关。私网与受平台限制的地址不会检测。

## 验证和本次交付范围

`npm --prefix Configurator run build` 构建页面和服务网关；`npm --prefix Configurator test` 验证模板扩展、地区删除、APP 路由、Token 有效期、实时模板读取、流量头、加密与网络地址限制。

本次只准备代码和 GitHub Pages 页面，不登录或部署 Cloudflare。未配置在线服务时，可为每个机场导入 YAML 节点文件，在本地完成地区选择、APP 配置、预览和下载；在线解析、真实连接检测和持久订阅链接需未来服务上线后使用。
