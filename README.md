<p align="center">
  <img src="assets/favicon-master.png" width="216" height="216" alt="Yggdrasil 世界树透明标识" />
</p>

<h1 align="center">Yggdrasil · 世界树</h1>

<p align="center">
  <strong>自由生长，生生不息。</strong><br />
  一站式订阅中枢 · Geo 数据驱动的超轻量配置<br />
  模块化规则与策略，随需组合，自由定制。
</p>

<p align="center">
  <a href="https://wiki.metacubex.one/"><img src="https://img.shields.io/badge/Core-Mihomo-3282B8?style=flat-square" alt="内核：Mihomo" /></a>
  <a href="#geo-驱动的超轻量配置"><img src="https://img.shields.io/badge/Geo-GeoSite_%2B_GeoIP-537A5A?style=flat-square" alt="GeoSite 与 GeoIP 数据驱动" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Permission_Required-C4A25A?style=flat-square" alt="使用前须取得书面许可" /></a>
</p>

<p align="center">
  <a href="#世界树与信使">项目理念</a> ·
  <a href="#一站式订阅">一站式订阅</a> ·
  <a href="#ratatoskr--轻量配置本体">Ratatoskr</a> ·
  <a href="#配置选择">配置选择</a> ·
  <a href="#快速开始">快速开始</a> ·
  <a href="#自定义与扩展">自定义与扩展</a>
</p>

---

## 世界树与信使

**Yggdrasil** 取意于北欧神话中联结诸界的世界树。根系汲取数据，枝干组织规则，枝叶承载不同的需求。我们希望配置能在清晰的结构中自由生长：规则持续迭代，模块按需增减，新的服务与使用方式都能找到自己的位置。

**[Ratatoskr](https://en.wikisource.org/wiki/The_Poetic_Edda_%28tr._Bellows%29/Grimnismol)** 是穿行于世界树枝干间的松鼠，也是本项目配置文件的名字。在这里，它承载着从中枢送达终端的配置：把 Geo 数据、分流规则与策略组编排成一份轻量的 YAML，交给 Mihomo 执行。

**Yggdrasil 负责组织、生成与交付；Ratatoskr 是抵达使用者手中的配置本体。**

## 一站式订阅

Yggdrasil 面向一站式的使用体验：使用者通过 WebUI 选择自己需要的配置内容，获得加工后生成的配置文件或订阅链接，再交给客户端使用。

<p align="center"><strong>选择所需内容 → 组装个人配置 → 获取文件或订阅 → 导入客户端</strong></p>

目标体验围绕三个步骤展开：

1. **选择。** 在 WebUI 中选择应用分流、规则模块、节点策略、地区分组及其他配置项。
2. **生成。** 将所选内容与节点订阅组合，生成对应的 Ratatoskr 配置。
3. **订阅。** 获取生成的配置文件或统一订阅链接，让客户端从同一入口接收后续更新。

> [!NOTE]
> **当前实现范围**：仓库已提供配置模板、节点订阅返回和固定模板合并接口。现有首页用于项目展示与链接复制；WebUI 模块勾选、按选择组装个人配置是下一阶段能力。上方描述的是目标使用流程。

## Ratatoskr · 轻量配置本体

Ratatoskr 将庞大的分类数据交给 Geo 数据库，将清晰的分流意图留在配置文件中。应用走向、直连范围、节点组织与出口策略集中编排，既便于直接使用，也方便维护者理解和扩展。

### Geo 驱动的超轻量配置

- **GeoSite 管理域名分类。** 用应用与服务分类表达分流范围，减少在 YAML 中逐条维护大量域名的负担。
- **GeoIP 提供 IP 分类匹配。** 配合域名规则，处理适合按 IP 分类识别的目标。
- **补充规则保留定制空间。** 通过少量 `rule-providers` 承接自定义域名、IP 与端口规则。
- **配置本体保持精简。** 当前主模板约 **22 KB**，主要保留分类引用、匹配顺序与策略编排。

体积仅指 YAML 配置本身。Geo 数据库仍需由客户端或内核加载、更新；轻量体现为更小的配置本体与更低的规则编排维护负担。

### 全栈式精准分流

将目标匹配、规则优先级、策略编排与出口选择连接起来，覆盖完整的分流链路。

| 分流维度 | 配置负责什么 |
| :--- | :--- |
| 应用与服务 | 为 AI、社交、通信、流媒体、游戏等服务设置独立出口 |
| 分类规则 | 以 Geo 分类组织国内外流量、应用类别与通用代理范围 |
| 域名与 IP | 组合 GeoSite、GeoIP 和自定义补充规则进行匹配 |
| 端口与例外 | 为特殊端口、指定目标和个性化例外保留独立规则 |
| 节点与地区 | 按名称组织地区节点，组合手动选择、自动选择和故障转移 |
| 出口与兜底 | 使用一致性哈希、轮询及最终出口，处理不同连接需求 |

规则按顺序匹配。实际分流效果由规则优先级、Geo 数据内容与客户端能力共同决定；地区节点分组按名称筛选，实际落地以机场说明为准。

<details>
<summary><strong>查看内置节点策略</strong></summary>

| 策略 | 行为 |
| :--- | :--- |
| 🚀 手动切换 | 固定使用选中的节点 |
| ♻️ 自动选择 | 根据延迟测试结果选择节点 |
| 🔯 故障转移 | 按顺序使用首个可用节点 |
| 🔮 负载均衡 | `consistent-hashing`，同一目标尽量保持相同出口 |
| ⚖️ 下载均衡 | `round-robin`，轮询分配新连接 |

应用是否使用某个策略，由其可选项、当前选择与规则命中决定。轮询不拆分单条连接，也不保证多节点带宽叠加。

模板启用 `unified-delay: true`，优先通过复用连接的第二次请求计算延迟。相关说明见 [Mihomo 全局配置](https://wiki.metacubex.one/config/general/#统一延迟)。

</details>

## 模块化与可维护性

规则数据、路由意图、出口策略与节点来源分层维护，让每一处变化都能落到明确的位置。

| 层次 | 职责与维护入口 |
| :--- | :--- |
| 数据根系 | GeoSite / GeoIP 提供分类数据，数据更新与 YAML 编排分离 |
| 规则枝干 | `rules` 表达匹配顺序；`rule-providers` 接入额外规则集 |
| 策略分枝 | `proxy-groups` 组织应用出口、地区分组与连接策略 |
| 节点叶群 | `proxy-providers` / `proxies` 管理机场订阅与手动节点 |
| 配置交付 | 接口读取模板与私有订阅，将节点来源注入约定区域 |

- **易维护。** 共享 Geo 分类与规则锚点，减少重复配置；订阅、策略与规则分别定位。
- **可扩展。** 新增应用、地区或规则源时，沿用现有分组与引用方式继续生长。
- **可自定义。** 调整目标匹配、规则优先级、节点筛选和出口选择，保留自己的使用习惯。
- **便于组合。** 为 WebUI 的按需选择与后续配置生成保留明确的模块边界。

## 配置选择

以 Ratatoskr 为主配置，根据地区分类和网络接管需求选择对应文件。

| 文件 | 定位 | 主要内容 |
| :--- | :--- | :--- |
| **[Ratatoskr](Ratatoskr.yaml)** | 日常主配置 | Geo 驱动的轻量分流，6 个常用地区与其他节点入口 |
| **[Ratatosk · Eb](Ratatosk-Eb.yaml)** | 地区扩展 | 24 个国家 / 地区分组，使用 macOSicons 图标 |
| **[yggdrasil.yaml](yggdrasil.yaml)** | 完整网络栈参考 | DNS、TUN、流量嗅探与详细外部规则集 |

`Ratatosk-Eb.yaml` 沿用仓库现有文件名。三份配置独立维护，规则与策略组并不完全相同；当前主模板的轻量 Geo 架构不代表所有参考配置使用同一种规则组织方式。

<details>
<summary><strong>查看配置直链与地区覆盖</strong></summary>

取得授权后，可下载文件或将配置地址导入客户端：

- [Ratatoskr.yaml](https://raw.githubusercontent.com/yakasuka/yggdrasil/main/Ratatoskr.yaml)
- [Ratatosk-Eb.yaml](https://raw.githubusercontent.com/yakasuka/yggdrasil/main/Ratatosk-Eb.yaml)
- [yggdrasil.yaml](https://raw.githubusercontent.com/yakasuka/yggdrasil/main/yggdrasil.yaml)

**常用地区**：香港、台湾、日本、韩国、新加坡、美国。

**Eb 扩展地区**：香港、台湾、澳门、日本、韩国、新加坡、泰国、马来西亚、越南、菲律宾、印度尼西亚、印度、澳大利亚、美国、加拿大、英国、德国、法国、荷兰、瑞士、俄罗斯、土耳其、巴西、阿根廷。

另设“其他”入口，具体范围由各模板的筛选规则决定。

</details>

## 快速开始

当前可通过模板导入或已部署的接口使用配置：

1. **确认授权。** 取得相应原作者或权利人的书面许可，条款见 [LICENSE](LICENSE)。
2. **选择配置。** 日常使用从 `Ratatoskr.yaml` 开始；需要更细地区分组时选择 Eb 版。
3. **准备节点与数据。** 在本地维护自己的 `proxy-providers` 或 `proxies`，并准备包含所用分类的 GeoSite / GeoIP 数据。
4. **导入并选择出口。** 在 Mihomo 客户端中加载配置，按应用或地区选择策略，重新执行延迟测试。

部署了合并接口的维护者，可将生成的 `/merge?token=…` 地址作为订阅入口。具体地址、令牌和可用功能以实际部署为准。

| 配置 | HTTP | SOCKS5 |
| :--- | :--- | :--- |
| Ratatoskr / Eb | `7890` | `7891` |
| 完整网络栈参考 | `7890` | `7890` |

完整网络栈参考使用混合端口。个人订阅地址、节点凭据与访问令牌应在本地或私有流程中维护。

## 自定义与扩展

可以从一个域名例外开始，也可以继续生长出新的应用、地区与出口策略。

| 需要调整什么 | 修改位置 |
| :--- | :--- |
| 替换机场或加入手动节点 | `proxy-providers` / `proxies` |
| 为某个应用指定出口 | 对应应用的 `proxy-groups` 与 `rules` |
| 加入自己的域名、IP 或端口例外 | 在现有 `rules` 中插入规则，或接入补充规则集 |
| 增加地区分类 | 节点筛选锚点、地区策略组及其引用 |
| 改变连接分配方式 | 策略组类型、候选节点和负载均衡参数 |
| 更换图标 | 策略组 `icon` 与相应图标说明 |

例如，为一个域名增加代理规则，可将下面的规则项插入现有 `rules` 列表，放在会覆盖它的通用规则及最终兜底之前：

```yaml
- DOMAIN-SUFFIX,example.com,🎚️ 节点选择
```

扩展策略组或重命名规则源时，同步更新引用；修改后重新加载并检查实际命中结果。

<details>
<summary><strong>维护者：订阅接口与部署约定</strong></summary>

仓库提供适用于 Cloudflare Pages Functions 的接口：

| 接口 | 实现与职责 |
| :--- | :--- |
| `/merge?token=…` | [merge.js](functions/merge.js)：读取公开模板，将私有 `providers.yaml` 注入自动订阅标记区 |
| `/sub?token=…` | [sub.js](functions/sub.js)：读取私有 `nodes.yaml`，返回节点 YAML |

环境变量：`TOKEN` 用于接口鉴权，`GH_TOKEN` 用于读取私有仓库，`PUBLIC_CONFIG_URL` 指定合并接口使用的模板地址。

当前代码读取 `yakasuka/yggdrasil-private`。迁移时应同步调整仓库位置、凭据和模板地址，并保留成对的 `AUTO-PROVIDERS-START` / `AUTO-PROVIDERS-END` 标记。

现有 `/merge` 负责固定模板的订阅注入，WebUI 选项到规则、策略模块的动态映射仍待实现。`/sub` 的 `Subscription-Userinfo` 是模拟流量信息，不代表机场真实用量。

</details>

## 图标与视觉

世界树标识与命名贯穿项目，应用和地区图标帮助使用者更快找到自己的出口。

<p align="center">
  <img src="icons/macosicons/chatgpt.png" width="46" alt="ChatGPT 图标" />
  <img src="icons/macosicons/claude.png" width="46" alt="Claude 图标" />
  <img src="icons/macosicons/telegram.png" width="46" alt="Telegram 图标" />
  <img src="icons/macosicons/spotify.png" width="46" alt="Spotify 图标" />
  <img src="icons/macosicons/steam.png" width="46" alt="Steam 图标" />
  <img src="icons/macosicons/maps.png" width="46" alt="地区分组图标" />
</p>

[品牌标识](assets/README.md) · [Eb 图标预览](icons/macosicons/preview.png) · [图标作者与来源](icons/macosicons/README.md) · [映射清单](icons/macosicons/manifest.json)

日常模板使用 `icons/` 中的图标；Eb 版使用 42 张 macOSicons PNG。图标作品、品牌标识及面板素材的权利归各自权利人所有。

<details>
<summary><strong>查看 Mihomo 控制面板参考</strong></summary>

![Zashboard 代理面板效果参考](icons/zashboard-pc-dark.png)

Mihomo 运行时的 Zashboard 控制面板参考；分组名称、节点状态与数值以所选配置和实际运行结果为准。

</details>

## 常见问题

**配置为什么很小，规则仍能覆盖很多服务？**

Ratatoskr 引用 Geo 数据分类，具体域名和 IP 数据由数据库承载。配置保留分类引用、匹配顺序和出口编排；数据库仍需单独加载。

**拿到一个 YAML 就能在所有客户端使用吗？**

配置面向 Mihomo，客户端需支持相应语法，并具备所引用的 Geo 分类。DNS、TUN 等网络接管功能按所选模板和设备环境配置。

**后续维护需要反复重写全部配置吗？**

Geo 数据分类、补充规则源、节点订阅和出口策略分别维护。按客户端机制更新数据，在需要时调整对应规则或策略组；分类名称和引用仍需保持有效。

## 许可与反馈

**All Rights Reserved · Prior Written Permission Required**

项目原创内容的使用、运行、修改、再分发、公开部署及商业使用，须事先取得相应原作者或权利人的书面许可；个人与非商业用途同样适用。完整范围、例外与免责条款见 [LICENSE](LICENSE)。第三方素材继续遵循各自许可，适用法律、GitHub 平台条款和既有有效授权不受排除。

通过 [Issues](https://github.com/yakasuka/yggdrasil/issues) 反馈问题或申请授权。问题反馈请附客户端与内核版本、所用配置和预期分流结果，并移除订阅令牌与节点凭据。

### 致谢与参考

- [Mihomo](https://github.com/MetaCubeX/mihomo)：配置所面向的内核与文档。
- [ACL4SSR](https://github.com/ACL4SSR/ACL4SSR)：README 的版本对照、规则分类与使用入口组织参考。
- [Custom OpenClash Rules](https://github.com/Aethersailor/Custom_OpenClash_Rules)：自定义补充规则来源。
- [macOSicons](https://macosicons.com/)：Eb 版图标作品，逐项署名见图标来源表。
- [uhovohu/clash](https://github.com/uhovohu/clash)：日常模板历史图标地址的引用来源。
- [《诗体埃达·格里姆尼尔之歌》](https://en.wikisource.org/wiki/The_Poetic_Edda_%28tr._Bellows%29/Grimnismol)：世界树与 Ratatoskr 的命名意象参考。

---

<p align="center"><sub>Yggdrasil · 根系相连，枝叶常新。</sub></p>
