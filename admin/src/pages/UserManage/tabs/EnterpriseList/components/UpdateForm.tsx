import { getAllIndustries } from '@/services/paral-hub/common';
import {
  ModalForm,
  ProFormText,
  ProFormSelect,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Form, Space, message } from 'antd';
import { useEffect, useState } from 'react';

export type UpdateFormProps = {
  onCancel: () => void;
  onSubmit: (values: Partial<API.EnterpriseItem>) => Promise<void>;
  open: boolean;
  values?: Partial<API.EnterpriseItem>;
  type: 'create' | 'update';
};

const UpdateForm: React.FC<UpdateFormProps> = ({
  onCancel,
  onSubmit,
  open,
  values,
  type,
}) => {
  const [form] = Form.useForm();
  const [industryOptions, setIndustryOptions] = useState<any[]>([]);

  const getIndustryOptions = async () => {
    const res = await getAllIndustries();
    setIndustryOptions(
      res.map((item: any) => ({
        label: item.name,
        value: item.name,
      })),
    );
  };

  // 表单数据初始化
  useEffect(() => {
    form.resetFields();
    if (open && values) {
      form.setFieldsValue(values);
    }
    getIndustryOptions();
  }, [open, values, form]);

  // 规模选项
  const scaleOptions = [
    { label: '小型(≤100人)', value: 'small' },
    { label: '中型(101-500人)', value: 'medium' },
    { label: '大型(>500人)', value: 'large' },
  ];

  return (
    <ModalForm
      title={`${type === 'create' ? '新建' : '编辑'}企业`}
      open={open}
      form={form}
      initialValues={{
        status: true,
        verificationStatus: 'pending',
        ...(type === 'create' ? values : {}),
      }}
      onOpenChange={(visible) => {
        if (!visible) {
          form.resetFields();
          onCancel();
        }
      }}
      onFinish={async (values) => {
        try {
          await onSubmit(values);
          return true;
        } catch (error) {
          message.error('操作失败: ' + (error as Error).message);
          return false;
        }
      }}
      width={640}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <ProFormText
          name="company"
          label="企业名称"
          rules={[
            { required: true, message: '请输入企业名称' },
            { max: 50, message: '企业名称最多50个字符' },
          ]}
        />
        <ProFormSelect
          name="industry"
          label="行业"
          options={industryOptions}
          rules={[{ required: true, message: '请选择行业' }]}
        />
        <ProFormSelect
          name="scale"
          label="规模"
          options={scaleOptions}
          rules={[{ required: true, message: '请选择规模' }]}
        />
        <ProFormText
          name="contactPerson"
          label="联系人"
          rules={[{ required: true, message: '请输入联系人' }]}
        />
        <ProFormText
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' },
          ]}
        />
        {type === 'create' && (
          <ProFormText.Password
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 8, message: '密码至少8个字符' },
              {
                pattern: /^(?=.*[a-zA-Z])(?=.*\d)[^]{8,}$/,
                message: '密码必须包含字母和数字',
              },
            ]}
          />
        )}
        <ProFormText
          name="phone"
          label="手机号"
          rules={[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
          ]}
        />
        <ProFormTextArea
          name="address"
          label="地址"
          rules={[
            { required: true, message: '请输入地址' },
            { max: 200, message: '地址最多200个字符' },
          ]}
        />
      </Space>
    </ModalForm>
  );
};

export default UpdateForm;
