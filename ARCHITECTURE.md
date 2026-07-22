# アーキテクチャ

## 現在のディレクトリ構成（Phase 0）

```
src/
  app/              # アプリケーションエントリポイント
  components/       # UIコンポーネント
    layout/         # レイアウト（EditorLayout, MobileNav）
    canvas/         # Konva Canvas描画
    toolbar/        # 上部ツールバー
    sidebar/        # 左サイドバー（タブ付き）
    properties/     # 右プロパティパネル
    dialogs/        # エラーバウンダリ、ダイアログ
  store/            # Zustand 状態管理
  db/               # Dexie.js IndexedDB定義
  models/           # TypeScript ドメイン型定義
  constants/        # アプリ定数、キャンバスプリセット
  styles/           # グローバルCSS、CSS変数
  tests/            # テストセットアップ
e2e/                # Playwright E2Eテスト
public/
  fonts/            # Noto Sans JP（同梱フォント）
```

## 将来のディレクトリ構成（Phase 1〜6で段階追加）

以下のディレクトリは、該当フェーズで必要になった時点で作成する。
事前に空ディレクトリを作成しない。

```
src/
  features/           # 機能別モジュール（Phase 1以降）
    projects/         # プロジェクト管理（Phase 1）
    assets/           # 素材画像管理（Phase 1）
    editor/           # エディター状態管理（Phase 1）
    crop/             # 非破壊トリミング（Phase 2）
    text/             # テキスト要素（Phase 2）
    stamps/           # スタンプ要素（Phase 2）
    shapes/           # 図形・注釈（Phase 2）
    layers/           # レイヤー管理（Phase 3）
    groups/           # グループ操作（Phase 3）
    export/           # PNG/JPEG書き出し（Phase 1/4）
    import/           # プロジェクトファイル読み込み（Phase 4）
    history/          # Undo/Redo（Phase 2）
    persistence/      # IndexedDB永続化（Phase 4）
  services/           # ビジネスロジック（Phase 1以降）
  workers/            # Web Worker（Phase 6、性能最適化時）
  utils/              # ユーティリティ関数（Phase 1以降）
  hooks/              # カスタムフック（Phase 1以降）
```

## 設計原則

- Canvas描画とアプリケーション状態を分離する（§5.2）
- TypeScriptのデータモデルを正とする（§5.2）
- Konva内部状態だけを永続データにしない（§5.2）
- 画像BlobをZustandの通常状態へ直接大量保存しない（§5.2）
- UI、状態管理、永続化、画像処理を分離する（§5.2）
- ドメインモデル（src/models/）とDBレコード型（src/db/types.ts）を分離する
- elements配列の順序をレイヤー順とする。永続的なzIndexは持たない（§15.1）
