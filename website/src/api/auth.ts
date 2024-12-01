import api from '@/lib/axios'
import type { RegisterRequest, LoginRequest, ResetPasswordDto } from '@/types/api'

// 获取登录验证码
export const getLoginCaptcha = (role: string, params: { email: string }) => {
  return api.get(`/${role}/auth/login/get-captcha`, { params })
}

// 获取注册验证码
export const getRegisterCaptcha = (role: string, params: { email: string }) => {
  console.log('getRegisterCaptcha：', role, 'params:', params)
  return api.get(`/${role}/auth/register/get-captcha`, { params })
}

// 注册
export const register = (role: string, data: RegisterRequest) => {
  return api.post(`/${role}/auth/register`, data)
}

// 登录
export const login = (role: string, type: 'captcha' | 'password', data: LoginRequest) => {
  return api.post(`/${role}/auth/login/${type}`, data)
}

// 登出
export const logout = (role: string) => {
  return api.post(`/${role}/auth/logout`)
}

// 获取重置密码验证码
export const getResetPasswordCaptcha = (role: string, params: { email: string }) => {
  return api.get(`/${role}/auth/reset-password/get-token`, { params })
}

// 重置密码
export const resetPassword = (role: string, data: ResetPasswordDto) => {
  return api.post(`/${role}/auth/reset-password`, data)
}

// 获取用户信息
export const getCurrentUser = () => {
  return api.get('/user/current-user')
}