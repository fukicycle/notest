package ocr

import (
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/otiai10/gosseract/v2"
)

// Service OCRサービス
type Service struct {
	tempDir string
}

// NewService 新しいOCRサービスを作成
func NewService() *Service {
	tempDir := filepath.Join(".", "temp")
	os.MkdirAll(tempDir, 0755)
	return &Service{
		tempDir: tempDir,
	}
}

// ProcessImage 画像からテキストを抽出
func (s *Service) ProcessImage(imageData string) (string, error) {
	// Base64デコード
	decoded, err := base64.StdEncoding.DecodeString(imageData)
	if err != nil {
		return "", fmt.Errorf("failed to decode image: %w", err)
	}

	// 一時ファイルに保存
	timestamp := time.Now().Unix()
	tempFile := filepath.Join(s.tempDir, fmt.Sprintf("ocr_%d.png", timestamp))
	if err := os.WriteFile(tempFile, decoded, 0644); err != nil {
		return "", fmt.Errorf("failed to write temp file: %w", err)
	}
	defer os.Remove(tempFile) // 処理後に削除

	// OCR処理
	client := gosseract.NewClient()
	defer client.Close()

	// 日本語と英語に対応
	client.SetLanguage("jpn", "eng")
	client.SetImage(tempFile)

	text, err := client.Text()
	if err != nil {
		return "", fmt.Errorf("OCR processing failed: %w", err)
	}

	return text, nil
}

// ProcessImageFromPath ファイルパスから画像を処理
func (s *Service) ProcessImageFromPath(imagePath string) (string, error) {
	client := gosseract.NewClient()
	defer client.Close()

	client.SetLanguage("jpn", "eng")
	client.SetImage(imagePath)

	text, err := client.Text()
	if err != nil {
		return "", fmt.Errorf("OCR processing failed: %w", err)
	}

	return text, nil
}
