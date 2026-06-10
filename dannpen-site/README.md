# dannpen.com — official site

dannpen の公式サイト。Apple Developer Program 組織登録審査用に作成。

## デプロイ手順

このサイトは **echor LP とは別の Cloudflare Pages プロジェクト** として独立デプロイします。

### Cloudflare Pages 新規プロジェクト設定

| 項目 | 値 |
|------|-----|
| Repository | `mitopmflab/echor-lp` |
| Branch | `main`（本ブランチをマージ後） |
| Root directory | `project/dannpen-site` |
| Build command | *(なし)* |
| Output directory | *(なし、ルートをそのまま配信)* |

### カスタムドメイン

作成した Cloudflare Pages プロジェクトに `dannpen.com` を Custom Domain として追加する。

## 公開前チェックリスト

- [ ] `dannpen.com` が Cloudflare Pages プロジェクトのカスタムドメインとして設定済み
- [ ] HTTPS で `https://dannpen.com` にアクセスできる
- [ ] ナビゲーションリンク（#about / #projects / #contact）が正しくスクロールする
- [ ] `View echor →` リンクが `https://echor.dannpen.com/` に遷移する
- [ ] `mito.pmflab@gmail.com` の mailto リンクが動作する
      ※ `contact@dannpen.com` が用意できた時点でメールアドレスを差し替える
- [ ] スマートフォン実機でレイアウトが崩れていない
- [ ] OGP が SNS シェア時に正しく表示される（og:title / og:description）
- [ ] `echor.dannpen.com`（echor LP）が影響を受けていないことを確認

## ファイル構成

```
dannpen-site/
  index.html   — ページ本体
  styles.css   — スタイル（外部依存は Google Fonts のみ）
  README.md    — このファイル
```

## 連絡先の差し替え方

`index.html` の以下の箇所を更新する:

```html
<a href="mailto:mito.pmflab@gmail.com" class="contact-email">mito.pmflab@gmail.com</a>
```
