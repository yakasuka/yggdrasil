# Yggdrasil · config-builder

**[打开配置工坊](https://yakasuka.github.io/yggdrasil/config-builder/)** · [部署指南与复盘](docs/DEPLOYMENT.md) · [项目介绍](../README.md) · [完整实现路径](docs/IMPLEMENTATION.md) · [服务准备](worker/README.md)

五步配置：机场订阅 → 解析节点 → 地区节点 → 节点策略 → APP 分流 → 最终确认。“解析节点”是第 1、2 步之间的状态项，不可选择。

```text
config-builder/
├── index.html                 # Pages 入口与底部操作按钮
├── config.json                # 静态预览配置；Pages 运行时动态返回同源地址
├── wrangler.jsonc             # Pages 项目、KV 与统一发布输出目录
├── src/
│   ├── app.js                 # 状态、解析和五步引导调度
│   ├── panels/                # 订阅 / 地区 / 策略 / APP / 确认，分别维护
│   ├── service.js             # 地址校验、健康检查与返回链接校验
│   ├── subscriptions.js       # 浏览器拉取与节点文件导入
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

打开 `http://localhost:8788/config-builder/`。旧 `/webui/`、`/builder/` 和 `/Configurator/` 会跳转到新入口。

修改源码后构建并提交 `assets/` 与 `shared/catalog.json`。新增模板内容的格式、相同 Token 跟随模板更新的机制，以及流量和 TCP 检测的实际边界，见 [完整实现路径](docs/IMPLEMENTATION.md)。

网页先尝试直接拉取订阅并解码 Base64；无法跨域读取时由 Pages 代取。KV 保存加密的用户选择和 YAML 快照，订阅拉取会更新节点与真实流量。完整配置保留所选地区和 P1/P2 来源标识。

GitHub Pages 的默认 `apiBase` 留空，页面会显示本地模式。订阅服务部署后，可在“连接设置”填写可信服务地址，或由维护者更新 `config.json`；Cloudflare Pages 会自动连接同源服务。未部署后端时，跨域代取和持久订阅仍不可用，文件导入、预览和下载可独立使用。
