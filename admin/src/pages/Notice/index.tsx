import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Modal, message, Tag, Avatar } from 'antd';
import { useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { getNotices, createNotice, updateNotice, deleteNotice, publishNotice, withdrawNotice } from '@/services/paral-hub/notice';
import NoticeForm from './components/UpdateForm';
import { handleBatchDelete } from '@/utils/batchDelete';
import { TableLink } from '@/components/TableLink';
import { createWebsiteLink, ROUTES } from '@/utils/routes';

const NoticePage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<API.NoticeItem>();

  // 处理新建
  const handleAdd = async (values: API.NoticeItem) => {
    try {
      await createNotice(values);
      message.success('创建成功');
      setCreateModalOpen(false);
      actionRef.current?.reload();
    } catch (error: any) {
      message.error('创建失败：' + error.message);
    }
  };

  // 处理更新
  const handleUpdate = async (values: API.NoticeItem) => {
    try {
      await updateNotice(currentRow!._id, values);
      await publishNotice(currentRow!._id);
      message.success('更新并发布成功');
      setUpdateModalOpen(false);
      actionRef.current?.reload();
    } catch (error: any) {
      message.error('更新失败：' + error.message);
    }
  };

  // 处理发布
  const handlePublish = async (id: string) => {
    try {
      await publishNotice(id);
      message.success('发布成功');
      actionRef.current?.reload();
    } catch (error: any) {
      message.error('发布失败：' + error.message);
    }
  };

  // 处理撤回
  const handleWithdraw = async (id: string) => {
    try {
      await withdrawNotice(id);
      message.success('撤回成功');
      actionRef.current?.reload();
    } catch (error: any) {
      message.error('撤回失败：' + error.message);
    }
  };

  // 添加一个辅助函数来处理过期状态
  const getExpirationStatus = (expireTime: string | undefined) => {
    if (!expireTime) return null;

    const now = new Date().getTime();
    const expireDate = new Date(expireTime).getTime();
    const oneDay = 24 * 60 * 60 * 1000; // 一天的毫秒数

    if (now > expireDate) {
      return <Tag color="error">已过期</Tag>;
    } else if (expireDate - now < oneDay) {
      return <Tag color="warning">即将过期</Tag>;
    }
    return null;
  };

  const columns: ProColumns<API.NoticeItem>[] = [
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
      width: 200,
      fixed: 'left',
      fieldProps: {
        placeholder: '请输入标题关键词',
      },
    },
    {
      title: '公告类型',
      dataIndex: 'type',
      width: 120,
      valueType: 'select',
      valueEnum: {
        system: { text: '🔔系统通知', status: 'Error' },
        announcement: { text: '📢公告', status: 'Warning' },
        notification: { text: '✉️消息提醒', status: 'Processing' },
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        draft: { text: '🚧草稿', status: 'Default' },
        published: { text: '✅已发布', status: 'Success' },
        expired: { text: '❌已过期', status: 'Error' },
      },
    },
    {
      title: '接收对象',
      dataIndex: 'target',
      width: 120,
      valueEnum: {
        all: { text: '👥所有用户', status: 'Processing' },
        enterprise: { text: '🏢企业用户', status: 'Warning' },
        developer: { text: '👨‍💻开发者', status: 'Success' },
      },
    },
    {
      title: '发布时间',
      dataIndex: 'publishTime',
      valueType: 'dateTime',
      width: 160,
      search: false,
      sorter: true,
    },
    {
      title: '过期时间',
      dataIndex: 'expireTime',
      valueType: 'dateTime',
      width: 160,
      search: false,
      sorter: true,
      render: (_, record) => (
        <span>
          {record.expireTime}{' '}
          {getExpirationStatus(record.expireTime)}
        </span>
      ),
    },
    {
      title: '创建人',
      dataIndex: ['creator', 'username'],
      width: 100,
      render: (_, record) => (
        <TableLink
          href={createWebsiteLink(ROUTES.WEBSITE.PROFILE, record.creator?._id)}
          className="flex items-center gap-2"
        >
          <Avatar
            size="small"
            src={record.creator?.avatar}
            icon={<UserOutlined />}
          >
            {record.creator?.username?.slice(0, 1).toUpperCase()}
          </Avatar>
          {record.creator?.username || '-'}
        </TableLink>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      width: 160,
      search: false,
      sorter: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      fixed: 'right',
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          onClick={() => {
            setCurrentRow(record);
            setUpdateModalOpen(true);
          }}
        >
          编辑
        </Button>,
        record.status === 'draft' ? (
          <Button
            key="publish"
            type="link"
            onClick={() => handlePublish(record._id)}
          >
            发布
          </Button>
        ) : (
          <Button
            key="withdraw"
            type="link"
            onClick={() => {
              Modal.confirm({
                title: '确认撤回',
                content: '撤回后公告将变为草稿状态，确定要撤回吗？',
                onOk: () => handleWithdraw(record._id),
              });
            }}
          >
            撤回
          </Button>
        ),
        <Button
          key="delete"
          type="link"
          danger
          onClick={() => {
            Modal.confirm({
              title: '确认删除',
              content: '确定要删除该公告吗？',
              onOk: async () => {
                await deleteNotice(record._id);
                message.success('删除成功');
                actionRef.current?.reload();
              },
            });
          }}
        >
          删除
        </Button>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.NoticeItem>
        headerTitle="公告管理"
        actionRef={actionRef}
        rowKey="_id"
        rowSelection={{
          onChange: (_, selectedRows) => {
            setSelectedRows(selectedRows.map(row => row._id));
          },
        }}
        toolBarRender={() => [
          selectedRows.length > 0 && (
            <Button
              key="batch-delete"
              danger
              onClick={() => {
                handleBatchDelete({
                  ids: selectedRows,
                  actionRef,
                  deleteFn: (ids) => deleteNotice(ids),
                  itemName: '公告',
                });
              }}
            >
              批量删除
            </Button>
          ),
          <Button
            key="create"
            type="primary"
            onClick={() => setCreateModalOpen(true)}
          >
            <PlusOutlined /> 新建公告
          </Button>,
        ]}
        request={async (params, sort) => {
          const { current, pageSize, title, content, type, status, target, ...rest } = params;

          const queryParams: API.NoticeParams = {
            current,
            pageSize,
            title,
            content,
            type,
            status,
            target: target || 'all',
            sortField: Object.keys(sort || {})[0],
            sortOrder: Object.values(sort || {})[0] as 'ascend' | 'descend',
            username: currentRow?.creator?.username,
            ...rest,
          };

          const res = await getNotices(queryParams);
          console.log('res from notice page', res);
          return {
            data: res.data,
            success: true,
            total: res.total,
          };
        }}
        columns={columns}
        scroll={{ x: 1500 }}
      />

      <NoticeForm
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onFinish={handleAdd}
        title="新建公告"
      />

      <NoticeForm
        open={updateModalOpen}
        onOpenChange={setUpdateModalOpen}
        onFinish={handleUpdate}
        initialValues={currentRow}
        title="编辑公告"
      />
    </PageContainer>
  );
};

export default NoticePage;
