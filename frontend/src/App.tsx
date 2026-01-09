import { useState, useEffect, useRef } from 'react';
import './App.css';
import { memoApi } from './api/client';
import { Memo, CreateMemoRequest } from './types';
import MemoItem from './features/memo/components/MemoItem';
import MemoEditor from './features/memo/components/MemoEditor';

type ViewMode = 'list' | 'editor';

function App() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // メモ一覧を読み込み
  useEffect(() => {
    loadMemos();
  }, []);

  // 検索展開時にフォーカス
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  const loadMemos = async () => {
    try {
      setLoading(true);
      const data = await memoApi.getAll();
      setMemos(data);
    } catch (error) {
      console.error('Failed to load memos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMemo = async (content: string, source: 'manual' | 'ocr' = 'manual') => {
    try {
      await memoApi.create({ content, source });
      await loadMemos();
      // エディタは閉じない（連続入力を許可）
    } catch (error) {
      console.error('Failed to create memo:', error);
      throw error; // エラーをエディタに返す
    }
  };

  const handleUpdateMemo = async (content: string) => {
    if (!editingMemo) return;
    try {
      await memoApi.update(editingMemo.id, { content });
      await loadMemos();
      // エディタは閉じない（連続編集を許可）
    } catch (error) {
      console.error('Failed to update memo:', error);
      throw error; // エラーをエディタに返す
    }
  };

  const handleDeleteMemo = async (id: number) => {
    try {
      await memoApi.delete(id);
      await loadMemos();
    } catch (error) {
      console.error('Failed to delete memo:', error);
    }
  };

  const handleMemoClick = (memo: Memo) => {
    setEditingMemo(memo);
    setViewMode('editor');
  };

  const handleNewMemo = () => {
    setEditingMemo(null);
    setViewMode('editor');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setEditingMemo(null);
  };

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      loadMemos();
      return;
    }
    try {
      const data = await memoApi.search(searchKeyword);
      setMemos(data);
    } catch (error) {
      console.error('Failed to search memos:', error);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const filteredMemos = memos;

  if (viewMode === 'editor') {
    return (
      <MemoEditor
        initialContent={editingMemo?.content || ''}
        onSave={editingMemo ? handleUpdateMemo : handleCreateMemo}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">メモ</h1>
        <div className="header-actions">
          <div className={`search-container ${isSearchExpanded ? 'expanded' : ''}`}>
            <button
              className="search-icon-btn"
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              title="検索"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
            {isSearchExpanded && (
              <input
                ref={searchInputRef}
                type="text"
                className="search-input"
                placeholder="検索..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                onBlur={() => {
                  if (!searchKeyword) {
                    setTimeout(() => setIsSearchExpanded(false), 200);
                  }
                }}
              />
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
          </div>
        ) : filteredMemos.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <p>メモがありません</p>
            <span className="empty-hint">下の + ボタンから最初のメモを作成しましょう</span>
          </div>
        ) : (
          <div className="memo-grid">
            {filteredMemos.map((memo) => (
              <MemoItem
                key={memo.id}
                memo={memo}
                onClick={handleMemoClick}
                onDelete={handleDeleteMemo}
              />
            ))}
          </div>
        )}
      </main>

      <button className="fab" onClick={handleNewMemo} title="新規メモ">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}

export default App;
