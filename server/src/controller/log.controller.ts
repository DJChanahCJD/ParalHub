import {
  Controller,
  Get,
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { LogService } from '../provider/log/log.service';
import { SkipLogging } from '../provider/log/skip-logging.decorator';
import { JwtAuthGuard } from '../guards/auth.guard';
import { ConfigService } from '@nestjs/config';

@Controller('/log')
@UseGuards(JwtAuthGuard)
export class LogController {
  private readonly isProduction: boolean;

  constructor(
    private readonly logService: LogService,
    private readonly configService: ConfigService,
  ) {
    this.isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
  }

  private async getLocationByIp(ip: string): Promise<string> {
    // 处理本地IP
    if (
      ip === '127.0.0.1' ||
      ip === 'localhost' ||
      ip.startsWith('192.168.') ||
      ip.startsWith('10.')
    ) {
      return '本地网络';
    }

    try {
      // 使用 fetch 直接请求 ip-api.com 的免费服务
      const response = await fetch(
        `http://ip-api.com/json/${ip}?lang=zh-CN&fields=status,message,country,regionName,city`,
      );
      const data = await response.json();
      if (data.status === 'success') {
        return `${data.country}${data.regionName}${data.city}`;
      }
    } catch (error) {
      console.error('IP解析失败:', error);
    }

    return ip;
  }

  private readonly userEvents = [
    // 认证相关
    '/auth/login/password', // 密码登录
    '/auth/login/captcha', // 验证码登录
    '/auth/logout', // 登出
    '/auth/register', // 注册
    '/auth/current', // 获取当前用户信息

    // 用户信息相关
    '/user/update', // 更新用户信息
    '/user/change-avatar', // 更改头像
    '/user/upload/avatar', // 上传头像

    // // 管理员相关
    // '/admin/create', // 创建管理员
    // '/admin/update', // 更新管理员信息
    // '/admin/delete', // 删除管理员
    // '/admin/access/toggle', // 切换管理员权限
    // '/admin/password/reset', // 重置密码

    // 开发者相关
    '/developer/auth/register', // 开发者注册
    '/developer/auth/login/password', // 开发者密码登录
    '/developer/auth/login/captcha', // 开发者验证码登录
    '/developer/update', // 更新开发者信息
    '/developer/delete', // 删除开发者

    // 企业相关
    '/enterprise/auth/register', // 企业注册
    '/enterprise/auth/login/password', // 企业密码登录
    '/enterprise/auth/login/captcha', // 企业验证码登录
    '/enterprise/update', // 更新企业信息
    '/enterprise/delete', // 删除企业
    '/enterprise/verify', // 企业认证
    '/enterprise/reject', // 企业认证拒绝

    // 关注相关
    '/follows/follow', // 关注用户
    '/follows/unfollow', // 取消关注

    // 案例相关
    '/case/',
    // 文章相关
    '/article/',
    // 评论相关
    '/comment/',
  ];

  @Get()
  @SkipLogging()
  async getLogs(
    @Query('type') type: string = 'system',
    @Query('current') current: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    // 验证日志类型
    const validTypes = ['system', 'error', 'access', 'user'];
    if (!validTypes.includes(type)) {
      throw new BadRequestException(
        `Invalid log type. Must be one of: ${validTypes.join(', ')}`,
      );
    }

    try {
      // 直接获取日志数组
      const logs = await this.logService.readLogs(type);

      // 处理分页
      const total = logs.length;
      const startIndex = (current - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const pagedLogs = logs.slice(startIndex, endIndex);

      // 格式化日志条目以匹配前端期望的格式
      const formattedLogs = pagedLogs.map((log) => ({
        timestamp: log.timestamp,
        level: log.level.toUpperCase(), // 确保level是大写
        message: log.message,
        context: log.context,
        metadata: log.metadata,
        source: log.source || 'system',
        repeatCount: log.repeatCount || 1,
      }));
      console.log('formattedLogs from controller', formattedLogs);
      return {
        code: 200,
        data: {
          data: formattedLogs,
          total,
          type,
          hasMore: endIndex < total,
          nextCursor: endIndex < total ? String(current + 1) : null,
        },
      };
    } catch (error) {
      console.error('获取日志失败:', error);
      return {
        code: 500,
        message: '获取日志失败',
        error: error.message,
        data: {
          data: [],
          total: 0,
          type,
          hasMore: false,
          nextCursor: null,
        },
      };
    }
  }

  @Get('user')
  @SkipLogging()
  async getUserLogs(
    @Query('current') current: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('ip') ip?: string,
    @Query('address') address?: string,
    @Query('event') event?: string,
    @Query('success') success?: string,
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: 'ascend' | 'descend',
  ) {
    try {
      const logs = await this.logService.readLogs('system');

      // 过滤用户相关事件
      let filteredLogs = logs.filter((log: any) => {
        const message = log.message.toLowerCase();
        return this.userEvents.some((eventPath) => {
          const logPath = message.split(' ')[1];
          return logPath && logPath.includes(eventPath.toLowerCase());
        });
      });

      // 简化日志格式，只保留需要的字段
      filteredLogs = await Promise.all(
        filteredLogs.map(async (log: any) => {
          const ipAddress = log.metadata?.ip || '-';
          return {
            time: log.timestamp,
            event: log.message.split(' ')[1] || '', // 只保留路径部分
            ip: ipAddress,
            address: (await this.getLocationByIp(ipAddress)) || '-',
            success: log.metadata?.status >= 200 && log.metadata?.status < 400,
          };
        }),
      );
      console.log('filteredLogs from controller', filteredLogs);
      // 应用过滤条件
      if (ip) {
        filteredLogs = filteredLogs.filter((log) =>
          log.ip.toLowerCase().includes(ip.toLowerCase()),
        );
      }

      if (address) {
        filteredLogs = filteredLogs.filter((log) =>
          log.address.toLowerCase().includes(address.toLowerCase()),
        );
      }

      if (event) {
        filteredLogs = filteredLogs.filter((log) =>
          log.event.toLowerCase().includes(event.toLowerCase()),
        );
      }

      if (success !== undefined && success !== null) {
        const successValue = success === 'true';
        filteredLogs = filteredLogs.filter(
          (log) => log.success === successValue,
        );
      }

      // 应用排序
      if (sortField && sortOrder) {
        filteredLogs.sort((a, b) => {
          if (sortField === 'time') {
            return sortOrder === 'ascend'
              ? new Date(a.time).getTime() - new Date(b.time).getTime()
              : new Date(b.time).getTime() - new Date(a.time).getTime();
          }
          const compareResult = String(a[sortField]).localeCompare(
            String(b[sortField]),
          );
          return sortOrder === 'ascend' ? compareResult : -compareResult;
        });
      } else {
        // 默认按时间倒序
        filteredLogs.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
      }

      // 计算分页
      const total = filteredLogs.length;
      const startIndex = (current - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const pagedLogs = filteredLogs.slice(startIndex, endIndex);

      return {
        code: 200,
        data: {
          data: pagedLogs,
          total,
          success: true,
        },
      };
    } catch (error) {
      console.error('获取用户日志失败:', error);
      return {
        code: 500,
        message: '获取用户日志失败',
        error: error.message,
        data: {
          data: [],
          total: 0,
          success: false,
        },
      };
    }
  }
}
