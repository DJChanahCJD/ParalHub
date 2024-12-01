import { getLog } from '@/services/paral-hub/api';
import { Button, Card, Spin } from 'antd';
import { useEffect, useRef, useState, useCallback } from 'react';
import { debounce } from 'lodash';
import TerminalDisplay from '@/components/TerminalDisplay';

const SystemLog: React.FC = () => {
  const [logs, setLogs] = useState<API.LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const timerRef = useRef<NodeJS.Timer>();
  const scrollRef = useRef<number>(0);
  const terminalRef = useRef<HTMLDivElement>(null);

  // 使用 useCallback 和 debounce 优化性能
  const fetchLogs = useCallback(
    debounce(async (keepScroll = true) => {
      const now = Date.now();
      if (now - lastUpdateTime < 2000) return;

      try {
        if (!keepScroll) {
          setLoading(true);
        }

        // 保存滚动位置
        if (terminalRef.current) {
          scrollRef.current = terminalRef.current.scrollTop;
        }

        const response = await getLog('system');
        const newLogs = response.data.data;

        // 优化日志更新逻辑
        setLogs(prevLogs => {
          const prevStr = JSON.stringify(prevLogs);
          const newStr = JSON.stringify(newLogs);
          return prevStr !== newStr ? newLogs : prevLogs;
        });

        setLastUpdateTime(now);

        // 恢复滚动位置
        if (keepScroll && terminalRef.current && isUserScrolling) {
          setTimeout(() => {
            if (terminalRef.current) {
              terminalRef.current.scrollTop = scrollRef.current;
            }
          }, 0);
        }
      } catch (error) {
        console.error('获取日志失败:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    [lastUpdateTime, isUserScrolling]
  );

  // 处理滚动事件
  const handleScroll = useCallback(() => {
    if (terminalRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
      const isBottom = scrollHeight - scrollTop - clientHeight < 10;
      setIsUserScrolling(!isBottom);
    }
  }, []);

  // 手动刷新
  const handleManualRefresh = useCallback(() => {
    setIsUserScrolling(false);
    fetchLogs(false);
  }, [fetchLogs]);

  // 设置定时器
  useEffect(() => {
    fetchLogs();
    timerRef.current = setInterval(() => fetchLogs(), 5000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current as NodeJS.Timeout);
      }
    };
  }, [fetchLogs]);

  return (
    <Card
      title="系统日志（每5s自动刷新）"
      extra={
        <Button type="primary" onClick={handleManualRefresh}>
          手动刷新
        </Button>
      }
    >
      <Spin spinning={loading}>
        <TerminalDisplay
          logs={logs}
          terminalRef={terminalRef}
          autoScroll={!isUserScrolling}
          onScroll={handleScroll}
        />
      </Spin>
    </Card>
  );
};

export default SystemLog;
