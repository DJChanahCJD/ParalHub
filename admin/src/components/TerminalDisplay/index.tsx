import convert from 'ansi-to-html';
import { useEffect, CSSProperties } from 'react';

// ANSI 颜色映射
const ANSI_COLORS = {
  INFO: '\x1b[32m',     // 绿色
  DEBUG: '\x1b[36m',    // 青色
  ERROR: '\x1b[31m',    // 红色
  WARN: '\x1b[33m',     // 黄色
  ACCESS: '\x1b[34m',   // 蓝色
  SYSTEM: '\x1b[35m',   // 紫色
  RESET: '\x1b[0m',     // 重置
  WHITE: '\x1b[37m',    // 白色
} as const;

// 配置 ANSI 转换器
const ansiToHtml = new convert({
  fg: '#FFF',
  bg: '#1e1e1e',
  newline: true,
  escapeXML: true,
  colors: {
    0: '#000000', // 黑色
    1: '#ff0000', // 红色
    2: '#00ff00', // 绿色
    3: '#ffff00', // 黄色
    4: '#0000ff', // 蓝色
    5: '#ff00ff', // 品红
    6: '#00ffff', // 青色
    7: '#ffffff', // 白色
  }
});

const styles = {
  terminal: {
    backgroundColor: '#1e1e1e',
    padding: '12px',
    borderRadius: '4px',
    color: '#FFF',
    width: '100%',
    height: 'calc(100vh - 250px)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'auto' as const,
  } as CSSProperties,
  code: {
    fontFamily: 'Monaco, Menlo, Consolas, "Courier New", monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word' as const,
    fontSize: '12px',
    lineHeight: '1.4',
    flex: 1,
    margin: 0,
  } as CSSProperties
};

interface TerminalDisplayProps {
  logs: API.LogEntry[];
  terminalRef: React.RefObject<HTMLDivElement>;
  autoScroll?: boolean;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
}

const TerminalDisplay: React.FC<TerminalDisplayProps> = ({
  logs,
  terminalRef,
  autoScroll = true,
  onScroll
}) => {
  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const formatLog = (log: API.LogEntry): string => {
    const timestamp = new Date(log.timestamp).toLocaleString();
    const level = log.level.toUpperCase();
    const colorCode = ANSI_COLORS[level as keyof typeof ANSI_COLORS] || ANSI_COLORS.WHITE;

    // 构建日志消息
    let message = `${colorCode}[${timestamp}] [${level}]`;

    // 添加IP地址
    if (log.metadata?.ip) {
      message += ` [${ANSI_COLORS.WHITE}${log.metadata.ip}${ANSI_COLORS.RESET}${colorCode}]`;
    }

    // 添加上下文
    if (log.context) {
      message += ` [${ANSI_COLORS.DEBUG}${log.context}${ANSI_COLORS.RESET}${colorCode}]`;
    }

    message += ` ${log.message}`;

    // 添加重复次数
    if (log.repeatCount && log.repeatCount > 1) {
      message += ` ${ANSI_COLORS.WARN}(共 ${log.repeatCount} 次)${ANSI_COLORS.RESET}${colorCode}`;
    }

    // 错误日志处理
    if (level === 'ERROR' && log.metadata?.error) {
      const { type, code, message: errMsg } = log.metadata.error;
      message += '\n  ' + [
        type && `错误类型: ${type}`,
        code && `错误代码: ${code}`,
        errMsg && errMsg !== log.message && `详细信息: ${errMsg}`,
      ].filter(Boolean).join('\n  ');
    }
    // 其他元数据处理
    else if (log.metadata && !log.message.includes('GET')) {
      const { query, body } = log.metadata;
      if (query) message += `\n  query: ${JSON.stringify(query)}`;
      if (body) message += `\n  body: ${JSON.stringify(body)}`;
    }

    return `${message}${ANSI_COLORS.RESET}`;
  };

  const formatContent = (logs: API.LogEntry[]): string => {
    return logs.map(formatLog).join('\n');
  };

  return (
    <div style={styles.terminal} ref={terminalRef} onScroll={onScroll}>
      <code
        style={styles.code}
        dangerouslySetInnerHTML={{
          __html: ansiToHtml.toHtml(formatContent(logs))
        }}
      />
    </div>
  );
};

export default TerminalDisplay;
