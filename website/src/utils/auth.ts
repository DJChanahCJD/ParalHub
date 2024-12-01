import type { User } from '@/types/user'

/**
 * Auth 类用于处理用户认证相关的本地存储
 */
class Auth {
  private readonly tokenKey: string
  private readonly userKey: string

  constructor() {
    this.tokenKey = process.env.NEXT_PUBLIC_TOKEN_KEY || 'app_token'
    this.userKey = process.env.NEXT_PUBLIC_USER_KEY || 'app_user'
  }

  // 添加浏览器环境检查
  private isBrowser(): boolean {
    return typeof window !== 'undefined'
  }

  // 安全的获取 localStorage
  private getStorage(key: string): string | null {
    if (!this.isBrowser()) return null
    return localStorage.getItem(key)
  }

  // 安全的设置 localStorage
  private setStorage(key: string, value: string): void {
    if (!this.isBrowser()) return
    localStorage.setItem(key, value)
  }

  // 安全的移除 localStorage
  private removeStorage(key: string): void {
    if (!this.isBrowser()) return
    localStorage.removeItem(key)
  }

  /**
   * 设置认证信息
   * @param token JWT token
   * @param user 用户信息
   */
  setAuth(token: string, user: User): void {
    try {
      this.setStorage(this.tokenKey, token)
      this.setStorage(this.userKey, JSON.stringify(user))
    } catch (error) {
      console.error('Failed to set auth:', error)
      throw new Error('认证信息存储失败')
    }
  }

  /**
   * 清除认证信息
   */
  clearAuth(): void {
    try {
      this.removeStorage(this.tokenKey)
      this.removeStorage(this.userKey)
    } catch (error) {
      console.error('Failed to clear auth:', error)
      throw new Error('认证信息清除失败')
    }
  }

  /**
   * 获取 token
   */
  getToken(): string | null {
    try {
      return this.getStorage(this.tokenKey)
    } catch (error) {
      console.error('Failed to get token:', error)
      return null
    }
  }

  /**
   * 获取用户信息
   */
  getUser(): User | null {
    try {
      const userStr = this.getStorage(this.userKey)
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      this.removeStorage(this.userKey)
      console.error('Failed to get user:', error)
      return null
    }
  }

  /**
   * 更新用户信息
   */
  updateUser(user: User): void {
    try {
      this.setStorage(this.userKey, JSON.stringify(user))
    } catch (error) {
      console.error('Failed to update user:', error)
      throw new Error('用户信息更新失败')
    }
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  /**
   * 检查 token 是否过期
   * 如果使用 JWT，可以解析 token 检查过期时间
   */
  isTokenExpired(): boolean {
    const token = this.getToken()
    if (!token) return true

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 < Date.now()
    } catch {
      return true
    }
  }
}

// 导出单例
export const auth = new Auth()