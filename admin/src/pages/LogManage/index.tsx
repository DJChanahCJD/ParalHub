import { useTab } from '@/services/paral-hub/useTab';
import { PageContainer } from '@ant-design/pro-components';
import SystemLog from './tabs/SystemLog';
import UserLogList from './tabs/UserLogList';
import styles from '../Welcome/index.less';

const LogManagement: React.FC = () => {
  const tabMap: Record<string, React.ReactNode> = {
    system: <SystemLog />,
    user: <UserLogList />,
  };
  const [tab, setTab] = useTab('system', 'dataTab');

  return (
    <PageContainer
      title={null}
      extra={null}
      header={{ title: null, extra: null, ghost: true }}
      className={styles.thinheader}
      tabActiveKey={tab}
      tabList={[
        {
          tab: '系统日志',
          key: 'system',
        },
        {
          tab: '用户日志',
          key: 'user',
        },
      ]}
      onTabChange={setTab}
    >
      {tabMap[tab]}
    </PageContainer>
  );
};

export default LogManagement;
