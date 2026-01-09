package models

import (
	"time"

	"gorm.io/gorm"
)

// Memo メモのデータモデル
type Memo struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	Content   string         `gorm:"type:text;not null" json:"content"`
	Source    string         `gorm:"size:50;default:'manual'" json:"source"` // manual, ocr
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
