/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import mongoose from 'mongoose';
import * as fs from 'fs';
// 导入 dotenv 包来加载环境变量
import * as dotenv from 'dotenv';
// 加载 .env 文件中的环境变量配置到 process.env 中
dotenv.config();

mongoose.set('debug', true);

async function bootstrap() {
  // 创建 NestJS 应用实例，指定为 Express 类型
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'debug', 'log', 'verbose'],
  });

  // 配置静态文件服务
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/', // 访问路径前缀
  });

  // 确保上传目录存在
  const uploadDirs = ['avatars', 'articles'];
  for (const dir of uploadDirs) {
    const uploadDir = join(__dirname, '..', 'uploads', dir);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  }

  // 根据环境配置 CORS
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.BASE_URL + ':' + process.env.WEBSITE_PORT, process.env.BASE_URL + ':' + process.env.ADMIN_PORT]
    : ['http://localhost:8000', 'http://localhost:8001'];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
