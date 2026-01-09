package main

import (
	"context"
	"fmt"
	"log"

	"notest/backend/config"
	"notest/backend/database"
	"notest/backend/router"

	"github.com/gin-gonic/gin"
)

// App struct
type App struct {
	ctx       context.Context
	apiServer *gin.Engine
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// データベース初期化
	if err := database.Initialize(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// 設定読み込み
	cfg := config.GetConfig()

	// APIサーバー起動
	a.apiServer = router.Setup(database.GetDB(), cfg)
	go func() {
		if err := a.apiServer.Run(":" + cfg.ServerPort); err != nil {
			log.Printf("API server error: %v", err)
		}
	}()

	log.Println("Application started successfully")
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
