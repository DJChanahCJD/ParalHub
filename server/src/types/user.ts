import { IsEmail, IsString, MinLength } from 'class-validator';
import { BaseUser } from 'src/schema/users.schema';

// ================ 基础 DTO ================
export class BaseResponseDto {
  status?: string;
  message?: string;
}

export class LoginResponseDto extends BaseResponseDto {
  data: BaseUser;
  token: string;

  constructor(
    data: BaseUser,
    token: string,
    status?: string,
    message?: string,
  ) {
    super();
    this.data = data;
    this.token = token;
    this.status = status || 'success';
    this.message = message;
  }
}

// 基础用户创建DTO
export class BaseCreateUserDto {
  @IsString()
  username?: string;

  @IsEmail()
  email: string;

  @IsString()
  phone?: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  bio?: string;
}

// 基础列表参数
export class BaseListParams {
  current?: number;
  pageSize?: number;
  username?: string;
  email?: string;
  phone?: string;
  sortField?: string;
  sortOrder?: string;
}

// ================ 认证相关 DTO ================
export class LoginUserDto {
  @IsEmail()
  email: string;

  @IsString()
  captcha?: string;

  @IsString()
  password?: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class ConfirmResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class UpdatePasswordDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class RegisterUserDto extends BaseCreateUserDto {
  @IsString()
  emailCaptcha: string;
}

export class GetCaptchaDto {
  @IsEmail()
  email: string;
}

// ================ 管理员相关 DTO ================
export class CreateAdminUserDto extends BaseCreateUserDto {
  @IsString()
  access?: string;
}

export class AdminListParams extends BaseListParams {
  access?: string;
}

// ================ 开发者相关 DTO ================
export class CreateDeveloperUserDto extends BaseCreateUserDto {
  @IsString()
  realName?: string;

  @IsString({ each: true })
  skills?: string[];
}

export class RegisterDeveloperUserDto extends CreateDeveloperUserDto {
  @IsString()
  emailCaptcha: string;
}

export class DeveloperListParams extends BaseListParams {
  realName?: string;
  skills?: string[];
}

// ================ 企业相关 DTO ================
export class CreateEnterpriseUserDto extends BaseCreateUserDto {
  @IsString()
  company: string;

  @IsString()
  industry?: string;

  @IsString()
  scale?: string;

  @IsString()
  contactPerson?: string;

  @IsString()
  address?: string;
}

export class RegisterEnterpriseUserDto extends CreateEnterpriseUserDto {
  @IsString()
  emailCaptcha: string;
}

export class EnterpriseListParams extends BaseListParams {
  company?: string;
  industry?: string;
  scale?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  contactPerson?: string;
  address?: string;
}
