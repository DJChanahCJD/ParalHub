import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from './redis.module';
import { AuthModule } from './auth.module';

// Controllers
import { AdminUsersController } from 'src/controller/users/admin.controller';
import { DeveloperUsersController } from 'src/controller/users/developer.controller';
import { EnterpriseUsersController } from 'src/controller/users/enterprise.controller';
import { PublicUsersController } from 'src/controller/users/user.controller';

// Services & Providers
import { UsersService } from 'src/provider/users/users.service';
import { AdminUserProvider } from 'src/provider/users/admin.provider';
import { DeveloperUserProvider } from 'src/provider/users/developer.provider';
import { EnterpriseUserProvider } from 'src/provider/users/enterprise.provider';
import { UserFactoryProvider } from 'src/provider/users/user-factory.provider';
import { Skill, SkillSchema } from 'src/schema/common.schema';
import { UploadService } from 'src/provider/upload/upload.service';
import { CacheModule } from '@nestjs/cache-manager';
// Models
import {
  AdminUser,
  AdminUserSchema,
  DeveloperUser,
  DeveloperUserSchema,
  EnterpriseUser,
  EnterpriseUserSchema,
} from 'src/schema/users.schema';
import { MailModule } from './mail.module';
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
    MongooseModule.forFeature([
      { name: AdminUser.name, schema: AdminUserSchema },
      { name: DeveloperUser.name, schema: DeveloperUserSchema },
      { name: EnterpriseUser.name, schema: EnterpriseUserSchema },
      { name: Skill.name, schema: SkillSchema },
    ]),
    RedisModule,
    AuthModule,
    MailModule,
    CacheModule.register({
      ttl: 60000, // 缓存时间1分钟
      max: 1000, // 最大缓存数量
    }),
  ],
  controllers: [
    AdminUsersController,
    DeveloperUsersController,
    EnterpriseUsersController,
    PublicUsersController,
  ],
  providers: [
    UsersService,
    UserFactoryProvider,
    AdminUserProvider,
    DeveloperUserProvider,
    EnterpriseUserProvider,
    UploadService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
