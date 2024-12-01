import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, message, Modal, Tag } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import UpdateForm from './components/UpdateForm';
import { getDeveloperList, deleteDeveloper, createDeveloper, updateDeveloper } from '@/services/paral-hub/developer';
import { getAllSkills } from '@/services/paral-hub/common';
import { createWebsiteLink, ROUTES } from '@/utils/routes';
import { TableLink } from '@/components/TableLink';

const DeveloperList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<Partial<API.DeveloperItem>>();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'update'>('create');
  const [pageSize, setPageSize] = useState<number>(10);
  const [skills, setSkills] = useState<API.SkillItem[]>([]);

  useEffect(() => {
    getAllSkills().then(res => setSkills(res));
  }, []);

  const handleDelete = (record: API.DeveloperItem) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除开发者 "${record.username}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteDeveloper(record._id);
          message.success('删除成功');
          actionRef.current?.reload();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const columns: ProColumns<API.DeveloperItem>[] = [
    {
      title: '用户名',
      dataIndex: 'username',
      fixed: 'left',
      width: 120,
      render: (_, record) => {
        const profileLink = createWebsiteLink(ROUTES.WEBSITE.PROFILE, record._id);
        return <TableLink href={profileLink}>{record.username}</TableLink>;
      },
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 120,
    },
    {
      title: '订阅数',
      dataIndex: 'followerCount',
      width: 120,
      search: false,
      sorter: true,
    },
    {
      title: '技能',
      dataIndex: 'skills',
      width: 200,
      valueType: 'select',
      fieldProps: {
        mode: 'multiple',
        options: skills?.map(skill => ({
          label: skill.name,
          value: skill.name,
        })),
      },
      render: (_, record) => (
        <>
          {record.skills?.map((skill) => (
            <Tag key={skill}>{skill}</Tag>
          ))}
        </>
      ),
    },
    {
      title: '个人简介',
      dataIndex: 'bio',
      width: 120,
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
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          onClick={() => {
            setCurrentRow(record);
            setModalType('update');
            setModalVisible(true);
          }}
        >
          编辑
        </Button>,
        <Button
          key="delete"
          type="link"
          danger
          onClick={() => handleDelete(record)}
        >
          删除
        </Button>,
      ],
    },
  ];

  return (
    <>
      <ProTable<API.DeveloperItem>
        headerTitle="开发者管理"
        actionRef={actionRef}
        rowKey="_id"
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              setModalType('create');
              setModalVisible(true);
            }}
          >
            <PlusOutlined /> 新建
          </Button>,
        ]}
        request={async (params, sort) => {
          const queryParams = {
            current: params.current || 1,
            pageSize: pageSize,
            ...params,
            sortField: sort ? Object.keys(sort)[0] : undefined,
            sortOrder: sort ? (sort.order === 'ascend' ? 'asc' : 'desc') : undefined,
          };
          console.log('queryParams from developer list: ', queryParams);
          return await getDeveloperList(queryParams);
        }}
        columns={columns}
        scroll={{ x: 1300 }}
        pagination={{
          pageSize,
          onChange: (_, size) => setPageSize(size),
        }}
      />
      <UpdateForm
        type={modalType}
        open={modalVisible}
        values={currentRow}
        onCancel={() => {
          setModalVisible(false);
          setCurrentRow(undefined);
        }}
        onSubmit={async (values) => {
          try {
            if (modalType === 'create') {
              await createDeveloper(values as API.DeveloperItem);
            } else {
              console.log('更新', currentRow?._id, values);
              await updateDeveloper(
                currentRow?._id as string,
                values,
              );
            }
            message.success(`${modalType === 'create' ? '创建' : '更新'}成功`);
            setModalVisible(false);
            actionRef.current?.reload();
          } catch (error) {
            message.error('操作失败: ' + (error as Error).message);
          }
        }}
      />
    </>
  );
};

export default DeveloperList;
