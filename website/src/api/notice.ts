import api from '@/lib/axios'

export interface Notice {
  _id: string
  title: string
  content: string
  type: 'system' | 'announcement' | 'notification'
  status: 'draft' | 'published' | 'expired'
  expireTime: string
  createdAt: string
  publishTime: string
  updatedAt: string
  target: 'all' | 'enterprise' | 'developer'
  creator?: {
    _id: string
    username: string
    avatar: string
  }
}

interface NoticeResponse {
  data: Notice[]
  total: number
}

export const getNoticeList = async (params?: {
  type?: string
  status?: string
  target?: string
  sortField?: string
  sortOrder?: string
  pageSize?: number
  current?: number
}) => {
  const response = await api.get<NoticeResponse>('/notice', { params })
  return response.data
}