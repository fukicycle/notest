package config

// Config アプリケーション設定
type Config struct {
	ServerPort string
	EnableOCR  bool
	EnableMemo bool
}

// Default デフォルト設定
var Default = Config{
	ServerPort: "8080",
	EnableOCR:  true,
	EnableMemo: true,
}

// GetConfig 設定を取得
func GetConfig() Config {
	return Default
}
