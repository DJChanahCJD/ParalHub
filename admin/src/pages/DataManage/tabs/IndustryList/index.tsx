import BaseList from '../../components/BaseList';
import { getIndustryList, createIndustry, updateIndustry, deleteIndustry } from '@/services/paral-hub/common';

const IndustryList: React.FC = () => (
  <BaseList<API.IndustryItem>
    title="行业列表"
    itemName="行业"
    getList={getIndustryList}
    createItem={createIndustry}
    updateItem={updateIndustry}
    deleteItem={deleteIndustry}
  />
);

export default IndustryList;
