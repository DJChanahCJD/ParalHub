import {
  ModalForm,
  ProFormText,
  ProFormRadio,
} from '@ant-design/pro-components';
import { Button, Form, Space, Modal, Typography, message } from 'antd';
import { useEffect, useState } from 'react';

const { Text } = Typography;

// 组件属性类型定义
export type UpdateFormProps = {
  onCancel: () => void;
  onSubmit: (values: Partial<API.AdminItem>) => Promise<void>;
  open: boolean;
  values?: Partial<API.AdminItem>;
  type: 'create' | 'update';
  currentUserId?: string;
};

const UpdateForm: React.FC<UpdateFormProps> = ({
  onCancel,
  onSubmit,
  open,
  values,
  type,
  currentUserId,
}) => {
  const [form] = Form.useForm();
  const [originalAccess, setOriginalAccess] = useState<string>();
  const [originalValues, setOriginalValues] = useState<Partial<API.AdminItem>>();

  // 表单数据初始化
  useEffect(() => {
    form.resetFields();
    if (open && values) {
      form.setFieldsValue(values);
      setOriginalAccess(values.access);
      setOriginalValues(values);  // 保存原始值
      console.log('adminlist UpdateForm form.setFieldsValue:', values);
    }
  }, [open, values, form]);


  // 是否编辑自己的信息
  const isEditSelf = values?._id === currentUserId;
  
  // 处理表单提交前的确认
  const handleSubmit = async (formValues: any) => {
    // 1. 检查数据是否有更新
    if (type === 'update') {
      const hasChanged = Object.keys(formValues).some(
        key => formValues[key] !== (originalValues as any)?.[key]
      );

      if (!hasChanged) {
        message.info('数据未变更，无需更新');
        return true; // 关闭modal但不调用onSubmit
      }
    }

    // 2. 如果是超级管理员更新自己的信息，保持原有权限
    if (type === 'update' && values?._id === currentUserId && values?.access === 'super_admin') {
      formValues.access = 'super_admin';  // 强制保持super_admin权限
    }

    // 3. 处理权限转移确认
    if (formValues.access === 'super_admin' && originalAccess !== 'super_admin') {
      try {
        const confirmed = await new Promise<boolean>((resolve) => {
          Modal.confirm({
            title: '转移超级管理员权限',
            content: (
              <div style={{ padding: '16px 0' }}>
                确定要将超级管理员权限转移给
                <Text strong style={{ color: '#1890ff', margin: '0 4px' }}>
                  {formValues.username}
                </Text>
                吗？
                <br />
                <Text type="danger" style={{ marginTop: '8px', display: 'block' }}>
                  转移后您将变成普通管理员，且需要重新登录。
                </Text>
              </div>
            ),
            centered: true,
            maskClosable: false,
            width: 420,
            okText: '确认转移',
            cancelText: '取消',
            okButtonProps: {
              danger: true,
            },
            onOk: () => resolve(true),
            onCancel: () => resolve(false)  // 明确返回 false
          });
        });

        if (!confirmed) {
          return false; // 如果用户取消，则停止提交
        }
      } catch (error) {
        console.error('权限转移过程出错:', error);
        return false; // 发生错误时也停止提交
      }
    }
    // 4. 提交更新后的数据
    return onSubmit(formValues);
  };

  return (
    <ModalForm
      title={`${type === 'create' ? '新建' : '编辑'}管理员`}
      open={open}
      form={form}
      initialValues={{
        status: true,
        access: values?.access || 'admin',
        ...(type === 'create' ? values : {}),
      }}
      submitter={
        type === 'create'
          ? {
              render: (props, dom) => [
                <Button key="reset" onClick={() => form.resetFields()}>
                  重置
                </Button>,
                ...dom,
              ],
            }
          : undefined
      }
      onOpenChange={(visible) => {
        if (!visible) {
          form.resetFields();
          setOriginalAccess(undefined);
          onCancel();
        }
      }}
      onFinish={async (values) => {
        const result = await handleSubmit(values);
        if (result) {
          form.resetFields();
          return true; // 关闭modal
        }
        return false; // 保持modal开启
      }}
      width={640}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* 用户名 */}
        <ProFormText
          name="username"
          label="用户名"
          rules={[
            { required: true, message: '请输入用户名（不用于登录）' },
            { min: 2, message: '用户名至少2个字符' },
            { max: 20, message: '用户名最多20个字符' },
            {
              pattern: /^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/,
              message: '用户名只能包含中英文、数字、下划线和横线',
            },
          ]}
        />
        {/* 邮箱 */}
        <ProFormText
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱（用于登录）' },
            { type: 'email', message: '请输入有效的邮箱地址' },
          ]}
        />
         {/* 密码，仅在创建时显示 */}
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
        {/* 手机号 */}
        <ProFormText
          name="phone"
          label="手机号"
          rules={[
            { required: false, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
          ]}
        />
        {/* 权限选择 */}
        <ProFormRadio.Group
          name="access"
          label="权限"
          rules={[{ required: true, message: '请选择权限' }]}
          options={[
            { label: '管理员', value: 'admin' },
            { label: '超级管理员', value: 'super_admin' },
          ]}
          disabled={isEditSelf || type === 'create' }
          tooltip='如需转移权限，请编辑其他管理员并设置为超级管理员'
          initialValue={values?.access || 'admin'}
        />
      </Space>
    </ModalForm>
  );
};

export default UpdateForm;
