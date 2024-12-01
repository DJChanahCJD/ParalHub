import { Statistic, Space, Divider, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import React from 'react';

const { Text } = Typography;

// 趋势数字组件
const TrendNumber: React.FC<{ value: number }> = ({ value }) => {
  if (value === 0) return <Text type="secondary">0%</Text>;

  return (
    <Text type={value > 0 ? 'success' : 'danger'}>
      {value > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
      {Math.abs(value)}%
    </Text>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend: {
    monthly: number;
    weekly: number;
  };
  description: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  description,
  loading,
}) => {
  return (
    <Statistic
      title={
        <Space>
          {icon}
          {title}
        </Space>
      }
      value={value}
      loading={loading}
      prefix={
        <Space direction="vertical" size="small">
          <Text type="secondary">{description}</Text>
          <Space split={<Divider type="vertical" />}>
            <Space>
              <Text type="secondary">月环比</Text>
              <TrendNumber value={trend.monthly} />
            </Space>
            <Space>
              <Text type="secondary">周环比</Text>
              <TrendNumber value={trend.weekly} />
            </Space>
          </Space>
        </Space>
      }
    />
  );
};

export default StatCard;
