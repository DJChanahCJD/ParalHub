import { useTab } from '@/services/paral-hub/useTab';
import { PageContainer } from '@ant-design/pro-components';
import SkillList from './tabs/SkillList';
import IndustryList from './tabs/IndustryList';
import styles from '../Welcome/index.less';
import TagList from './tabs/TagList';

const DataManagement: React.FC = () => {
  const tabMap: Record<string, React.ReactNode> = {
    skills: <SkillList />,
    industry: <IndustryList />,
    tags: <TagList />,
  };
  const [tab, setTab] = useTab('skills', 'dataTab');

  return (
    <PageContainer
      title={null}
      extra={null}
      header={{ title: null, extra: null, ghost: true }}
      className={styles.thinheader}
      tabActiveKey={tab}
      tabList={[
        {
          tab: '技能管理',
          key: 'skills',
        },
        {
          tab: '行业管理',
          key: 'industry',
        },
        {
          tab: '标签管理',
          key: 'tags',
        },
      ]}
      onTabChange={setTab}
    >
      {tabMap[tab]}
    </PageContainer>
  );
};

export default DataManagement;
