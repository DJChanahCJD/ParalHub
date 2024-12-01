// 统一的路由配置和链接生成工具
export const ROUTES = {
  WEBSITE: {
    ARTICLE: '/article',
    CASE: '/case',
    PROFILE: '/profile',
  },
  ADMIN: {
    ARTICLE: '/admin/article',
    CASE: '/admin/case',
    USER: '/admin/users',
  }
} as const;

// 获取前台URL
const getWebsiteBaseUrl = () => {
  return process.env.REACT_APP_WEBSITE_URL || 'http://localhost:8001/'  // 开发环境
}

// 创建前台链接
export const createWebsiteLink = (path: string, id?: string) => {
  const baseUrl = getWebsiteBaseUrl()
  const fullPath = id ? `${path}/${id}` : path
  return `${baseUrl}${fullPath}`
}
