import { useTab } from '@/services/paral-hub/useTab';
import { PageContainer } from '@ant-design/pro-components';
import DeveloperList from './tabs/DeveloperList';
import EnterpriseList from './tabs/EnterpriseList';
import AdminList from './tabs/AdminList';
import styles from '../Welcome/index.less';

const UserManagement: React.FC = () => {
  const tabMap: Record<string, React.ReactNode> = {
    developer: <DeveloperList />,
    enterprise: <EnterpriseList />,
    admin: <AdminList />,
  };
  // const [tab, setTab] = useTab('developer', 'tab');
  const [tab, setTab] = useTab('admin', 'tab');
  return (
    <PageContainer
      title={null}
      extra={null}
      header={{ title: null, extra: null, ghost: true }}
      className={styles.thinheader}
      tabActiveKey={tab}
      tabList={[
        {
          tab: '开发者管理',
          key: 'developer',
        },
        {
          tab: '企业管理',
          key: 'enterprise',
        },
        {
          tab: '管理员管理',
          key: 'admin',
        },
      ]}
      onTabChange={setTab}
    >
      {tabMap[tab]}
    </PageContainer>
  );
};

export default UserManagement;
