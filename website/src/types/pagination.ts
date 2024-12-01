export interface PaginationParams {
  current?: number
  pageSize?: number
  sortField?: string
  sortOrder?: 'ascend' | 'descend'
}

export interface PaginatedResponse<T> {
  data: T[]
  items?: T[]
  total: number
  current: number
  pageSize: number
}