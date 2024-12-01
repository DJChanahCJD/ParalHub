import { request } from '@umijs/max';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
/** 获取企业列表 */
export async function getEnterpriseList(params: any, options?: { [key: string]: any }) {
  return request<API.EnterpriseItem>(`${API_URL}/enterprise/list`, {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** 创建企业 */
export async function createEnterprise(data: Partial<API.EnterpriseItem>) {
  return request<API.EnterpriseItem>(`${API_URL}/enterprise/create`, {
    method: 'POST',
    data,
  });
}

/** 更新企业 */
export async function updateEnterprise(id: string, data: Partial<API.EnterpriseItem>) {
  return request<API.EnterpriseItem>(`${API_URL}/enterprise/update/${id}`, {
    method: 'PUT',
    data,
  });
}

/** 删除企业 */
export async function deleteEnterprise(id: string) {
  return request<API.EnterpriseItem>(`${API_URL}/enterprise/delete/${id}`, {
    method: 'DELETE',
  });
}

/** 认证企业 */
export async function verifyEnterprise(id: string) {
  return request<API.EnterpriseItem>(`${API_URL}/enterprise/verify/${id}`, {
    method: 'PUT',
  });
}

/** 拒绝企业 */
export async function rejectEnterprise(id: string) {
  return request<API.EnterpriseItem>(`${API_URL}/enterprise/reject/${id}`, {
    method: 'PUT',
  });
}
