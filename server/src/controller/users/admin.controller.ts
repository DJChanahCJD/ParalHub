// src/users/users.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from 'src/provider/users/users.service';
import { AdminUserProvider } from 'src/provider/users/admin.provider';
import { AdminUser, UserRole } from 'src/schema/users.schema';
import { AdminListParams, LoginUserDto } from 'src/types/user';
import { Public } from '@/decorators/public.decorator';
import { JwtAuthGuard } from '@/guards/auth.guard';

/**
 * 后台管理员用户控制器
 */
@Controller('/admin')
@UseGuards(JwtAuthGuard)
export class AdminUsersController {
  private readonly ROLE = UserRole.ADMIN;
  constructor(
    private readonly usersService: UsersService,
    private readonly adminProvider: AdminUserProvider,
  ) {}

  /**
   * 登录相关路由集中管理
   */
  @Public()
  @Post('/auth/login/password')
  async loginByPassword(@Body() loginUserDto: LoginUserDto) {
    return await this.usersService.loginByPassword(this.ROLE, loginUserDto);
  }

  @Public()
  @Post('/auth/login/captcha')
  async loginByCaptcha(@Body() loginUserDto: LoginUserDto) {
    return await this.usersService.loginByCaptcha(this.ROLE, loginUserDto);
  }

  @Public()
  @Get('/auth/login/get-captcha')
  async getLoginCaptcha(@Query('email') email: string) {
    return await this.usersService.getCaptchaByEmailForLogin(this.ROLE, email);
  }

  @Public()
  @Post('/auth/logout')
  async logout() {
    return await this.usersService.outLogin();
  }

  @Get('/profile/:id')
  async getAdminProfile(@Param('id') id: string) {
    return await this.usersService.getUserById(this.ROLE, id);
  }

  @Post('/create')
  async createAdmin(@Body() createAdminUserDto: Partial<AdminUser>) {
    return await this.usersService.createUser(this.ROLE, createAdminUserDto);
  }

  /**
   * 管理员列表相关路由
   */
  @Get('/list')
  async getAdminList(@Query() params: AdminListParams) {
    return this.usersService.getList(this.ROLE, params);
  }

  @Get('/detail/:id')
  async getAdminDetail(@Param('id') id: string) {
    return await this.usersService.getUserById(this.ROLE, id);
  }

  @Post('/update/:id')
  async updateAdmin(
    @Param('id') id: string,
    @Body()
    params: {
      updateUserDto: Partial<AdminUser>;
    },
  ) {
    return await this.usersService.updateUser(
      this.ROLE,
      id,
      params.updateUserDto,
    );
  }

  @Delete('/delete/:id')
  async deleteAdmin(@Param('id') id: string) {
    return await this.usersService.deleteUser(this.ROLE, id);
  }

  /**
   * 权限相关路由
   */
  @Post('/access/toggle')
  async toggleAdminAccess(@Body() params: { id: string }) {
    return await this.adminProvider.toggleAdminAccess(params.id);
  }

  @Post('/password/reset')
  async resetPassword(@Body() params: { userId: string; password: string }) {
    return await this.usersService.resetPassword(
      this.ROLE,
      params.userId,
      params.password,
    );
  }
}
