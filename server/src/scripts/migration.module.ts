import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  AdminUser,
  DeveloperUser,
  EnterpriseUser,
  AdminUserSchema,
  DeveloperUserSchema,
  EnterpriseUserSchema,
} from 'src/schema/users.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: AdminUser.name, schema: AdminUserSchema },
      { name: DeveloperUser.name, schema: DeveloperUserSchema },
      { name: EnterpriseUser.name, schema: EnterpriseUserSchema },
    ]),
  ],
})
export class MigrationModule {}
