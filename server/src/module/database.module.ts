import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import {
  AdminUser,
  AdminUserSchema,
  DeveloperUser,
  DeveloperUserSchema,
  EnterpriseUser,
  EnterpriseUserSchema,
} from '../schema/users.schema';

@Global()
@Module({
  // 数据库连接
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        // 添加推荐的连接选项
        serverApi: {
          version: '1', // 使用最新的稳定 API 版本
          strict: true,
          deprecationErrors: true,
        },
      }),
      inject: [ConfigService],
    }),
    // 注册模型
    MongooseModule.forFeature([
      { name: AdminUser.name, schema: AdminUserSchema },
      { name: DeveloperUser.name, schema: DeveloperUserSchema },
      { name: EnterpriseUser.name, schema: EnterpriseUserSchema },
    ]),
  ],
  exports: [MongooseModule], // 导出 MongooseModule 供其他模块使用
})
export class DatabaseModule {}
