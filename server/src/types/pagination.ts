// 分页参数接口
export interface PaginationParams {
  page: number;
  pageSize: number;
  keyword?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

// 分页响应接口
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
