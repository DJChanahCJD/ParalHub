import {
  ModalForm,
  ProFormText,
  ProFormSelect,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Form, Space, message } from 'antd';
import { useEffect, useState } from 'react';
import { getAllSkills } from '@/services/paral-hub/common';
import { showNoUpdateInfo } from '@/utils/NoUpdateInfo';

export type UpdateFormProps = {
  onCancel: () => void;
  onSubmit: (values: Partial<API.DeveloperItem>) => Promise<void>;
  open: boolean;
  values?: Partial<API.DeveloperItem>;
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
  const [skillOptions, setSkillOptions] = useState<{ label: string; value: string }[]>([]);
  const [initialValues, setInitialValues] = useState<any>();
  // 表单数据初始化
  useEffect(() => {
    form.resetFields();
    if (open && values) {
      form.setFieldsValue(values);
      setInitialValues(form.getFieldsValue());
    }
  }, [open, values, form]);

  useEffect(() => {
    // 获取技能选项
    const fetchSkillOptions = async () => {
      try {
        const data = await getAllSkills(); // 添加 await
        const options = data.map((item: API.SkillItem) => ({
          label: item.name,
          value: item.name,
        }));
        console.log('options', options);
        setSkillOptions(options);
      } catch (error) {
        message.error('获取技能选项失败: ' + (error as Error).message);
      }
    };

    fetchSkillOptions();
  }, []);

  return (
    <ModalForm
      title={`${type === 'create' ? '新建' : '编辑'}开发者`}
      open={open}
      form={form}
      initialValues={{
        skills: [],
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
          console.log('values', values);
          // 如果是编辑模式且数据没有变化，则提示并返回
          if (type === 'update' && JSON.stringify(form.getFieldsValue()) === JSON.stringify(initialValues)) {
            showNoUpdateInfo();
            return true;
          }
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
          name="username"
          label="用户名"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 2, message: '用户名至少2个字符' },
            { max: 20, message: '用户名最多20个字符' },
          ]}
        />
        <ProFormText
          name="realName"
          label="真实姓名"
          rules={[
            { min: 2, message: '姓名至少2个字符' },
            { max: 20, message: '姓名最多20个字符' },
          ]}
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
            { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
          ]}
        />
        <ProFormSelect
          name="skills"
          label="技能"
          mode="multiple"
          options={skillOptions}
          rules={[
            { required: true, message: '请选择技能' }
          ]}
        />
        <ProFormTextArea
          name="bio"
          label="个人简介"
          rules={[
            { max: 500, message: '个人简介不能超过500字' }
          ]}
        />
      </Space>
    </ModalForm>
  );
};

export default UpdateForm;
