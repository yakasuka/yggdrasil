# Ratatoskr · 配置工坊

Yggdrasil 的五步订阅向导：填写机场 → 代理分流 → 规则选择 → 地区节点 → 生成配置。

**[打开 WebUI](https://yakasuka.github.io/yggdrasil/webui/)** · [项目说明](../README.md) · [Worker 部署](worker/README.md)

## 目录约定

```text
webui/
├── index.html                 # GitHub Pages 页面入口
├── config.json                # 运行时配置：Worker 服务地址
├── src/                       # 浏览器端源码，日常修改入口
│   ├── app.js                 # 五步引导与页面交互
│   └── styles.css             # 布局、主题与响应式样式
├── assets/                    # 编译产物，由构建脚本生成并提交
│   ├── app.js
│   └── app.css
├── shared/                    # 浏览器与 Worker 共用的配置逻辑
│   ├── compiler.js            # 参数校验与 Mihomo YAML 生成
│   └── catalog.json           # 从仓库模板提取的公开规则目录
├── worker/                    # Cloudflare Worker + KV 后端
├── scripts/                   # 规则目录生成与前端构建
├── tests/                     # 生成器与接口测试
├── package.json
└── package-lock.json
```

项目整体说明在仓库根目录的 `README.md`；配置文件与品牌资源也留在根目录。模板筛选工具位于 `scripts/generate-ratatoskr-filters.mjs`，与 WebUI 构建分开维护。

`src/`、`shared/compiler.js`、`index.html` 是维护入口。不要手动修改 `assets/` 或 `shared/catalog.json`，它们会在构建时重新生成。服务地址只在 `config.json` 配置，无需重新编译页面。

## 构建与验证

在仓库根目录执行，需要 Node.js 22 或更新版本：

```sh
npm --prefix webui ci
npm --prefix webui run build
npm --prefix webui test
```

也可以 `cd webui` 后使用 `npm ci`、`npm run build`、`npm test`。脚本按自身位置定位模板和输出文件，不依赖调用时的工作目录。

构建先读取根目录的 `ratatoskr.yaml` 和 `Ratatosk-Eb.yaml`，生成公开目录，再编译 `src/app.js` 与 `src/styles.css`。只提取应用、规则与地区信息，不提取模板中的 `proxy-providers` 或 `proxies`。

修改源代码或模板后，将变更与生成的 `shared/catalog.json`、`assets/` 一起提交。CI 会重新构建、执行测试并检查生成文件是否同步。

## 预览与发布

在仓库根目录启动静态服务：

```sh
python3 -m http.server 8765
```

打开 `http://localhost:8765/webui/`。从仓库根目录提供服务，可同时加载上级目录的品牌图片和 favicon。

GitHub Pages 继续从仓库根目录发布，无需额外的前端托管配置。正式入口为 `/yggdrasil/webui/`，旧 `/yggdrasil/builder/` 保留兼容跳转。

配置服务需另行部署，详见 [Worker 说明](worker/README.md)。`config.json` 的 `apiBase` 未填写时，WebUI 可预览和下载 YAML，生成正式订阅链接的按钮会显示为不可用。修改共享生成器或目录后，前端与 Worker 都要同步更新。
