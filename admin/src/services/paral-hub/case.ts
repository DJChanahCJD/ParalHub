import { request } from '@umijs/max';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';


// API 请求函数
export async function getCases(params: API.CaseParams) {
  return request<API.CaseResponse>(`${API_URL}/case`, {
    method: 'GET',
    params,
  });
}

export async function addCase(data: Partial<API.CaseItem>) {
  return request<API.CaseItem>(`${API_URL}/case`, {
    method: 'POST',
    data,
  });
}

export async function updateCase(id: string, data: Partial<API.CaseItem>) {
  return request<API.CaseItem>(`${API_URL}/case/${id}`, {
    method: 'PUT',
    data,
  });
}

export async function deleteCase(id: string) {
  return request<void>(`${API_URL}/case/${id}`, {
    method: 'DELETE',
  });
}
