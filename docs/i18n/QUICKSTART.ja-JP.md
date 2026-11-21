<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Yggdrasil プロジェクトロゴ" />
</p>

<h1 align="center">クイックスタート</h1>

<p align="center">
  <a href="README.ja-JP.md">はじめに</a> ·
  <a href="QUICKSTART.ja-JP.md">クイックスタート</a> ·
  <a href="CONTRIBUTING.ja-JP.md">コントリビューションガイド</a> ·
  <a href="CONTRIBUTORS.ja-JP.md">コントリビューター</a> ·
  <a href="FAQ.ja-JP.md">よくある質問</a>
</p>

---

## 開始する前に

本プロジェクトは **All Rights Reserved** ライセンスを採用しています。オリジナル素材の使用、運用、改変、再配布、公開デプロイ、商用利用の前に、該当する権利者の事前の書面による許可を取得してください。詳しくは [LICENSE](../../LICENSE) を参照してください。

## 推奨方式：Config Builder

[Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) を開き、次の 5 ステップに従います。

1. **サブスクリプション元。** 机场（プロバイダー）名と、YAML、Base64、または一般的なノードリンクのサブスクリプションを入力します。ノードとプロバイダーが報告するトラフィック情報が解析されます。
2. **地域ノード。** サブスクリプションに実際に存在する地域のみが表示されます。保持するノードの範囲を選択します。
3. **ノード戦略。** 必要な自動戦略だけを保持します。デフォルトの出口は手動選択です。
4. **APP 分流。** すべてのアプリケーションが既定で有効になり、プロキシを通過します。必要に応じてアプリごとに保持した地域、Direct、Reject を指定します。
5. **最終確認。** 設定をプレビューし、`name-ratatoskr.yaml` をダウンロードするか、永続的なサブスクリプションリンクを生成します。

サブスクリプションは YAML、Base64、一般的なノードリンクに対応します。トラフィック情報はプロバイダーの `Subscription-Userinfo` から取得されます。省略可能な遅延チェックは測定サーバーからノードへの TCP 接続確立時間を計測するもので、ICMP ping や完全なプロキシ遅延ではありません。

## 手動方式：テンプレートを直接使用する

1. [ratatoskr-template.yaml](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml) をダウンロードします。
2. サブスクリプションのノードを使って、自分の `proxy-providers` / `proxies` をローカルで管理します。
3. クライアントが参照先の GeoSite / GeoIP データを備えていることを確認します。
4. Mihomo 対応クライアントにインポートし、アプリケーションまたは地域ごとに出口を選択して、遅延テストを再実行します。

## ポート

| 設定 | HTTP | SOCKS5 |
| :--- | :--- | :--- |
| 手動テンプレート | `7890` | `7891` |
| Config Builder の生成ファイル | `7890` | `7890` |

Config Builder は混合ポートを使用し、カスタマイズにも対応しています。個人のサブスクリプション URL、ノード認証情報、アクセストークンはローカルまたは非公開のフローで管理してください。

## デプロイ

Config Builder とサブスクリプションサービスは Cloudflare Pages に同居デプロイされます。詳しくは[デプロイガイド](../../config-builder/docs/DEPLOYMENT.md)と[実装の全体像](../../config-builder/docs/IMPLEMENTATION.md)を参照してください。

---

<p align="center"><sub>Yggdrasil × Ratatoskr · 設定ツールとコアテンプレートが連携します。</sub></p>
