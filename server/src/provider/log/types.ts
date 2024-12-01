// 1. 日志级别定义
export enum LogLevel {
  ERROR = 'error', // 错误日志
  WARN = 'warn', // 警告日志
  INFO = 'info', // 信息日志
  DEBUG = 'debug', // 调试日志
}

// 2. 日志类型定义
export enum LogType {
  SYSTEM = 'system', // 系统日志
  ACCESS = 'access', // 访问日志
  ERROR = 'error', // 错误日志
  USER = 'user', // 用户日志
}

// 3. 基础日志接口
export interface BaseLog {
  timestamp: string; // 时间戳
  level: LogLevel; // 日志级别
  context: string; // 上下文
  message: string; // 日志消息
  metadata?: any; // 元数据
}

// 4. 访问日志接口
export interface AccessLog extends BaseLog {
  metadata: {
    ip: string; // 访问IP
    method: string; // 请求方法
    path: string; // 请求路径
    duration: number; // 处理时长
    status: number; // 响应状态
  };
}

export interface UserLogEntry {
  timestamp: string;
  event: string;
  userId?: string;
  username?: string;
  ip: string;
  address?: string;
  success: boolean;
  details?: any;
}
