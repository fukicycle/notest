# クイックスタートガイド

## 1. 開発モードで起動

```bash
# Wails開発サーバーを起動
wails dev
```

起動すると：
- フロントエンドが http://localhost:34115 で起動
- バックエンドAPIが http://localhost:8080 で起動
- デスクトップアプリが自動的に開きます

## 2. 基本的な使い方

### メモの作成
1. 画面右下の「+」ボタンをクリック
2. テキストエリアにメモを入力
3. **Enterキーで改行**（通常の改行動作）
4. **入力後2秒で自動保存**されます
5. 戻るボタン（←）で一覧に戻ります（未保存があれば自動保存）

### 画像からメモを作成（OCR）
1. 画面右下の「+」ボタンをクリック
2. テキストエリア上で画像を貼り付け（Ctrl+V / Cmd+V）
3. 自動的にOCR処理が開始されます
4. 抽出されたテキストがカーソル位置に挿入されます
5. 必要に応じて編集
6. **入力後2秒で自動保存**

### メモの検索
1. ヘッダーの検索アイコンにマウスを乗せる
2. 検索欄が展開されるのでキーワードを入力
3. Enterキーを押すと検索されます

### メモの編集・削除
1. メモカードをクリックして開く
2. 内容を編集（Enterで改行可能）
3. **入力後2秒で自動保存**
4. 削除する場合は、カード右下のゴミ箱アイコンをクリック

## 3. ビルド

### 簡単ビルド（対話式）

```bash
./build.sh
```

選択肢：
1. Windows (amd64)
2. Linux (amd64)  
3. 両方
4. 開発モードで実行

### 手動ビルド

```bash
# Linux向け
wails build

# Windows向け（Linux上でクロスコンパイル）
wails build -platform windows/amd64

# 両方
wails build -platform windows/amd64,linux/amd64
```

ビルド成果物は `build/bin/` に生成されます。

## 4. トラブルシューティング

### OCRが動かない

**症状**: 画像をアップロードしてもエラーが出る

**解決策**:
```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr tesseract-ocr-jpn tesseract-ocr-eng

# 確認
tesseract --version
```

### データベースエラー

**症状**: アプリ起動時にデータベースエラー

**解決策**:
1. `data/` ディレクトリを削除して再起動
2. 書き込み権限を確認：`chmod 755 data/`

### ポート8080が使用中

**症状**: "address already in use" エラー

**解決策**:
```bash
# 使用中のプロセスを確認
sudo lsof -i :8080

# または別のポートを使用（backend/config/config.go を編集）
ServerPort: "8081"
```

## 5. API直接アクセス（開発時）

開発モードでは、APIに直接アクセスできます：

```bash
# すべてのメモを取得
curl http://localhost:8080/api/memos

# メモを作成
curl -X POST http://localhost:8080/api/memos \
  -H "Content-Type: application/json" \
  -d '{"title":"テストメモ","content":"テスト内容"}'

# メモを検索
curl "http://localhost:8080/api/memos/search?q=テスト"
```

## 6. 機能の有効化・無効化

`backend/config/config.go` を編集：

```go
var Default = Config{
    ServerPort: "8080",
    EnableOCR:  false,  // OCR機能を無効化
    EnableMemo: true,
}
```

変更後、アプリを再起動してください。

## 7. データベースの場所

メモデータは以下に保存されます：
- 開発時: `./data/memos.db`
- 本番ビルド後: 実行ファイルと同じディレクトリの `data/memos.db`

## 8. よくある質問

**Q: データのバックアップ方法は？**
A: `data/memos.db` ファイルをコピーしてください。

**Q: Windows版でOCRを使うには？**
A: [Tesseract for Windows](https://github.com/UB-Mannheim/tesseract/wiki) をインストールし、環境変数 `TESSDATA_PREFIX` を設定してください。

**Q: メモの数に制限はある？**
A: SQLiteの制限内であれば無制限です（実用上は数万件まで問題なし）。

**Q: ダークモードはある？**
A: 現在未実装です。`frontend/src/App.css` を編集してカスタマイズできます。
