import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Modal, Tag, message, Avatar } from 'antd';
import { useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { getCases, deleteCase, addCase, updateCase } from '@/services/paral-hub/case';
import CaseForm from './components/UpdateForm';
import { TableLink } from '@/components/TableLink';
import { ROUTES, createWebsiteLink } from '@/utils/routes';
import { getTagList } from '@/services/paral-hub/common';
import { handleBatchDelete } from '@/utils/batchDelete';

const CasePage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [pageSize, setPageSize] = useState<number>(10);
  // 新增状态管理
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<API.CaseItem>();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isBatchCreate, setIsBatchCreate] = useState(false);

  // 处理新建
  const handleAdd = async (values: Partial<API.CaseItem>) => {
    try {
      await addCase(values);
      message.success('创建成功');
      setCreateModalOpen(false);
      actionRef.current?.reload();
    } catch (error: unknown) {
      message.error('创建失败：' + (error as Error).message);
    }
  };

  // 处理编辑
  const handleUpdate = async (values: Partial<API.CaseItem>) => {
    if (!currentRow?._id) return;
    try {
      await updateCase(currentRow._id, values);
      message.success('更新成功');
      setUpdateModalOpen(false);
      actionRef.current?.reload();
    } catch (error: unknown) {
      message.error('更新失败：' + (error as Error).message);
    }
  };

  // 处理删除
  const handleDelete = async (id: string) => {
    try {
      await deleteCase(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch (error: unknown) {
      message.error('删除失败：' + (error as Error).message);
    }
  };

  // 处理批量新建
  const handleBatchAdd = async (values: Partial<API.CaseItem>) => {
    try {
      // 创建10个相同的案例
      const promises = Array(10).fill(null).map((_, index) => {
        const batchValues = {
          ...values,
          title: `${values.title}_${index + 1}`, // 添加序号
        };
        return addCase(batchValues);
      });

      await Promise.all(promises);
      message.success('批量创建10个案例成功');
      setCreateModalOpen(false);
      actionRef.current?.reload();
    } catch (error: unknown) {
      message.error('批量创建失败：' + (error as Error).message);
    }
  };

  // 定义表格列
  const columns: ProColumns<API.CaseItem>[] = [
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
        <TableLink href={createWebsiteLink(ROUTES.WEBSITE.CASE, record._id)}>
          {record.title}
        </TableLink>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      width: 300,
      fieldProps: {
        placeholder: '请输入描述',
      },
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
        return response.data.map(tag => ({
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
        placeholder: '请输入内容',
      },
    },
    {
      title: '收藏数',
      dataIndex: 'stars',
      width: 100,
      sorter: true,
      search: false,
      valueType: 'digit',
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
              content: '确定要删除这个案例吗？',
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
      <ProTable<API.CaseItem>
        headerTitle="案例管理"
        actionRef={actionRef}
        rowKey="_id"
        toolBarRender={() => [
          selectedRows.length > 0 && (
            <Button
              key="batch-delete"
              danger
              onClick={() => handleBatchDelete({
                ids: selectedRows,
                actionRef,
                deleteFn: deleteCase,
                itemName: '案例',
              })}
            >
              批量删除
            </Button>
          ),
          <Button
            key="batch-create"
            onClick={() => {
              setCreateModalOpen(true);
              setIsBatchCreate(true);
            }}
          >
            批量新建
          </Button>,
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setCreateModalOpen(true);
              setIsBatchCreate(false);
            }}
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
            console.log('分页变化 - 页码:', current, '每页条数:', size);
            actionRef.current?.reload();
          },
        }}
        request={async (params, sort) => {
          const { authorId, ...restParams } = params;
          const queryParams = {
            current: params.current || 1,
            pageSize: params.pageSize || 10,
            ...(authorId?._id && { authorId: authorId._id }),
            ...restParams,
            sortField: Object.keys(sort || {})[0],
            sortOrder: Object.values(sort || {})[0] as 'ascend' | 'descend' | undefined,
          };

          console.log('请求参数:', queryParams);

          const response = await getCases(queryParams);
          return {
            data: response.items,
            success: true,
            total: response.total,
          };
        }}
        columns={columns}
        scroll={{ x: 1500 }}
        rowSelection={{
          onChange: (selectedRowKeys) => {
            setSelectedRows(selectedRowKeys as string[]);
          },
        }}
      />

      {/* 新建/批量新建表单 */}
      <CaseForm
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onFinish={isBatchCreate ? handleBatchAdd : handleAdd}
        title={isBatchCreate ? "批量新建案例" : "新建案例"}
      />

      {/* 编辑表单 */}
      <CaseForm
        open={updateModalOpen}
        onOpenChange={setUpdateModalOpen}
        onFinish={handleUpdate}
        initialValues={currentRow}
        title="编辑案例"
      />
    </PageContainer>
  );
};

export default CasePage;
