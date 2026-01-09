package memo

import (
	"notest/backend/models"

	"gorm.io/gorm"
)

// Repository メモリポジトリ
type Repository struct {
	db *gorm.DB
}

// NewRepository 新しいリポジトリを作成
func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// GetAll すべてのメモを取得
func (r *Repository) GetAll() ([]models.Memo, error) {
	var memos []models.Memo
	result := r.db.Order("updated_at desc").Find(&memos)
	return memos, result.Error
}

// GetByID IDでメモを取得
func (r *Repository) GetByID(id uint) (*models.Memo, error) {
	var memo models.Memo
	result := r.db.First(&memo, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &memo, nil
}

// Create 新しいメモを作成
func (r *Repository) Create(memo *models.Memo) error {
	return r.db.Create(memo).Error
}

// Update メモを更新
func (r *Repository) Update(memo *models.Memo) error {
	return r.db.Save(memo).Error
}

// Delete メモを削除
func (r *Repository) Delete(id uint) error {
	return r.db.Delete(&models.Memo{}, id).Error
}

// Search メモを検索
func (r *Repository) Search(keyword string) ([]models.Memo, error) {
	var memos []models.Memo
	result := r.db.Where("title LIKE ? OR content LIKE ?", "%"+keyword+"%", "%"+keyword+"%").
		Order("updated_at desc").
		Find(&memos)
	return memos, result.Error
}
