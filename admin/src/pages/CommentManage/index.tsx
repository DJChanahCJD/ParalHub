import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Modal, message, Avatar } from 'antd';
import { useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { UserOutlined, FileTextOutlined, PlusOutlined } from '@ant-design/icons';
import { TableLink } from '@/components/TableLink';
import { ROUTES, createWebsiteLink } from '@/utils/routes';
import { handleBatchDelete } from '@/utils/batchDelete';
import { deleteComment, getComments, addComment } from '@/services/paral-hub/comment';
import { getArticles } from '@/services/paral-hub/article';
import CommentForm from './components/CommentForm';

// 评论管理页面组件
const CommentManage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // 删除评论处理函数
  const handleDelete = async (id: string) => {
    try {
      await deleteComment(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch (error: any) {
      message.error('删除失败：' + error.message);
    }
  };

  // 添加评论处理函数
  const handleAdd = async (values: API.CommentItem) => {
    try {
      const res = await addComment(values);
      console.log('res from addComment', res);
      message.success('创建成功');
      setCreateModalOpen(false);
      actionRef.current?.reload();
    } catch (error: any) {
      message.error('创建失败：' + error.message);
    }
  };

  // 定义表格列
  const columns: ProColumns<API.CommentItem>[] = [
    {
      title: '评论者',
      dataIndex: ['userId', 'username'],
      width: 120,
      ellipsis: true,
      fixed: 'left',
      search: {
        transform: (value) => ({ 'userId.username': value }),
      },
      render: (_, record) => (
        <TableLink
          href={createWebsiteLink(ROUTES.WEBSITE.PROFILE, record.userId?._id)}
          className="flex items-center gap-2"
        >
          <Avatar
            size="small"
            src={record.userId?.avatar}
            icon={<UserOutlined />}
          >
            {record.userId?.username?.slice(0, 1).toUpperCase()}
          </Avatar>
          {record.userId?.username || '-'}
        </TableLink>
      ),
    },
    {
      title: '关联文章',
      dataIndex: ['articleId', 'title'],
      width: 200,
      ellipsis: true,
      search: {
        transform: (value) => ({ 'articleId.title': value }),
      },
      valueType: 'select',
      fieldProps: {
        showSearch: true,
        placeholder: '请选择关联文章',
      },
      request: async () => {
        const { items } = await getArticles({ pageSize: 999 });
        return items.map((item: API.ArticleItem) => ({
          label: item.title,
          value: item._id,
        }));
      },
      render: (_, record) => (
        <TableLink
          href={createWebsiteLink(ROUTES.WEBSITE.ARTICLE, record.articleId?._id)}
          className="flex items-center gap-2"
        >
          <FileTextOutlined />
          {record.articleId?.title || '-'}
        </TableLink>
      ),
    },
    {
      title: '评论内容',
      dataIndex: 'content',
      width: 300,
      ellipsis: true,
      search: {
        transform: (value) => ({ content: value }),
      },
    },
    {
      title: '评论类型',
      dataIndex: 'type',
      width: 100,
      valueEnum: {
        comment: { text: '💬主评论', status: 'Success' },
        reply: { text: '↩️回复', status: 'Default' },
      },
    },
    {
      title: '点赞数',
      dataIndex: 'likes',
      width: 100,
      sorter: true,
      search: false,
    },
    {
      title: '回复数',
      dataIndex: 'replyCount',
      width: 100,
      sorter: true,
      search: false,
      render: (_, record) => (record.type === 'comment' ? record.replyCount : '-'),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      width: 160,
      sorter: true,
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      fixed: 'right',
      render: (_, record) => [
        <Button
          key="delete"
          type="link"
          danger
          onClick={() => {
            Modal.confirm({
              title: '确认删除',
              content: '确定要删除这条评论吗？',
              onOk: () => handleDelete(record._id),
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
      <ProTable<API.CommentItem>
        headerTitle="评论管理"
        actionRef={actionRef}
        rowKey="_id"
        rowSelection={{
          onChange: (selectedRowKeys) => {
            setSelectedRows(selectedRowKeys as string[]);
          },
        }}
        toolBarRender={() => [
          selectedRows.length > 0 && (
            <Button
              key="batch-delete"
              danger
              onClick={() => handleBatchDelete({
                ids: selectedRows,
                actionRef: actionRef,
                deleteFn: deleteComment,
                itemName: '评论',
              })}
            >
              批量删除
            </Button>
          ),
          <Button
            key="add"
            icon={<PlusOutlined />}
            type="primary"
            onClick={() => setCreateModalOpen(true)}
          >
            新建评论
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
          },
        }}
        request={async (params, sort) => {
          const { current, pageSize, ...restParams } = params;
          const queryParams = {
            current,
            pageSize,
            ...restParams,
            sortField: Object.keys(sort || {})[0],
            sortOrder: Object.values(sort || {})[0] as 'ascend' | 'descend',
          };

          const response = await getComments(queryParams);
          console.log('response from getComments', response);
          return {
            data: response.items,
            success: true,
            total: response.total,
          };
        }}
        columns={columns}
        scroll={{ x: 1500 }}
      />

      <CommentForm
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onFinish={handleAdd}
        title="新建评论"
      />
    </PageContainer>
  );
};

export default CommentManage;
