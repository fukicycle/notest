export interface Memo {
  id: number;
  content: string;
  source: 'manual' | 'ocr';
  created_at: string;
  updated_at: string;
}

export interface CreateMemoRequest {
  content: string;
  source?: 'manual' | 'ocr';
}

export interface UpdateMemoRequest {
  content: string;
}

export interface OCRRequest {
  image_data: string;
}

export interface OCRResponse {
  text: string;
}
