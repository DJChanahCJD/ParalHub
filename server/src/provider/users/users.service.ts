import { Injectable, BadRequestException } from '@nestjs/common';
import { UserFactoryProvider } from './user-factory.provider';
import {
  LoginUserDto,
  LoginResponseDto,
  ResetPasswordDto,
} from 'src/types/user';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AdminUser,
  DeveloperUser,
  EnterpriseUser,
  UserRole,
} from 'src/schema/users.schema';
import { AdminUserProvider } from './admin.provider';
@Injectable()
export class UsersService {
  constructor(
    private readonly userFactory: UserFactoryProvider,
    @InjectModel(AdminUser.name) private adminModel: Model<AdminUser>,
    @InjectModel(DeveloperUser.name)
    private developerModel: Model<DeveloperUser>,
    @InjectModel(EnterpriseUser.name)
    private enterpriseModel: Model<EnterpriseUser>,
  ) {}

  async loginByPassword(
    role: string,
    loginDto: LoginUserDto,
  ): Promise<LoginResponseDto> {
    const provider = this.userFactory.getProvider(role);
    // 检查是否是首次管理员登录
    if (
      role === UserRole.ADMIN &&
      (await this.adminModel.countDocuments()) === 0
    ) {
      return await (provider as AdminUserProvider).createFirstAdminAndLogin(
        loginDto,
      );
    }
    return await provider.loginByPassword(loginDto);
  }

  async getCaptchaByEmailForLogin(
    role: string,
    email: string,
  ): Promise<{ status: string; message: string }> {
    const provider = this.userFactory.getProvider(role);
    return await provider.getCaptchaByEmailForLogin(email);
  }

  async getCaptchaByEmailForRegister(
    role: string,
    email: string,
  ): Promise<{ status: string; message: string }> {
    const provider = this.userFactory.getProvider(role);
    return await provider.getCaptchaByEmailForRegister(email);
  }

  async getResetPasswordToken(
    role: string,
    email: string,
  ): Promise<{ status: string; message: string }> {
    const provider = this.userFactory.getProvider(role);
    return await provider.getResetPasswordToken(email);
  }

  async loginByCaptcha(
    role: string,
    loginDto: LoginUserDto,
  ): Promise<LoginResponseDto> {
    const provider = this.userFactory.getProvider(role);
    return await provider.loginByCaptcha(loginDto);
  }

  async getCurrentUser(role: string, userId: string) {
    const provider = this.userFactory.getProvider(role);
    return await provider.getCurrentUser(userId);
  }

  async outLogin() {
    return {
      status: 'success',
      message: '退出登录成功',
    };
  }

  async getList(role: string, params: any) {
    const provider = this.userFactory.getProvider(role);
    return await provider.getList(params);
  }

  async getUserById(role: string, id: string) {
    const provider = this.userFactory.getProvider(role);
    return await provider.findById(id);
  }

  async createUser(role: string, userData: any) {
    const provider = this.userFactory.getProvider(role);
    return await provider.create(userData);
  }

  async deleteUser(role: string, id: string) {
    const provider = this.userFactory.getProvider(role);
    return await provider.delete(id);
  }

  async updateUser(role: string, id: string, userData: any) {
    const provider = this.userFactory.getProvider(role);
    return await provider.update(id, userData);
  }

  async isUsernameUnique(
    username: string,
    excludeUserId?: string,
  ): Promise<boolean> {
    const models = [this.adminModel, this.developerModel, this.enterpriseModel];

    for (const model of models) {
      const query = excludeUserId
        ? { username, _id: { $ne: excludeUserId } }
        : { username };

      const count = await model.countDocuments(query);
      if (count > 0) return false;
    }

    return true;
  }

  async validateUsername(username: string, excludeUserId?: string) {
    const isUnique = await this.isUsernameUnique(username, excludeUserId);
    if (!isUnique) {
      throw new BadRequestException('用户名已被使用');
    }
  }

  /**
   * 切换用户的案例收藏状态
   */
  async toggleCaseStar(
    userId: string,
    role: string,
    caseId: string,
  ): Promise<boolean> {
    // 根据角色获取对应的用户模型
    const userModel = this.getUserModelByRole(role);

    // 查找用户当前是否已收藏
    const user = await userModel.findById(userId);
    const hasStarred = user.starIds.includes(caseId);

    // 更新用户的收藏列表
    await userModel.findByIdAndUpdate(userId, {
      [hasStarred ? '$pull' : '$addToSet']: { starIds: caseId },
    });

    // 返回新的收藏状态
    return !hasStarred;
  }

  async toggleArticleLike(
    userId: string,
    role: string,
    articleId: string,
  ): Promise<boolean> {
    const userModel = this.getUserModelByRole(role);
    const user = await userModel.findById(userId);
    const hasLiked = user.likedArticleIds.includes(articleId);

    await userModel.findByIdAndUpdate(userId, {
      [hasLiked ? '$pull' : '$addToSet']: { likedArticleIds: articleId },
    });

    return !hasLiked;
  }

  /**
   * 根据角色获取对应的用户模型
   */
  private getUserModelByRole(role: string): Model<any> {
    switch (role.toLowerCase()) {
      case 'admin':
        return this.adminModel;
      case 'developer':
        return this.developerModel;
      case 'enterprise':
        return this.enterpriseModel;
      default:
        throw new BadRequestException('Invalid user role');
    }
  }

  async getStarIds(userId: string, role: string) {
    const user = await this.getUserModelByRole(role).findById(userId);
    return user.starIds;
  }

  async getCurrentUserById(role: string, userId: string) {
    try {
      const provider = this.userFactory.getProvider(role);
      const user = await provider.findById(userId);

      return {
        status: 'success',
        data: user,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async changeAvatar(id: string, role: string, avatar: string) {
    const user = await this.getUserModelByRole(role).findByIdAndUpdate(id, {
      avatar,
    });
    return user;
  }

  async resetPassword(role: string, userId: string, password: string) {
    const provider = this.userFactory.getProvider(role);
    return await provider.resetPassword(userId, password);
  }

  async resetPasswordByToken(role: string, resetPasswordDto: ResetPasswordDto) {
    const provider = this.userFactory.getProvider(role);
    return await provider.resetPasswordByToken(resetPasswordDto);
  }
}
