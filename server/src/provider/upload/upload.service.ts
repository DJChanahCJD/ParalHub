import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import * as sharp from 'sharp';
import { promises as fs } from 'fs';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

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
  private readonly accessLogPath: string;

  constructor(private configService: ConfigService) {
    this.uploadBasePath = join(__dirname, '../../../uploads');
    this.apiUrl = this.configService.get<string>('API_URL');
    this.accessLogPath = join(this.uploadBasePath, 'access_log.json');
    // 确保 access_log.json 存在
    this.initAccessLog();
  }

  // 初始化访问日志文件
  private async initAccessLog(): Promise<void> {
    try {
      await fs.access(this.accessLogPath);
    } catch {
      await fs.writeFile(this.accessLogPath, '{}', 'utf-8');
    }
  }

  async handleUpload(
    file: Express.Multer.File,
    options: UploadOptions,
  ): Promise<string> {
    try {
      const {
        type,
        compress = true,
        width = 256,
        height = 256,
        quality = 80,
        oldUrl,
      } = options;
      const subDir = type === 'avatar' ? 'avatars' : 'articles';
      const outputDir = join(this.uploadBasePath, subDir);

      // 确保目录存在
      await fs.mkdir(outputDir, { recursive: true });

      // 如果存在旧文件，先删除
      if (oldUrl) {
        await this.deleteOldFile(oldUrl);
      }

      if (compress) {
        const compressedFileName = `compressed_${file.filename}`;
        const outputPath = join(outputDir, compressedFileName);

        // 压缩处理
        const sharpInstance = sharp(file.path);
        if (width || height) {
          sharpInstance.resize(width, height, {
            fit: 'cover',
            position: 'center',
          });
        }

        await sharpInstance
          .jpeg({ quality, progressive: true })
          .toFile(outputPath);

        // 删除原文件
        await this.safeDeleteFile(file.path);

        return `${this.apiUrl}/uploads/${subDir}/${compressedFileName}`;
      }

      // 移动文件到正确的位置
      const finalPath = join(outputDir, file.filename);
      await fs.rename(file.path, finalPath);

      return `${this.apiUrl}/uploads/${subDir}/${file.filename}`;
    } catch (error) {
      // 清理临时文件
      await this.safeDeleteFile(file.path);
      throw new Error(`文件处理失败：${error.message}`);
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
