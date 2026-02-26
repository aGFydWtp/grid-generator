# CSS Grid Generator

CSS Gridレイアウトを視覚的に作成し、CSSコードを生成するWebアプリケーション

## 概要

このツールは、CSS Gridの `grid-template-areas` を使用したレイアウトを、マウス操作で直感的に作成できます。作成したグリッドレイアウトは、リアルタイムでCSSコードに変換され、プレビューと共に表示されます。

## 機能

- 行と列の数を動的に調整（最大48×48）
- カスタムエリア名の定義と管理
- ドラッグ操作によるグリッドエリアの描画
- 行と列のサイズ指定（fr、px、%など）
- グリッド間隔（gap）の調整
- 生成されたCSSコードのコピー機能
- リアルタイムプレビュー表示
- 矩形チェック機能（エリアが正しい矩形形状か検証）

## 技術スタック

- [Hono](https://hono.dev/) - 軽量Webフレームワーク（SSR + クライアントサイドレンダリング）
- [Vite](https://vite.dev/) - ビルドツール・開発サーバー
- [@hono/vite-build](https://github.com/honojs/vite-plugins) - Cloudflare Workers向けViteビルドプラグイン
- [@hono/vite-dev-server](https://github.com/honojs/vite-plugins) - Hono用Vite開発サーバー
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) - エッジサーバーレス実行環境
- [Cloudflare Workers Assets](https://developers.cloudflare.com/workers/static-assets/) - 静的ファイル配信
- TypeScript / JSX - 型安全なUI開発

## プロジェクト構成

```
src/
  index.tsx       - Honoアプリケーションエントリポイント（SSR）
  renderer.tsx    - JSXレンダラー（HTMLシェル）
  client.tsx      - CSS Grid GeneratorのUIコンポーネント（クライアントサイド）
vite.config.ts    - Viteビルド設定（クライアント/SSRデュアルビルド）
wrangler.jsonc    - Cloudflare Workers設定
```

## ビルドの仕組み

Viteによるデュアルビルド構成：

1. **クライアントビルド** (`vite build --mode client`) - `src/client.tsx` を `dist/static/client.js` にバンドル
2. **SSRビルド** (`vite build`) - `src/index.tsx` を `dist/index.js` にバンドル（Cloudflare Workers向け）

開発時は `@hono/vite-dev-server` によりHMR対応の開発サーバーが起動します。

## 開発環境のセットアップ

```
pnpm install
```

## 開発サーバーの起動

```
pnpm dev
```

開発サーバーは http://localhost:5173 で起動します。

## ビルド

```
pnpm build
```

## デプロイ

Cloudflare Workersへのデプロイ：

```
pnpm deploy
```

## 使用方法

1. グリッドの行と列の数を設定
2. エリア名を追加（header、sidebar、main、footerなど）
3. エリアを選択してグリッド上にペイント
4. 必要に応じて行・列のサイズやgapを調整
5. 生成されたCSSコードをコピーして使用

## 制約事項

- グリッドエリアは連続した矩形である必要があります
- エリア名はCSSの識別子規則に従う必要があります（英数字、アンダースコア、ハイフンのみ）
- 最大エリア数はグリッドのセル数（行×列）と同じ
