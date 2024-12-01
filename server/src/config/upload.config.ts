import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage, diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

export interface UploadConfigOptions {
  maxSize?: number;
  allowedTypes?: RegExp;
}

export const createUploadConfig = (
  type: 'avatar' | 'article' | 'image',
  options?: UploadConfigOptions,
): MulterOptions => {
  const defaultOptions = {
    maxSize: 5 * 1024 * 1024, // 默认5MB
    allowedTypes: /^image\/(jpg|jpeg|png|gif)$/,
  };

  const config = { ...defaultOptions, ...options };
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    storage: isProduction
      ? memoryStorage() // 生产环境使用内存存储
      : diskStorage({
          // 开发环境使用磁盘存储
          destination: `./uploads/${type}s`,
          filename: (req, file, callback) => {
            const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
            callback(null, uniqueName);
          },
        }),
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(config.allowedTypes)) {
        return callback(new Error('不支持的文件类型！'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: config.maxSize,
    },
  };
};
