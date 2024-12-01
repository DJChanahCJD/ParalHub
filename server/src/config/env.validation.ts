import {
  IsString,
  IsNumber,
  IsEnum,
  IsUrl,
  validateSync,
} from 'class-validator';
import { plainToClass, Type, Transform } from 'class-transformer';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  PORT: number;

  @IsString()
  @IsUrl({ require_tld: false })
  BASE_URL: string;

  @IsString()
  MONGODB_URI: string;

  @IsString()
  JWT_SECRET?: string;

  @IsString()
  REDIS_HOST?: string;

  @IsNumber()
  @Type(() => Number)
  REDIS_PORT?: number;

  @IsString()
  UPLOAD_DIR?: string;

  @IsNumber()
  @Type(() => Number)
  MAX_FILE_SIZE?: number;
}

export function validateEnvConfig(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation error: ${errors.toString()}`);
  }

  return validatedConfig;
}
