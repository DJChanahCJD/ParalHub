import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage, diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export interface UploadConfigOptions {
  maxSize?: number;
  allowedTypes?: RegExp;
}

export const createUploadConfig = (
  type: 'avatar' | 'article' | 'image',
  options?: UploadConfigOptions,
): MulterOptions => {
  const defaultOptions = {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: /^image\/(jpg|jpeg|png|gif)$/,
  };

  const config = { ...defaultOptions, ...options };
  const isProduction = process.env.NODE_ENV === 'production';
  const uploadPath = join(__dirname, '../../uploads', `${type}s`);
  console.log('uploadPath', uploadPath);

  if (!isProduction && !existsSync(uploadPath)) {
    console.log(`创建上传目录: ${uploadPath}`);
    mkdirSync(uploadPath, { recursive: true });
  }

  return {
    storage: isProduction
      ? memoryStorage()
      : diskStorage({
          destination: (req, file, cb) => {
            console.log('type', type);
            console.log('destination', uploadPath);
            cb(null, uploadPath);
          },
          filename: (req, file, cb) => {
            const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
            cb(null, uniqueName);
          },
        }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(config.allowedTypes)) {
        return cb(new Error('不支持的文件类型！'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: config.maxSize,
    },
  };
};
