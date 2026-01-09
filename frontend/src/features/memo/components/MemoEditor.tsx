import React, { useState, useEffect, useRef } from 'react';
import { ocrApi } from '../../../api/client';
import './MemoEditor.css';

interface MemoEditorProps {
  initialContent?: string;
  onSave: (content: string, source?: 'manual' | 'ocr') => void;
  onBack: () => void;
  autoSave?: boolean;
}

const MemoEditor: React.FC<MemoEditorProps> = ({
  initialContent = '',
  onSave,
  onBack,
  autoSave = true,
}) => {
  const [content, setContent] = useState(initialContent);
  const [hasChanges, setHasChanges] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialContentRef = useRef(initialContent);
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setContent(initialContent);
    initialContentRef.current = initialContent;
    setHasChanges(false);
  }, [initialContent]);

  useEffect(() => {
    // フォーカスを当てる
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // 自動保存（debounce: 2秒後に保存）
  useEffect(() => {
    if (!autoSave || !hasChanges) return;

    // 既存のタイマーをクリア
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 2秒後に保存
    saveTimeoutRef.current = window.setTimeout(() => {
      handleSave();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, hasChanges, autoSave]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setHasChanges(newContent !== initialContentRef.current);
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) {
      console.log('❌ No clipboard data');
      return;
    }

    console.log('📋 Clipboard items count:', clipboardData.items.length);
    console.log('📋 Clipboard types:', clipboardData.types);
    
    // 方法1: clipboardData.items から画像を取得
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      console.log(`📌 Item ${i}: type="${item.type}", kind="${item.kind}"`);
      
      // 画像タイプかチェック（image/png, image/jpeg, image/gif, image/webp など）
      if (item.kind === 'file' && item.type.indexOf('image/') === 0) {
        console.log('✅ Image detected via clipboardData.items');
        e.preventDefault();
        
        const file = item.getAsFile();
        if (!file) {
          console.error('❌ getAsFile() returned null');
          continue;
        }

        console.log('📷 Image file:', { name: file.name, type: file.type, size: file.size });
        await processImageFile(file);
        return; // 最初の画像を処理したら終了
      }
    }

    // 方法2: clipboardData.files から画像を取得（バックアップ方法）
    if (clipboardData.files && clipboardData.files.length > 0) {
      console.log('📁 Checking clipboardData.files:', clipboardData.files.length);
      for (let i = 0; i < clipboardData.files.length; i++) {
        const file = clipboardData.files[i];
        console.log(`📌 File ${i}:`, { name: file.name, type: file.type, size: file.size });
        
        if (file.type.indexOf('image/') === 0) {
          console.log('✅ Image detected via clipboardData.files');
          e.preventDefault();
          await processImageFile(file);
          return;
        }
      }
    }

    console.log('ℹ️ No image found in clipboard, allowing default text paste');
  };

  const processImageFile = async (file: File) => {
    setIsProcessing(true);

    try {
      console.log('🔄 Converting image to base64...');
      const base64 = await fileToBase64(file);
      const base64Data = base64.split(',')[1];

      console.log('✅ Base64 conversion complete, length:', base64Data.length);
      console.log('🔄 Starting OCR processing...');

      // OCR処理
      const text = await ocrApi.processImage(base64Data);
      
      console.log('✅ OCR complete, result length:', text.length);
      console.log('📝 OCR result preview:', text.substring(0, 100));

      // テキストエリアのカーソル位置に挿入
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newText = content.substring(0, start) + text + content.substring(end);
        setContent(newText);
        setHasChanges(true);

        // カーソル位置を更新
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + text.length;
          textarea.focus();
        }, 0);
      }

      console.log('✅ Text inserted successfully');
    } catch (error) {
      console.error('❌ OCR error:', error);
      alert('OCR処理に失敗しました。\n' + (error instanceof Error ? error.message : String(error)));
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

  const handleSave = async () => {
    if (content.trim() && hasChanges) {
      setIsSaving(true);
      try {
        await onSave(content.trim());
        initialContentRef.current = content.trim();
        setHasChanges(false);
      } catch (error) {
        console.error('Save error:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleBackClick = async () => {
    // タイマーをクリア
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 未保存の変更があれば保存
    if (hasChanges && autoSave && content.trim()) {
      await handleSave();
    }
    onBack();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      return;
    }

    console.log('📤 File upload:', { name: file.name, type: file.type, size: file.size });
    await processImageFile(file);

    // 入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="memo-editor">
      <div className="editor-header">
        <button onClick={handleBackClick} className="back-button" title="戻る">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="editor-actions">
          <button onClick={handleImageButtonClick} className="image-button" title="画像からOCR" disabled={isProcessing}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </div>
        <div className="editor-status">
          {isProcessing && <span className="processing">OCR処理中...</span>}
          {isSaving && <span className="saving">保存中...</span>}
          {!isSaving && hasChanges && !isProcessing && <span className="unsaved">未保存</span>}
        </div>
      </div>
      <textarea
        ref={textareaRef}
        className="memo-textarea"
        value={content}
        onChange={handleContentChange}
        onPaste={handlePaste}
        placeholder="メモを入力してください...&#10;&#10;画像を貼り付けるとOCRが動作します&#10;または、上の画像ボタンから画像を選択できます"
      />
      <div className="editor-hint">
        <span>入力後2秒で自動保存</span>
        <span>•</span>
        <span>画像貼り付けまたは画像ボタンでOCR</span>
        <span>•</span>
        <span>Enterで改行</span>
      </div>
    </div>
  );
};

export default MemoEditor;
