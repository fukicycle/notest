package ocr

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

// OCRResult PaddleOCR結果
type OCRResult struct {
	Text  string `json:"text"`
	Error string `json:"error"`
}

// Service OCRサービス
type Service struct {
	tempDir      string
	pythonScript string
}

// NewService 新しいOCRサービスを作成
func NewService() *Service {
	tempDir := filepath.Join(".", "temp")
	os.MkdirAll(tempDir, 0755)

	// PaddleOCRスクリプトのパスを取得
	scriptPath := filepath.Join("backend", "features", "ocr", "paddleocr_script.py")

	return &Service{
		tempDir:      tempDir,
		pythonScript: scriptPath,
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
	return s.runPaddleOCR(tempFile)
}

// ProcessImageFromPath ファイルパスから画像を処理
func (s *Service) ProcessImageFromPath(imagePath string) (string, error) {
	return s.runPaddleOCR(imagePath)
}

// runPaddleOCR PaddleOCRを実行
func (s *Service) runPaddleOCR(imagePath string) (string, error) {
	// Pythonスクリプトを実行
	cmd := exec.Command("python3", s.pythonScript, imagePath)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("failed to execute PaddleOCR: %w, output: %s", err, string(output))
	}

	// JSON結果をパース
	var result OCRResult
	if err := json.Unmarshal(output, &result); err != nil {
		return "", fmt.Errorf("failed to parse OCR result: %w, output: %s", err, string(output))
	}

	if result.Error != "" {
		return "", fmt.Errorf("OCR processing failed: %s", result.Error)
	}

	return result.Text, nil
}
