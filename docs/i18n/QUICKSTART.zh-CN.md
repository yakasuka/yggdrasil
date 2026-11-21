<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Yggdrasil 项目标识" />
</p>

<h1 align="center">快速开始</h1>

<p align="center">
  <a href="README.zh-CN.md">项目介绍</a> ·
  <a href="QUICKSTART.zh-CN.md">快速开始</a> ·
  <a href="CONTRIBUTING.zh-CN.md">贡献指南</a> ·
  <a href="CONTRIBUTORS.zh-CN.md">贡献者</a> ·
  <a href="FAQ.zh-CN.md">常见问题</a>
</p>

---

## 开始之前

项目采用 **All Rights Reserved** 许可。使用、运行、修改、再分发、公开部署或商业使用项目原创内容前，须事先取得相应权利人的书面许可。详见 [LICENSE](../../LICENSE)。

## 推荐方式：配置工坊

打开 [配置工坊](https://yakasuka.github.io/yggdrasil/config-builder/)，依次完成五步：

1. **订阅来源。** 填写机场名称与 YAML、Base64 或常见节点链接订阅，随后解析节点和机场报告的流量信息。
2. **地区节点。** 只展示订阅中确实拥有的地区，选择需要保留的节点范围。
3. **节点策略。** 四种自动策略按需保留，默认出口为手动选择。
4. **APP 分流。** 默认全部启用并跟随代理，也可指定已保留的地区、Direct 或 Reject。
5. **最终确认。** 预览配置，下载 `名字-ratatoskr.yaml`，或生成持久订阅链接。

订阅接受 YAML、Base64 与常见节点链接；流量信息来自机场的 `Subscription-Userinfo`。可选检测测量服务器到节点的 TCP 建连耗时，不将其标为 ICMP ping 或完整代理延迟。

## 手动方式：直接使用模板

1. 下载 [ratatoskr-template.yaml](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml)。
2. 在本地维护自己的 `proxy-providers` / `proxies`，填入订阅节点。
3. 确保客户端具备所引用的 GeoSite / GeoIP 数据。
4. 导入 Mihomo 客户端，按应用或地区选择出口，重新执行延迟测试。

## 端口

| 配置 | HTTP | SOCKS5 |
| :--- | :--- | :--- |
| 手动模板 | `7890` | `7891` |
| 配置工坊生成文件 | `7890` | `7890` |

配置工坊使用混合端口并支持自定义。个人订阅地址、节点凭据与访问令牌应在本地或私有流程中维护。

## 部署

配置工坊与订阅服务同源部署在 Cloudflare Pages。详见 [部署指南](../../config-builder/docs/DEPLOYMENT.md) 与 [实现路径](../../config-builder/docs/IMPLEMENTATION.md)。

---

<p align="center"><sub>Yggdrasil × Ratatoskr · 配置工具与核心模板协同工作。</sub></p>
