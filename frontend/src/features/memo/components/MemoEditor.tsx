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
    const [isDragging, setIsDragging] = useState(false);
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
        console.log('🎯 PASTE EVENT TRIGGERED!');

        const clipboardData = e.clipboardData;
        if (!clipboardData) {
            console.log('❌ No clipboard data available');
            return;
        }

        console.log('📋 Clipboard data:', {
            items: clipboardData.items.length,
            files: clipboardData.files.length,
            types: Array.from(clipboardData.types)
        });

        // 全ての型のデータを取得して確認
        for (const type of clipboardData.types) {
            try {
                const data = clipboardData.getData(type);
                console.log(`📄 Data for "${type}":`, JSON.stringify(data));
            } catch (error) {
                console.log(`❌ Failed to get data for "${type}":`, error);
            }
        }

        // 全てのアイテムを詳細にログ
        console.log('--- Clipboard Items ---');
        for (let i = 0; i < clipboardData.items.length; i++) {
            const item = clipboardData.items[i];
            console.log(`  [${i}] kind: ${item.kind}, type: ${item.type}`);
        }

        console.log('--- Clipboard Files ---');
        for (let i = 0; i < clipboardData.files.length; i++) {
            const file = clipboardData.files[i];
            console.log(`  [${i}] name: ${file.name}, type: ${file.type}, size: ${file.size}`);
        }

        // 画像があるかを確認（スクリーンショットの直接貼り付けなど）
        let hasImage = false;
        let imageIndex = -1;

        // まずitems配列をチェック
        for (let i = 0; i < clipboardData.items.length; i++) {
            const item = clipboardData.items[i];
            if (item.type.indexOf('image/') === 0 || item.type.includes('image')) {
                hasImage = true;
                imageIndex = i;
                console.log(`✅ Image detected in items[${i}]: ${item.type}`);
                break;
            }
        }

        // files配列もチェック
        if (!hasImage && clipboardData.files.length > 0) {
            for (let i = 0; i < clipboardData.files.length; i++) {
                const file = clipboardData.files[i];
                if (file.type.indexOf('image/') === 0 || file.type.includes('image') || file.name.match(/\.(png|jpg|jpeg|gif|webp|bmp)$/i)) {
                    hasImage = true;
                    console.log(`✅ Image detected in files[${i}]: ${file.type} (${file.name})`);
                    break;
                }
            }
        }

        // 画像が見つかったらデフォルトの貼り付けを防止
        if (hasImage) {
            console.log('🚫 Preventing default paste behavior');
            e.preventDefault();
            e.stopPropagation();
        } else {
            console.log('ℹ️ No image detected - allowing default text paste');
            return;
        }

        // items配列から取得
        for (let i = 0; i < clipboardData.items.length; i++) {
            const item = clipboardData.items[i];

            if (item.type.indexOf('image/') === 0) {
                console.log(`🔄 Attempting to get file from items[${i}]`);
                const file = item.getAsFile();
                if (file) {
                    console.log('✅ File obtained from items:', { name: file.name, type: file.type, size: file.size });
                    await processImageFile(file);
                    return;
                } else {
                    console.error('❌ getAsFile() returned null');
                }
            }
        }

        // files配列から取得
        for (let i = 0; i < clipboardData.files.length; i++) {
            const file = clipboardData.files[i];

            if (file.type.indexOf('image/') === 0 || file.name.match(/\.(png|jpg|jpeg|gif|webp|bmp)$/i)) {
                console.log('✅ Using file from files array:', { name: file.name, type: file.type, size: file.size });
                await processImageFile(file);
                return;
            }
        }

        console.error('❌ Image was detected but could not be extracted');
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

    const handleImageButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        console.log('📤 File upload:', { name: file.name, type: file.type, size: file.size });
        await processImageFile(file);

        // 入力をリセット
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        console.log('🎯 DROP EVENT TRIGGERED!');

        const files = Array.from(e.dataTransfer.files);
        console.log(`📁 Dropped ${files.length} file(s)`);

        if (files.length === 0) {
            console.log('❌ No files in drop event');
            return;
        }

        for (const file of files) {
            console.log('📄 File:', { name: file.name, type: file.type, size: file.size });

            // 画像ファイルかチェック
            if (file.type.startsWith('image/') || file.name.match(/\.(png|jpg|jpeg|gif|webp|bmp)$/i)) {
                console.log('✅ Processing image file');
                await processImageFile(file);
                return; // 最初の画像のみ処理
            }
        }

        console.log('ℹ️ No image files found in dropped files');
    };

    return (
        <div className="memo-editor">
            {isProcessing && (
                <div className="loading-overlay">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>OCR処理中...</p>
                    </div>
                </div>
            )}
            <div className="editor-header">
                <button onClick={handleBackClick} className="back-button" title="戻る">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="editor-status">
                    {isProcessing && <span className="processing">OCR処理中...</span>}
                    {isSaving && <span className="saving">保存中...</span>}
                    {!isSaving && hasChanges && !isProcessing && <span className="unsaved">未保存</span>}
                </div>
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

            </div>
            <textarea
                ref={textareaRef}
                className={`memo-textarea ${isDragging ? 'dragging' : ''}`}
                value={content}
                onChange={handleContentChange}
                onPaste={handlePaste}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                placeholder="メモを入力してください...&#10;&#10;OCR機能の使い方：&#10;・ 上のボタンから画像を選択&#10;・ 画像ファイルをドラッグ&ドロップ&#10;・ Ctrl+V で画像を貼り付け"
                disabled={isProcessing}
            />
            <div className="editor-hint">
                <span>入力後2秒で自動保存</span>
                <span>•</span>
                <span>ボタン・ドラッグ・貼り付けでOCR</span>
                <span>•</span>
                <span>Enterで改行</span>
            </div>
        </div>
    );
};

export default MemoEditor;
