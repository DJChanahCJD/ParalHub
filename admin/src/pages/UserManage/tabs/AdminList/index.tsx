import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, message, Modal, Form, Input } from 'antd';
import { useRef, useState } from 'react';
import UpdateForm from './components/UpdateForm';
import { ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useModel } from '@umijs/max';
import { createWebsiteLink, ROUTES } from '@/utils/routes';
import {
  getAdminList,
  deleteAdmin,
  createAdmin,
  updateAdmin,
  outLogin,
  resetPassword,
  toggleAdminAccess,
} from '@/services/paral-hub/api';
import { TableLink } from '@/components/TableLink';

type AdminItem = API.AdminItem;

const AdminList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<Partial<AdminItem>>();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'update'>('create');

  const { initialState } = useModel('@@initialState');
  const isSuperAdmin = initialState?.currentUser?.access === 'super_admin';
  const currentUserId = initialState?.currentUser?._id;

  const [pageSize, setPageSize] = useState<number>(10);

  const handleDelete = (record: AdminItem) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除管理员 "${record.username}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        // TODO: 调用删除 API
        await deleteAdmin(record._id).then(() => {
          message.success('删除成功');
          actionRef.current?.reload();
        }).catch(() => {
          message.error('删除失败');
        });
      },
    });
  };

  const handleLogout = () => {
    message.warning('请重新登录');
    // 使用 async/await 确保顺序执行
    setTimeout(async () => {
      try {
        await outLogin();
        window.location.reload(); // 强制刷新页面
      } catch (error) {
        console.error('退出登录失败:', error);
        message.error('退出登录失败，请手动退出');
      }
    }, 1500); // 给一点时间显示成功消息
  }

  const [resetPasswordForm] = Form.useForm();

  const handleResetPassword = (record: AdminItem) => {
    Modal.confirm({
      title: '重置密码',
      icon: null,
      width: 500,
      content: (
        <Form form={resetPasswordForm} layout="vertical">
          <Form.Item
            name="password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码至少8个字符' },
              {
                pattern: /^(?=.*[a-zA-Z])(?=.*\d)[^]{8,}$/,
                message: '密码必须包含字母和数字',
              },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item
            name="confirm"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      ),
      async onOk() {
        try {
          // 验证表单
          const values = await resetPasswordForm.validateFields();
          // 调用重置密码 API
          await resetPassword({ userId: record._id, password: values.password });
          message.success('密码重置成功');
          if (currentUserId === record._id) { // 如果重置的是自己，则退出登录
            handleLogout();
          }
        } catch (error) {
          message.error('密码重置失败: ' + (error as Error).message);
        }
      },
      onCancel() {
        resetPasswordForm.resetFields();
      },
      okText: '确认重置',
      cancelText: '取消',
      maskClosable: true,
    });
  };

  const columns: ProColumns<AdminItem>[] = [
    {
      title: '用户名',
      dataIndex: 'username',
      width: 120,
      fixed: 'left',
      search: {
        transform: (value) => ({ username: value }), // 用户名搜索
      },
      render: (_, record) => {
        const profileLink = createWebsiteLink(ROUTES.WEBSITE.PROFILE, record._id);
        return <TableLink href={profileLink}>{record.username}</TableLink>;
      },
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 120,
      search: {
        transform: (value) => ({ email: value }), // 邮箱搜索
      },
    },
    {
      title: '电话',
      dataIndex: 'phone',
      width: 120,
      search: {
        transform: (value) => ({ phone: value }), // 电话搜索
      },
    },
    {
      title: '权限',
      dataIndex: 'access',
      width: 120,
      valueEnum: {
        super_admin: { text: '超级管理员', status: 'error' },
        admin: { text: '管理员', status: 'processing' },
      },
      search: {
        transform: (value) => ({ access: value }), // 权限筛选
      },
    },
    {
      title: '订阅数',
      dataIndex: 'followerCount',
      width: 120,
      search: false,
      sorter: true,
    },
    {
      title: '上次登录',
      dataIndex: 'lastLogin',
      width: 160,
      valueType: 'dateTime',
      sorter: true,
      search: false,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      valueType: 'dateTime',
      sorter: true,
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      fixed: 'right',
      width: 180,
      render: (_, record) => {
        const isSelf = record._id === currentUserId;

        return [
          <Button
            key="edit"
            type="link"
            disabled={!isSuperAdmin && !isSelf}
            onClick={() => {
              setCurrentRow(record);
              setModalType('update');
              setModalVisible(true);
            }}
          >
            编辑
          </Button>,
          <Button
            key="reset"
            type="link"
            disabled={!isSuperAdmin && !isSelf}
            onClick={() => handleResetPassword(record)}
          >
            重置密码
          </Button>,
          <Button
            key="delete"
            type="link"
            danger
            disabled={!isSuperAdmin || isSelf}  // 超级管理员和管理员都不能删除自己
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>,
        ];
      },
    },
  ];

  return (
    <>
      <ProTable<AdminItem>
        headerTitle="管理员列表"
        actionRef={actionRef}
        rowKey="id"
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            onClick={() => {
              if (!isSuperAdmin) {
                message.error('权限不足');
                return;
              }
              setModalType('create');
              setModalVisible(true);
            }}
          >
            <PlusOutlined /> 新建
          </Button>,
        ]}
        pagination={{
          defaultPageSize: 10,
          pageSize: pageSize,
          showSizeChanger: true,
          showQuickJumper: true,
          onChange: (current, size) => {
            if (size !== pageSize) {
              setPageSize(size);
            }
            console.log('分页变化 - 页码:', current, '每页条数:', size);
            actionRef.current?.reload();
          },
          onShowSizeChange: (current, size) => {
            setPageSize(size);
            console.log('每页条数变化:', size);
            actionRef.current?.reload();
          },
        }}
        request={async (params, sort) => {
          const queryParams = {
            current: params.current || 1,
            pageSize: pageSize,
            // 搜索条件
            username: params.username,
            email: params.email,
            phone: params.phone,
            access: params.access,
            // 排序
            sortField: Object.keys(sort || {})[0],
            sortOrder: Object.values(sort || {})[0] as 'ascend' | 'descend',
          };

          console.log('请求参数:', queryParams);
          const adminList = await getAdminList(queryParams);
          return adminList;
        }}
        columns={columns}
        scroll={{ x: 1500 }}
      />
      <UpdateForm
        type={modalType}
        open={modalVisible}
        values={modalType === 'update' ? currentRow : undefined}
        currentUserId={currentUserId}
        onCancel={() => {
          setModalVisible(false);
          setCurrentRow(undefined);
          console.log('cancel currentRow:', currentRow);
        }}
        onSubmit={async (values) => {
          try {
            let byId = '';
            if (modalType === 'create') {
              console.log('create:', values);
              await createAdmin(values as Partial<API.AdminItem>);
            } else {  //  modalType === 'update'
              console.log('update:', values);

              const isPromotingToSuperAdmin = currentRow?.access !== 'super_admin' && values.access === 'super_admin';  // 当前行新值为超级管理员，则需要转移权限
              byId = isPromotingToSuperAdmin ? currentUserId as string : '';
              await updateAdmin(currentRow?._id as string, values as API.AdminItem);
              if (isPromotingToSuperAdmin) {  // 转移权限
                await toggleAdminAccess(byId);
              }
            }

            message.success(`${modalType === 'create' ? '创建' : '更新'}成功`);
            setModalVisible(false);
            actionRef.current?.reload();

            console.log('byId:', byId);
            // 如果需要退出登录
            if (byId !== '') {
              handleLogout();
            }
          } catch (error) {
            console.error('操作失败:', error);
            message.error('操作失败: ' + (error as Error).message);
          }
        }}
      />
    </>
  );
};

export default AdminList;
