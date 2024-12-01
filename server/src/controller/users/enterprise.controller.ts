import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UsersService } from '../../provider/users/users.service';
import { Body, Param, Post, Put, Delete } from '@nestjs/common';
import { EnterpriseUserProvider } from '../../provider/users/enterprise.provider';
import { EnterpriseUser, UserRole } from '../../schema/users.schema';
import { EnterpriseListParams, ResetPasswordDto } from '../../types/user';
import { Public } from '../../decorators/public.decorator';
import { LoginUserDto, RegisterEnterpriseUserDto } from '../../types/user';
import { JwtAuthGuard } from '../../guards/auth.guard';

@Controller('/enterprise')
@UseGuards(JwtAuthGuard)
export class EnterpriseUsersController {
  private readonly ROLE = UserRole.ENTERPRISE;
  constructor(
    private readonly usersService: UsersService,
    private readonly enterpriseProvider: EnterpriseUserProvider,
  ) {}
  @Get('list')
  async getEnterpriseList(@Query() params: EnterpriseListParams) {
    return await this.usersService.getList(UserRole.ENTERPRISE, params);
  }

  @Public()
  @Get('profile/:id')
  async getEnterpriseProfile(@Param('id') id: string) {
    return this.usersService.getUserById(UserRole.ENTERPRISE, id);
  }
  @Post('create')
  async create(@Body() body: EnterpriseUser) {
    return this.usersService.createUser(this.ROLE, body);
  }

  @Put('update/:id')
  async update(@Param('id') id: string, @Body() body: EnterpriseUser) {
    return this.usersService.updateUser(this.ROLE, id, body);
  }

  @Delete('delete/:id')
  async delete(@Param('id') id: string) {
    return this.usersService.deleteUser(this.ROLE, id);
  }

  @Put('verify/:id')
  async verify(@Param('id') id: string) {
    return this.enterpriseProvider.updateVerificationStatus(id, 'verified');
  }

  @Put('reject/:id')
  async reject(@Param('id') id: string) {
    return this.enterpriseProvider.updateVerificationStatus(id, 'rejected');
  }

  @Public()
  @Post('/auth/register')
  async register(@Body() registerUserDto: RegisterEnterpriseUserDto) {
    return await this.enterpriseProvider.register(registerUserDto);
  }

  @Public()
  @Post('/auth/login/password')
  async loginByPassword(@Body() loginUserDto: LoginUserDto) {
    return await this.usersService.loginByPassword(
      UserRole.ENTERPRISE,
      loginUserDto,
    );
  }

  @Post('/auth/logout')
  async logout() {
    return await this.usersService.outLogin();
  }

  @Public()
  @Get('/auth/reset-password/get-token')
  async getResetPasswordToken(@Query('email') email: string) {
    return await this.usersService.getResetPasswordToken(
      UserRole.ENTERPRISE,
      email,
    );
  }

  @Public()
  @Post('/auth/reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.usersService.resetPasswordByToken(
      UserRole.ENTERPRISE,
      resetPasswordDto,
    );
  }

  @Public()
  @Post('/auth/login/captcha')
  async loginByCaptcha(@Body() loginUserDto: LoginUserDto) {
    return await this.usersService.loginByCaptcha(
      UserRole.ENTERPRISE,
      loginUserDto,
    );
  }

  @Public()
  @Get('/auth/register/get-captcha')
  async getRegisterCaptcha(@Query('email') email: string) {
    return await this.usersService.getCaptchaByEmailForRegister(
      UserRole.ENTERPRISE,
      email,
    );
  }

  @Public()
  @Get('/auth/login/get-captcha')
  async getLoginCaptcha(@Query('email') email: string) {
    return await this.usersService.getCaptchaByEmailForLogin(
      UserRole.ENTERPRISE,
      email,
    );
  }
}
