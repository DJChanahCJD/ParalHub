import { showNoUpdateInfo } from '@/utils/NoUpdateInfo';
import {
  ModalForm,
  ProFormText,
} from '@ant-design/pro-components';
import { Form } from 'antd';
import { useEffect, useState } from 'react';

export type UpdateFormProps = {
  type: 'create' | 'update';
  onCancel: () => void;
  onSubmit: (value: string) => Promise<void>;
  open: boolean;
  values?: API.SkillItem | API.IndustryItem;
  itemName: string;
};

const UpdateForm: React.FC<UpdateFormProps> = ({
  type,
  onCancel,
  onSubmit,
  open,
  values,
  itemName,
}) => {
  const [form] = Form.useForm();
  // 保存初始表单数据用于比较
  const [initialValues, setInitialValues] = useState<any>();

  useEffect(() => {
    form.resetFields();
    if (open && values) {
      const formValues = {
        name: values.name,
      };
      form.setFieldsValue(formValues);
      setInitialValues(formValues); // 保存初始值
    }
  }, [open, values, form]);

  return (
    <ModalForm
      title={`${type === 'create' ? '新建' : '编辑'}${itemName}`}
      open={open}
      form={form}
      onOpenChange={(visible) => {
        if (!visible) {
          form.resetFields();
          setInitialValues(undefined);
          onCancel();
        }
      }}
      onFinish={async (formValues) => {
        try {
          // 如果是编辑模式，直接比较所有表单数据
          if (type === 'update' && JSON.stringify(formValues) === JSON.stringify(initialValues)) {
            showNoUpdateInfo();
            return true;
          }
          console.log('formValues', formValues);
          await onSubmit(formValues.name);
          return true;
        } catch (error) {
          return false;
        }
      }}
      width={500}
      initialValues={initialValues}
    >
      <ProFormText
        name="name"
        label={`${itemName}名称`}
        rules={[
          { required: true, message: `请输入${itemName}名称` },
          { max: 50, message: `${itemName}名称最多50个字符` }
        ]}
        placeholder={`请输入${itemName}名称，如：${itemName === '技能' ? 'Python' : itemName === '行业' ? '互联网' : 'AI'}`}
      />
    </ModalForm>
  );
};

export default UpdateForm;
