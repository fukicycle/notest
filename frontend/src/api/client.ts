import axios from 'axios';
import { Memo, CreateMemoRequest, UpdateMemoRequest, OCRRequest, OCRResponse } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// メモAPI
export const memoApi = {
  // すべてのメモを取得
  getAll: async (): Promise<Memo[]> => {
    const response = await api.get<Memo[]>('/memos');
    return response.data;
  },

  // メモを取得
  getById: async (id: number): Promise<Memo> => {
    const response = await api.get<Memo>(`/memos/${id}`);
    return response.data;
  },

  // メモを作成
  create: async (data: CreateMemoRequest): Promise<Memo> => {
    const response = await api.post<Memo>('/memos', data);
    return response.data;
  },

  // メモを更新
  update: async (id: number, data: UpdateMemoRequest): Promise<Memo> => {
    const response = await api.put<Memo>(`/memos/${id}`, data);
    return response.data;
  },

  // メモを削除
  delete: async (id: number): Promise<void> => {
    await api.delete(`/memos/${id}`);
  },

  // メモを検索
  search: async (keyword: string): Promise<Memo[]> => {
    const response = await api.get<Memo[]>('/memos/search', {
      params: { q: keyword },
    });
    return response.data;
  },
};

// OCR API
export const ocrApi = {
  // 画像からテキストを抽出
  processImage: async (imageData: string): Promise<string> => {
    const response = await api.post<OCRResponse>('/ocr/process', {
      image_data: imageData,
    });
    return response.data.text;
  },
};

export default api;
