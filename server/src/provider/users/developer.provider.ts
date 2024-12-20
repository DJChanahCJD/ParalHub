import { BadRequestException, Injectable, forwardRef } from '@nestjs/common';
import { BaseUserProvider } from './base-user.provider';
import { DeveloperUser } from '../../schema/users.schema';
import { Model } from 'mongoose';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectModel } from '@nestjs/mongoose';
import { AuthService } from '../../module/auth/auth.service';
import * as bcrypt from 'bcrypt';
import { RedisClientType } from 'redis';
import { Inject } from '@nestjs/common';
import { RegisterDeveloperUserDto } from '../../types/user';
import { UserRole } from '../../schema/users.schema';
import { Skill } from '../../schema/common.schema';

@Injectable()
export class DeveloperUserProvider extends BaseUserProvider<DeveloperUser> {
  constructor(
    @InjectModel(DeveloperUser.name) developerModel: Model<DeveloperUser>,
    @InjectModel(Skill.name) private skillModel: Model<Skill>,
    mailerService: MailerService,
    @Inject(forwardRef(() => AuthService)) authService: AuthService,
    @Inject('REDIS_CLIENT') redisClient: RedisClientType,
  ) {
    super(developerModel, mailerService, authService, redisClient);
  }
  protected buildQuery(params: any): any {
    const query: any = {};
    const { username, email, phone, skills, bio, realName } = params;
    if (username) query.username = { $regex: username, $options: 'i' };
    if (email) query.email = { $regex: email, $options: 'i' };
    if (phone) query.phone = { $regex: phone, $options: 'i' };
    if (skills) query.skills = { $in: skills };
    if (bio) query.bio = { $regex: bio, $options: 'i' };
    if (realName) query.realName = { $regex: realName, $options: 'i' };
    return query;
  }

  async register(userData: RegisterDeveloperUserDto) {
    console.log('=== 开始注册流程 ===');
    try {
      // 1. 验证必填字段
      console.log('1. 验证必填字段');
      if (!userData.email || (!userData.password && !userData.emailCaptcha)) {
        throw new BadRequestException('缺少必要信息');
      }

      // 2. 验证邮箱是否已存在
      console.log('2. 验证邮箱是否已存在');
      const existingUser = await this.userModel.findOne({
        email: userData.email,
      });
      if (existingUser) {
        throw new BadRequestException('该邮箱已被注册');
      }

      // 3. 验证验证码
      console.log('3. 开始验证验证码');
      const isValid = await this.verifyCaptcha(
        userData.email,
        userData.emailCaptcha,
        'register',
      );
      console.log('验证码验证结果:', isValid);

      if (!isValid) {
        throw new BadRequestException('验证码无效或已过期');
      }

      // 4. 验证特定规则
      console.log('4. 验证特定规则');
      await this.validateUserSpecificRules(userData);

      // 5. 密码加密
      console.log('5. 密码加密');
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const phone =
        userData.phone && userData.phone.trim() !== '' ? userData.phone : null;

      // 6. 创建用户
      console.log('6. 创建用户');
      const newUser = new this.userModel({
        ...userData,
        role: UserRole.DEVELOPER,
        password: hashedPassword,
        username: userData.username || userData.email,
        phone,
      });
      await newUser.save();

      // 7. 生成 token
      console.log('7. 生成 token');
      const token = await this.authService.generateToken(newUser);

      console.log('=== 注册流程完成 ===');
      return {
        status: 'success',
        message: '注册成功',
        data: {
          token,
          user: {
            id: newUser._id,
            email: newUser.email,
            username: newUser.username,
            role: newUser.role,
            skills: newUser.skills,
          },
        },
      };
    } catch (error) {
      console.error('注册过程发生错误:', error);
      throw new BadRequestException(error.message);
    }
  }

  protected async validateUserSpecificRules(
    userData: RegisterDeveloperUserDto,
  ): Promise<boolean> {
    // 验证技能是否存在
    if (!userData.skills || userData.skills.length === 0) {
      throw new BadRequestException('请至少选择一个技能');
    }

    // 验证技能名称是否有效
    const skillCount = await this.skillModel.countDocuments({
      name: { $in: userData.skills },
    });

    if (skillCount !== userData.skills.length) {
      throw new BadRequestException('选择的技能中包含不存在的技能名称');
    }

    return true;
  }
}
