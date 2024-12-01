import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LogService } from './log.service';
import { Reflector } from '@nestjs/core';
import { SKIP_LOGGING_KEY } from './skip-logging.decorator';
import { LogType, LogLevel } from './types';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  // 定义不需要记录日志的路径
  private readonly IGNORE_PATHS = [
    '/health',
    '/metrics',
    '/favicon.ico',
    '/static/',
    '/public/',
  ];

  constructor(
    private readonly logService: LogService,
    private readonly reflector: Reflector,
  ) {}

  private formatIp(ip: string): string {
    // 调试输出
    console.log('Formatting IP:', ip);

    // 如果是本地地址
    if (ip === '127.0.0.1' || ip === 'localhost' || ip === '::1') {
      return '127.0.0.1';
    }

    // 如果是内网地址
    if (/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1]))/.test(ip)) {
      return ip;
    }

    // 外网地址
    return ip;
  }

  // 获取客户端真实IP地址的辅助方法
  private getClientIp(request: any): string {
    // 按优先级尝试不同的方式获取 IP
    const ip =
      // 1. 尝试获取 Express 的 IP（需要 trust proxy）
      request.ip ||
      // 2. 尝试获取 X-Forwarded-For
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      // 3. 尝试获取 X-Real-IP（通常由 Nginx 设置）
      request.headers['x-real-ip'] ||
      // 4. 尝试获取 socket 的远程地址
      request.socket?.remoteAddress ||
      // 5. 尝试获取连接的远程地址（旧版本兼容）
      request.connection?.remoteAddress ||
      // 6. 兜底
      'unknown';

    console.log('Original IP:', ip); // 调试用

    // 处理各种 IP 格式
    let formattedIp = ip;

    // 处理 IPv6 格式
    if (formattedIp.includes('::ffff:')) {
      formattedIp = formattedIp.replace(/^::ffff:/, '');
    } else if (formattedIp === '::1') {
      formattedIp = '127.0.0.1';
    }

    // 格式化 IP
    return this.formatIp(formattedIp);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 1. 检查是否需要忽略的路径
    if (
      this.reflector.get(SKIP_LOGGING_KEY, context.getHandler()) ||
      this.shouldIgnorePath(context)
    ) {
      return next.handle();
    }

    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    const { method, path } = request;

    // 获取真实IP地址
    const clientIp = this.getClientIp(request);

    // 2. 记录所有请求信息
    const requestInfo = {
      ip: clientIp,
      query:
        request.query && Object.keys(request.query).length > 0
          ? this.sanitizeData(request.query)
          : undefined,
      body:
        request.body && Object.keys(request.body).length > 0
          ? this.sanitizeData(request.body)
          : undefined,
    };

    // 3. 处理请求
    return next.handle().pipe(
      tap({
        next: (response) => {
          const duration = Date.now() - startTime;

          this.logService.writeLog(LogType.ACCESS, {
            level: LogLevel.INFO,
            context: 'HTTP',
            message: `${method} ${path}`,
            metadata: {
              ip: clientIp,
              ...requestInfo,
              duration,
              status: response?.statusCode || 200,
              response: this.sanitizeResponse(response),
            },
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;

          this.logService.writeLog(LogType.ERROR, {
            level: LogLevel.ERROR,
            context: 'HTTP',
            message: `${method} ${path} - ${error.message}`,
            metadata: {
              ip: clientIp,
              ...requestInfo,
              duration,
              error: this.sanitizeError(error),
            },
          });
        },
      }),
    );
  }

  private shouldIgnorePath(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return this.IGNORE_PATHS.some((path) => request.path.startsWith(path));
  }

  private sanitizeData(data: any): any {
    // 1. 如果数据为空，直接返回 undefined
    if (!data) return undefined;

    try {
      // 2. 深拷贝，添加错误处理
      const sanitized = JSON.parse(JSON.stringify(data));

      const sensitiveFields = [
        'password',
        'token',
        'secret',
        'captcha',
        'email',
        'phone',
        'address',
        'idCard',
      ];

      const clean = (obj: any) => {
        // 3. 添加类型检查
        if (!obj || typeof obj !== 'object') return;

        // 4. 处理数组
        if (Array.isArray(obj)) {
          obj.forEach((item) => {
            if (item && typeof item === 'object') {
              clean(item);
            }
          });
          return;
        }

        // 5. 处理对象
        Object.keys(obj).forEach((key) => {
          if (sensitiveFields.includes(key.toLowerCase())) {
            obj[key] = '[FILTERED]';
          } else if (obj[key] && typeof obj[key] === 'object') {
            clean(obj[key]);
          }
        });
      };

      clean(sanitized);
      return sanitized;
    } catch (error) {
      // 6. 添加错误处理
      console.error('Error sanitizing data:', error);
      return undefined;
    }
  }

  private sanitizeResponse(response: any): any {
    try {
      if (!response) return undefined;

      // 只返回安全的响应信息
      return {
        success: response?.success ?? true,
        ...(response?.total !== undefined && { total: response.total }),
        ...(Array.isArray(response?.data) && { count: response.data.length }),
      };
    } catch (error) {
      console.error('Error sanitizing response:', error);
      return undefined;
    }
  }

  private sanitizeError(error: any): any {
    try {
      if (!error) return { type: 'Unknown', message: 'Unknown error' };

      // 提取关键错误信息
      const errorInfo = {
        type: error.name || 'Error',
        message: error.message || 'Unknown error',
        code: error.code,
      };

      // 对特定类型错误的处理
      if (error.response) {
        return {
          ...errorInfo,
          status: error.response.status,
          statusText: error.response.statusText,
        };
      } else if (error.code === 11000) {
        return {
          ...errorInfo,
          message: '数据重复，请检查输入',
        };
      }

      // 开发环境可以包含更多信息
      if (process.env.NODE_ENV === 'development') {
        return {
          ...errorInfo,
          stack: error.stack?.split('\n').slice(0, 3).join('\n'),
        };
      }

      return errorInfo;
    } catch (err) {
      console.error('Error sanitizing error:', err);
      return { type: 'Unknown', message: 'Error processing error details' };
    }
  }
}
