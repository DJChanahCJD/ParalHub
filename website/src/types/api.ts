// 基础响应类型
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  status: string
  data: T
}

// 技能类型
export interface Skill {
  _id: string
  name: string
}

// 行业类型
export interface Industry {
  _id: string
  name: string
}

// 规模类型
export interface Scale {
  _id: string
  name: string
}
export interface LoginRequest {
  email: string
  password?: string
  captcha?: string
}

// 注册请求类型
export interface RegisterRequest {
  username?: string
  realName?: string
  company?: string
  email: string
  password: string
  emailCaptcha: string
  phone?: string
  skills?: string[]
  bio?: string
  industry?: string
  scale?: string
  contact?: string
  address?: string
}

export interface ResetPasswordDto {
  email: string
  token: string
  newPassword: string
}
