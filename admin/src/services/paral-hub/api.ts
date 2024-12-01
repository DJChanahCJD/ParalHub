/* eslint-disable */
import { request } from '@umijs/max';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Auth 相关接口
/** 获取当前用户信息 */
export async function currentUser(options?: { [key: string]: any }) {
  return request<{ data: API.CurrentUser }>(`${API_URL}/user/current-user`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    ...(options || {}),
  });
}

/** 退出登录 */
export async function outLogin(options?: { [key: string]: any }) {
  localStorage.removeItem('token');
  return request<Record<string, any>>(`${API_URL}/admin/auth/logout`, {
    method: 'POST',
    ...(options || {}),
  });
}

/** 密码登录 */
export async function loginByPassword(body: API.LoginParams) {
  return request<API.LoginResult>(`${API_URL}/admin/auth/login/password`, {
    method: 'POST',
    data: body,
  });
}

/** 验证码登录 */
export async function loginByCaptcha(body: API.LoginParams) {
  return request<API.LoginResult>(`${API_URL}/admin/auth/login/captcha`, {
    method: 'POST',
    data: body,
  });
}

/** 获取邮箱验证码 */
export async function getCaptchaByEmail(params: { email?: string }) {
  return request<API.Captcha>(`${API_URL}/admin/auth/login/get-captcha`, {
    method: 'GET',
    params,
  });
}

/** 注册管理员 */
export async function createAdmin(
  body: Partial<API.AdminItem>,
  options?: { [key: string]: any },
) {
  return request<API.AdminItem>(`${API_URL}/admin/create`, {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

// 管理员管理接口
/** 获取管理员列表 */
export async function getAdminList(params: any, options?: { [key: string]: any }) {
  return request<API.AdminItem>(`${API_URL}/admin/list`, {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** 更新管理员信息 */
export async function updateAdmin(id: string, updateUserDto: Partial<API.AdminItem>) {
  return request(`${API_URL}/admin/update/${id}`, {
    method: 'POST',
    data: { updateUserDto },
  });
}

/** 切换管理员权限 */
export async function toggleAdminAccess(id: string) {
  return request(`${API_URL}/admin/access/toggle`, {
    method: 'POST',
    data: { id },
  });
}

/** 删除管理员 */
export async function deleteAdmin(id: string, options?: { [key: string]: any }) {
  return request<API.AdminItem>(`${API_URL}/admin/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 重置密码 */
export async function resetPassword(params: {
  userId: string;
  password: string;
}, options?: { [key: string]: any }) {
  return request<Record<string, any>>(`${API_URL}/admin/password/reset`, {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

// 日志管理接口
/** 获取日志 */
export async function getLog(
  type: 'system' | 'error' | 'access',
  options?: { [key: string]: any }
) {
  return request<API.LogResponse>(`${API_URL}/log`, {
    method: 'GET',
    params: {
      type,
      ...options
    },
  });
}

/** 获取用户日志 */
export async function getUserLogs(params?: API.UserLogParams) {
  return request<API.UserLogResponse>(`${API_URL}/log/user`, {
    method: 'GET',
    params,
  });
}


/** 获取通知列表 */
export async function getNoticeList(options?: { [key: string]: any }) {
  return request<API.NoticeIconList>(`${API_URL}/admin/notices`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取案例列表 */
export async function getCaseList(params: any, options?: { [key: string]: any }) {
  return request<API.CaseItem>(`${API_URL}/admin/cases`, {
    method: 'GET',
    params,
    ...(options || {}),
  });
}
