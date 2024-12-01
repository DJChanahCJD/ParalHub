import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, message, Tooltip,  Modal, Tag } from 'antd';
import { useRef, useState } from 'react';
import { PlusOutlined, InfoCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { getEnterpriseList, deleteEnterprise,  verifyEnterprise, createEnterprise, updateEnterprise, rejectEnterprise } from '@/services/paral-hub/enterprise';
import { getAllIndustries } from '@/services/paral-hub/common';
import UpdateForm from './components/UpdateForm';
import { useEffect } from 'react';
import { createWebsiteLink, ROUTES } from '@/utils/routes';
import { TableLink } from '@/components/TableLink';

const EnterpriseList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<API.EnterpriseItem>();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'update'>('create');
  const [pageSize, setPageSize] = useState<number>(10);
  const [industryList, setIndustryList] = useState<API.IndustryItem[]>([]);

  useEffect(() => {
    getAllIndustries().then(res => setIndustryList(res));
  }, []);

  const handleDelete = (record: API.EnterpriseItem) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除企业 "${record.company}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteEnterprise(record._id);
          message.success('删除成功');
          actionRef.current?.reload();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };


  const handleAudit = (record: API.EnterpriseItem) => {
    Modal.confirm({
      title: '企业审核',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>企业名称：{record.company}</p>
          <p>联系人：{record.contactPerson}</p>
          <p>联系方式：{record.phone}</p>
          <p>确定要通过该企业的认证申请吗？</p>
        </div>
      ),
      okText: '通过',
      cancelText: '拒绝',
      onOk: async () => {
        try {
          await verifyEnterprise(record._id);
          message.success('已通过认证');
          actionRef.current?.reload();
        } catch (error) {
          message.error('操作失败');
        }
      },
      onCancel: async () => {
        Modal.confirm({
          title: '拒绝原因',
          content: '确定要拒绝该企业的认证申请吗？',
          okText: '确定',
          cancelText: '取消',
          onOk: async () => {
            try {
              await rejectEnterprise(record._id);
              message.success('已拒绝认证');
              actionRef.current?.reload();
            } catch (error) {
              message.error('操作失败');
            }
          },
        });
      },
    });
  };

  const columns: ProColumns<API.EnterpriseItem>[] = [
    {
      title: '企业名称',
      dataIndex: 'company',
      fixed: 'left',
      width: 200,
      render: (dom, entity) => {
        return (
          <TableLink href={entity.website || createWebsiteLink(ROUTES.WEBSITE.PROFILE, entity._id)}>
            {dom}
          </TableLink>
        );
      },
    },
    {
      title: '行业',
      dataIndex: 'industry',
      width: 120,
      valueType: 'select',
      fieldProps: {
        mode: 'multiple',
        options: industryList?.map(item => ({
          label: item.name,
          value: item.name,
        })),
      },
    },
    {
      title: '规模',
      dataIndex: 'scale',
      width: 120,
      valueEnum: {
        'small': { text: '小型(≤100人)' },
        'medium': { text: '中型(101-500人)' },
        'large': { text: '大型(>500人)' },
      },
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
      width: 100,
      render: (_, record) => {
        const profileLink = createWebsiteLink(ROUTES.WEBSITE.PROFILE, record._id);
        return <TableLink href={profileLink}>{record.contactPerson}</TableLink>;
      },
    },
    {
      title: '联系方式',
      dataIndex: 'contact',
      width: 200,
      render: (_, record) => (
        <>
          <div>{record.phone}</div>
          <div>{record.email}</div>
        </>
      ),
    },
    {
      title: '认证状态',
      dataIndex: 'verificationStatus',
      width: 120,
      valueEnum: {
        pending: {
          text: '待审核',
          status: 'warning',
        },
        verified: {
          text: '已认证',
          status: 'success',
        },
        rejected: {
          text: '已拒绝',
          status: 'error',
        },
      },
      render: (_, record) => (
        <Tag color={
          record.verificationStatus === 'verified' ? 'success' :
          record.verificationStatus === 'rejected' ? 'error' :
          'warning'
        }>
          {record.verificationStatus === 'verified' ? '已认证' :
           record.verificationStatus === 'rejected' ? '已拒绝' :
           '待审核'}
        </Tag>
      ),
    },
    {
      title: '订阅数',
      dataIndex: 'followerCount',
      width: 120,
      search: false,
      sorter: true,
    },
    {
      title: '案例数',
      dataIndex: 'caseCount',
      width: 100,
      sorter: true,
      search: false,
    },
    {
      title: '注册时间',
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
      width: 200,
      render: (_, record) => {
        return [
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
            key="audit"
            type="link"
            onClick={() => handleAudit(record)}
            disabled={record.verificationStatus === 'verified'}
          >
            审核
          </Button>,
          <Button
            key="delete"
            type="link"
            danger
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>,
        ].filter(Boolean);
      },
    },
  ];

  return (
    <>
      <ProTable<API.EnterpriseItem>
        headerTitle="企业管理"
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
          <Tooltip title="企业认证规则" key="info">
            <InfoCircleOutlined style={{ marginLeft: 8 }} />
          </Tooltip>,
        ]}
        request={async (params, sort) => {
          console.log('params for getEnterpriseList: ', params);
          const queryParams = {
            current: params.current || 1,
            pageSize: pageSize,
            ...params,
            sortField: sort ? Object.keys(sort)[0] : undefined,
            sortOrder: sort ? Object.values(sort)[0] : undefined,
          };
          console.log('queryParams for getEnterpriseList: ', queryParams);
          const res = await getEnterpriseList(queryParams);
          console.log('EnterpriseList: ', res);
          return res;
        }}
        columns={columns}
        scroll={{ x: 1500 }}
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
              await createEnterprise(values as API.EnterpriseItem);
            } else {
              await updateEnterprise(currentRow?._id as string, values);
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

export default EnterpriseList;
