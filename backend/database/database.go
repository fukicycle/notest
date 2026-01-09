package database

import (
	"log"
	"os"
	"path/filepath"

	"notest/backend/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Initialize データベースの初期化
func Initialize() error {
	// データベースディレクトリを作成
	dbDir := filepath.Join(".", "data")
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		return err
	}

	// データベースファイルパス
	dbPath := filepath.Join(dbDir, "memos.db")

	// データベース接続
	var err error
	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return err
	}

	// マイグレーション実行
	if err := AutoMigrate(); err != nil {
		return err
	}

	log.Println("Database initialized successfully")
	return nil
}

// AutoMigrate 自動マイグレーション
func AutoMigrate() error {
	// 既存のテーブルにTitleカラムが存在する場合は削除
	if DB.Migrator().HasColumn(&models.Memo{}, "title") {
		if err := DB.Migrator().DropColumn(&models.Memo{}, "title"); err != nil {
			log.Printf("Warning: Failed to drop title column: %v", err)
		}
	}

	return DB.AutoMigrate(
		&models.Memo{},
	)
}

// GetDB データベースインスタンスを取得
func GetDB() *gorm.DB {
	return DB
}
