# Yggdrasil · Configurator

**[打开 Configurator](https://yakasuka.github.io/yggdrasil/Configurator/)** · [项目介绍](../README.md) · [完整实现路径](docs/IMPLEMENTATION.md) · [服务准备](worker/README.md)

五步配置：机场订阅 → 解析节点 → 地区节点 → 节点策略 → APP 分流 → 最终确认。“解析节点”是第 1、2 步之间的状态项，不可选择。

```text
Configurator/
├── index.html                 # Pages 入口与底部操作按钮
├── config.json                # 公开网关地址，未部署时留空
├── src/
│   ├── app.js                 # 状态、解析和五步引导调度
│   ├── panels/                # 订阅 / 地区 / 策略 / APP / 确认，分别维护
│   ├── service.js             # 公开地址与返回链接校验
│   ├── ui.js                  # 文本转义、流量卡片与显示格式
│   └── styles.css
├── shared/
│   ├── template.js            # 唯一模板解析，前后端共用
│   ├── catalog.json           # 生成目录，不手动修改
│   ├── nodes.js               # 节点、地区分类与流量
│   ├── profile.js             # 文件名和 Token 有效期
│   ├── compiler.js            # 参数校验与 YAML 生成
│   └── service-routes.js      # 公开路径映射
├── worker/                    # 内部服务、订阅拉取、加密与公开网关
├── scripts/                   # 目录生成和资源构建
├── tests/                     # 测试与测试订阅文件
├── docs/IMPLEMENTATION.md     # 每项功能的实现路径与维护方式
└── assets/                    # 自动生成的页面资源
```

目录来源是根目录的 **[Ratatoskr-Template.yaml](../Ratatoskr-Template.yaml)**。新增 APP 策略组和规则、或带元数据的地区组后，推送到 `main`，Actions 会测试并同步生成资源；内部服务也会运行时读取最新模板。不在前端维护第二份 APP 或国家列表。

```sh
npm --prefix Configurator ci
npm --prefix Configurator run build
npm --prefix Configurator test
python3 -m http.server 8765
```

打开 `http://localhost:8765/Configurator/`。旧 `/webui/` 和 `/builder/` 会跳转到新入口。

修改源码后构建并提交 `assets/` 与 `shared/catalog.json`。新增模板内容的格式、相同 Token 跟随模板更新的机制，以及流量和 TCP 检测的实际边界，见 [完整实现路径](docs/IMPLEMENTATION.md)。

未部署服务时，可导入机场的 Mihomo 节点文件进行本地预览和下载。在线机场解析、TCP 检测、实时流量查询和持久订阅需后续部署服务；页面不会生成虚假的订阅地址。
