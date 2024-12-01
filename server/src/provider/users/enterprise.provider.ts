import {
  BadRequestException,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { BaseUserProvider } from './base-user.provider';
import { EnterpriseUser } from '../../schema/users.schema';
import { InjectModel } from '@nestjs/mongoose';
import { MailerService } from '@nestjs-modules/mailer';
import { AuthService } from '../../module/auth/auth.service';
import { Model } from 'mongoose';
import { RedisClientType } from 'redis';
import { Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../schema/users.schema';
import { RegisterEnterpriseUserDto } from '../../types/user';

@Injectable()
export class EnterpriseUserProvider extends BaseUserProvider<EnterpriseUser> {
  constructor(
    @InjectModel(EnterpriseUser.name) enterpriseModel: Model<EnterpriseUser>,
    mailerService: MailerService,
    @Inject(forwardRef(() => AuthService)) authService: AuthService,
    @Inject('REDIS_CLIENT') redisClient: RedisClientType,
  ) {
    super(enterpriseModel, mailerService, authService, redisClient);
  }
  protected validateUserSpecificRules(user: EnterpriseUser): boolean {
    if (!user.company) {
      throw new BadRequestException('Company name is required');
    }
    return true;
  }
  protected buildQuery(params: any): any {
    const query: any = {};

    const {
      company,
      contact,
      industry,
      verificationStatus,
      scale,
      contactPerson,
      address,
    } = params;

    if (company) query.company = { $regex: company, $options: 'i' };
    if (contact) {
      query.$or = [
        { phone: { $regex: contact, $options: 'i' } },
        { email: { $regex: contact, $options: 'i' } },
      ];
    }
    if (industry) query.industry = { $in: industry };
    if (scale) query.scale = { $regex: scale, $options: 'i' };
    if (contactPerson)
      query.contactPerson = { $regex: contactPerson, $options: 'i' };
    if (address) query.address = { $regex: address, $options: 'i' };
    if (verificationStatus) query.verificationStatus = verificationStatus;

    return query;
  }
  async updateVerificationStatus(
    id: string,
    status: 'pending' | 'verified' | 'rejected',
  ) {
    const enterprise = await this.userModel.findByIdAndUpdate(
      id,
      { verificationStatus: status },
      { new: true },
    );

    if (!enterprise) {
      throw new NotFoundException('Enterprise user not found');
    }

    // 可以在这里添加邮件通知等逻辑
    if (status === 'verified') {
      await this.mailerService.sendMail({
        to: enterprise.email,
        subject: '恭喜贵公司通过ParalHub企业认证',
        html: `
          <h2>尊敬的${enterprise.company}:</h2>
          <p>恭喜贵公司已通过ParalHub平台的企业认证审核。</p>
          <p>现在您可以:</p>
          <ul>
            <li>发布项目需求</li>
            <li>查看开发者详细信息</li>
            <li>与开发者直接沟通</li>
          </ul>
          <p>如有任何问题，请随时联系我们的客服团队。</p>
          <p>祝商祺！</p>
          <p>ParalHub团队</p>
        `,
      });
    }

    return enterprise;
  }
  async register(userData: RegisterEnterpriseUserDto) {
    try {
      // 1. 验证必填字段
      if (
        !userData.email ||
        !userData.password ||
        !userData.emailCaptcha ||
        !userData.company
      ) {
        throw new BadRequestException('缺少必要信息');
      }

      // 2. 验证邮箱和公司名是否已存在
      const [existingEmail, existingCompany] = await Promise.all([
        this.userModel.findOne({ email: userData.email }),
        this.userModel.findOne({ company: userData.company }),
      ]);

      if (existingEmail) {
        throw new BadRequestException('该邮箱已被注册');
      }
      if (existingCompany) {
        throw new BadRequestException('该公司名已被注册');
      }

      // 3. 验证验证码
      const isValid = await this.verifyCaptcha(
        userData.email,
        userData.emailCaptcha,
        'register',
      );
      if (!isValid) {
        throw new BadRequestException('验证码无效或已过期');
      }

      // 4. 验证特定规则
      this.validateUserSpecificRules(userData as unknown as EnterpriseUser);

      // 5. 密码加密
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // 6. 创建用户（直接使用 new 和 save）
      const newUser = new this.userModel({
        ...userData,
        role: UserRole.ENTERPRISE,
        password: hashedPassword,
        username: userData.company || userData.email, // 企业用户默认使用公司名作为用户名
        verificationStatus: 'pending',
      });
      await newUser.save();

      // 7. 生成 token
      const token = await this.authService.generateToken(newUser);

      // 8. 返回结果
      return {
        status: 'success',
        message: '注册成功，请等待管理员审核',
        data: {
          token,
          user: {
            id: newUser._id,
            email: newUser.email,
            company: newUser.company,
            role: newUser.role,
            verificationStatus: newUser.verificationStatus,
          },
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
