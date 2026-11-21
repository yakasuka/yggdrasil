# 常见问题

<p align="center">
  <a href="README.zh-CN.md">项目介绍</a> ·
  <a href="QUICKSTART.zh-CN.md">快速开始</a> ·
  <a href="CONTRIBUTING.zh-CN.md">贡献指南</a> ·
  <a href="CONTRIBUTORS.zh-CN.md">贡献者</a> ·
  <a href="FAQ.zh-CN.md">常见问题</a>
</p>

---

## 配置为什么这么小，规则却能覆盖很多服务？

Ratatoskr 引用 Geo 数据分类，具体域名和 IP 数据由数据库承载。配置只保留分类引用、匹配顺序和出口编排；数据库仍需由客户端单独加载与更新。

## 拿到一个 YAML 就能在所有客户端使用吗？

配置面向 Mihomo，客户端需支持相应语法并具备所引用的 Geo 分类。DNS、TUN 等网络接管功能按所选模板与设备环境配置。

## 后续维护需要反复重写全部配置吗？

Geo 数据分类、补充规则源、节点订阅与出口策略分别维护。按客户端机制更新数据，在需要时调整对应规则或策略组；分类名称与引用需保持有效。

## 广告拦截规则如何更新？

AdGuard 桌面规则由 GitHub Actions 每日探测官方上游，仅在内容变化时拉取并更新规则文件，遵循低资源占用的懒更新原则。

## 配置工坊和主配置是什么关系？

配置工坊（Yggdrasil 应用）读取 Ratatoskr 模板中的应用、地区与策略定义，按网页选择组装个人配置。一个负责组织和生成，一个定义实际的分流与节点策略。

## 使用是否免费？是否需要授权？

项目采用 **All Rights Reserved** 许可。使用、运行、修改、再分发、公开部署及商业使用原创内容，须事先取得相应权利人书面许可；个人与非商业用途同样适用。完整条款见 [LICENSE](../../LICENSE)，可通过 [Issues](https://github.com/yakasuka/yggdrasil/issues) 申请授权。
