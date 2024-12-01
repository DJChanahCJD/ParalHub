import { history } from '@umijs/max';
import { useState } from 'react';

export const useTab = (init: string, tabKey: string) => {
  const [currTabKey, setCurrTabKey] = useState(
    (history.location as any).query?.[tabKey] || init
  );
  console.log(history.location);
  return [
    currTabKey,
    (newTab: string) => {
      setCurrTabKey(newTab);
      const newQuery: Record<string, string> = {};

      // 添加空值检查
      const currentQuery = (history.location as any).query || {};

      // 复制现有的 query 参数
      Object.entries(currentQuery).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          newQuery[k] = String(v);
        }
      });

      // 添加新的 tab 参数
      newQuery[tabKey] = newTab;

      // 构建 query 字符串
      const queryString = new URLSearchParams(newQuery).toString();

      // 更新 URL
      history.push(`${history.location.pathname}${queryString ? `?${queryString}` : ''}`);
    },
  ] as const;
};
