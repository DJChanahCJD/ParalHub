import {
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormSelect,
} from '@ant-design/pro-components';
import { Form } from 'antd';
import { getTagList } from '@/services/paral-hub/common';
import { DefaultOptionType } from 'antd/es/select';

interface CaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish: (values: Partial<API.CaseItem>) => Promise<void>;
  initialValues?: Partial<API.CaseItem>;
  title: string;
}

const CaseForm: React.FC<CaseFormProps> = ({
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
          { max: 64, message: '标题最多64个字符' },
        ]}
      />

      <ProFormTextArea
        name="description"
        label="描述"
        rules={[
          { required: true, message: '请输入描述' },
          { max: 256, message: '描述最多256个字符' },
        ]}
      />

      <ProFormTextArea
        name="content"
        label="内容"
        fieldProps={{
          rows: 15,
        }}
        rules={[
          { required: true, message: '请输入内容' },
          { max: 102400, message: '内容最多10万个字符(约50KB)' },
        ]}
      />

      <ProFormSelect
        name="tags"
        label="标签"
        mode="multiple"
        placeholder="请选择标签"
        rules={[
          { required: true, message: '请至少选择一个标签' },
          { type: 'array', max: 5, message: '最多选择5个标签' },
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

export default CaseForm;
