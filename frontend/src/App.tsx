import { useState, useEffect } from 'react';
import './App.css';
import { memoApi } from './api/client';
import { Memo, CreateMemoRequest, UpdateMemoRequest } from './types';
import MemoItem from './features/memo/components/MemoItem';
import MemoForm from './features/memo/components/MemoForm';
import OCRCapture from './features/ocr/components/OCRCapture';

function App() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [activeTab, setActiveTab] = useState<'manual' | 'ocr'>('manual');

  // メモ一覧を読み込み
  useEffect(() => {
    loadMemos();
  }, []);

  const loadMemos = async () => {
    try {
      const data = await memoApi.getAll();
      setMemos(data);
    } catch (error) {
      console.error('Failed to load memos:', error);
    }
  };

  const handleCreateMemo = async (data: CreateMemoRequest) => {
    try {
      await memoApi.create(data);
      await loadMemos();
      setShowForm(false);
      setOcrText('');
      setActiveTab('manual');
    } catch (error) {
      console.error('Failed to create memo:', error);
    }
  };

  const handleUpdateMemo = async (data: UpdateMemoRequest) => {
    if (!editingMemo) return;
    try {
      await memoApi.update(editingMemo.id, data);
      await loadMemos();
      setEditingMemo(null);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to update memo:', error);
    }
  };

  const handleDeleteMemo = async (id: number) => {
    if (!window.confirm('このメモを削除しますか？')) return;
    try {
      await memoApi.delete(id);
      await loadMemos();
    } catch (error) {
      console.error('Failed to delete memo:', error);
    }
  };

  const handleEditMemo = (memo: Memo) => {
    setEditingMemo(memo);
    setShowForm(true);
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

  const handleOCRTextExtracted = (text: string) => {
    setOcrText(text);
    setActiveTab('manual');
  };

  const handleNewMemo = () => {
    setEditingMemo(null);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingMemo(null);
    setOcrText('');
  };

  return (
    <div id="App">
      <header className="app-header">
        <h1>📝 メモアプリ</h1>
        <div className="header-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="検索..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>検索</button>
          </div>
          <button onClick={handleNewMemo} className="btn-new">
            新規メモ
          </button>
        </div>
      </header>

      <main className="app-main">
        {showForm ? (
          <div className="form-container">
            <h2>{editingMemo ? 'メモを編集' : '新規メモ'}</h2>
            
            {!editingMemo && (
              <div className="tabs">
                <button
                  className={activeTab === 'manual' ? 'active' : ''}
                  onClick={() => setActiveTab('manual')}
                >
                  手動入力
                </button>
                <button
                  className={activeTab === 'ocr' ? 'active' : ''}
                  onClick={() => setActiveTab('ocr')}
                >
                  OCRで入力
                </button>
              </div>
            )}

            {activeTab === 'ocr' && !editingMemo && (
              <OCRCapture onTextExtracted={handleOCRTextExtracted} />
            )}

            <MemoForm
              initialTitle={editingMemo?.title || ''}
              initialContent={editingMemo?.content || ocrText}
              initialSource={ocrText ? 'ocr' : 'manual'}
              onSubmit={editingMemo ? handleUpdateMemo : handleCreateMemo}
              onCancel={handleCancelForm}
              submitLabel={editingMemo ? '更新' : '作成'}
            />
          </div>
        ) : (
          <div className="memo-list">
            {memos.length === 0 ? (
              <div className="empty-state">
                <p>メモがありません</p>
                <button onClick={handleNewMemo} className="btn-new">
                  最初のメモを作成
                </button>
              </div>
            ) : (
              memos.map((memo) => (
                <MemoItem
                  key={memo.id}
                  memo={memo}
                  onEdit={handleEditMemo}
                  onDelete={handleDeleteMemo}
                />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
