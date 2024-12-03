import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import * as sharp from 'sharp';
import { existsSync, promises as fs } from 'fs';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { v2 as cloudinary } from 'cloudinary';

interface UploadOptions {
  type: 'avatar' | 'article' | 'image';
  compress?: boolean;
  width?: number;
  height?: number;
  quality?: number;
  oldUrl?: string;
}

interface AccessLog {
  [filepath: string]: {
    lastAccess: number;
    accessCount: number; // 添加访问次数统计
  };
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadBasePath: string;
  private readonly apiUrl: string;
  private readonly isProduction: boolean;
  private readonly accessLogPath: string;
  constructor(private configService: ConfigService) {
    this.uploadBasePath = join(__dirname, '../../../uploads');
    this.apiUrl =
      this.configService.get<string>('API_URL') || 'http://localhost:3000';
    this.accessLogPath = join(this.uploadBasePath, 'access_log.json');
    this.isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    // 只在生产环境初始化 Cloudinary
    if (this.isProduction) {
      cloudinary.config({
        cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
        api_key: this.configService.get('CLOUDINARY_API_KEY'),
        api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
      });
    } else {
      // 开发环境确保上传目录存在
      this.ensureUploadDirs();
    }
  }

  private async ensureUploadDirs() {
    const dirs = ['articles', 'avatars', 'images'];

    // 首先确保基础上传目录存在
    const basePath = join(__dirname, '../../../uploads');
    console.log(`检查基础目录是否存在: ${basePath}`);

    if (!existsSync(basePath)) {
      console.log(`创建基础目录: ${basePath}`);
      await fs.mkdir(basePath, { recursive: true });
    }

    for (const dir of dirs) {
      const path = join(basePath, dir);
      console.log(`准备创建目录: ${path}`);
      if (!existsSync(path)) {
        console.log(`目录不存在，创建: ${path}`);
        await fs.mkdir(path, { recursive: true });
      } else {
        console.log(`目录已存在: ${path}`);
      }
    }
  }

  async handleUpload(
    file: Express.Multer.File,
    options: UploadOptions,
  ): Promise<string> {
    try {
      if (this.isProduction) {
        return this.handleCloudinaryUpload(file, options);
      } else {
        return this.handleLocalUpload(file, options);
      }
    } catch (error) {
      this.logger.error(`上传失败: ${error.message}`);
      throw error;
    }
  }

  private async handleCloudinaryUpload(
    file: Express.Multer.File,
    options: UploadOptions,
  ): Promise<string> {
    // 添加 Cloudinary 上传结果的类型定义
    interface CloudinaryUploadResult {
      secure_url: string;
      public_id: string;
    }

    const result = await new Promise<CloudinaryUploadResult>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: options.type === 'avatar' ? 'avatars' : 'articles',
            public_id: `${options.type}_${Date.now()}`,
            resource_type: 'auto',
            fetch_format: 'auto',
            quality: 'auto',
            transformation: [
              {
                width: options.width,
                height: options.height,
                crop: 'fill',
                gravity: 'auto',
              },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as CloudinaryUploadResult);
          },
        );

        uploadStream.end(file.buffer);
      },
    );

    return result.secure_url;
  }

  private async handleLocalUpload(
    file: Express.Multer.File,
    options: UploadOptions,
  ): Promise<string> {
    const {
      type,
      compress = true,
      quality = 80,
      width,
      height,
      oldUrl,
    } = options;

    if (oldUrl) {
      await this.deleteOldFile(oldUrl);
    }

    if (compress) {
      const outputPath = file.path;
      console.log(`处理压缩图片type: ${type}, ${outputPath}`);
      try {
        const image = sharp(file.path);

        // 根据图片类型使用不同的处理策略
        if (type === 'avatar') {
          // 头像固定尺寸，使用裁切
          await image
            .resize(256, 256, {
              fit: 'cover',
              position: 'center',
            })
            .jpeg({ quality, progressive: true })
            .toFile(outputPath + '_compressed');
        } else {
          // 文章图片保持原比例
          const resizeOptions: sharp.ResizeOptions = {
            fit: 'inside', // 保持原比例
            withoutEnlargement: true, // 不放大小图
          };

          // 如果指定了最大宽度或高度，则添加限制
          if (width) resizeOptions.width = width;
          if (height) resizeOptions.height = height;

          await image
            .resize(resizeOptions)
            .jpeg({ quality, progressive: true })
            .toFile(outputPath + '_compressed');
        }

        await fs.rename(outputPath + '_compressed', outputPath);
      } catch (error) {
        throw new Error('图片处理失败\n' + error);
      }
    }
    // 待优化（根据type返回不同路径）
    return `${this.apiUrl}/uploads/${type === 'avatar' ? 'avatars' : 'images'}/${file.filename}`;
  }

  // 从 Cloudinary URL 获取 public_id
  private getPublicIdFromUrl(url: string): string | null {
    try {
      const matches = url.match(/\/v\d+\/(.+?)\./);
      return matches ? matches[1] : null;
    } catch {
      return null;
    }
  }

  // 安全删除文件
  private async safeDeleteFile(filePath: string): Promise<void> {
    try {
      if (filePath) {
        await fs.unlink(filePath);
      }
    } catch (error) {
      this.logger.warn(`删除文件失败: ${filePath}`, error);
    }
  }

  // 删除旧文件
  private async deleteOldFile(oldUrl: string): Promise<void> {
    try {
      const filePath = this.getLocalPathFromUrl(oldUrl);
      await this.safeDeleteFile(filePath);
    } catch (error) {
      this.logger.warn(`删除旧文件失败: ${oldUrl}`, error);
    }
  }

  // 从URL获取本地文件路径
  private getLocalPathFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const relativePath = urlObj.pathname.replace('/uploads/', '');
      return join(this.uploadBasePath, relativePath);
    } catch {
      return ''; // 返回空字符串表示无效URL
    }
  }

  // 记录图片访问
  async logImageAccess(imagePath: string): Promise<void> {
    const accessLog = await this.getAccessLog();
    const now = Date.now();

    accessLog[imagePath] = {
      lastAccess: now,
      accessCount: (accessLog[imagePath]?.accessCount || 0) + 1,
    };

    await fs.writeFile(this.accessLogPath, JSON.stringify(accessLog, null, 2));
  }

  // 获取访问日志
  private async getAccessLog(): Promise<AccessLog> {
    try {
      const data = await fs.readFile(this.accessLogPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  // 清理过期文件和日志
  @Cron('0 0 * * *') // 每天凌晨执行
  async cleanupOldFiles(): Promise<void> {
    try {
      const accessLog = await this.getAccessLog();
      const now = Date.now();
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30天
      const articlesDir = join(this.uploadBasePath, 'articles');

      // 获取实际存在的文件列表
      const existingFiles = await fs.readdir(articlesDir);
      const updatedLog: AccessLog = {};

      // 检查和清理文件
      for (const file of existingFiles) {
        const relativePath = `articles/${file}`;
        const filePath = join(articlesDir, file);
        const fileLog = accessLog[relativePath];

        if (!fileLog || now - fileLog.lastAccess > maxAge) {
          // 删除过期或未记录的文件
          await this.safeDeleteFile(filePath);
          this.logger.log(`已删除过期文件: ${filePath}`);
        } else {
          // 保留有效的日志记录
          updatedLog[relativePath] = fileLog;
        }
      }

      // 更新访问日志（只保留实际存在的文件的记录）
      await fs.writeFile(
        this.accessLogPath,
        JSON.stringify(updatedLog, null, 2),
      );

      this.logger.log('清理完成，日志已更新');
    } catch (error) {
      this.logger.error('清理过期文件失败', error);
    }
  }
}
