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
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { createUploadConfig } from '../config/upload.config';
import { UploadService } from '../provider/upload/upload.service';
import { JwtAuthGuard } from '../guards/auth.guard';
import { join } from 'path';
import { promises as fs } from 'fs';

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // 上传图片接口
  @Post('image')
  @UseGuards(JwtAuthGuard) // 只有上传需要认证
  @UseInterceptors(FileInterceptor('image', createUploadConfig('image')))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type: 'article' | 'avatar' | 'image' = 'article',
  ) {
    const imageUrl = await this.uploadService.handleUpload(file, {
      type: type,
      compress: true,
      quality: 80,
    });

    return {
      status: 'success',
      data: { url: imageUrl },
    };
  }

  // 获取文章图片接口
  @Get('articles/:filename')
  async getArticleImage(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
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
}
