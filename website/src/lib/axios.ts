import axios from 'axios';
import { toast } from '@/hooks/use-toast';
import { auth } from '@/utils/auth';

// 创建 axios 实例
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 5000,
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = auth.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 检查响应头中是否有新的 token
    const newToken = response.headers['new-token'];
    if (newToken) {
      // 获取当前用户信息
      const currentUser = auth.getUser();
      if (currentUser) {
        // 更新本地存储的 token 和用户信息
        auth.setAuth(newToken, currentUser);
      }
    }
    return response;
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // token 过期或无效，清除认证信息并重定向到登录页
          auth.clearAuth();
          // if (window.location.pathname !== '/auth/login') {
          //   window.location.href = '/auth/login';
          // }
          break;
        case 403:
          toast({
            title: '访问被拒绝',
            description: '您没有权限访问该资源',
            variant: 'destructive',
          });
          break;
        default:
          toast({
            title: "错误",
            description: error.response.data?.message || "请求失败",
            variant: "destructive",
          });
      }
    } else if (error.request) {
      // 请求已发出但未收到响应
      toast({
        title: "网络错误",
        description: "服务器无响应，请稍后重试",
        variant: "destructive",
      });
    } else {
      // 请求配置出错
      toast({
        title: "错误",
        description: error.message || "请求配置错误",
        variant: "destructive",
      });
    }
    return Promise.reject(error);
  }
);

export default api;