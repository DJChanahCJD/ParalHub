import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AdminUser } from 'src/schema/users.schema';
import { BaseUserProvider } from './base-user.provider';
import { MailerService } from '@nestjs-modules/mailer';
import { RedisClientType } from 'redis';
import { Inject } from '@nestjs/common';
import { AuthService } from '@/module/auth/auth.service';
import { LoginResponseDto, LoginUserDto } from '@/types/user';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AdminUserProvider extends BaseUserProvider<AdminUser> {
  constructor(
    @InjectModel(AdminUser.name) adminModel: Model<AdminUser>,
    mailerService: MailerService,
    authService: AuthService,
    @Inject('REDIS_CLIENT') redisClient: RedisClientType,
  ) {
    super(adminModel, mailerService, authService, redisClient);
  }

  protected buildQuery(params: any) {
    const query: any = {};
    const { username, email, phone, access } = params;

    if (username) query.username = { $regex: username, $options: 'i' };
    if (email) query.email = { $regex: email, $options: 'i' };
    if (phone) query.phone = { $regex: phone, $options: 'i' };
    if (access) query.access = access;

    return query;
  }

  protected validateUserSpecificRules(user: AdminUser): boolean {
    return user.access === 'admin';
  }

  public async createFirstAdminAndLogin(
    loginDto: LoginUserDto,
  ): Promise<LoginResponseDto> {
    // 创建一个新对象而不是直接修改 loginDto
    const user: Partial<AdminUser> = {
      email: loginDto.email,
      password: await bcrypt.hash(loginDto.password, 10),
      access: 'super_admin',
      username: loginDto.email,
    };

    // 创建用户并等待结果
    const newAdmin = await this.create(user);

    // 直接生成 token 并返回，不再调用 loginByPassword
    const token = await this.authService.generateToken(newAdmin);

    return new LoginResponseDto(
      newAdmin,
      token,
      'success',
      '欢迎！您已成为系统的首位管理员',
    );
  }
  // 管理员特有的方法
  async assignAccess(userId: string, access: string): Promise<AdminUser> {
    const user = await this.findOne(userId);
    user.access = access;
    return await user.save();
  }

  async toggleAdminAccess(id: string) {
    const user = await this.findOne(id);
    const newAccess = user.access === 'super_admin' ? 'admin' : 'super_admin';
    console.log(
      'toggleAdminAccess user.access from:',
      user.access,
      'to:',
      newAccess,
    );
    user.access = newAccess;
    return await user.save();
  }
}
