# Yggdrasil

Mihomo 配置模板与订阅服务。

| 配置 | 用途 |
|---|---|
| [yggdrasil.yaml](yggdrasil.yaml) | 完整模板，包含 DNS / TUN / 流量嗅探和详细规则集 |
| [Ratatoskr.yaml](Ratatoskr.yaml) | 使用 GeoSite / GeoIP 的轻量模板，包含 24 个国家 / 地区分组和 macOSicons 图标 |

## Ratatoskr

[配置直链](https://raw.githubusercontent.com/yakasuka/yggdrasil/main/Ratatoskr.yaml) · [图标预览](icons/macosicons/preview.png) · [图标来源与作者](icons/macosicons/README.md)

- 按国旗 / 中英文名称 / 地区代码筛选节点，新增地区支持常见城市别名。
- 地区覆盖香港、台湾、澳门、日本、韩国、新加坡、泰国、马来西亚、越南、菲律宾、印尼、印度、澳大利亚、美国、加拿大、英国、德国、法国、荷兰、瑞士、俄罗斯、土耳其、巴西、阿根廷。
- “其他地区”过滤订阅信息节点，并排除已单列的地区。
- 包含手动选择、延迟自动选择、故障转移、一致性哈希及轮询负载均衡。
- 应用组包含 AI、社交、流媒体、游戏和加密货币；预留入口已在配置注释中标明。
- 策略组图片由本仓库托管，原始作品来自 [macOSicons](https://macosicons.com/)。

### 使用

1. 下载 `Ratatoskr.yaml`，导入支持 GeoSite / GeoIP 的 Mihomo 客户端，并确保客户端的地理数据可用。
2. 在 `proxy-providers` 示例中填写自己的订阅并取消整段注释，或通过 `AUTO-PROVIDERS` 标记区注入订阅。手动节点在 `proxies` 中补全协议参数。
3. 加载配置后，在“节点选择”或应用策略组中选择出口。HTTP 端口为 `7890`，SOCKS5 端口为 `7891`。

配置直链提供模板；个人订阅地址及节点凭据应在本地或现有私有订阅流程中填写。

### 地区匹配

地区由节点名称判断，实际落地以机场标注为准。节点名称包含多个地区标记时，可能同时出现在多个分组。地区正则排除名称以 `=>` 开头的节点；“其他地区”同时应用信息节点净化。

Bybit 图标暂用 Wallet，TapTap 图标暂用 Game Center；地区组统一采用 Maps。详细映射见 [manifest.json](icons/macosicons/manifest.json)。

## 仓库结构

```text
yggdrasil.yaml            完整配置模板
Ratatoskr.yaml            轻量配置模板
Rules/                   现有自定义规则
functions/               现有订阅与配置合并接口
icons/macosicons/         图标、预览、映射与作品署名
```

图标作品及品牌标识的权利归各自作者或品牌方所有，来源页面与作者信息已保留在图标目录中。
