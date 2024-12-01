import api from '@/lib/axios'
import { UploadResponse } from '@/types/upload'

// 文件上传API
const uploadAvatar = async (userId: string, file: File) => {
  const formData = new FormData()
  formData.append('avatar', file)

  const response = await api.post<UploadResponse>(
    `/user/${userId}/upload/avatar`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )
  console.log('response from uploadAvatar', response)
  return response.data.data?.avatarUrl
}

// 更新头像处理函数
export const changeAvatar = async (userId: string, file: File) => {
  try {
    const avatarUrl = await uploadAvatar(userId, file)

    return avatarUrl
  } catch (error) {
    throw new Error('上传头像失败：' + error)
  }
}

export async function uploadImage(file: File, type?: string): Promise<string> {
  const formData = new FormData()
  formData.append('image', file)

  const response = await api.post<UploadResponse>(
    `/uploads/image${type ? `?type=${type}` : ''}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )

  if (response.data.status === 'error' || !response.data.data?.url) {
    throw new Error(response.data.message || '上传失败')
  }

  return response.data.data?.url
}
