<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Yggdrasil プロジェクトロゴ" />
</p>

<h1 align="center">Yggdrasil</h1>

<p align="center">
  Mihomo 設定・サブスクリプションツール · Ratatoskr テンプレートを中核に
</p>

<p align="center">
  <a href="https://wiki.metacubex.one/"><img src="https://img.shields.io/badge/Core-Mihomo-3282B8?style=flat-square" alt="コア: Mihomo" /></a>
  <a href="https://github.com/yakasuka/yggdrasil/releases/latest"><img src="https://img.shields.io/badge/Release-v1.0.0-537A5A?style=flat-square" alt="最新リリース" /></a>
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/License-Permission_Required-C4A25A?style=flat-square" alt="事前許可が必要" /></a>
</p>

<p align="center">
  <a href="README.ja-JP.md">はじめに</a> ·
  <a href="QUICKSTART.ja-JP.md">クイックスタート</a> ·
  <a href="CONTRIBUTING.ja-JP.md">コントリビューションガイド</a> ·
  <a href="CONTRIBUTORS.ja-JP.md">コントリビューター</a> ·
  <a href="FAQ.ja-JP.md">よくある質問</a>
</p>

---

## Language

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja-JP.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [हिन्दी](README.hi.md) · [Nederlands](README.nl.md) · [Italiano](README.it.md)

---

## プロジェクトとは

**Yggdrasil はアプリケーションとツール群であり、Ratatoskr はその中核となる設定です。** Yggdrasil は設定ビルダー、テンプレート解析、YAML 生成、サブスクリプション配信を提供します。Ratatoskr はルーティングルール、地域カタログ、ノードフィルター、プロキシグループを定義します。

設定ビルダーは Ratatoskr テンプレートからカタログとルールを読み取り、選択されたノードと出口戦略を組み合わせて個人用 YAML を生成します。これによりテンプレートは、すぐに使える設定のベースであると同時に、カタログとビルダーが共有するデータソースとなります。

```text
Subscription / node file → Config Builder → Ratatoskr template → Personal Mihomo YAML
```

**Yggdrasil は整理し、生成し、配信します。Ratatoskr はユーザーに届ける設定本体です。**

## 主な特徴

- **デスクトップ級の広告ブロッカー。** AdGuard Windows デスクトップルールのサブスクリプションを内蔵し、約 316,000 のブロック対象ドメインを収録。公式アップストリームに追随し、変更時に遅延取得します。
- **Geo による軽量ルーティング。** GeoSite / GeoIP が分類データを担当し、メイン設定は約 28 KB。ルーティングの意図が明確に読めます。
- **5 つの出口戦略。** 手動選択、URL-test、フェイルオーバー、一貫性ハッシュによる負荷分散、ラウンドロビンによるダウンロード分散。
- **アプリケーションと地域のカタログ。** ChatGPT、Claude、Telegram、Spotify、Steam などのアプリケーション用プロキシグループ、香港 / 台湾 / 日本 / 韓国 / シンガポール / 米国などの地域グループに専用アイコンを付与。
- **自動配信。** ルール本文は内容が変化したときだけ取得するため、リソース使用量が低く、出力が決定的です。Release では固定のダウンロードリンクと SHA-256 チェックサムを提供します。

## 設定の選択

メイン設定は [Release からダウンロード](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml)するか、リポジトリ内の [ratatoskr-template.yaml](../../resources/template/ratatoskr-template.yaml) を直接使用してください。

| 用途 | 入口 |
| :--- | :--- |
| 日常使いのメイン設定 | Release 固定リンク / リポジトリのテンプレート |
| ビジュアルに個人設定を生成 | [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) |
| 完全なドキュメント | [クイックスタート](QUICKSTART.ja-JP.md) |

## ライセンスとフィードバック

**All Rights Reserved · 事前の書面による許可が必要です。** オリジナル素材の使用、運用、改変、再配布、公開デプロイ、商用利用には、権利者の事前の書面による許可が必要です。個人利用および非商用利用も対象に含まれます。全文は [LICENSE](../../LICENSE) を参照してください。サードパーティ素材にはそれぞれのライセンスが適用されます。

問題の報告や許可の申請は [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues) から行ってください。報告にはサブスクリプショントークンやノード認証情報を記載しないでください。

---

<p align="center"><sub>Yggdrasil × Ratatoskr · 設定ツールとコアテンプレートが連携します。</sub></p>
