import BaseList from '../../components/BaseList';
import { getSkillList, createSkill, updateSkill, deleteSkill } from '@/services/paral-hub/common';

const SkillList: React.FC = () => (
  <BaseList
    title="技能列表"
    itemName="技能"
    getList={getSkillList}
    createItem={createSkill}
    updateItem={updateSkill}
    deleteItem={deleteSkill}
  />
);

export default SkillList;
