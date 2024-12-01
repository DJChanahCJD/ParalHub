import api from '@/lib/axios'

export interface Notification {
  _id: string
  type: 'new_case' | 'new_article'
  title: string
  content?: string
  isRead: boolean
  createdAt: string
  sender: {
    _id: string
    username: string
    avatar: string
  }
  contentId: string
}

interface NotificationResponse {
  items: Notification[]
  total: number
  page: number
  pageSize: number
}

export async function getNotifications(params: { page: number; pageSize: number }) {
  const { data } = await api.get<NotificationResponse>('/notifications', { params })
  return data
}

export async function getUnreadCount() {
  const { data } = await api.get<{ count: number }>('/notifications/unread-count')
  return data
}

export async function markAsRead(id: string) {
  return api.post(`/notifications/${id}/read`)
}

export async function markAllAsRead() {
  return api.post('/notifications/read-all')
}
