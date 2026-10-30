# Ratatosk · Eb / macOSicons

已集成 64 个启用的策略组及 1 个保持注释的可选策略组，共使用 42 张 macOSicons PNG；其中 24 个国家 / 地区策略组统一使用 Maps 图标。

- `Ratatosk-Eb.yaml` 使用本仓库托管的 macOSicons 静态 PNG 地址，客户端可直接加载，无需 API Key。
- 日常模板 `Ratatoskr.yaml` 使用 `icons/` 中的另一套图标，不属于本清单的策略组映射范围。
- 此目录的 PNG 是本地备份，均已下载并验证为 256×256。
- `manifest.json` 保存策略组映射、地区与正则锚点对应关系、原始图片地址、来源页面、作者、尺寸和 SHA-256。
- `preview.png` 提供整套图标预览。

## 匹配说明

- Bybit：公开目录未找到精确品牌图标，暂用 Apple Wallet。
- TapTap：公开目录未找到精确品牌图标，暂用 Game Center。
- 地区策略组统一采用 Maps，策略组继续使用各地区的代表 Emoji 命名。
- 地区由节点名称中的国旗 / 中英文名称 / 地区代码匹配，新增地区补充了常见城市别名；实际落地以机场标注为准。
- “其他地区”应用节点净化，并排除已单列的 24 个国家 / 地区。
- Meta 组使用 Instagram，延续原来的品牌标识。macOSicons 中名为 Meta 的目录对应另一个音乐应用，未用于此组。
- R18 图标已替换，其策略组继续保持注释状态。

## 地区映射

| 国家 / 地区 | 策略组 | 正则锚点 | 图标 |
|---|---|---|---|
| 香港 | 🌆 | FilterHK | Maps |
| 台湾 | 🧋 | FilterTW | Maps |
| 澳门 | 🎰 | FilterMO | Maps |
| 日本 | ⛩️ | FilterJP | Maps |
| 韩国 | 🎤 | FilterKR | Maps |
| 新加坡 | 🏙️ | FilterSG | Maps |
| 泰国 | 🐘 | FilterTH | Maps |
| 马来西亚 | 🌺 | FilterMY | Maps |
| 越南 | 🍜 | FilterVN | Maps |
| 菲律宾 | 🏝️ | FilterPH | Maps |
| 印度尼西亚 | 🌋 | FilterID | Maps |
| 印度 | 🪷 | FilterIN | Maps |
| 澳大利亚 | 🦘 | FilterAU | Maps |
| 美国 | 🗽 | FilterUS | Maps |
| 加拿大 | 🍁 | FilterCA | Maps |
| 英国 | 💂 | FilterUK | Maps |
| 德国 | 🍺 | FilterDE | Maps |
| 法国 | 🗼 | FilterFR | Maps |
| 荷兰 | 🌷 | FilterNL | Maps |
| 瑞士 | 🏔️ | FilterCH | Maps |
| 俄罗斯 | 🪆 | FilterRU | Maps |
| 土耳其 | 🧿 | FilterTR | Maps |
| 巴西 | ⚽ | FilterBR | Maps |
| 阿根廷 | 🧉 | FilterAR | Maps |

## 后续更换

在下表来源页面挑选新的 PNG，将图片保存到本目录，并同步更新策略组的仓库图片地址及 `manifest.json` 中的来源、作者和 SHA-256。

图标来源为 [macOSicons](https://macosicons.com/)，作者和原始作品页面记录如下；作品权利归各自作者或品牌方所有。图标验证日期：2026-10-29。

| 策略组 | 作品 | 作者 | 来源 |
|---|---|---|---|
| 🎚️ 节点选择 | Control Centre | Random Ics | [作品页面](https://macosicons.com/icon/control-centre-wEgTx0LD5q) |
| 🚀 手动切换 | Network Utility | Fausto Ristagno | [作品页面](https://macosicons.com/icon/network-utility-JFnWk2pMWE) |
| ♻️ 自动选择 | Automator | Agent David | [作品页面](https://macosicons.com/icon/automator-OOcKY57Kvt) |
| 🔯 故障转移 | Time Machine | schneidericons | [作品页面](https://macosicons.com/icon/time-machine-JDDDaRfWvM) |
| 🔮 负载均衡 | Activity Monitor | https://twitter.com/JoeMelanie1 | [作品页面](https://macosicons.com/icon/activity-monitor-6VQhaKTBEV) |
| ⚖️ 下载均衡 | Downloads | Hubapps.com LLC | [作品页面](https://macosicons.com/icon/downloads-uRANJwAgCl) |
| ⚡ OpenAI | ChatGPT (Default) (macOS 26.2+) | designer_26.2 | [作品页面](https://macosicons.com/icon/chatgpt-default-macos-26-2-KQd6S28qRb) |
| 🪐 Anthropic | Claude (Default) | kwahli | [作品页面](https://macosicons.com/icon/claude-default-bQPQfXDUHF) |
| ✨ AI 服务 | Apple Intelligence | 🅺 | [作品页面](https://macosicons.com/icon/apple-intelligence-1IZryj0xQg) |
| 🟦 OKX | OKX | OKX Inc. | [作品页面](https://macosicons.com/icon/okx-giKJ6pF921) |
| 🟨 Binance | Binance | pein1911 | [作品页面](https://macosicons.com/icon/binance-c1DpPKijNU) |
| 🟪 Bybit | Apple Wallet | Random Ics | [作品页面](https://macosicons.com/icon/apple-wallet-d5QDUaC49g) |
| 🪙 Crypto | Bitcoin Core | Frank Septillion | [作品页面](https://macosicons.com/icon/bitcoin-core-zeaBPZEJo9) |
| 📺 YouTube | YouTube | Google | [作品页面](https://macosicons.com/icon/youtube-VnDNflASuV) |
| 🧭 Google | Google | Google | [作品页面](https://macosicons.com/icon/google-5ShHbQvlee) |
| ☁️ Cloudflare | Cloudflare | https://twitter.com/ii_giovanni | [作品页面](https://macosicons.com/icon/cloudflare-7VYUVFL1FK) |
| 📦 Amazon | Amazon | https://www.behance.net/edermartinez | [作品页面](https://macosicons.com/icon/amazon-G7nKNzFQQO) |
| 🐙 GitHub | GitHub | xdan | [作品页面](https://macosicons.com/icon/github-yUUfPCJA0m) |
| 🪟 Microsoft | Microsoft | allenx | [作品页面](https://macosicons.com/icon/microsoft-NeqoAz6U4c) |
| 🎨 Adobe | Adobe | https://macosicons.com/u/IceGod%20-%20Folders | [作品页面](https://macosicons.com/icon/adobe-ssXVfVqoWB) |
| ⚪ Apple | Apple | lck | [作品页面](https://macosicons.com/icon/apple-DiPPbQPhrD) |
| 🤖 Android | Android | next | [作品页面](https://macosicons.com/icon/android-Xgx04UeAwU) |
| 𝕏 X | X | X Corp. | [作品页面](https://macosicons.com/icon/x-P2QIHEpuxi) |
| ♾️ Meta | Instagram | Instagram, Inc. | [作品页面](https://macosicons.com/icon/instagram-TODQDHD9cx) |
| 🪽 Telegram | Telegram | Telegram Messenger LLP | [作品页面](https://macosicons.com/icon/telegram-dQqA49CHzl) |
| 🎮 Discord | Discord | iuriveiga | [作品页面](https://macosicons.com/icon/discord-mOqJF5y5me) |
| 🫂 Social | Messages | https://www.deviantart.com/octaviotti | [作品页面](https://macosicons.com/icon/messages-JQL8D8bMM2) |
| 🎶 TikTok | TikTok | blackjaeger7423 | [作品页面](https://macosicons.com/icon/tiktok-PH3ECRHDAv) |
| 🍿 Netflix | Netflix | maxkoscisz | [作品页面](https://macosicons.com/icon/netflix-tvuzyrdmPE) |
| 💚 Spotify | Spotify | Spotify | [作品页面](https://macosicons.com/icon/spotify-KqWJyVq6fL) |
| 🎥 Media | Apple TV | Agent David | [作品页面](https://macosicons.com/icon/apple-tv-Ack0y3WKkY) |
| 📺 Bilibili | bilibili | BILIBILI SINGAPORE PTE. LTD. | [作品页面](https://macosicons.com/icon/bilibili-rB47NAOsts) |
| 👾 Steam | Steam | https://twitter.com/crakitus | [作品页面](https://macosicons.com/icon/steam-6zz45quoGz) |
| 🎁 Epic | Epic Games Launcher | Epic Games Inc. | [作品页面](https://macosicons.com/icon/epic-games-launcher-hgNgLkETAe) |
| 🕹️ TapTap | Game Center | Agent David | [作品页面](https://macosicons.com/icon/game-center-GeFwLxoeJR) |
| ⚡ Speedtest | Speedtest | From iOS | [作品页面](https://macosicons.com/icon/speedtest-OPHfzYY16a) |
| 🔌 特殊端口 | Airport Utility | Apple | [作品页面](https://macosicons.com/icon/airport-utility-j6YuYShBli) |
| 😈 R18 | Safari (Pure Dark) | Justanotherguy | [作品页面](https://macosicons.com/icon/safari-pure-dark-io6FLKAntf) |
| 🏮 | Home | Apple | [作品页面](https://macosicons.com/icon/home-MqhrKGr6yk) |
| 🏁 Final | safari | Discord: TheHollenVAI#4556 | [作品页面](https://macosicons.com/icon/safari-XVYkORoX9d) |
| 🌆 | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| 🧋 | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| 🎰 | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| ⛩️ | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| 🎤 | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| 🏙️ | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| 🐘 | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| 🌺 | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| 🍜 | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| 🏝️ | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| 🌋 | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| 🪷 | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| 🦘 | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| 🗽 | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| 🍁 | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| 💂 | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| 🍺 | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| 🗼 | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| 🌷 | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| 🏔️ | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| 🪆 | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| 🧿 | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| ⚽ | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| 🧉 | Maps | Apple | [作品页面](https://macosicons.com/icon/maps-oSRZz1fudH) |
| 🌌 | Network | penntheone | [作品页面](https://macosicons.com/icon/network-Lq2622Pb8Q) |
