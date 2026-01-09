import React, { useState } from 'react';
import { Memo } from '../../../types';
import './MemoItem.css';

interface MemoItemProps {
  memo: Memo;
  onEdit: (memo: Memo) => void;
  onDelete: (id: number) => void;
}

const MemoItem: React.FC<MemoItemProps> = ({ memo, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP');
  };

  return (
    <div className="memo-item">
      <div className="memo-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>{memo.title}</h3>
        <div className="memo-meta">
          <span className={`source-badge ${memo.source}`}>{memo.source}</span>
          <span className="date">{formatDate(memo.updated_at)}</span>
        </div>
      </div>
      {isExpanded && (
        <div className="memo-body">
          <p className="memo-content">{memo.content}</p>
          <div className="memo-actions">
            <button onClick={() => onEdit(memo)} className="btn-edit">
              編集
            </button>
            <button onClick={() => onDelete(memo.id)} className="btn-delete">
              削除
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoItem;
