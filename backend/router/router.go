package router

import (
	"notest/backend/config"
	"notest/backend/features/memo"
	"notest/backend/features/ocr"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Setup ルーターをセットアップ
func Setup(db *gorm.DB, cfg config.Config) *gin.Engine {
	r := gin.Default()

	// CORS設定
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// APIグループ
	api := r.Group("/api")

	// メモ機能が有効な場合
	if cfg.EnableMemo {
		memoRepo := memo.NewRepository(db)
		memoService := memo.NewService(memoRepo)
		memoHandler := memo.NewHandler(memoService)

		memoGroup := api.Group("/memos")
		{
			memoGroup.POST("", memoHandler.CreateMemo)
			memoGroup.GET("", memoHandler.GetAllMemos)
			memoGroup.GET("/:id", memoHandler.GetMemo)
			memoGroup.PUT("/:id", memoHandler.UpdateMemo)
			memoGroup.DELETE("/:id", memoHandler.DeleteMemo)
			memoGroup.GET("/search", memoHandler.SearchMemos)
		}
	}

	// OCR機能が有効な場合
	if cfg.EnableOCR {
		ocrService := ocr.NewService()
		ocrHandler := ocr.NewHandler(ocrService)

		ocrGroup := api.Group("/ocr")
		{
			ocrGroup.POST("/process", ocrHandler.ProcessImage)
		}
	}

	return r
}
