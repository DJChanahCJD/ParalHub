import {
  Controller,
  Query,
  Get,
  Post,
  Param,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../../provider/users/users.service';
import { DeveloperUserProvider } from '../../provider/users/developer.provider';
import {
  DeveloperListParams,
  LoginUserDto,
  RegisterDeveloperUserDto,
  ResetPasswordDto,
} from '../../types/user';
import { DeveloperUser, UserRole } from '../../schema/users.schema';
import { Public } from '../../decorators/public.decorator';
import { JwtAuthGuard } from '../../guards/auth.guard';
@Controller('/developer')
@UseGuards(JwtAuthGuard)
export class DeveloperUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly developerProvider: DeveloperUserProvider,
  ) {}

  @Public()
  @Post('/auth/login/password')
  async loginByPassword(@Body() loginUserDto: LoginUserDto) {
    return await this.usersService.loginByPassword(
      UserRole.DEVELOPER,
      loginUserDto,
    );
  }

  @Public()
  @Post('/auth/login/captcha')
  async loginByCaptcha(@Body() loginUserDto: LoginUserDto) {
    return await this.usersService.loginByCaptcha(
      UserRole.DEVELOPER,
      loginUserDto,
    );
  }

  @Public()
  @Get('/auth/login/get-captcha')
  async getLoginCaptcha(@Query('email') email: string) {
    return await this.usersService.getCaptchaByEmailForLogin(
      UserRole.DEVELOPER,
      email,
    );
  }

  @Public()
  @Get('/auth/register/get-captcha')
  async getRegisterCaptcha(@Query('email') email: string) {
    try {
      console.log('Controller: getRegisterCaptcha called with email:', email);
      const result = await this.usersService.getCaptchaByEmailForRegister(
        UserRole.DEVELOPER,
        email,
      );
      console.log('Controller: getRegisterCaptcha result:', result);
      return result;
    } catch (error) {
      console.error('Controller: getRegisterCaptcha error:', error);
      throw error;
    }
  }

  @Public()
  @Post('/auth/register')
  async register(@Body() registerUserDto: RegisterDeveloperUserDto) {
    console.log('register controller', registerUserDto);
    return await this.developerProvider.register(registerUserDto);
  }

  @Post('/auth/logout')
  async logout() {
    return await this.usersService.outLogin();
  }

  @Get('/list')
  async getDeveloperList(@Query() params: DeveloperListParams) {
    return await this.usersService.getList(UserRole.DEVELOPER, params);
  }

  @Get('/profile/:id')
  @Public()
  async getDeveloperProfile(@Param('id') id: string) {
    return await this.usersService.getUserById(UserRole.DEVELOPER, id);
  }

  @Post('/create')
  async createDeveloper(
    @Body() createDeveloperUserDto: Partial<DeveloperUser>,
  ) {
    return await this.usersService.createUser(
      UserRole.DEVELOPER,
      createDeveloperUserDto,
    );
  }

  @Post('/update/:id')
  async updateDeveloper(@Param('id') id: string, @Body() userData: any) {
    console.log('updateDeveloper controller', id, userData);
    return await this.usersService.updateUser(UserRole.DEVELOPER, id, userData);
  }

  @Delete('/delete/:id')
  async deleteDeveloper(@Param('id') id: string) {
    return await this.usersService.deleteUser(UserRole.DEVELOPER, id);
  }

  @Public()
  @Get('/auth/reset-password/get-token')
  async getResetPasswordToken(@Query('email') email: string) {
    return await this.usersService.getResetPasswordToken(
      UserRole.DEVELOPER,
      email,
    );
  }

  @Public()
  @Post('/auth/reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.usersService.resetPasswordByToken(
      UserRole.DEVELOPER,
      resetPasswordDto,
    );
  }
}
