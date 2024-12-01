import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Express } from 'express';
import { Public } from '../../decorators/public.decorator';
import { UsersService } from '../../provider/users/users.service';
import { UserRole } from '../../schema/users.schema';
import { JwtAuthGuard } from '../../guards/auth.guard';
import { CurrentUser } from '../../decorators/user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { createUploadConfig } from '../../config/upload.config';
import { UploadService } from '../../provider/upload/upload.service';
import { JwtPayload } from '../../types/auth.types';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class PublicUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly uploadService: UploadService,
  ) {}

  @Get('/current-user')
  async getCurrentUser(@CurrentUser() user: JwtPayload) {
    return await this.usersService.getCurrentUser(user.role, user.userId);
  }

  @Public()
  @Get('/profile/:id')
  async getUserProfile(@Param('id') id: string) {
    // 定义要查找的用户角色数组
    const roles = [UserRole.ENTERPRISE, UserRole.DEVELOPER, UserRole.ADMIN];
    const roleNames = ['企业', '开发者', '管理员'];

    // 依次在各个用户表中查找
    for (let i = 0; i < roles.length; i++) {
      try {
        console.log(`开始查找${roleNames[i]}用户：`, id);
        const user = await this.usersService.getUserById(roles[i], id);
        if (user) {
          return { data: user, status: 'success' };
        }
      } catch (error) {
        console.log(`该${roleNames[i]}用户不存在：`, error);
        continue; // 继续查找下一个角色
      }
    }

    // 如果都没找到，返回错误
    return {
      status: 'error',
      message: '用户不存在',
    };
  }

  @Post('/update/:id')
  async updateUser(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() data,
  ) {
    if (user.userId !== id) {
      console.log('user._id', user.userId);
      console.log('id', id);
      throw new ForbiddenException('无权限');
    }
    console.log('data from updateUser', data);
    return await this.usersService.updateUser(user.role, id, data);
  }

  @Post('/change-avatar/:id')
  async changeAvatar(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body('avatar') avatar: string,
  ) {
    if (user.userId !== id) {
      throw new ForbiddenException('无权限');
    }
    return await this.usersService.changeAvatar(id, user.role, avatar);
  }

  @Post('/:id/upload/avatar')
  @UseInterceptors(
    FileInterceptor(
      'avatar',
      createUploadConfig('avatar', {
        maxSize: 5 * 1024 * 1024,
      }),
    ),
  )
  async uploadAvatar(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (user.userId !== id) {
      throw new ForbiddenException('无权限');
    }

    try {
      // 获取用户当前头像
      const currentUser = await this.usersService.getUserById(user.role, id);
      const oldAvatarUrl = currentUser?.avatar;

      const avatarUrl = await this.uploadService.handleUpload(file, {
        type: 'avatar',
        compress: true,
        width: 200,
        height: 200,
        quality: 80,
        oldUrl: oldAvatarUrl, // 传入旧头像URL
      });

      // 更新用户头像
      await this.usersService.changeAvatar(id, user.role, avatarUrl);

      return {
        status: 'success',
        data: { avatarUrl },
      };
    } catch (error) {
      throw new Error('头像处理失败：' + error.message);
    }
  }
}
