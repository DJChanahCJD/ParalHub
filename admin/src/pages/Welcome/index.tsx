import { PageContainer, ProCard } from '@ant-design/pro-components';
import React, { useState, useEffect } from 'react';
import {
  EyeOutlined,
  UserOutlined,
  FolderOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import StatCard from '@/components/StatCard';
import { Card } from 'antd';
import { Chart, Line, Point, Tooltip, Legend } from 'bizcharts';
import { getDashboardOverview } from '@/services/paral-hub/dashboard';
import type { DashboardOverview } from '@/types/dashboard';

const Welcome: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);

  // 获取数据
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getDashboardOverview();
      setDashboardData(response);
    } catch (error) {
      console.error('获取仪表盘数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 1000 * 60 * 5); // 每5分钟刷新
    return () => clearInterval(interval);
  }, []);

  // 统计卡片数据
  const statisticsCards = [
    {
      title: '总访问量',
      value: dashboardData?.pageViews?.total ?? 0,
      icon: <EyeOutlined />,
      trend: {
        monthly: dashboardData?.pageViews?.monthlyGrowth ?? 0,
        weekly: dashboardData?.pageViews?.weeklyGrowth ?? 0,
      },
      description: '网站总访问量统计',
    },
    {
      title: '用户总数',
      value: dashboardData?.users?.total ?? 0,
      icon: <UserOutlined />,
      trend: {
        monthly: dashboardData?.users?.monthlyGrowth ?? 0,
        weekly: dashboardData?.users?.weeklyGrowth ?? 0,
      },
      description: '注册用户总数',
    },
    {
      title: '案例总数',
      value: dashboardData?.cases?.total ?? 0,
      icon: <FolderOutlined />,
      trend: {
        monthly: dashboardData?.cases?.monthlyGrowth ?? 0,
        weekly: dashboardData?.cases?.weeklyGrowth ?? 0,
      },
      description: '已发布的案例总数',
    },
    {
      title: '文章总数',
      value: dashboardData?.articles?.total ?? 0,
      icon: <FileTextOutlined />,
      trend: {
        monthly: dashboardData?.articles?.monthlyGrowth ?? 0,
        weekly: dashboardData?.articles?.weeklyGrowth ?? 0,
      },
      description: '已发布的文章总数',
    },
  ];

  // 处理趋势数据
  const processChartData = (data: DashboardOverview['trends']) => {
    if (!data) return [];

    // 按日期排序
    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // 图表配置
  const config = {
    autoFit: true,
    data: dashboardData?.trends || [],
    padding: 'auto',
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    xAxis: {
      type: 'time',
      mask: 'MM-DD',
    },
    yAxis: {
      min: 0,
    },
    legend: {
      position: 'top',
    },
    smooth: true,
    // @ts-ignore
    animation: false,  // 禁用动画可能有助于解决渲染问题
    theme: {
      geometries: {
        point: {
          circle: {
            active: {
              style: {
                r: 4,
                fillOpacity: 1,
                stroke: '#000',
                lineWidth: 1,
              },
            },
          },
        },
      },
    },
  };

  return (
    <PageContainer>
      <ProCard gutter={[16, 16]} wrap>
        {statisticsCards.map((stat, index) => (
          <ProCard colSpan={6} key={index} ghost>
            <StatCard {...stat} loading={loading} />
          </ProCard>
        ))}
      </ProCard>

      <ProCard title="数据趋势" style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            加载中...
          </div>
        ) : (
          <Chart
            height={400}
            padding={[10, 20, 50, 50]}
            autoFit
            data={dashboardData?.trends || []}
          >
            <Line
              shape="smooth"
              position="date*value"
              color="type"
            />
            <Point
              position="date*value"
              color="type"
              shape="circle"
            />
            <Tooltip shared />
            <Legend position="top" />
          </Chart>
        )}
      </ProCard>
    </PageContainer>
  );
};

export default Welcome;
