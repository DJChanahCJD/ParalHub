import {
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormSelect,
} from '@ant-design/pro-components';
import { Form } from 'antd';
import { getCases } from '@/services/paral-hub/case';
import { DefaultOptionType } from 'antd/es/select';
import { getTagList } from '@/services/paral-hub/common';

interface ArticleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish: (values: Partial<API.ArticleItem>) => Promise<void>;
  initialValues?: Partial<API.ArticleItem>;
  title: string;
}

const ArticleForm: React.FC<ArticleFormProps> = ({
  open,
  onOpenChange,
  onFinish,
  initialValues,
  title,
}) => {
  const [form] = Form.useForm();

  return (
    <ModalForm
      title={title}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      initialValues={initialValues}
      onFinish={async (values) => {
        await onFinish(values);
        return true;
      }}
      modalProps={{
        destroyOnClose: true,
        maskClosable: false,
        width: 800,
      }}
    >
      <ProFormText
        name="title"
        label="标题"
        rules={[
          { required: true, message: '请输入标题' },
          { max: 100, message: '标题最多100个字符' },
        ]}
      />

      <ProFormSelect
        name="caseId"
        label="关联案例"
        rules={[{ required: true, message: '请选择关联案例' }]}
        request={async () => {
          const { items } = await getCases({ pageSize: 999 });
          return items.map(item => ({
            label: item.title,
            value: item._id,
            searchTerms: [item.title, item.description].filter(Boolean).join(' '),
          }));
        }}
        fieldProps={{
          showSearch: true,
          placeholder: '请选择关联案例',
          filterOption: (
            input: string,
            option?: DefaultOptionType,
          ) => {
            if (!option) return false;

            const searchText = input.toLowerCase();
            const label = String(option.label).toLowerCase();
            const searchTerms = option.searchTerms?.toLowerCase() || '';

            return label.includes(searchText) || searchTerms.includes(searchText);
          },
          optionFilterProp: 'label',
        }}
      />

      <ProFormTextArea
        name="content"
        label="内容"
        fieldProps={{
          rows: 15,
        }}
        rules={[
          { required: true, message: '请输入内容' },
        ]}
      />

      <ProFormSelect
        name="tags"
        label="标签"
        mode="multiple"
        placeholder="请输入标签"
        rules={[
          { required: true, message: '请至少添加一个标签' },
          { type: 'array', max: 5, message: '最多添加5个标签' },
        ]}
        request={async () => {
          const response = await getTagList({ pageSize: 999 });
          return response.data.map((tag) => ({
            label: tag.name,
            value: tag.name,
          }));
        }}
      />
    </ModalForm>
  );
};

export default ArticleForm;
