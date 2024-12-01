import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { MailerService } from '@nestjs-modules/mailer';
import { BaseUser } from '../../schema/users.schema';
import * as bcrypt from 'bcrypt';
import {
  LoginResponseDto,
  LoginUserDto,
  ResetPasswordDto,
} from '../../types/user';
import { emailTemplate } from '../../utils/emaili';
import { Inject } from '@nestjs/common';
import { AuthService } from '../../module/auth/auth.service';
import { RedisClientType } from 'redis';

@Injectable()
export abstract class BaseUserProvider<T extends BaseUser> {
  constructor(
    protected userModel: Model<T>,
    @Inject('MAILER_SERVICE') protected readonly mailerService: MailerService,
    protected readonly authService: AuthService,
    @Inject('REDIS_CLIENT') private redisClient: RedisClientType,
  ) {}

  private readonly emailCaptchaType = {
    login: 'login',
    register: 'register',
    resetPassword: 'resetPassword',
  };
  // 基础CRUD操作
  async create(createDto: Partial<T>): Promise<T> {
    try {
      if (!createDto.email || !createDto.password) {
        throw new BadRequestException('Email and password are required');
      }

      const exists = await this.userModel.findOne({ email: createDto.email });
      if (exists) {
        throw new BadRequestException('User already exists');
      }

      if (!createDto.username) {
        createDto.username = createDto.email;
      }

      createDto.password = await bcrypt.hash(createDto.password, 10);
      const user = new this.userModel(createDto);
      return await user.save();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findOne(id: string): Promise<T> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getList(params: any) {
    const {
      current = 1,
      pageSize = 10,
      sortField = 'createdAt',
      sortOrder = 'descend',
      ...queryParams
    } = params;

    const query = this.buildQuery(queryParams);
    const sort = { [sortField]: sortOrder === 'ascend' ? 1 : -1 } as any;

    const total = await this.userModel.countDocuments(query);
    const list = await this.userModel
      .find(query)
      .sort(sort)
      .skip((current - 1) * pageSize)
      .limit(pageSize);

    return { data: list, total, success: true };
  }

  async findByEmail(email: string): Promise<T> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findById(id: string): Promise<T> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, updateDto: Partial<T>): Promise<T> {
    try {
      console.log('updateDto', updateDto);
      // 使用 $set 操作符明确指定要更新的字段
      const user = await this.userModel.findByIdAndUpdate(id, updateDto, {
        new: true,
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      console.log('update user provider', user);
      return user;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async delete(id: string): Promise<any> {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // 删除用户后不需要返回用户信息
    return {
      status: 'success',
      message: `删除用户 「${user.username}」成功`,
    };
  }

  async loginByPassword(loginDto: LoginUserDto): Promise<LoginResponseDto> {
    try {
      console.log('通过密码登录: ', loginDto);
      const user = await this.userModel
        .findOne({ email: loginDto.email })
        .select('+password');
      console.log('user: ', user);
      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        throw new BadRequestException('密码错误');
      }

      const token = await this.authService.generateToken(user);

      // 更新最后登录时间
      await this.updateLastLogin(user._id.toString());

      return new LoginResponseDto(user, token, 'success', '登录成功');
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // 统一的发送验证码方法
  async sendEmailCaptcha(
    email: string,
    type: keyof typeof this.emailCaptchaType,
  ) {
    try {
      const captcha = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('发送验证码: ', captcha);

      // 2. Redis 存储
      const cacheKey = `${type}_captcha:${email}`;
      const cacheData = JSON.stringify({
        code: captcha,
        type,
      });
      console.log('当前Redis客户端:', this.redisClient);
      console.log('准备存储到Redis, key:', cacheKey, 'data:', cacheData);
      try {
        await this.redisClient.set(cacheKey, cacheData, {
          EX: 300, // 设置过期时间300秒
        });
        console.log('Redis存储成功');
      } catch (cacheError) {
        console.error('Redis存储失败:', cacheError);
        throw new Error('验证码存储失败');
      }

      // 4. 发送验证码邮件
      console.log('准备发送邮件到:', email);
      const typeText = this.emailCaptchaType[type];
      try {
        console.log('邮件配置:', {
          to: email,
          subject: `ParalHub ${typeText}验证码`,
          template: 'captcha',
        });

        await this.mailerService
          .sendMail({
            to: email,
            subject: `ParalHub ${typeText}验证码`,
            html: emailTemplate.captcha(captcha, 5),
          })
          .catch((error) => {
            console.error('邮件发送详细错误:', error);
            throw error;
          });
        console.log('邮件发送成功');
      } catch (mailError) {
        console.error('邮件发送错误:', mailError);
        throw new Error(`邮件发送失败: ${mailError.message}`);
      }

      return {
        status: 'success',
        message: '验证码已发送到您的邮箱',
      };
    } catch (error) {
      console.error('发送验证码失败:', error);
      throw new BadRequestException(
        error.message || '发送验证码失败，请稍后重试',
      );
    }
  }

  // 统一的验证码验证方法
  protected async verifyCaptcha(
    email: string,
    captcha: string,
    type: keyof typeof this.emailCaptchaType,
  ): Promise<boolean> {
    const cacheKey = `${type}_captcha:${email}`;
    const storedData = await this.redisClient.get(cacheKey);

    if (!storedData) {
      return false;
    }

    const captchaData = JSON.parse(storedData as string);
    const isValid = captchaData.code === captcha && captchaData.type === type;

    if (isValid) {
      // 验证成功后立即删除验证码
      await this.redisClient.del(cacheKey);
    }

    return isValid;
  }

  // 修改登录方法
  async loginByCaptcha(loginDto: LoginUserDto): Promise<LoginResponseDto> {
    try {
      const user = await this.findByEmail(loginDto.email);

      const isValid = await this.verifyCaptcha(
        loginDto.email,
        loginDto.captcha,
        'login',
      );

      if (!isValid) {
        throw new BadRequestException('验证码无效或已过期');
      }

      // 更新最后登录时间
      await this.updateLastLogin(user._id.toString());

      // 使用 AuthService 生成 token
      const token = await this.authService.generateToken(user);

      return new LoginResponseDto(user, token, 'success', '登录成功');
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // 原来的方法改为调用统一方法
  async getCaptchaByEmailForLogin(email: string) {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new BadRequestException('用户不存在');
    }
    return this.sendEmailCaptcha(email, 'login');
  }

  async getCaptchaByEmailForRegister(email: string) {
    const user = await this.userModel.findOne({ email });
    if (user) {
      throw new BadRequestException('用户已存在');
    }
    return this.sendEmailCaptcha(email, 'register');
  }

  async getResetPasswordToken(email: string) {
    try {
      const user = await this.findByEmail(email);
      if (!user) {
        throw new BadRequestException('用户不存在');
      }

      // 发送重置密码验证码
      return this.sendEmailCaptcha(email, 'resetPassword');
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async resetPasswordByToken(resetPasswordDto: ResetPasswordDto) {
    try {
      const { email, token, newPassword } = resetPasswordDto;

      // 验证验证码
      const isValid = await this.verifyCaptcha(email, token, 'resetPassword');

      if (!isValid) {
        throw new BadRequestException('验证码无效或已过期');
      }

      // 查找用户
      const user = await this.findByEmail(email);
      if (!user) {
        throw new BadRequestException('用户不存在');
      }

      // 更新密码
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.userModel.findByIdAndUpdate(user._id, {
        password: hashedPassword,
      });

      return {
        status: 'success',
        message: '密码重置成功',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getCurrentUser(userId: string): Promise<any> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    try {
      const user = await this.userModel.findById(userId).exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        data: user,
        status: 'success',
        message: '获取用户信息成功',
      };
    } catch (error) {
      throw new UnauthorizedException(
        'Invalid user ID or user not found: ' + error.message,
      );
    }
  }

  async updateLastLogin(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      lastLoginAt: new Date(),
    });
  }

  async resetPassword(id: string, password: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.password = await bcrypt.hash(password, 10);
    return await user.save();
  }

  // 子类必须实现的方法
  protected abstract buildQuery(params: any): any;
}
