import { request } from '@umijs/max';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// 获取公告列表
export async function getNotices(params: API.NoticeParams) {
  return request<API.NoticeResponse>(`${API_URL}/notice`, {
    method: 'GET',
    params,
  });
}

// 创建公告
export async function createNotice(data: API.NoticeItem) {
  return request<API.NoticeResponse>(`${API_URL}/notice`, {
    method: 'POST',
    data,
  });
}

// 更新公告
export async function updateNotice(id: string, data: Partial<API.NoticeItem>) {
  return request<API.NoticeResponse>(`${API_URL}/notice/${id}`, {
    method: 'PUT',
    data,
  });
}

// 删除公告
export async function deleteNotice(id: string) {
  return request<API.NoticeResponse>(`${API_URL}/notice/${id}`, {
    method: 'DELETE',
  });
}

// 发布公告
export async function publishNotice(id: string) {
  return request<API.NoticeResponse>(`${API_URL}/notice/${id}/publish`, {
    method: 'POST',
  });
}

// 撤回公告
export async function withdrawNotice(id: string) {
  return request<API.NoticeResponse>(`${API_URL}/notice/${id}/withdraw`, {
    method: 'POST',
  });
}
