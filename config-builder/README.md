# Yggdrasil · config-builder

**配置工坊** · [部署指南与复盘](docs/DEPLOYMENT.md) · [项目介绍](../README.md) · [完整实现路径](docs/IMPLEMENTATION.md) · [服务准备](worker/README.md)

五步配置：机场订阅 → 解析节点 → 地区节点 → 节点策略 → APP 分流 → 最终确认。“解析节点”是第 1、2 步之间的状态项，不可选择。

```text
config-builder/
├── index.html                 # Pages 入口与底部操作按钮
├── wrangler.jsonc             # Pages 项目、KV 与统一发布输出目录
├── src/
│   ├── app.js                 # 状态、五步引导调度与同源接口调用
│   ├── panels/                # 订阅 / 地区 / 策略 / APP / 确认，分别维护
│   ├── service.js             # 地址校验、健康检查与返回链接校验
│   ├── ui.js                  # 文本转义、流量卡片与显示格式
│   └── styles.css
├── shared/
│   ├── template.js            # 唯一模板解析，前后端共用
│   ├── catalog.json           # 生成目录，不手动修改
│   ├── nodes.js               # 节点、地区分类与流量
│   ├── subscription.js        # Base64、YAML 与节点协议转换
│   ├── profile.js             # 文件名和 Token 有效期
│   ├── compiler.js            # 参数校验与 YAML 生成
│   └── service-routes.js      # 公开路径映射
├── worker/                    # 内部服务、订阅拉取、加密与公开网关
├── scripts/                   # 目录生成和资源构建
├── tests/                     # 测试与测试订阅文件
├── docs/DEPLOYMENT.md         # 部署步骤、故障复盘和操作记录
├── docs/IMPLEMENTATION.md     # 每项功能的实现路径与维护方式
└── assets/                    # 自动生成的页面资源
```

目录来源是 **[resources/template/ratatoskr-template.yaml](../resources/template/ratatoskr-template.yaml)**。新增 APP 策略组和规则、或带元数据的地区组后，Actions 会测试并同步生成资源；重新部署 Pages 后会使用新模板。不在前端维护第二份 APP 或国家列表。Pages 与 KV 的部署、验收和常见故障，见 [部署指南](docs/DEPLOYMENT.md)。

```sh
npm --prefix config-builder ci
npm --prefix config-builder run build
npm --prefix config-builder test
npm --prefix config-builder run service:dev
```

打开 `http://localhost:8788/config-builder/` 可本地开发预览；正式的公开入口是部署后的 `https://<项目名>.pages.dev/config-builder/`。旧 `/webui/`、`/builder/` 和 `/Configurator/` 会跳转到新入口。

修改源码后构建并提交 `assets/` 与 `shared/catalog.json`。新增模板内容的格式、相同 Token 跟随模板更新的机制，以及流量和 TCP 检测的实际边界，见 [完整实现路径](docs/IMPLEMENTATION.md)。

页面与订阅服务同源部署在 Cloudflare Pages：浏览器只把机场链接提交给 `/api/inspect`，由服务拉取、解码并只返回节点清单与真实流量；预览、下载与持久订阅分别由 `/api/preview`、`/api/subscriptions` 生成。KV 保存加密的用户选择和 YAML 快照，完整配置保留所选地区和 P1/P2 来源标识。

没有独立的本地 / 离线模式，也没有手动填写服务地址的入口：服务未就绪时向导会停止并给出明确提示。GitHub 负责代码托管与 Actions 构建测试，Cloudflare Pages 负责静态资源、Functions 接口与 KV，两者免费额度即可运行，不需要自建或租用服务器。部署与验收见 [部署指南](docs/DEPLOYMENT.md)。
