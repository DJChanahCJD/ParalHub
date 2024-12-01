export interface StatisticData {
  total: number;
  monthlyGrowth: number;
  weeklyGrowth: number;
}

export interface DashboardOverview {
  pageViews: StatisticData;
  users: StatisticData;
  cases: StatisticData;
  articles: StatisticData;
  trends: Array<{
    date: string;
    value: number;
    type: string;
  }>;
}
