import BaseList from '../../components/BaseList';
import { getTagList, createTag, updateTag, deleteTag } from '@/services/paral-hub/common';

const TagList: React.FC = () => (
  <BaseList
    title="标签列表"
    itemName="标签"
    getList={getTagList}
    createItem={createTag}
    updateItem={updateTag}
    deleteItem={deleteTag}
  />
);

export default TagList;
