# メモアプリ - Wails + React + Gin + SQLite

機能ごとにモジュール化されたメモアプリケーションです。

## 機能

### 実装済み機能
- ✅ メモのCRUD操作（作成、読み取り、更新、削除）
- ✅ メモの検索機能
- ✅ OCR機能（画像からテキスト抽出）
- ✅ SQLiteデータベースによる永続化
- ✅ React + TypeScript フロントエンド
- ✅ Gin フレームワークによるREST API
- ✅ 機能ごとのモジュール分離

## プロジェクト構造

```
notest/
├── backend/              # Goバックエンド
│   ├── config/          # アプリケーション設定
│   ├── database/        # データベース設定とマイグレーション
│   ├── models/          # データモデル
│   ├── features/        # 機能モジュール
│   │   ├── memo/       # メモ機能（Repository, Service, Handler）
│   │   └── ocr/        # OCR機能（Service, Handler）
│   └── router/          # APIルーター設定
├── frontend/            # Reactフロントエンド
│   └── src/
│       ├── api/        # API クライアント
│       ├── types/      # TypeScript型定義
│       └── features/   # 機能モジュール
│           ├── memo/   # メモコンポーネント
│           └── ocr/    # OCRコンポーネント
├── data/               # SQLiteデータベース（実行時に作成）
└── build/              # ビルド設定
```

## 前提条件

### 必須
- Go 1.23以上
- Node.js 18以上
- Wails CLI v2
- Tesseract OCR（OCR機能を使用する場合）

### Tesseract OCRのインストール

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y tesseract-ocr tesseract-ocr-jpn
```

#### Windows
1. [Tesseract GitHub](https://github.com/UB-Mannheim/tesseract/wiki) からインストーラーをダウンロード
2. インストール時に「Additional language data」で日本語を選択
3. 環境変数 `TESSDATA_PREFIX` に Tesseract のデータディレクトリを設定

## セットアップ

1. **依存パッケージのインストール**

```bash
# Goモジュールのダウンロード
go mod download

# Frontendパッケージのインストール
cd frontend
npm install
cd ..
```

2. **開発モードで実行**

```bash
wails dev
```

## ビルド

### Windows向けビルド

```bash
# Windows上で実行
wails build

# Linux上でクロスコンパイル（要Windows用ツール）
wails build -platform windows/amd64
```

### Ubuntu/Linux向けビルド

```bash
# Linux上で実行
wails build

# ビルド成果物は build/bin/ に生成されます
```

### すべてのプラットフォーム向けビルド

```bash
# Windows と Linux の両方をビルド
wails build -platform windows/amd64,linux/amd64
```

## 機能の有効化・無効化

`backend/config/config.go` で機能の有効/無効を切り替えられます：

```go
var Default = Config{
    ServerPort: "8080",
    EnableOCR:  true,  // OCR機能の有効化/無効化
    EnableMemo: true,  // メモ機能の有効化/無効化
}
```

## API エンドポイント

### メモ機能
- `GET /api/memos` - すべてのメモを取得
- `GET /api/memos/:id` - 特定のメモを取得
- `POST /api/memos` - 新しいメモを作成
- `PUT /api/memos/:id` - メモを更新
- `DELETE /api/memos/:id` - メモを削除
- `GET /api/memos/search?q=キーワード` - メモを検索

### OCR機能
- `POST /api/ocr/process` - 画像からテキストを抽出

## トラブルシューティング

### OCRエラー
- Tesseract OCRがインストールされているか確認
- 日本語データ（jpn.traineddata）がインストールされているか確認
- `TESSDATA_PREFIX` 環境変数が正しく設定されているか確認

### データベースエラー
- `data/` ディレクトリへの書き込み権限があるか確認
- SQLiteが正しくインストールされているか確認

### ビルドエラー
- Go 1.23以上がインストールされているか確認
- Wails CLI v2がインストールされているか確認
- CGOが有効になっているか確認（SQLite使用のため）

## ライセンス

MIT

## 開発者向け情報

### 新機能の追加方法

1. `backend/features/` に新しい機能ディレクトリを作成
2. Repository、Service、Handlerを実装
3. `backend/router/router.go` にルートを追加
4. `backend/config/config.go` に機能フラグを追加
5. Frontend側に対応するコンポーネントを作成

この構造により、機能の追加・削除が容易になります。
