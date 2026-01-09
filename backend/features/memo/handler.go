package memo

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// Handler メモハンドラー
type Handler struct {
	service *Service
}

// NewHandler 新しいハンドラーを作成
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// CreateMemo メモ作成ハンドラー
func (h *Handler) CreateMemo(c *gin.Context) {
	var req struct {
		Content string `json:"content" binding:"required"`
		Source  string `json:"source"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Source == "" {
		req.Source = "manual"
	}

	memo, err := h.service.CreateMemo(req.Content, req.Source)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, memo)
}

// GetAllMemos すべてのメモ取得ハンドラー
func (h *Handler) GetAllMemos(c *gin.Context) {
	memos, err := h.service.GetAllMemos()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, memos)
}

// GetMemo メモ取得ハンドラー
func (h *Handler) GetMemo(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	memo, err := h.service.GetMemoByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Memo not found"})
		return
	}

	c.JSON(http.StatusOK, memo)
}

// UpdateMemo メモ更新ハンドラー
func (h *Handler) UpdateMemo(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req struct {
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	memo, err := h.service.UpdateMemo(uint(id), req.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, memo)
}

// DeleteMemo メモ削除ハンドラー
func (h *Handler) DeleteMemo(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	err = h.service.DeleteMemo(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Memo deleted successfully"})
}

// SearchMemos メモ検索ハンドラー
func (h *Handler) SearchMemos(c *gin.Context) {
	keyword := c.Query("q")
	if keyword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search keyword is required"})
		return
	}

	memos, err := h.service.SearchMemos(keyword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, memos)
}
