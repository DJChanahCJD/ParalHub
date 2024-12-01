import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { Case } from 'src/schema/case.schema';
import { Article } from 'src/schema/article.schema';
import {
  AdminUser,
  DeveloperUser,
  EnterpriseUser,
} from 'src/schema/users.schema';
import { RedisClientType } from 'redis';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Case.name) private caseModel: Model<Case>,
    @InjectModel(Article.name) private articleModel: Model<Article>,
    @InjectModel(AdminUser.name) private adminModel: Model<AdminUser>,
    @InjectModel(DeveloperUser.name)
    private developerModel: Model<DeveloperUser>,
    @InjectModel(EnterpriseUser.name)
    private enterpriseModel: Model<EnterpriseUser>,
    @Inject('REDIS_CLIENT') private redisClient: RedisClientType,
  ) {}

  // 增加访问量
  async incrementPageView() {
    const PAGEVIEW_KEY = 'site:pageviews:total';
    const DAILY_PAGEVIEW_KEY = `site:pageviews:daily:${new Date().toISOString().split('T')[0]}`;

    // 增加总访问量
    const total = Number(await this.redisClient.get(PAGEVIEW_KEY)) || 0;
    await this.redisClient.set(PAGEVIEW_KEY, total + 1);

    // 增加每日访问量
    const daily = Number(await this.redisClient.get(DAILY_PAGEVIEW_KEY)) || 0;
    await this.redisClient.set(DAILY_PAGEVIEW_KEY, daily + 1);
    // 设置24小时过期
    await this.redisClient.expire(DAILY_PAGEVIEW_KEY, 24 * 60 * 60);
  }

  // 获取访问量统计
  private async getPageViews() {
    const PAGEVIEW_KEY = 'site:pageviews:total';
    const now = new Date();

    // 周统计相关日期
    const startOfThisWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay(),
    );
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    // 月统计相关日期
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // 获取总访问量
    const total = Number(await this.redisClient.get(PAGEVIEW_KEY)) || 0;

    // 统计数据
    let thisWeek = 0;
    let lastWeek = 0;
    let thisMonth = 0;
    let lastMonth = 0;

    // 获取当月每日数据
    for (
      let d = new Date(startOfThisMonth);
      d < now;
      d.setDate(d.getDate() + 1)
    ) {
      const key = `site:pageviews:daily:${d.toISOString().split('T')[0]}`;
      thisMonth += Number(await this.redisClient.get(key)) || 0;
    }

    // 获取上月每日数据
    for (
      let d = new Date(startOfLastMonth);
      d < startOfThisMonth;
      d.setDate(d.getDate() + 1)
    ) {
      const key = `site:pageviews:daily:${d.toISOString().split('T')[0]}`;
      lastMonth += Number(await this.redisClient.get(key)) || 0;
    }

    // 获取本周和上周数据
    for (let i = 0; i < 7; i++) {
      const thisWeekDay = new Date(startOfThisWeek);
      thisWeekDay.setDate(thisWeekDay.getDate() + i);
      const thisWeekKey = `site:pageviews:daily:${thisWeekDay.toISOString().split('T')[0]}`;
      thisWeek += Number(await this.redisClient.get(thisWeekKey)) || 0;

      const lastWeekDay = new Date(startOfLastWeek);
      lastWeekDay.setDate(lastWeekDay.getDate() + i);
      const lastWeekKey = `site:pageviews:daily:${lastWeekDay.toISOString().split('T')[0]}`;
      lastWeek += Number(await this.redisClient.get(lastWeekKey)) || 0;
    }

    // 计算增长率
    const weeklyGrowth =
      lastWeek === 0
        ? thisWeek > 0
          ? 100
          : 0
        : Number((((thisWeek - lastWeek) / lastWeek) * 100).toFixed(2));
    const monthlyGrowth =
      lastMonth === 0
        ? thisMonth > 0
          ? 100
          : 0
        : Number((((thisMonth - lastMonth) / lastMonth) * 100).toFixed(2));

    return {
      total,
      weeklyGrowth,
      monthlyGrowth,
    };
  }

  // 获取月环比增长率
  private async getMonthlyGrowth(model: Model<any>): Promise<number> {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // 本月数据
    const thisMonth = await model.countDocuments({
      createdAt: {
        $gte: startOfThisMonth,
        $lt: startOfNextMonth,
      },
    });

    // 上月数据
    const lastMonth = await model.countDocuments({
      createdAt: {
        $gte: startOfLastMonth,
        $lt: startOfThisMonth,
      },
    });

    // 优化增长率计算逻辑
    if (lastMonth === 0) {
      return thisMonth > 0 ? 100 : 0; // 如果本月有数据，返回100%增长
    }
    return Number((((thisMonth - lastMonth) / lastMonth) * 100).toFixed(2));
  }

  // 获取周环比增长率
  private async getWeeklyGrowth(model: Model<any>): Promise<number> {
    const now = new Date();
    const startOfThisWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfLastWeek = new Date(now.setDate(now.getDate() - 7));
    const startOfNextWeek = new Date(now.setDate(now.getDate() + 14));

    // 本周数据
    const thisWeek = await model.countDocuments({
      createdAt: {
        $gte: startOfThisWeek,
        $lt: startOfNextWeek,
      },
    });

    // 上周数据
    const lastWeek = await model.countDocuments({
      createdAt: {
        $gte: startOfLastWeek,
        $lt: startOfThisWeek,
      },
    });

    if (lastWeek === 0) return 0;
    return Number((((thisWeek - lastWeek) / lastWeek) * 100).toFixed(2));
  }

  // 获取趋势数据
  private async getTrends(): Promise<any[]> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ] as PipelineStage[];

    const [caseTrends, articleTrends] = await Promise.all([
      this.caseModel.aggregate(pipeline),
      this.articleModel.aggregate(pipeline),
    ]);

    // 格式化数据为图表所需格式
    const trends = [];
    caseTrends.forEach((item) => {
      trends.push({
        date: item._id,
        value: item.count,
        type: '案例',
      });
    });
    articleTrends.forEach((item) => {
      trends.push({
        date: item._id,
        value: item.count,
        type: '文章',
      });
    });

    return trends;
  }

  // 获取概览数据
  async getOverview() {
    const CACHE_KEY = 'dashboard:overview';
    const cached = await this.redisClient.get(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }

    // 获取各项统计数据
    const [
      pageViews,
      totalCases,
      totalArticles,
      totalUsers,
      caseStats,
      articleStats,
      userStats,
      trends,
    ] = await Promise.all([
      this.getPageViews(),
      this.caseModel.countDocuments(),
      this.articleModel.countDocuments(),
      Promise.all([
        this.adminModel.countDocuments(),
        this.developerModel.countDocuments(),
        this.enterpriseModel.countDocuments(),
      ]).then((counts) => counts.reduce((a, b) => a + b, 0)),
      Promise.all([
        this.getMonthlyGrowth(this.caseModel),
        this.getWeeklyGrowth(this.caseModel),
      ]),
      Promise.all([
        this.getMonthlyGrowth(this.articleModel),
        this.getWeeklyGrowth(this.articleModel),
      ]),
      Promise.all([
        this.getMonthlyGrowth(this.developerModel),
        this.getWeeklyGrowth(this.developerModel),
      ]),
      this.getTrends(),
    ]);

    const data = {
      pageViews: {
        total: pageViews.total,
        monthlyGrowth: pageViews.monthlyGrowth,
        weeklyGrowth: pageViews.weeklyGrowth,
      },
      users: {
        total: totalUsers,
        monthlyGrowth: userStats[0],
        weeklyGrowth: userStats[1],
      },
      cases: {
        total: totalCases,
        monthlyGrowth: caseStats[0],
        weeklyGrowth: caseStats[1],
      },
      articles: {
        total: totalArticles,
        monthlyGrowth: articleStats[0],
        weeklyGrowth: articleStats[1],
      },
      trends,
    };

    // 设置缓存，5分钟过期
    await this.redisClient.set(CACHE_KEY, JSON.stringify(data));
    await this.redisClient.expire(CACHE_KEY, 300);

    return data;
  }
}
