#!/bin/bash

# メモアプリのビルドスクリプト

echo "==================================="
echo "メモアプリ - ビルドスクリプト"
echo "==================================="

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# エラーハンドリング
set -e

echo -e "${YELLOW}ビルド準備中...${NC}"

# Goモジュールのダウンロード
echo "Goモジュールをダウンロード中..."
go mod download

# Frontendの依存パッケージをインストール
echo "Frontend依存パッケージをインストール中..."
cd frontend
npm install
cd ..

echo -e "${GREEN}✓ 準備完了${NC}"

# ビルドターゲットの選択
echo ""
echo "ビルドターゲットを選択してください:"
echo "1) Windows (amd64)"
echo "2) Linux (amd64)"
echo "3) 両方"
echo "4) 開発モードで実行"
read -p "選択 (1-4): " choice

case $choice in
  1)
    echo -e "${YELLOW}Windows向けにビルド中...${NC}"
    wails build -platform windows/amd64
    echo -e "${GREEN}✓ Windowsビルド完了: build/bin/notest.exe${NC}"
    ;;
  2)
    echo -e "${YELLOW}Linux向けにビルド中...${NC}"
    wails build -platform linux/amd64
    echo -e "${GREEN}✓ Linuxビルド完了: build/bin/notest${NC}"
    ;;
  3)
    echo -e "${YELLOW}Windows & Linux向けにビルド中...${NC}"
    wails build -platform windows/amd64,linux/amd64
    echo -e "${GREEN}✓ ビルド完了:${NC}"
    echo "  - Windows: build/bin/notest.exe"
    echo "  - Linux: build/bin/notest"
    ;;
  4)
    echo -e "${YELLOW}開発モードで起動中...${NC}"
    wails dev
    ;;
  *)
    echo -e "${RED}無効な選択です${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}==================================="
echo "完了！"
echo "===================================${NC}"
