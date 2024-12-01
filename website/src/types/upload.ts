export interface UploadResponse {
  status: 'success' | 'error';
  data?: {
    avatarUrl?: string;
    url?: string;
  };
  message?: string;
}