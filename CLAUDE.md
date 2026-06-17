## Production readiness check

このLP/静的サイトでは、本番公開前・デプロイ前・パフォーマンス改善時に、必ず以下を確認すること。

- 本番不要な開発用スクリプトが残っていないか
- デバッグUIや調整用パネルが残っていないか
- 未使用JSや不要な外部CDN読み込みがないか
- console.log / debug / test / localhost 参照が残っていないか
- react.development.js / react-dom.development.js が本番HTMLに残っていないか
- @babel/standalone が本番HTMLに残っていないか
- tweaks / debug / dev / test 系ファイルやscriptタグが本番HTMLから参照されていないか
- unpkg などの開発用途CDNを本番で不要に読み込んでいないか
- 画像に適切な loading / decoding が設定されているか
- GA4タグやクリックイベントを壊していないか

特に `react.development.js`、`react-dom.development.js`、`@babel/standalone`、`tweaks-panel.jsx`、`tweaks-app.jsx` のような開発・調整用スクリプトは、本番LPに残さないこと。
