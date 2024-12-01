import { request } from '@umijs/max';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
/** 获取开发者列表 */
export async function getDeveloperList(params: any, options?: { [key: string]: any }) {
  return request<API.DeveloperItem>(`${API_URL}/developer/list`, {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

//CURD
export async function createDeveloper(data: API.DeveloperItem, options?: { [key: string]: any }) {
  return request<API.DeveloperItem>(`${API_URL}/developer/create`, {
    method: 'POST',
    data,
    ...(options || {}),
  });
}

export async function updateDeveloper(
  id: string,
  data: Partial<API.DeveloperItem>,
  options?: { [key: string]: any },
) {
  return request<API.DeveloperItem>(`${API_URL}/developer/update/${id}`, {
    method: 'POST',
    data,
    ...(options || {}),
  });
}

export async function deleteDeveloper(id: string, options?: { [key: string]: any }) {
  return request<API.DeveloperItem>(`${API_URL}/developer/delete/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}
