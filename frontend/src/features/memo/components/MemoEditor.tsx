import React, { useState, useEffect, useRef } from 'react';
import { ocrApi } from '../../../api/client';
import './MemoEditor.css';

interface MemoEditorProps {
    initialContent?: string;
    onSave: (content: string, source?: 'manual' | 'ocr') => void;
    onBack: () => void;
    autoSave?: boolean;
}

interface ContextMenuPosition {
    x: number;
    y: number;
}

interface SubmenuState {
    visible: boolean;
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
    const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);
    const [submenuVisible, setSubmenuVisible] = useState(false);
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
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);

    useEffect(() => {
        // コンテキストメニューを閉じるためのグローバルクリックハンドラー
        const handleGlobalClick = () => {
            setContextMenu(null);
            setSubmenuVisible(false);
        };
        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
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

    const handleContextMenu = (e: React.MouseEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
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

    const handleOCRFromClipboard = async () => {
        setContextMenu(null);
        try {
            const clipboardItems = await navigator.clipboard.read();
            for (const item of clipboardItems) {
                for (const type of item.types) {
                    if (type.startsWith('image/')) {
                        const blob = await item.getType(type);
                        const file = new File([blob], 'clipboard.png', { type });
                        await processImageFile(file);
                        return;
                    }
                }
            }
            alert('クリップボードに画像がありません。\n画像をコピーしてから再度お試しください。');
        } catch (error) {
            console.error('Clipboard error:', error);
            if (error instanceof Error) {
                if (error.name === 'NotAllowedError') {
                    alert('クリップボードへのアクセスが拒否されました。\n\nブラウザの設定でクリップボードへのアクセスを許可してください。\n\n代わりに「ファイルを選択」から画像を読み込むこともできます。');
                } else {
                    alert('クリップボードへのアクセスに失敗しました。\n\nエラー: ' + error.message + '\n\n代わりに「ファイルを選択」から画像を読み込んでください。');
                }
            } else {
                alert('クリップボードへのアクセスに失敗しました。\n\n代わりに「ファイルを選択」から画像を読み込んでください。');
            }
        }
    };

    const handleOCRFromFile = () => {
        setContextMenu(null);
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
            </div>
            <textarea
                ref={textareaRef}
                className="memo-textarea"
                value={content}
                onChange={handleContentChange}
                onContextMenu={handleContextMenu}
                placeholder="メモを入力してください...&#10;&#10;右クリックでOCR機能を利用できます"
                disabled={isProcessing}
            />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
            />
            {contextMenu && (
                <div
                    className="context-menu"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="context-menu-parent">
                        <div 
                            className="context-menu-item"
                            onClick={(e) => {
                                e.stopPropagation();
                                console.log('Menu clicked, current state:', submenuVisible);
                                setSubmenuVisible(!submenuVisible);
                            }}
                        >
                            <span>画像から文字の読み取り</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </div>
                        <div className="context-menu-submenu" style={{ display: submenuVisible ? 'block' : 'none' }}>
                            <div className="context-menu-item" onClick={handleOCRFromClipboard}>
                                クリップボードから
                            </div>
                            <div className="context-menu-item" onClick={handleOCRFromFile}>
                                ファイルを選択
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className="editor-hint">
                <span>入力後2秒で自動保存</span>
                <span>•</span>
                <span>右クリックでOCR</span>
                <span>•</span>
                <span>Enterで改行</span>
            </div>
        </div>
    );
};

export default MemoEditor;
