import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientType } from 'redis';
import * as fs from 'fs/promises';
import { createReadStream, existsSync } from 'fs';
import * as path from 'path';
import * as readline from 'readline';

interface LogBuffer {
  entry: any;
  count: number;
  firstTime: string;
  lastTime: number;
}

@Injectable()
export class LogService implements OnModuleInit {
  private readonly logDir = 'logs';
  private readonly isProduction: boolean;
  private lastLogs: Record<
    string,
    { data: any; timestamp: string; count: number; position: number }
  > = {};

  // Redis 相关配置
  private readonly LOG_RETENTION_DAYS = 7;
  private readonly MAX_LOGS_PER_TYPE = 1000;
  private readonly REDIS_LOG_PREFIX = 'app:logs:';

  // 保留原有的日志配置
  private readonly logConfig = {
    system: {
      maxSize: 50 * 1024 * 1024,
      retentionDays: 30,
      compress: false,
    },
    error: {
      maxSize: 30 * 1024 * 1024,
      retentionDays: 30,
      compress: false,
    },
    access: {
      maxSize: 20 * 1024 * 1024,
      retentionDays: 7,
      compress: false,
    },
  };

  private logBuffer: Map<string, LogBuffer> = new Map();
  private readonly BUFFER_WINDOW = 5000; // 5秒时间窗口

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redisClient: RedisClientType,
    private readonly configService: ConfigService,
  ) {
    this.isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
  }

  async onModuleInit() {
    if (!this.isProduction) {
      try {
        if (!existsSync(this.logDir)) {
          await fs.mkdir(this.logDir, { recursive: true });
        }
      } catch (error) {
        console.warn('Failed to create logs directory:', error);
      }
    } else {
      // 生产环境：启动时清理过期日志
      await this.cleanupOldLogs();
    }
  }

  private getRedisKey(type: string, date: string): string {
    return `${this.REDIS_LOG_PREFIX}${type}:${date}`;
  }

  private createBufferKey(data: any): string {
    // 创建日志的唯一标识，用于判断重复
    return `${data.message}|${data.level}|${data.context}|${
      data.metadata?.status || ''
    }|${data.metadata?.path || ''}`;
  }

  async writeLog(type: string, data: any) {
    const timestamp = new Date();
    const currentTime = timestamp.getTime();
    const bufferKey = this.createBufferKey(data);

    // 检查缓冲区是否有相同的日志
    const buffered = this.logBuffer.get(bufferKey);

    if (buffered && currentTime - buffered.lastTime < this.BUFFER_WINDOW) {
      // 更新现有缓冲
      buffered.count++;
      buffered.lastTime = currentTime;
      this.logBuffer.set(bufferKey, buffered);
      return;
    }

    // 如果有需要写入的缓冲日志，先写入
    if (buffered) {
      const logEntry = {
        timestamp: buffered.firstTime,
        level: buffered.entry.level || 'info',
        message: buffered.entry.message,
        context: buffered.entry.context || 'APP',
        metadata: buffered.entry.metadata || {},
        source: type,
        repeatCount: buffered.count,
      };

      await this.writeLogToStorage(type, logEntry);
      this.logBuffer.delete(bufferKey);
    }

    // 创建新的缓冲
    this.logBuffer.set(bufferKey, {
      entry: data,
      count: 1,
      firstTime: timestamp.toISOString(),
      lastTime: currentTime,
    });

    // 设置定时器，确保日志最终会被写入
    setTimeout(() => {
      this.flushBufferedLog(bufferKey);
    }, this.BUFFER_WINDOW);
  }

  private async flushBufferedLog(bufferKey: string) {
    const buffered = this.logBuffer.get(bufferKey);
    if (!buffered) return;

    const logEntry = {
      timestamp: buffered.firstTime,
      level: buffered.entry.level || 'info',
      message: buffered.entry.message,
      context: buffered.entry.context || 'APP',
      metadata: buffered.entry.metadata || {},
      source: buffered.entry.source,
      repeatCount: buffered.count,
    };

    await this.writeLogToStorage(buffered.entry.source || 'system', logEntry);
    this.logBuffer.delete(bufferKey);
  }

  private async writeLogToStorage(type: string, logEntry: any) {
    if (this.isProduction) {
      try {
        const dateKey = new Date(logEntry.timestamp)
          .toISOString()
          .split('T')[0];
        const redisKey = this.getRedisKey(type, dateKey);

        await this.redisClient.lPush(redisKey, JSON.stringify(logEntry));
        await this.redisClient.lTrim(redisKey, 0, this.MAX_LOGS_PER_TYPE - 1);
        await this.redisClient.expire(
          redisKey,
          60 * 60 * 24 * this.LOG_RETENTION_DAYS,
        );
      } catch (error) {
        console.error('Failed to write log to Redis:', error);
      }
    } else {
      try {
        const logFile = path.join(this.logDir, `${type}.log`);
        await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
      } catch (error) {
        console.error('Failed to write log file:', error);
      }
    }

    // 更新最后一条日志记录
    this.lastLogs[type] = {
      data: logEntry,
      timestamp: logEntry.timestamp,
      count: (this.lastLogs[type]?.count || 0) + 1,
      position: 0,
    };
  }

  async readLogs(type: string, days: number = 7): Promise<any[]> {
    if (this.isProduction) {
      try {
        const logs: any[] = [];
        // 获取指定天数范围内的所有日志
        for (let i = 0; i < days; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateKey = date.toISOString().split('T')[0];
          const redisKey = this.getRedisKey(type, dateKey);

          // 获取该日期的所有日志
          const dailyLogs = await this.redisClient.lRange(redisKey, 0, -1);
          if (dailyLogs && dailyLogs.length > 0) {
            logs.push(
              ...dailyLogs
                .map((log) => {
                  try {
                    const parsedLog = JSON.parse(log);
                    // 确保日志格式一致
                    return {
                      timestamp: parsedLog.timestamp,
                      level: parsedLog.level || 'info',
                      message: parsedLog.message,
                      context: parsedLog.context,
                      metadata: parsedLog.metadata || {},
                    };
                  } catch (e) {
                    console.error('Failed to parse log:', e);
                    return null;
                  }
                })
                .filter(Boolean),
            );
          }
        }
        return logs;
      } catch (error) {
        console.error('Failed to read logs from Redis:', error);
        return [];
      }
    } else {
      // 开发环境：从文件读取
      try {
        const logFile = path.join(this.logDir, `${type}.log`);
        if (!existsSync(logFile)) {
          return [];
        }
        const logs = await this.readLogsFile(logFile);
        return logs;
      } catch (error) {
        console.error('Failed to read logs:', error);
        return [];
      }
    }
  }

  // 保留原有的文件系统方法
  private async checkAndRotateLog(type: string) {
    if (this.isProduction) return; // 生产环境不需要此功能

    const logFile = path.join(this.logDir, `${type}.log`);
    try {
      const stats = await fs.stat(logFile);
      const config = this.logConfig[type];

      if (stats.size >= config.maxSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(this.logDir, `${type}-${timestamp}.log`);
        await fs.rename(logFile, backupFile);

        // 清理旧的备份文件
        await this.cleanupOldBackups(type);
      }
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  private async cleanupOldBackups(type: string) {
    if (this.isProduction) return; // 生产环境不需要此功能

    try {
      const files = await fs.readdir(this.logDir);
      const backups = files.filter(
        (f) => f.startsWith(`${type}-`) && f.endsWith('.log'),
      );
      const config = this.logConfig[type];

      // 按时间排序
      const sortedBackups = backups.sort().reverse();

      // 删除超过保留天数的备份
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);

      for (const backup of sortedBackups) {
        const filePath = path.join(this.logDir, backup);
        const stats = await fs.stat(filePath);
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  // Redis 清理方法
  private async cleanupOldLogs() {
    if (!this.isProduction) return; // 开发环境不需要此功能

    try {
      const pattern = `${this.REDIS_LOG_PREFIX}*`;
      const keys = await this.redisClient.keys(pattern);

      const now = new Date();
      for (const key of keys) {
        const keyParts = key.split(':');
        const dateStr = keyParts[keyParts.length - 1];
        const keyDate = new Date(dateStr);

        const daysDiff =
          (now.getTime() - keyDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > this.LOG_RETENTION_DAYS) {
          await this.redisClient.del(key);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  // 统计方法
  async getLogsStats(): Promise<any> {
    if (this.isProduction) {
      try {
        const stats = {};
        const pattern = `${this.REDIS_LOG_PREFIX}*`;
        const keys = await this.redisClient.keys(pattern);

        for (const key of keys) {
          const length = await this.redisClient.lLen(key);
          stats[key] = length;
        }

        return stats;
      } catch (error) {
        console.error('Failed to get logs stats:', error);
        return {};
      }
    } else {
      try {
        const stats = {};
        const files = await fs.readdir(this.logDir);

        for (const file of files) {
          if (file.endsWith('.log')) {
            const filePath = path.join(this.logDir, file);
            const fileStats = await fs.stat(filePath);
            stats[file] = {
              size: fileStats.size,
              modified: fileStats.mtime,
            };
          }
        }

        return stats;
      } catch (error) {
        console.error('Failed to get logs stats:', error);
        return {};
      }
    }
  }

  private async readLogsFile(filePath: string): Promise<any[]> {
    const logs: any[] = [];
    const fileStream = createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    try {
      for await (const line of rl) {
        try {
          const parsed = JSON.parse(line);
          logs.push(parsed);
        } catch (error) {
          console.error('Failed to parse log line:', error);
        }
      }
    } finally {
      rl.close();
      fileStream.close();
    }

    return logs;
  }
}
