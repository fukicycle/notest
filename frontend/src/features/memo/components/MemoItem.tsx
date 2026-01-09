import React from 'react';
import { Memo } from '../../../types';
import './MemoItem.css';

interface MemoItemProps {
  memo: Memo;
  onClick: (memo: Memo) => void;
  onDelete: (id: number) => void;
}

const MemoItem: React.FC<MemoItemProps> = ({ memo, onClick, onDelete }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes}分前`;
      }
      return `${hours}時間前`;
    } else if (days === 1) {
      return '昨日';
    } else if (days < 7) {
      return `${days}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    }
  };

  const getPreviewText = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return '';
    
    // 最初の行を最大50文字まで表示
    const firstLine = lines[0];
    return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('このメモを削除しますか？')) {
      onDelete(memo.id);
    }
  };

  return (
    <div className="memo-item-card" onClick={() => onClick(memo)}>
      <div className="memo-preview">{getPreviewText(memo.content)}</div>
      <div className="memo-footer">
        <span className="memo-date">{formatDate(memo.updated_at)}</span>
        <button
          className="memo-delete"
          onClick={handleDeleteClick}
          title="削除"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MemoItem;
