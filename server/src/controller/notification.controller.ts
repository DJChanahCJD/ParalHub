import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationService } from 'src/provider/notification/notification.service';
import { JwtAuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/decorators/user.decorator';
import { JwtPayload } from '@/types/auth.types';
import { NotificationResponse } from 'src/types/notification.types';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getUserNotifications(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
  ): Promise<NotificationResponse> {
    return this.notificationService.getUserNotifications(
      user.userId,
      Number(page),
      Number(pageSize),
    );
  }

  // 获取未读消息数
  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: JwtPayload) {
    return {
      count: await this.notificationService.getUnreadCount(user.userId),
    };
  }

  // 标记单条消息为已读
  @Post(':id/read')
  async markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id') notificationId: string,
  ) {
    await this.notificationService.markAsRead(user.userId, notificationId);
    return { success: true };
  }

  // 标记所有消息为已读
  @Post('read-all')
  async markAllAsRead(@CurrentUser() user: JwtPayload) {
    await this.notificationService.markAsRead(user.userId);
    return { success: true };
  }
}
