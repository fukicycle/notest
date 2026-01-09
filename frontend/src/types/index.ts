export interface Memo {
  id: number;
  title: string;
  content: string;
  source: 'manual' | 'ocr';
  created_at: string;
  updated_at: string;
}

export interface CreateMemoRequest {
  title: string;
  content: string;
  source?: 'manual' | 'ocr';
}

export interface UpdateMemoRequest {
  title: string;
  content: string;
}

export interface OCRRequest {
  image_data: string;
}

export interface OCRResponse {
  text: string;
}
