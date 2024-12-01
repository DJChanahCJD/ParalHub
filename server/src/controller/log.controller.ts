import {
  Controller,
  Get,
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { LogService } from 'src/provider/log/log.service';
import { SkipLogging } from 'src/provider/log/skip-logging.decorator';
import * as geoip from 'geoip-lite';
import { JwtAuthGuard } from '@/guards/auth.guard';

@Controller('/log')
@UseGuards(JwtAuthGuard)
export class LogController {
  constructor(private readonly logService: LogService) {}

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

  private getLocationByIp(ip: string): string {
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
      const geo = geoip.lookup(ip);
      if (geo) {
        // 中文环境
        if (geo.country === 'CN') {
          return `${geo.country}${geo.region}${geo.city}`;
        }
        // 国际环境
        return `${geo.country}${geo.city ? `, ${geo.city}` : ''}`;
      }
    } catch (error) {
      console.error('IP解析失败:', error);
    }
    return '未知地址';
  }

  @Get()
  @SkipLogging()
  async getLogs(@Query('type') type: string = 'system') {
    // 验证日志类型
    const validTypes = ['system', 'error', 'access', 'user'];
    if (!validTypes.includes(type)) {
      throw new BadRequestException(
        `Invalid log type. Must be one of: ${validTypes.join(', ')}`,
      );
    }

    const safeLimit = 1000;

    try {
      const result = await this.logService.readLogs(type, safeLimit);
      return {
        code: 200,
        data: {
          data: (result as any).data,
          total: (result as any).data?.length || 0,
          type,
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
      // 获取系统日志
      const result = await this.logService.readLogs('system', 1000);
      let logs = (result as any).data || [];

      // 过滤并转换日志格式
      logs = logs
        .filter((log: any) => {
          const message = log.message.toLowerCase();
          return this.userEvents.some((event) => message.includes(event));
        })
        .map((log: any) => {
          const ipAddress = log.metadata?.ip || '-';
          const locationAddress = this.getLocationByIp(ipAddress);
          return {
            timestamp: log.timestamp,
            message: log.message,
            ip: ipAddress,
            success: log.metadata?.status >= 200 && log.metadata?.status < 400,
            address: locationAddress,
            metadata: log.metadata,
          };
        });

      // 应用IP过滤
      if (ip) {
        logs = logs.filter((log) =>
          log.ip.toLowerCase().includes(ip.toLowerCase()),
        );
      }

      // 应用地区过滤
      if (address) {
        logs = logs.filter((log) =>
          log.address.toLowerCase().includes(address.toLowerCase()),
        );
      }

      // 应用事件过滤
      if (event) {
        logs = logs.filter((log) =>
          log.message.toLowerCase().includes(event.toLowerCase()),
        );
      }

      // 应用状态过滤
      if (success !== undefined && success !== null) {
        const successValue = success === 'true';
        logs = logs.filter((log) => log.success === successValue);
      }

      // 应用排序
      if (sortField && sortOrder) {
        logs.sort((a, b) => {
          if (sortField === 'timestamp') {
            return sortOrder === 'ascend'
              ? new Date(a.timestamp).getTime() -
                  new Date(b.timestamp).getTime()
              : new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime();
          }
          const compareResult = String(a[sortField]).localeCompare(
            String(b[sortField]),
          );
          return sortOrder === 'ascend' ? compareResult : -compareResult;
        });
      }

      // 计算分页
      const total = logs.length;
      const startIndex = (current - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const pagedLogs = logs.slice(startIndex, endIndex);

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
