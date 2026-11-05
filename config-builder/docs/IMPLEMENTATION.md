# config-builder · 实现路径

## 数据流

`resources/template/ratatoskr-template.yaml` 是 APP、国家/地区与规则的唯一来源。`scripts/generate-catalog.mjs` 调用 `shared/template.js` 生成共享目录，页面和 Pages 服务随同一次构建更新。目录不提取个人订阅与节点凭据。

前端与订阅服务同源部署在 Cloudflare Pages。`src/app.js` 固定以 `location.origin` 为 API 地址：把机场链接提交给 `/api/inspect`，由 Pages 服务端通过 `worker/subscriptions.js` 拉取，`shared/subscription.js` 解码 Base64、YAML 或节点链接，`shared/nodes.js` 用模板 filter 分类并只返回脱敏清单。浏览器不直连机场、不缓存完整节点、不写入本地存储，因此不受 CORS 限制。

`src/service.js` 在页面加载时检查同源 `/api/status`，验证存储、模板版本与能力；服务未就绪时向导停止并提示重试，不提供本地 / 离线降级，也没有手动填写服务地址的入口。后续选择地区、策略和 APP 与订阅协议分离。

最终下载通过 `/api/preview` 取得含完整节点的自包含 YAML。生成订阅时，Pages 将用户选择与 YAML 快照通过 AES-GCM 加密保存到 KV；客户端持有 ID 与独立随机 Token，访问稳定的 `/subscription/…` 地址。每次拉取更新节点和真实流量，再按当前模板编排。

## 功能对应位置

| 功能                                           | 维护入口                                           |
| ---------------------------------------------- | -------------------------------------------------- |
| 机场名称、链接及 P1/P2                         | `src/panels/sources.js`、`src/app.js`              |
| 同源接口调用、健康检查、状态与重试             | `src/app.js`、`src/service.js`、`index.html`       |
| Base64、YAML 和协议链接转换                    | `shared/subscription.js`                           |
| 脱敏节点清单、地区匹配、流量汇总               | `shared/nodes.js`                                  |
| 只展示拥有的地区、地区去留                     | `src/panels/regions.js`                            |
| 四种策略、默认手动                             | `src/panels/strategies.js`、`shared/compiler.js`   |
| APP 默认全选、跟随代理、地区/Direct/Reject     | `src/panels/apps.js`、`shared/compiler.js`         |
| 固定规则、最终出口跟随代理                     | `shared/compiler.js` 的参数校验和组装              |
| 最终确认、预览、下载及按钮位置                 | `src/panels/review.js`、`src/app.js`、`index.html` |
| 用户名文件名、Token 有效期                     | `shared/profile.js`                                |
| 完整节点 YAML 与地区过滤                       | `shared/compiler.js` 的 `inlineProxies` 选项       |
| 服务端拉取、缓存、私网防护、可选 TCP 检测      | `worker/subscriptions.js`                          |
| IP 地址机场、自定义端口、原生 TLS 和 HTTP 响应 | `worker/ip-fetch.js`                               |
| 公网地址判定、统一 URL 校验                    | `worker/public-url.js`                             |
| 创建、加密快照、旧记录兼容、实时更新           | `worker/application.js`                            |
| AES-GCM 与独立随机密钥                         | `worker/crypto.js`                                 |
| Pages 直连 KV、公开路径、静态文件隔离          | `worker/gateway/index.js`                          |
| Pages 项目、KV 与统一输出目录                  | `wrangler.jsonc`                                   |
| Pages 发布产物白名单                           | `scripts/build-gateway.mjs`                        |
| 自动检查、模板目录与页面产物同步               | 根目录 `.github/workflows/check.yml`               |
| 可选手动 Pages 发布                            | 根目录 `.github/workflows/deploy-cloudflare.yml`   |

## 接口

| 公开路径                                 | 行为                                        |
| ---------------------------------------- | ------------------------------------------- |
| `GET /api/status`                        | 读取 KV 并检查服务、模板与功能              |
| `POST /api/inspect`                      | 必要时替浏览器拉取机场，只返回脱敏清单      |
| `POST /api/latency`                      | 可选的服务器到节点 TCP 建连耗时             |
| `POST /api/preview`                      | 生成完整 YAML，供预览和下载；不创建 KV 记录 |
| `POST /api/subscriptions`                | 加密保存用户选择与 YAML 快照，返回订阅链接  |
| `GET /subscription/<id>/<secret>.yaml`   | 验证 Token，刷新机场节点、流量，生成配置    |
| `GET /subscription/<id>/<secret>/status` | 向链接持有者刷新流量报告                    |

公开路径集中在 `shared/service-routes.js`。内部路由文件和模板不作为静态资源提供。生产入口只导出默认 HTTP 处理器；测试工厂从 `worker/application.js` 注入数据源，不暴露为额外平台类入口。

## 扩展模板

新增 APP 时，在模板加入 select 策略组和指向它的规则；可用 `x-configurator` 元数据指定标签、分类及 ID。构建会自动生成页面项。旧 Token 的 `appsMode: all` 会在下一次读取时包含新增 APP。

新增地区时，增加带 `x-configurator: { kind: region, id, label, flag }` 的策略组和 filter。浏览器与服务端使用同一匹配规则，并遵循模板中的分类优先级；页面只展示实际节点中匹配到的地区。生成文件也剔除未保留地区，其他地区不会重新包含已识别但被取消的国家。

规则由模板统一维护，不接受页面自定义规则和最终出口。新增协议需要修改共用解析器并增加转换、凭据保护和 Mihomo 语法验证；不在地区或 APP 面板内增加协议逻辑。

## 动效维护

`src/caustics.js` 维护单一水面与首次约 3.6 秒的开屏：图片解码后开始入场与 2.1 秒展示，再用 1.5 秒收拢至顶部。`index.html` 预加载 Logo，`src/styles.css` 用独立的等比容器完整展示图片，避免拉伸或裁切；解码等待与整个开屏都有超时上限。Canvas 落位后才移动到顶部容器，避免画面断开。首帧判断已访问、刷新和减少动态效果偏好，刷新直接显示顶部水面；Escape、Tab 或视口改变可立即跳过。水波以平滑衰减的折射叠加，渲染在后台或离开视口时停止。

`src/styles.css` 统一维护深浅主题、系统字体、间距和控件。编辑区采用实色表面；导航、水面入口按钮、移动端底部操作栏、预览与提示浮层采用磨砂玻璃。减少透明度、高对比度偏好和不支持背景模糊的环境使用实色降级。APP 的地区选择始终可见，不依赖鼠标悬停。

`src/motion.js` 集中维护非线性曲线、保留速度的步骤箭头弹簧、卡片增删和完成礼花；`src/motion.css` 管理对应视觉规则。步骤导航 DOM 持续复用，解析阶段指向中间行；新增机场只插入新卡片，保留已有输入和侧栏，再将焦点交给新机场。礼花仅在文件生成或订阅创建成功后触发，减少动态效果模式跳过装饰动效。

`scripts/build.mjs` 为 JS / CSS 写入内容哈希，检查工作流同步对应 HTML，避免新旧资源缓存混用。主题与水面模块打包进浏览器入口，不再依赖公开源码路径。

## 验证与边界

`npm run build && npm test` 覆盖编排引用、地区筛选、P1/P2、真实/缺失流量、四种有效期、加密快照、同链接更新、跨域来源、私有地址保护、公开文件隔离和协议解码。新增协议还需用 Mihomo 内核检查生成配置。

订阅统一由同源服务拉取，浏览器不再受机场 CORS 策略影响。Base64 解码保留 UTF-8 字符，不是密码学解密。可选测速属于服务端 TCP 建连耗时，不能当作 ICMP ping 或完整代理隧道延迟。

对于公网 IP 加自定义端口的机场，同源服务使用 `cloudflare:sockets` 拉取 HTTP / HTTPS 订阅，避免 Cloudflare `fetch()` 的 IP 目标限制；域名订阅继续使用 `fetch()`。HTTPS 保留原生 TLS 验证；只允许 GET / HEAD，重定向后重新检查目标，响应和解压结果均受大小限制。HTTP 分块、gzip / deflate、超时及关闭连接由独立模块处理，回归测试见 `tests/ip-subscriptions.test.mjs`。

格式识别使用响应正文，不依赖 `Content-Type`。即使机场把 Base64 标成 `text/html`，也先解码并转换为 Mihomo 节点；不会把它作为 HTML 执行。所有机场都由服务端代取，未提供流量头的机场显示未知。

机场凭据、完整订阅链接和 YAML 不进入日志。完整 Token 链接是访问凭据；KV 只保存密文。客户端 DNS、TUN 与系统代理仍由客户端管理。
