import { message } from 'antd';

export const showNoUpdateInfo = (msg?: string) => {
  message.info(msg || '数据未变更，无需更新');
};
