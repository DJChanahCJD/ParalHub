import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, message, Modal, Space } from 'antd';
import { useRef, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import UpdateForm from './UpdateForm';

interface BaseListProps<T = any> {
  title: string;
  itemName: string;
  getList: (params: API.PageParams) => Promise<API.PageResult<T>>;
  createItem: (data: Partial<T>) => Promise<void>;
  updateItem: (id: string, data: Partial<T>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

const BaseList = <T extends { _id: string; name: string }>({
  title,
  itemName,
  getList,
  createItem,
  updateItem,
  deleteItem,
}: BaseListProps<T>) => {
  const actionRef = useRef<ActionType>();
  const [updateModalOpen, setUpdateModalOpen] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<any>();
  const [modalType, setModalType] = useState<'create' | 'update'>('create');
  const [pageSize, setPageSize] = useState<number>(10);

  const handleEdit = (record: any) => {
    setCurrentRow(record);
    setModalType('update');
    setUpdateModalOpen(true);
  };

  const handleDelete = (record: any) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 ${record.name} 这个${itemName}吗？`,
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteItem(record._id);
        actionRef.current?.reload();
        message.success('删除成功');
      },
    });
  };

  const columns: ProColumns<any>[] = [
    {
      title: `${itemName}名称`,
      dataIndex: 'name',
      ellipsis: true,
      width: '40%',
      search: {
        transform: (value) => ({ name: value })
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      valueType: 'dateTime',
      width: '30%',
      search: false,
      sorter: true,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      width: '30%',
      render: (_, record) => (
        <Space size="middle">
          <a key="edit" onClick={() => handleEdit(record)}>编辑</a>
          <a key="delete" style={{ color: '#ff4d4f' }} onClick={() => handleDelete(record)}>删除</a>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable
        headerTitle={title}
        actionRef={actionRef}
        rowKey="_id"
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="add"
            onClick={() => {
              setModalType('create');
              setCurrentRow(undefined);
              setUpdateModalOpen(true);
            }}
          >
            <PlusOutlined /> 新建{itemName}
          </Button>,
        ]}
        request={async (params, sort) => {
          const queryParams = {
            current: params.current || 1,
            pageSize: pageSize,
            ...params,
            sortField: Object.keys(sort || {})[0],
            sortOrder: Object.values(sort || {})[0],
          };

          console.log('请求参数:', queryParams);
          const response = await getList(queryParams);
          return {
            data: response.data || [],
            success: true,
            total: response.total || 0,
            pageSize: response.pageSize,
            current: response.current,
          };
        }}
        columns={columns}
        pagination={{
          pageSize,
          showSizeChanger: true,
          showQuickJumper: true,
          onChange: (_, size) => {
            if (size !== pageSize) {
              setPageSize(size);
            }
            actionRef.current?.reload();
          },
        }}
        dateFormatter="string"
        cardBordered
      />
      <UpdateForm
        type={modalType}
        itemName={itemName}
        open={updateModalOpen}
        values={modalType === 'update' ? currentRow : undefined}
        onCancel={() => {
          setUpdateModalOpen(false);
          setCurrentRow(undefined);
        }}
        onSubmit={async (value: string) => {
          try {
            if (currentRow?._id) {
              await updateItem(currentRow._id, { name: value } as Partial<T>);
            } else {
              await createItem({ name: value } as Partial<T>);
            }
            setUpdateModalOpen(false);
            actionRef.current?.reload();
            message.success('操作成功');
          } catch (error) {
            message.error('操作失败: ' + (error as Error).message);
          }
        }}
      />
    </>
  );
};

export default BaseList;
