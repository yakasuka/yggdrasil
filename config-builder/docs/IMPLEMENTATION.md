# config-builder · 实现路径

## 数据流

`config-builder/shared/catalog.json` 是 APP、国家/地区、规则与规则模块的静态目录数据，它是仓库示例模板 `resources/template/ratatoskr-template.yaml` 的同源快照（`cleanFilter` 与模板 `FilterAll` 完全一致），前端 bundle 与自建服务在构建时直接读取它，不提取个人订阅与节点凭据。新增 APP、地区或规则模块时直接编辑该文件并重新构建。`shared/template.js` 的 `catalogFromTemplate` 只在 `TEMPLATE_URL` 指向带 `x-configurator` 元数据的远程模板时于运行时解析目录，测试夹具位于 `tests/fixtures/template-with-metadata.yaml`。

前端是发布在 Cloudflare Pages 与 GitHub Pages 上的**静态文件**，两套站点共用同一份 `assets/app.js`。`src/config.js` 解析自建服务地址（HTML meta → 构建注入的 `SERVICE_BASE_URL` → 同源），`src/app.js` 通过 `apiFetch()` 跨源提交机场链接到 `/api/inspect`；`worker/subscriptions.js` 由 `server/` 直接运行，拉取订阅后由 `shared/subscription.js` 解码 Base64、YAML 或节点链接，`shared/nodes.js` 用模板 filter 分类并只返回脱敏清单。浏览器不直连机场、不缓存完整节点、不写入本地存储；服务端按 `ALLOWED_ORIGINS` 做 CORS 白名单。

`src/service.js` 在页面加载时检查自建服务的 `/api/status`，验证存储、模板版本与能力；服务未就绪时向导停止并提示重试，不提供本地 / 离线降级，也没有在向导里手动填写服务地址的入口（地址写在静态文件 / 构建变量里）。后续选择地区、策略和 APP 与订阅协议分离。

第六步「规则模块」以按钮块勾选规则组（私有网络 / 大陆直连 / 受限域名 / 游戏直连 / 两类增强规则集 / 特殊端口）。`shared/compiler.js` 的 `compile()` 按 `profile.modules` 裁剪 `orderedRules`：未启用模块的规则连同其 `rule-providers` 都不写入配置；gateway、手动切换与最终出口策略组无条件保留，引用始终有效。未带 `modules` 字段的历史订阅按「全部启用」处理，旧链接不受影响。

配置由 `shared/template-render.js` 的 `renderFromTemplate()` **在 `ratatoskr-template.yaml` 原文上定点编辑**生成：先由 `compile()` 得到经校验的裁剪决策，渲染器据此逐行保留分区注释、flow 单行格式、`FilterRegions` 锚点与 `GEOSITE`/`GEOIP` 客户端规则，只注入 `proxy-providers`（机场原始订阅地址）、改端口与 APP 默认出口、删除未选中的组/规则行，并同步修正入口组 `proxies` 引用。节点不再内联，也不写 `geox-url`——客户端直接从机场远程拉取，节点更新即时生效。

生成订阅时，`worker/application.js` 将用户选择经 AES-GCM 加密后交给 `server/storage.js` 写入 `server/data/`；`server/create-server.js` 把配置名称与可选口令映射到内部随机 ID/密钥，对外只暴露 `/config-builder?token=<名称>[&pwd=<口令>]`。后端是公开 API，没有共享 TOKEN、不读私有仓库；旧的 `/merge`、`/sub`、`/subscription/…` 链路及其静态跳转页均已移除。后端 `/api/endpoints` 吐出所有公开链接模板。

## 功能对应位置

| 功能 | 维护入口 |
| --- | --- |
| 机场名称、链接及 P1/P2 | `src/panels/sources.js`、`src/app.js` |
| 后端地址解析、跨源请求、健康检查与重试 | `src/config.js`、`src/app.js`、`src/service.js`、`index.html` |
| Base64、YAML 和协议链接转换 | `shared/subscription.js` |
| 脱敏节点清单、地区匹配、流量汇总 | `shared/nodes.js` |
| 只展示拥有的地区、地区去留 | `src/panels/regions.js` |
| 四种策略、默认手动 | `src/panels/strategies.js`、`shared/compiler.js` |
| APP 默认全选、跟随代理、地区/Direct/Reject | `src/panels/apps.js`、`shared/compiler.js` |
| 规则模块按钮块、按模块裁剪规则 | `src/panels/rules.js`、`shared/compiler.js`（`RULE_MODULES` / `ruleModules`） |
| 模板规则、最终出口跟随代理 | `shared/compiler.js` 的参数校验和组装 |
| 最终确认、预览、下载及按钮位置 | `src/panels/review.js`、`src/app.js`、`index.html` |
| 用户名文件名、Token 有效期 | `shared/profile.js` |
| 裁剪决策与引用校验（结构化 config） | `shared/compiler.js` 的 `compile()` |
| 基于模板原文的 YAML 渲染（注释/flow/锚点/GEOSITE、远程 providers） | `shared/template-render.js`、`shared/catalog.json` 的 `templateText` |
| 模板元数据派生（地区/APP/规则/图标） | `shared/catalog-from-yaml.js`、`scripts/generate-catalog.mjs` |
| 服务端拉取、缓存、私网防护、可选 TCP 检测 | `worker/subscriptions.js` |
| IP 地址机场的旧 CF 套接字客户端（历史测试用） | `worker/ip-fetch.js` |
| 公网地址判定、统一 URL 校验 | `worker/public-url.js` |
| 创建、加密快照、旧记录兼容、实时更新 | `worker/application.js` |
| AES-GCM 与独立随机密钥 | `worker/crypto.js` |
| Node HTTP 入口、请求/响应转换 | `server/index.js` |
| 公开路由、CORS、链接改写、endpoints | `server/create-server.js` |
| 分享码生成 / 解析 / 合并、字段白名单 | `shared/share.js`、`src/share.js` |
| 分享码加密存储与本地密钥 | `server/presets.js`、`server/data/.preset-key` |
| 分享码导入 / 生成入口 | `src/panels/sources.js`、`src/panels/review.js`、`src/app.js` |
| 配置、文件型 KV、Node DNS/TCP 适配 | `server/config.js`、`server/storage.js`、`server/node-platform.js` |
| 纯静态产物（无 `_worker.js`）、service.json | `scripts/build-gateway.mjs` |
| CF Pages 纯静态项目配置（无 KV） | `wrangler.jsonc` |
| 自动检查 | 根目录 `.github/workflows/check.yml` |
| GitHub Pages 产物同步 / GitHub 侧调用后端 | 根目录 `.github/workflows/sync-static.yml`、`call-service.yml` |
| 可选手动 CF Pages 发布 | 根目录 `.github/workflows/deploy-cloudflare.yml` |

`worker/gateway/index.js` 是弃用的旧 CF 网关，不参与构建或部署，仅为历史回归测试保留。

## 接口

| 公开路径 | 行为 |
| --- | --- |
| `GET /api/status` | 检查存储、模板版本与能力，返回 `storage: self-hosted` 与后端地址 |
| `GET /api/endpoints` | 后端吐出 subscription 等链接模板，不含凭据 |
| `POST /api/inspect` | 替浏览器拉取机场，只返回脱敏清单 |
| `POST /api/latency` | 可选的服务器到节点 TCP 建连耗时 |
| `POST /api/preview` | 生成完整 YAML，供预览和下载；不落盘 |
| `POST /api/subscriptions` | 加密保存选择，返回 `/config-builder?token=<配置名称>[&pwd=<口令>]`；名称+口令映射到内部随机凭据，同名同口令返回 409 |
| `POST /api/presets` | 生成 36 位十六进制分享码，保存字段白名单内的配置选择 |
| `GET /api/presets/<code>` | 凭分享码取回选择；默认不含机场订阅地址 |
| `GET /config-builder?token=<名称>[&pwd=<口令>]` | 按配置名称与口令取回订阅，内联返回 YAML（无 `Content-Disposition`），浏览器可直接查看 |
| `GET /config-builder/status?token=<名称>[&pwd=<口令>]` | 向链接持有者刷新流量报告 |

旧的 `/subscription/<id>/<key>.yaml` 与 `/subscription/<id>/<key>/status` 路由已彻底移除，不是公开路径。

公开路径集中在 `shared/service-routes.js`；`server/create-server.js` 把它们映射到 `worker/application.js` 的内部路径。内部路由文件和模板不作为静态资源提供。

订阅链接在创建响应里改写：`server/create-server.js` 从 `filename` 还原用户填写的配置名称，做规范化（去空格、转 `-`、小写）与 3–60 位校验，并读取创建请求里的 `X-Config-Pwd`（可选，1–64 位非空白字符）。`shared/config-link.js` 用名称与口令生成 URL 查询串，并以「名称 + 口令」的 SHA-256 摘要作为 `alias:` 存储键（无口令时保留旧键以兼容历史链接）：同名不同口令互不冲突，同名同口令返回 409。映射指向 worker 返回的随机 id/key 并存入文件型 KV，口令明文不落盘。浏览器打开 `/config-builder?token=<名称>[&pwd=<口令>]` 时按同一摘要定位映射并转发到内部 `/s/…`，并把 YAML 响应的 `Content-Type` 改为 `text/plain`、去掉 `Content-Disposition`，以便直接浏览；客户端拉取仍收到 `Subscription-Userinfo` 与实时生成的配置。前端 `src/service.js` 的 `subscriptionURL()` / `usageURL()` 只校验新的 `/config-builder` 链接（含可选 `pwd`）。

分享码在确认页生成：前端把当前选择交给 `POST /api/presets`，后端用 `shared/share.js` 的字段白名单剔除机场地址（除非用户勾选包含），用 `server/presets.js` 以 18 字节随机数生成 36 位十六进制码，经 AES-GCM 封存到文件型 KV。导入时从「订阅来源」页粘贴码或完整链接，`applyShare()` 按当前 catalog 过滤未知 ID、保留导入者已有的机场地址；解析节点后恢复分享码里的地区选择（只保留当前订阅确实存在的地区）。分享码与订阅链接互不影响，前者分享选择，后者交付节点配置。

## 扩展模板

新增 APP 时，在模板加入 select 策略组和指向它的规则；可用 `x-configurator` 元数据指定标签、分类及 ID。构建会自动生成页面项。旧 Token 的 `appsMode: all` 会在下一次读取时包含新增 APP。

新增地区时，增加带 `x-configurator: { kind: region, id, label, flag }` 的策略组和 filter。浏览器与服务端使用同一匹配规则，并遵循模板中的分类优先级；页面只展示实际节点中匹配到的地区。生成文件也剔除未保留地区，其他地区不会重新包含已识别但被取消的国家。

规则由模板统一维护，不接受页面自定义规则和最终出口。新增协议需要修改共用解析器并增加转换、凭据保护和 Mihomo 语法验证；不在地区或 APP 面板内增加协议逻辑。

## 动效维护

`src/caustics.js` 维护单一水面与首次约 3.6 秒的开屏：图片解码后开始入场与 2.1 秒展示，再用 1.5 秒收拢至顶部。`index.html` 预加载 Logo，`src/styles.css` 用独立的等比容器完整展示图片，避免拉伸或裁切；解码等待与整个开屏都有超时上限。Canvas 落位后才移动到顶部容器，避免画面断开。首帧判断已访问、刷新和减少动态效果偏好，刷新直接显示顶部水面；Escape、Tab 或视口改变可立即跳过。水波以平滑衰减的折射叠加，渲染在后台或离开视口时停止。

`src/styles.css` 统一维护深浅主题、系统字体、间距和控件。编辑区采用实色表面；导航、水面入口按钮、移动端底部操作栏、预览与提示浮层采用磨砂玻璃。减少透明度、高对比度偏好和不支持背景模糊的环境使用实色降级。APP 的地区选择始终可见，不依赖鼠标悬停。

`src/motion.js` 集中维护非线性曲线、保留速度的步骤箭头弹簧、卡片增删和完成礼花；`src/motion.css` 管理对应视觉规则。步骤导航 DOM 持续复用，解析阶段指向中间行；新增机场只插入新卡片，保留已有输入和侧栏，再将焦点交给新机场。礼花仅在文件生成或订阅创建成功后触发，减少动态效果模式跳过装饰动效。

`scripts/build.mjs` 为 JS / CSS 写入内容哈希，并注入 `SERVICE_BASE_URL`，避免新旧资源缓存混用。主题与水面模块打包进浏览器入口，不再依赖公开源码路径。

## 验证与边界

`npm run build && npm test` 覆盖编排引用、地区筛选、P1/P2、真实/缺失流量、四种有效期、加密快照、同链接更新、跨源白名单、自建服务吐链接、文件存储过期、私有地址保护、静态产物隔离和协议解码。新增协议还需用 Mihomo 内核检查生成配置。

订阅统一由自建服务拉取，浏览器不受机场 CORS 策略影响。Base64 解码保留 UTF-8 字符，不是密码学解密。可选测速属于服务端 TCP 建连耗时，不能当作 ICMP ping 或完整代理隧道延迟。

对于公网 IP 加自定义端口的机场，自建服务直接用 Node 的 `fetch()` 读取（Node 没有 Cloudflare `fetch()` 的 IP 目标限制），DNS 由 `node:dns` 解析、TCP 检测由 `node:net` 完成；域名订阅同样使用 `fetch()`。HTTPS 保留 TLS 验证；重定向后重新检查目标，响应和解压结果均受大小限制。旧 `worker/ip-fetch.js` 的 `cloudflare:sockets` 实现仅保留给历史回归测试。

格式识别使用响应正文，不依赖 `Content-Type`。即使机场把 Base64 标成 `text/html`，也先解码并转换为 Mihomo 节点；不会把它作为 HTML 执行。所有机场都由服务端代取，未提供流量头的机场显示未知。

机场凭据、完整订阅链接和 YAML 不进入日志。完整 Token 链接是访问凭据；`server/data/` 只保存密文。客户端 DNS、TUN 与系统代理仍由客户端管理。
