import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs/promises';
import { createReadStream } from 'fs';
import * as path from 'path';
import * as readline from 'readline';

@Injectable()
export class LogService implements OnModuleInit {
  private readonly logDir = 'logs';
  private lastLogs: Record<
    string,
    {
      data: any;
      timestamp: string;
      count: number;
      position: number;
    }
  > = {};

  // 不同类型日志的配置
  private readonly logConfig = {
    system: {
      maxSize: 50 * 1024 * 1024, // 系统日志 50MB
      retentionDays: 30, // 保留 30 天
      compress: false, // 不压缩
    },
    error: {
      maxSize: 100 * 1024 * 1024, // 错误日志 100MB
      retentionDays: 30, // 保留 30 天
      compress: false, // 不压缩
    },
    access: {
      maxSize: 20 * 1024 * 1024, // 访问日志 20MB
      retentionDays: 7, // 保留 7 天
      compress: false, // 不压缩
    },
  };

  constructor() {
    console.log('日志目录路径:', path.resolve(this.logDir));
  }
  async onModuleInit() {
    await this.initializeLogDir();
  }

  // 初始化日志目录
  async initializeLogDir() {
    try {
      await fs.access(this.logDir);
      console.log('日志目录已存在:', this.logDir);
    } catch {
      await fs.mkdir(this.logDir, { recursive: true });
      console.log('日志目录已创建:', this.logDir);
    }
  }

  // 写入日志
  async writeLog(type: string, logEntry: any) {
    const logType = type.toLowerCase();
    const logFile = path.join(this.logDir, `${logType}.log`);

    try {
      // 1. 格式化日志条目
      const formattedEntry = this.formatLogEntry({
        timestamp: new Date().toISOString(),
        type: logType,
        ...this.cleanLogEntry(logEntry),
      });

      // 2. 检查是否与最后一条日志相同
      const lastLog = this.lastLogs[logType];
      if (lastLog && this.areLogsEqual(lastLog.data, formattedEntry)) {
        // 更新计数和时间戳
        lastLog.count += 1;
        lastLog.timestamp = formattedEntry.timestamp;
        return;
      }

      // 3. 如果有未写入的重复日志，先写入
      if (lastLog && lastLog.count > 1) {
        await this.flushLog(logType);
      }

      // 4. 使用更安全的 JSON 序列化
      const logString = JSON.stringify(formattedEntry) + '\n';

      // 5. 使用原子写入
      await fs.appendFile(logFile, logString, {
        encoding: 'utf8',
        flag: 'a',
      });

      // 6. 如果不是系统日志，同时写入系统日志
      if (logType !== 'system') {
        await this.writeLog('system', {
          ...formattedEntry,
          originalType: logType,
        });
      }

      // 7. 更新最后日志记录
      const stats = await fs.stat(logFile);
      this.lastLogs[logType] = {
        data: formattedEntry,
        timestamp: formattedEntry.timestamp,
        count: 1,
        position: stats.size - Buffer.from(logString).length,
      };

      // 8. 检查是否需要轮转日志
      await this.checkAndRotateLog(logFile, logType);
    } catch (error) {
      console.error(`写入日志失败 (${logType}):`, error);
    }
  }

  // 添加日志清理方法
  private cleanLogEntry(entry: any): any {
    if (!entry) return {};

    try {
      // 深拷贝以避免修改原对象
      const cleaned = JSON.parse(JSON.stringify(entry));

      // 处理特殊字段
      if (cleaned.repeatCount !== undefined) {
        cleaned.repeatCount = Number(cleaned.repeatCount) || 1;
      }

      // 确保 sortOrder 是有效值
      if (
        cleaned.sortOrder !== undefined &&
        typeof cleaned.sortOrder !== 'number'
      ) {
        delete cleaned.sortOrder;
      }

      // 清理元数据
      if (cleaned.metadata) {
        cleaned.metadata = this.cleanMetadata(cleaned.metadata);
      }

      return cleaned;
    } catch (error) {
      console.warn('清理日志条目失败:', error);
      return entry;
    }
  }

  // 刷新缓存的日志
  private async flushLog(type: string) {
    const lastLog = this.lastLogs[type];
    if (lastLog) {
      await this.writeLog(type, {
        ...lastLog.data,
        timestamp: lastLog.timestamp,
        repeatCount: lastLog.count,
      });
      delete this.lastLogs[type];
    }
  }

  // 在服务关闭时确保所有日志都被写入
  async onApplicationShutdown() {
    for (const type of Object.keys(this.lastLogs)) {
      await this.flushLog(type);
    }
  }

  // 添加便捷的日志方法
  async logInfo(message: string, data?: any) {
    await this.writeLog('system', {
      type: 'INFO',
      message,
      data,
    });
  }

  async logError(message: string, error?: any) {
    const errorData = {
      type: 'ERROR',
      message,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
    };

    // 写入错误日志（会自动同步到系统日志）
    await this.writeLog('error', errorData);
  }

  async logWarning(message: string, data?: any) {
    await this.writeLog('system', {
      type: 'WARNING',
      message,
      data,
    });
  }

  async logAccess(data: any) {
    await this.writeLog('access', {
      type: 'ACCESS',
      ...data,
    });
  }

  // 检查并轮转日志
  private async checkAndRotateLog(logFile: string, type: string) {
    try {
      const stats = await fs.stat(logFile);
      const config = this.logConfig[type] || this.logConfig.system;

      if (stats.size >= config.maxSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedFile = `${logFile}.${timestamp}`;
        await fs.rename(logFile, rotatedFile);

        // 直接创建新的日志文件
        await fs.writeFile(logFile, '', 'utf8');

        // 清理超过保留期限的日志
        await this.cleanOldLogFiles(
          path.dirname(logFile),
          path.basename(logFile),
          config.retentionDays,
        );
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  // 清理旧日志文件
  private async cleanOldLogFiles(
    dir: string,
    baseFileName: string,
    retentionDays: number,
  ) {
    const files = await fs.readdir(dir);
    const now = Date.now();
    const maxAge = retentionDays * 24 * 60 * 60 * 1000;

    const logFiles = files
      .filter((file) => file.startsWith(baseFileName) && file !== baseFileName)
      .map(async (file) => {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        return {
          path: filePath,
          mtime: stats.mtime.getTime(),
        };
      });

    const fileStats = await Promise.all(logFiles);

    // 删除超过保留期限的文件
    for (const file of fileStats) {
      if (now - file.mtime > maxAge) {
        await fs.unlink(file.path);
      }
    }
  }

  // 读取日志，直接返回最新的N行
  async readLogs(type: string, limit: number = 1000) {
    const logType = type.toLowerCase();
    const logFile = path.join(this.logDir, `${logType}.log`);

    try {
      await fs.access(logFile);
    } catch {
      return { data: [] };
    }

    return new Promise((resolve, reject) => {
      const logs: any[] = [];
      const lines: string[] = [];
      const readInterface = readline.createInterface({
        input: createReadStream(logFile, { encoding: 'utf8' }),
        crlfDelay: Infinity,
      });

      readInterface.on('line', (line) => {
        if (line.trim()) lines.push(line);
      });

      readInterface.on('close', () => {
        const recentLines = lines.slice(-limit);
        for (const line of recentLines) {
          const parsed = this.parseLine(line);
          if (parsed) {
            logs.push(parsed);
          }
        }
        resolve({ data: logs });
      });

      readInterface.on('error', (error) => {
        console.error('读取日志文件失败:', error);
        reject(error);
      });
    });
  }

  // 比较两条日志是否相同（忽略时间戳）
  private areLogsEqual(log1: any, log2: any) {
    // 只比较关键字段
    const compareLog = (log: any) => {
      const { level, message, context, metadata = {} } = log;

      // 对于 metadata，只比较关键信息（如查询参数），忽略动态数据
      const {
        query, // 保留查询参数
        body, // 保留请求体
        // 忽略 duration, status, response 等动态数据
      } = metadata;

      return {
        level,
        message,
        context,
        ...(query && { query }), // 只在存在时添加
        ...(body && { body }), // 只在存在时添加
      };
    };

    return (
      JSON.stringify(compareLog(log1)) === JSON.stringify(compareLog(log2))
    );
  }

  // 优化格式化方法
  private formatLogEntry(log: any) {
    // 构建基础消息
    let message = log.message;
    const metadata = { ...(log.metadata || log.data || {}) };

    // 处理 HTTP 请求日志
    if (metadata.method && metadata.path) {
      message = `${metadata.method} ${metadata.path}`;
      delete metadata.method;
      delete metadata.path;
    }

    // 清理并构造日志对象
    return {
      timestamp: log.timestamp,
      level: log.level || log.type || 'INFO',
      message,
      context: log.context || 'SYSTEM',
      ...(Object.keys(this.cleanMetadata(metadata)).length > 0 && {
        metadata: this.cleanMetadata(metadata),
      }),
    };
  }

  private cleanMetadata(metadata: any) {
    if (!metadata) return {};

    const cleaned = { ...metadata };

    // 删除冗余或空值字段
    Object.keys(cleaned).forEach((key) => {
      if (
        cleaned[key] === undefined ||
        cleaned[key] === null ||
        (typeof cleaned[key] === 'object' &&
          Object.keys(cleaned[key]).length === 0)
      ) {
        delete cleaned[key];
      }
    });

    return cleaned;
  }

  // 添加日志行解析方法
  private parseLine(line: string): any {
    try {
      // 1. 基础清理
      line = line.trim().replace(/^\uFEFF/, '');

      // 2. 跳过空行或明显无效的行
      if (!line || line.length < 2) return null;

      // 3. 尝试修复常见的 JSON 格式问题
      let fixedLine = line;

      // 3.1 确保以 { 开始，} 结束
      if (!fixedLine.startsWith('{')) fixedLine = '{' + fixedLine;
      if (!fixedLine.endsWith('}')) fixedLine = fixedLine + '}';

      // 3.2 修复键名缺少引号的问题
      fixedLine = fixedLine.replace(/([{,]\s*)(\w+):/g, '$1"$2":');

      // 3.3 修复值缺少引号的问题（针对特定已知字段）
      const knownFields = ['type', 'context', 'message', 'level'];
      knownFields.forEach((field) => {
        const regex = new RegExp(`"${field}":\\s*(\\w+)`, 'g');
        fixedLine = fixedLine.replace(regex, `"${field}":"$1"`);
      });

      // 4. 尝试解析修复后的 JSON
      try {
        return JSON.parse(fixedLine);
      } catch {
        // 5. 如果仍然失败，尝试更激进的修复
        // 5.1 移除可能的重复 JSON
        const lastBrace = fixedLine.lastIndexOf('}');
        if (lastBrace !== fixedLine.length - 1) {
          fixedLine = fixedLine.substring(0, lastBrace + 1);
        }

        // 5.2 修复可能的截断问题
        if (fixedLine.includes('"repeatCount":')) {
          fixedLine = fixedLine.replace(/,\s*$/, '}');
        }

        return JSON.parse(fixedLine);
      }
    } catch (error) {
      // 6. 记录详细的解析错误信息
      console.warn(`跳过无效的日志行: ${line.substring(0, 50)}...`, {
        error: error.message,
        originalLine: line,
      });
      return null;
    }
  }

  // 添加新的 readUserLogs 方法
  async readUserLogs(params: {
    current?: number;
    pageSize?: number;
    event?: string;
    success?: boolean;
    keyword?: string;
    sortOrder?: 'ascend' | 'descend';
  }) {
    const {
      current = 1,
      pageSize = 10,
      event,
      success,
      keyword,
      sortOrder = 'descend', // 默认按时间倒序
    } = params;

    try {
      const logFile = path.join(this.logDir, 'user.log');
      const logs = await this.readLogsFile(logFile);
      let filteredLogs = [...logs]; // 创建副本以进行过滤和排序

      // 应用过滤条件
      if (event) {
        filteredLogs = filteredLogs.filter(
          (log) => log.metadata?.event?.toLowerCase() === event.toLowerCase(),
        );
      }

      if (success !== undefined) {
        filteredLogs = filteredLogs.filter(
          (log) => log.metadata?.success === success,
        );
      }

      if (keyword) {
        filteredLogs = filteredLogs.filter((log) =>
          JSON.stringify(log).toLowerCase().includes(keyword.toLowerCase()),
        );
      }

      // 排序
      filteredLogs.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === 'ascend' ? timeA - timeB : timeB - timeA;
      });

      // 计算分页
      const total = filteredLogs.length;
      const start = (current - 1) * pageSize;
      const end = start + pageSize;
      const pagedLogs = filteredLogs.slice(start, end);

      return {
        data: pagedLogs.map((log) => ({
          time: log.timestamp,
          event: log.metadata.event,
          username: log.metadata.username,
          ip: log.metadata.ip,
          address: log.metadata.address,
          success: log.metadata.success,
          details: log.metadata.details,
        })),
        total,
        success: true,
      };
    } catch (error) {
      console.error('读取用户日志失败:', error);
      return { data: [], total: 0, success: false };
    }
  }

  // 新增通用日志文件读取方法
  private async readLogsFile(filePath: string): Promise<any[]> {
    const logs: any[] = [];

    try {
      await fs.access(filePath);
    } catch {
      return logs; // 如果文件不存在，返回空数组
    }

    const fileStream = createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    try {
      for await (const line of rl) {
        const parsed = this.parseLine(line);
        if (parsed) {
          logs.push(parsed);
        }
      }
    } catch (error) {
      console.error('读取日志文件失败:', error);
    } finally {
      rl.close();
      fileStream.close();
    }

    return logs;
  }
}
