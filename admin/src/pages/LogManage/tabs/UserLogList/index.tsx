import { Tag, Tooltip, Space } from 'antd';
import { getUserLogs } from '@/services/paral-hub/api';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import type { RequestData } from '@ant-design/pro-components';
import { GlobalOutlined } from '@ant-design/icons';
import { formatTime } from '@/utils/utils';
interface UserLog {
  time: string;
  event: string;
  address: string;
  ip: string;
  success: boolean;
}

const UserLogList: React.FC = () => {
  const columns: ProColumns<UserLog>[] = [
    {
      title: '序号',
      dataIndex: 'index',
      width: 70,
      fixed: 'left',
      hideInSearch: true,
      render: (_, __, index) => index + 1,
    },
    {
      title: '时间',
      dataIndex: 'time',
      width: 160,
      valueType: 'dateTime',
      sorter: true,
      search: false,
      render: (_, record) => {
        const time = formatTime(record.time);
        return (
          <Tooltip title={time.full}>
            {time.short}
          </Tooltip>
        );
      },
    },
    {
      title: '事件',
      dataIndex: 'event',
      width: 300,
      ellipsis: true,
      search: {
        transform: (value) => ({ event: value }),
      },
      render: (text) => (
        <Tag color="default">
          {text}
        </Tag>
      ),
    },
    {
      title: '地区',
      dataIndex: 'address',
      width: 160,
      ellipsis: true,
      search: {
        transform: (value) => ({ address: value }),
      },
      render: (text) => (
        <Space>
          <GlobalOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      width: 140,
      search: {
        transform: (value) => ({ ip: value }),
      },
      render: (text) => (
        <Tooltip title={`复制IP`}>
          <Tag style={{ cursor: 'pointer' }} onClick={() => {
            navigator.clipboard.writeText(text as string);
          }}>
            {text}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'success',
      width: 100,
      filters: [
        { text: '成功', value: 'true' },
        { text: '失败', value: 'false' },
      ],
      filterMultiple: false,
      render: (_, record) => (
        <Tag color={record.success ? 'success' : 'error'}>
          {record.success ? '成功' : '失败'}
        </Tag>
      ),
    },
  ];

  return (
    <ProTable<UserLog>
      columns={columns}
      request={async (
        params,
        sort,
        filter,
      ): Promise<Partial<RequestData<UserLog>>> => {
        try {
          const response = await getUserLogs({
            current: params.current,
            pageSize: params.pageSize,
            ip: params.ip,
            address: params.address,
            event: params.event,
            success: filter.success?.[0] as unknown as boolean,
            sortField: Object.keys(sort || {})[0],
            sortOrder: sort[Object.keys(sort || {})[0]] as 'ascend' | 'descend',
          });

          return {
            data: response.data.data as unknown as UserLog[],
            success: response.data.success,
            total: response.data.total,
          };
        } catch (error) {
          console.error('获取用户日志失败:', error);
          return {
            data: [],
            success: false,
            total: 0,
          };
        }
      }}
      rowKey="time"
      pagination={{
        showQuickJumper: true,
        showSizeChanger: true,
        showTotal: (total) => `共 ${total} 条记录`,
      }}
      search={{
        labelWidth: 'auto',
      }}
      dateFormatter="string"
      toolbar={{
        actions: [
          <a
            key="refresh"
            onClick={() => window.location.reload()}
            style={{ cursor: 'pointer' }}
          >
            刷新
          </a>,
        ],
      }}
      options={{
        density: true,
        fullScreen: true,
        reload: true,
        setting: true,
      }}
    />
  );
};

export default UserLogList;
