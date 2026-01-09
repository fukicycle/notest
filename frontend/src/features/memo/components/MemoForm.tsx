import React, { useState, useEffect } from 'react';
import { CreateMemoRequest, UpdateMemoRequest } from '../../../types';
import './MemoForm.css';

interface MemoFormProps {
  initialTitle?: string;
  initialContent?: string;
  initialSource?: 'manual' | 'ocr';
  onSubmit: (data: CreateMemoRequest | UpdateMemoRequest) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

const MemoForm: React.FC<MemoFormProps> = ({
  initialTitle = '',
  initialContent = '',
  initialSource = 'manual',
  onSubmit,
  onCancel,
  submitLabel = '保存',
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
  }, [initialTitle, initialContent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      onSubmit({
        title: title.trim(),
        content: content.trim(),
        source: initialSource,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="memo-form">
      <div className="form-group">
        <label htmlFor="title">タイトル</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="メモのタイトルを入力"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="content">内容</label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="メモの内容を入力"
          rows={10}
          required
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-submit">
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-cancel">
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
};

export default MemoForm;
