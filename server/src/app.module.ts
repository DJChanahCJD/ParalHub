import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from 'src/module/users.module';
import { MailModule } from 'src/module/mail.module';
import { DatabaseModule } from 'src/module/database.module';
import { LogModule } from 'src/module/log.module';
import { CommonModule } from 'src/module/common.module';
import { RedisModule } from 'src/module/redis.module';
import { CacheModule } from '@nestjs/cache-manager';
import { CaseModule } from 'src/module/case.module';
import { ArticleModule } from 'src/module/article.module';
import { AuthModule } from '@/module/auth.module';
import { NoticeModule } from 'src/module/notice.module';
import { CommentModule } from 'src/module/comment.module';
import { UploadService } from 'src/provider/upload/upload.service';
import { UploadController } from 'src/controller/upload.controller';
import { MulterModule } from '@nestjs/platform-express';
import { ScheduleModule } from '@nestjs/schedule';
import { FollowController } from 'src/controller/follow/follow.controller';
import { FollowProvider } from 'src/provider/follow/follow.provider';
import { Follow, FollowSchema } from 'src/schema/follow.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationModule } from './module/notification.module';
import { DashboardModule } from './module/dashboard.module';
import { PageViewMiddleware } from 'src/middleware/page-view.middleware';
import { validateEnvConfig } from './config/env.validation';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvConfig,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    CacheModule.register({
      ttl: 5000, // 缓存时间 5 秒
      max: 1000, // 最大缓存数量
    }),
    MongooseModule.forFeature([{ name: Follow.name, schema: FollowSchema }]),
    UsersModule,
    MailModule,
    DatabaseModule,
    LogModule,
    CommonModule,
    RedisModule,
    CaseModule,
    ArticleModule,
    AuthModule,
    NoticeModule,
    CommentModule,
    ScheduleModule.forRoot(),
    MulterModule.register({
      dest: './uploads', // 基础上传目录
    }),
    NotificationModule,
    DashboardModule,
  ],
  controllers: [UploadController, FollowController],
  providers: [UploadService, FollowProvider, PageViewMiddleware],
  exports: [UploadService, FollowProvider],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PageViewMiddleware).forRoutes('*');
  }
}
