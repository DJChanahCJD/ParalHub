import { Modal, message } from 'antd';
import type { ActionType } from '@ant-design/pro-table';

interface BatchDeleteOptions {
  ids: string[];                              // 要删除的 ID 数组
  actionRef?: React.MutableRefObject<ActionType | undefined>;  // 表格的 actionRef
  deleteFn: (ids: string) => Promise<unknown>;    // 删除函数
  itemName?: string;                          // 项目名称，用于显示在确认框中
  onCancel?: () => void;                      // 取消回调
}

/**
 * 通用批量删除处理函数
 * @param options 批量删除配置项
 */
export const handleBatchDelete = ({
  ids,
  actionRef,
  deleteFn,
  itemName = '项目',
  onCancel,
}: BatchDeleteOptions) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除${ids.length}个${itemName}吗？此操作不可恢复。`,
    okButtonProps: { danger: true },
    onOk: async () => {
      try {
        const promises = ids.map(id => deleteFn(id));
        await Promise.all(promises);
        message.success('批量删除成功');
        actionRef?.current?.reload();
      } catch (error: unknown) {
        message.error('批量删除失败：' + (error as Error).message);
      }
    },
    onCancel: () => {
      onCancel?.();
    },
  });
};
