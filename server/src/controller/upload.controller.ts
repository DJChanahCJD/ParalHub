import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Param,
  Res,
  NotFoundException,
  Query,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { createUploadConfig } from '../config/upload.config';
import { UploadService } from '../provider/upload/upload.service';
import { JwtAuthGuard } from '../guards/auth.guard';
import { join } from 'path';
import { promises as fs } from 'fs';
import { ConfigService } from '@nestjs/config';

@Controller('uploads')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);
  private readonly isProduction: boolean;

  constructor(
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
  ) {
    this.isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
  }

  // 上传图片接口
  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', createUploadConfig('image')))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type: 'article' | 'avatar' | 'image' = 'article',
  ) {
    try {
      const imageUrl = await this.uploadService.handleUpload(file, {
        type: type,
        compress: true,
        quality: 80,
      });

      return {
        status: 'success',
        data: { url: imageUrl },
      };
    } catch (error) {
      this.logger.error(`上传失败: ${error.message}`);
      throw error;
    }
  }

  // 获取图片接口 - 仅在开发环境中使用
  @Get('articles/:filename')
  async getArticleImage(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    // 生产环境直接返回404，因为文件应该从Cloudinary获取
    if (this.isProduction) {
      throw new NotFoundException(
        '在生产环境中，请直接使用完整的CDN URL访问图片',
      );
    }

    const imagePath = join(__dirname, '../../uploads/articles', filename);
    try {
      await fs.access(imagePath);
      // 记录访问
      await this.uploadService.logImageAccess(`articles/${filename}`);
      // 发送文件
      res.sendFile(imagePath);
    } catch (error) {
      throw new NotFoundException('图片未找到\n' + error);
    }
  }

  // 获取头像接口 - 仅在开发环境中使用
  @Get('avatars/:filename')
  async getAvatarImage(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    if (this.isProduction) {
      throw new NotFoundException(
        '在生产环境中，请直接使用完整的CDN URL访问图片',
      );
    }

    const imagePath = join(__dirname, '../../uploads/avatars', filename);
    try {
      await fs.access(imagePath);
      res.sendFile(imagePath);
    } catch (error) {
      throw new NotFoundException('头像未找到\n' + error);
    }
  }
}
