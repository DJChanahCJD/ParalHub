import { PlusOutlined, BuildOutlined, UserOutlined } from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Modal, Tag, message, Avatar } from 'antd';
import { useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { getArticles, deleteArticle, addArticle, updateArticle } from '@/services/paral-hub/article';
import ArticleForm from './components/UpdateForm';
import { getCases } from '@/services/paral-hub/case';
import { getTagList } from '@/services/paral-hub/common';
import { TableLink } from '@/components/TableLink';
import { ROUTES, createWebsiteLink } from '@/utils/routes';
import { handleBatchDelete } from '@/utils/batchDelete';
const ArticlePage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [pageSize, setPageSize] = useState<number>(10);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<API.ArticleItem>();

  // CRUD 处理函数
  const handleAdd = async (values: Partial<API.ArticleItem>) => {
    try {
      await addArticle(values);
      message.success('创建成功');
      setCreateModalOpen(false);
      actionRef.current?.reload();
    } catch (error: any) {
      message.error('创建失败：' + error.message);
    }
  };

  const handleUpdate = async (values: Partial<API.ArticleItem>) => {
    if (!currentRow?._id) return;
    try {
      await updateArticle(currentRow._id, values);
      message.success('更新成功');
      setUpdateModalOpen(false);
      actionRef.current?.reload();
    } catch (error: any) {
      message.error('更新失败：' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteArticle(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch (error: any) {
      message.error('删除失败：' + error.message);
    }
  };

  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // 定义表格列
  const columns: ProColumns<API.ArticleItem>[] = [
    {
      title: '作者',
      dataIndex: ['authorId', 'username'],
      width: 120,
      ellipsis: true,
      fixed: 'left',
      search: false,
      render: (_, record) => (
        <TableLink
          href={createWebsiteLink(ROUTES.WEBSITE.PROFILE, record.authorId?._id)}
          className="flex items-center gap-2"
        >
          <Avatar
            size="small"
            src={record.authorId?.avatar}
            icon={<UserOutlined />}
          >
            {record.authorId?.username?.slice(0, 1).toUpperCase()}
          </Avatar>
          {record.authorId?.username || '-'}
        </TableLink>
      ),
    },
    {
      title: '作者ID',
      dataIndex: ['authorId', '_id'],
      width: 120,
      fieldProps: {
        placeholder: '请输入作者ID',
      },
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
      width: 200,
      fieldProps: {
        placeholder: '请输入标题',
      },
      render: (_, record) => (
        <TableLink href={createWebsiteLink(`case/${record.caseId?._id}?tab=articles&articleId=${record._id}`)}>
          {record.title}
        </TableLink>
      ),
    },
    {
      title: '关联案例',
      dataIndex: ['caseId', 'title'],
      width: 200,
      ellipsis: true,
      search: {
        transform: (value) => ({ caseId: value }),
      },
      valueType: 'select',
      fieldProps: {
        showSearch: true,
        placeholder: '请选择关联案例',
      },
      request: async () => {
        const { items } = await getCases({ pageSize: 999 });
        return items.map(item => ({
          label: item.title,
          value: item._id,
        }));
      },
      render: (_, record) => (
        <TableLink
          href={createWebsiteLink(ROUTES.WEBSITE.CASE, record.caseId?._id)}
          className="flex items-center gap-2"
        >
          <BuildOutlined style={{ fontSize: '16px' }} />
          {' '}
          {record.caseId?.title || '-'}
        </TableLink>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      width: 200,
      render: (_, record) => (
        <>
          {record.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </>
      ),
      valueType: 'select',
      fieldProps: {
        mode: 'multiple',
        placeholder: '请选择标签',
        showSearch: true,
      },
      request: async () => {
        const response = await getTagList({ pageSize: 999 });
        return response.data.map((tag) => ({
          label: tag.name,
          value: tag.name,
        }));
      },
    },
    {
      title: '内容',
      dataIndex: 'content',
      width: 200,
      ellipsis: true,
      fieldProps: {
        placeholder: '请输入内容关键词',
      },
      render: (_, record) => {
        const text = record.content as string;
        return text?.length > 50 ? `${text.slice(0, 50)}...` : text;
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
      title: '评论数',
      dataIndex: 'comments',
      width: 100,
      sorter: true,
      search: false,
    },
    {
      title: '浏览量',
      dataIndex: 'views',
      width: 100,
      sorter: true,
      search: false,
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
      title: '更新时间',
      dataIndex: 'updatedAt',
      valueType: 'dateTime',
      width: 160,
      sorter: true,
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
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
        <Button
          key="delete"
          type="link"
          danger
          onClick={() => {
            Modal.confirm({
              title: '确认删除',
              content: '确定要删除这篇文章吗？',
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
      <ProTable<API.ArticleItem>
        headerTitle="文章管理"
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
                deleteFn: deleteArticle,
                itemName: '文章',
              })}
            >
              批量删除
            </Button>
          ),
          <Button
            key="button"
            icon={<PlusOutlined />}
            type="primary"
            onClick={() => setCreateModalOpen(true)}
          >
            新建
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
          const { current, pageSize, authorId, ...restParams } = params;
          console.log('params from getArticles: ', params);
          const queryParams = {
            current,
            pageSize,
            ...(authorId?._id && { authorId: authorId._id }),
            ...restParams,
            sortField: Object.keys(sort || {})[0],
            sortOrder: Object.values(sort || {})[0] as 'ascend' | 'descend',
          };

          console.log('处理后的查询参数:', queryParams);

          const response = await getArticles(queryParams);
          return {
            data: response.items,
            success: true,
            total: response.total,
          };
        }}
        columns={columns}
        scroll={{ x: 1500 }}
      />

      <ArticleForm
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onFinish={handleAdd}
        title="新建文章"
      />

      <ArticleForm
        open={updateModalOpen}
        onOpenChange={setUpdateModalOpen}
        onFinish={handleUpdate}
        initialValues={currentRow}
        title="编辑文章"
      />
    </PageContainer>
  );
};

export default ArticlePage;
