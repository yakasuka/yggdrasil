# コントリビューションガイド

<p align="center">
  <a href="README.ja-JP.md">はじめに</a> ·
  <a href="QUICKSTART.ja-JP.md">クイックスタート</a> ·
  <a href="CONTRIBUTING.ja-JP.md">コントリビューションガイド</a> ·
  <a href="CONTRIBUTORS.ja-JP.md">コントリビューター</a> ·
  <a href="FAQ.ja-JP.md">よくある質問</a>
</p>

---

## 参加方法

不具合報告、許可の申請、提案は Issues へお気軽にどうぞ。報告にはクライアントとコアのバージョン、使用中の設定、期待する分流結果を添え、サブスクリプショントークンとノード認証情報を削除してください。

## 開発コマンド

Config Builder のフロントエンドと共有テンプレートコンパイラは `config-builder/` にあります。

```sh
npm --prefix config-builder ci
npm --prefix config-builder run build
npm --prefix config-builder test
npm --prefix config-builder run service:dev
```

ローカルサービスのアドレスは `http://localhost:8788/config-builder/` です。

## リポジトリ構造

| パス | 役割 |
| :--- | :--- |
| `resources/template/` | コア設定テンプレート |
| `resources/rules/` | ソース別に分類されたルールデータ（adguard / aethersailor / download） |
| `config-builder/` | Config Builder のフロントエンド、共有コンパイラ、サブスクリプションサービス |
| `scripts/rules/` | ルール取得・同期スクリプト（遅延更新） |
| `scripts/endpoints/` | 旧版の `/merge`、`/sub` エンドポイント |
| `docs/i18n/` | 多言語 wiki ドキュメント |

## アプリケーションまたは地域の追加

静的カタログ [catalog.json](../../config-builder/shared/catalog.json) を編集します。再ビルドすると、ページのカタログとバックエンドのテンプレートが連動して更新されます。完全なデータフローは[実装の全体像](../../config-builder/docs/IMPLEMENTATION.md)を参照してください。

## ルールの更新

ルールスクリプトは遅延更新の原則で動作します。ETag / Last-Modified による条件付きプローブで、内容が変化したときだけ本文を取得します。2 つの GitHub Actions ワークフローが、AdGuard デスクトップルールと Aethersailor ルールの同期をそれぞれ処理します。デプロイ方法は[デプロイガイド](../../config-builder/docs/DEPLOYMENT.md)を参照してください。

## ドキュメント

多言語ドキュメントは `docs/i18n/` にあります。各言語には README、QUICKSTART、CONTRIBUTING、CONTRIBUTORS、FAQ の 5 章が含まれます。新しい言語を追加する場合は一式をコピーし、次のように命名してください。

```text
README.<language-code>.md
QUICKSTART.<language-code>.md
CONTRIBUTING.<language-code>.md
CONTRIBUTORS.<language-code>.md
FAQ.<language-code>.md
```

言語コードは BCP 47 に従います。例：`zh-CN`、`en`、`pt-BR`。
