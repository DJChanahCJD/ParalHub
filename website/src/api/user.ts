import api from '@/lib/axios'
import type { User } from '@/types/user'

// 获取用户信息
export const getUserProfile = (userId: string) => {
  return api.get(`/user/profile/${userId}`)
}


export const updateProfile = (id: string, data: Partial<User>) => {
  return api.post<User>(`/user/update/${id}`, {
    ...data,
  })
}
