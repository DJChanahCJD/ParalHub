import {
  ModalForm,
  ProForm,
  ProFormDateTimePicker,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Form } from 'antd';
import React from 'react';

export type NoticeFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish: (values: API.NoticeItem) => Promise<void>;
  initialValues?: Partial<API.NoticeItem>;
  title?: string;
};

const NoticeForm: React.FC<NoticeFormProps> = ({
  open,
  onOpenChange,
  onFinish,
  initialValues,
  title = '新建公告',
}) => {
  const [form] = Form.useForm();

  return (
    <ModalForm
      title={title}
      open={open}
      form={form}
      onOpenChange={onOpenChange}
      onFinish={async (values) => {
        await onFinish(values);
        form.resetFields();
      }}
      initialValues={initialValues}
      modalProps={{
        destroyOnClose: true,
        maskClosable: false,
      }}
      width={600}
    >
      <ProForm.Group>
        <ProFormText
          name="title"
          label="标题"
          width="xl"
          rules={[{ required: true, message: '请输入公告标题' }]}
        />
        <ProFormSelect
          name="type"
          label="公告类型"
          width="md"
          valueEnum={{
            system: { text: '🔔系统通知' },
            announcement: { text: '📢公告' },
            notification: { text: '✉️消息提醒' },
          }}
          rules={[{ required: true, message: '请选择公告类型' }]}
        />
      </ProForm.Group>

      <ProFormTextArea
        name="content"
        label="内容"
        rules={[{ required: true, message: '请输入公告内容' }]}
      />

      <ProForm.Group>
        <ProFormSelect
          name="target"
          label="接收者范围"
          width="md"
          valueEnum={{
            all: { text: '👥所有用户' },
            enterprise: { text: '🏢企业用户' },
            developer: { text: '👨‍💻开发者' },
          }}
          rules={[{ required: true, message: '请选择接收者范围' }]}
        />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormDateTimePicker
          name="expireTime"
          label="过期时间"
          width="md"
          rules={[{ required: true, message: '请选择过期时间' }]}
        />
      </ProForm.Group>
    </ModalForm>
  );
};

export default NoticeForm;
