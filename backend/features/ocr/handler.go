package ocr

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Handler OCRハンドラー
type Handler struct {
	service *Service
}

// NewHandler 新しいハンドラーを作成
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// ProcessImage 画像からテキストを抽出するハンドラー
func (h *Handler) ProcessImage(c *gin.Context) {
	var req struct {
		ImageData string `json:"image_data" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	text, err := h.service.ProcessImage(req.ImageData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"text": text,
	})
}
