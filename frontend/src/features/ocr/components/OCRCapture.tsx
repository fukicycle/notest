import React, { useState } from 'react';
import { ocrApi } from '../../../api/client';
import './OCRCapture.css';

interface OCRCaptureProps {
  onTextExtracted: (text: string) => void;
}

const OCRCapture: React.FC<OCRCaptureProps> = ({ onTextExtracted }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 画像ファイルのみ許可
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // ファイルをBase64に変換
      const base64 = await fileToBase64(file);
      const base64Data = base64.split(',')[1]; // "data:image/png;base64," の部分を除去

      // OCR処理
      const text = await ocrApi.processImage(base64Data);
      onTextExtracted(text);
    } catch (err) {
      console.error('OCR error:', err);
      setError('OCR処理に失敗しました。Tesseractがインストールされているか確認してください。');
    } finally {
      setIsProcessing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className="ocr-capture">
      <div className="ocr-upload">
        <label htmlFor="image-upload" className="upload-label">
          {isProcessing ? (
            <div className="loading">
              <div className="spinner"></div>
              <span>画像を処理中...</span>
            </div>
          ) : (
            <>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>画像をアップロードしてOCR</span>
              <small>PNG, JPG, GIF対応</small>
            </>
          )}
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isProcessing}
          style={{ display: 'none' }}
        />
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default OCRCapture;
