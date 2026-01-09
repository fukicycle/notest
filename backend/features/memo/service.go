package memo

import (
	"notest/backend/models"
)

// Service メモサービス
type Service struct {
	repo *Repository
}

// NewService 新しいサービスを作成
func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// CreateMemo 新しいメモを作成
func (s *Service) CreateMemo(content, source string) (*models.Memo, error) {
	memo := &models.Memo{
		Content: content,
		Source:  source,
	}
	err := s.repo.Create(memo)
	if err != nil {
		return nil, err
	}
	return memo, nil
}

// GetAllMemos すべてのメモを取得
func (s *Service) GetAllMemos() ([]models.Memo, error) {
	return s.repo.GetAll()
}

// GetMemoByID IDでメモを取得
func (s *Service) GetMemoByID(id uint) (*models.Memo, error) {
	return s.repo.GetByID(id)
}

// UpdateMemo メモを更新
func (s *Service) UpdateMemo(id uint, content string) (*models.Memo, error) {
	memo, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	memo.Content = content

	err = s.repo.Update(memo)
	if err != nil {
		return nil, err
	}

	return memo, nil
}

// DeleteMemo メモを削除
func (s *Service) DeleteMemo(id uint) error {
	return s.repo.Delete(id)
}

// SearchMemos メモを検索
func (s *Service) SearchMemos(keyword string) ([]models.Memo, error) {
	return s.repo.Search(keyword)
}
