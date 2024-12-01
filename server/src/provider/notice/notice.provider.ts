import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notice, NoticeDocument } from 'src/schema/notice.schema';

@Injectable()
export class NoticeProvider {
  constructor(
    @InjectModel(Notice.name) private noticeModel: Model<NoticeDocument>,
  ) {}

  // 创建公告
  async create(createNoticeDto: Partial<Notice>): Promise<Notice> {
    const notice = new this.noticeModel(createNoticeDto);
    return notice.save();
  }

  // 获取公告列表
  async findAll(params: {
    current?: number;
    pageSize?: number;
    type?: string;
    status?: string;
    title?: string;
    target?: string;
    username?: string;
    sortField?: string;
    sortOrder?: string;
    creator?: string;
  }): Promise<{ items: Partial<Notice>[]; total: number; success: boolean }> {
    // 首先更新过期状态
    const now = new Date();
    await this.noticeModel.updateMany(
      {
        status: 'published',
        expireTime: { $lt: now },
      },
      {
        status: 'expired',
      },
    );

    const {
      current = 1,
      pageSize = 10,
      type,
      status,
      title,
      target,
      creator,
      sortField = 'createdAt',
      sortOrder = 'descend',
    } = params;

    // 解析 creator 参数
    let creatorQuery = {};
    if (creator) {
      try {
        creatorQuery = JSON.parse(creator);
      } catch (e) {
        console.error('Failed to parse creator:', e);
      }
    }

    const query: any = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (title) query.title = { $regex: title, $options: 'i' };
    if (target) query.target = target;

    const aggregation = [];

    // 添加查询条件
    if (Object.keys(query).length > 0) {
      aggregation.push({ $match: query });
    }

    // 关联用户表
    aggregation.push({
      $lookup: {
        from: 'admin_users',
        let: { creatorId: '$creatorId' },
        pipeline: [
          {
            $match: {
              $and: [
                { $expr: { $eq: ['$_id', '$$creatorId'] } },
                // 如果有用户名搜索条件，添加到 pipeline 中
                ...((creatorQuery as any)?.username
                  ? [
                      {
                        username: {
                          $regex: (creatorQuery as any).username,
                          $options: 'i',
                        },
                      },
                    ]
                  : []),
              ],
            },
          },
          {
            $project: {
              _id: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
        as: 'creator',
      },
    });

    // 展开 creator 数组，并在有用户名搜索时过滤
    if ((creatorQuery as any)?.username) {
      aggregation.push(
        // 确保 creator 数组不为空（即找到了匹配的用户）
        { $match: { creator: { $ne: [] } } },
        // 然后展开数组
        { $unwind: '$creator' },
      );
    } else {
      // 如果没有用户名搜索，正常展开
      aggregation.push({ $unwind: '$creator' });
    }

    // 计算总数
    const countAggregation = [...aggregation, { $count: 'total' }];
    const totalResult = await this.noticeModel.aggregate(countAggregation);
    const total = totalResult[0]?.total || 0;

    // 添加排序
    aggregation.push({
      $sort: { [sortField]: sortOrder === 'ascend' ? 1 : -1 },
    });

    // 添加分页
    aggregation.push(
      { $skip: (Number(current) - 1) * Number(pageSize) },
      { $limit: Number(pageSize) },
    );

    const items = await this.noticeModel.aggregate(aggregation);

    return {
      items,
      total,
      success: true,
    };
  }

  // 更新公告
  async update(id: string, updateNoticeDto: Partial<Notice>): Promise<Notice> {
    return this.noticeModel
      .findByIdAndUpdate(id, updateNoticeDto, { new: true })
      .exec();
  }

  // 删除公告
  async delete(id: string): Promise<Notice> {
    return this.noticeModel.findByIdAndDelete(id).exec();
  }

  // 发布公告
  async publish(id: string): Promise<Notice> {
    const notice = await this.noticeModel.findById(id);

    if (!notice) {
      throw new Error('公告不存在');
    }

    // 检查是否已过期
    if (notice.expireTime && new Date(notice.expireTime) < new Date()) {
      throw new Error('不能发布已过期的公告');
    }

    return this.noticeModel
      .findByIdAndUpdate(
        id,
        {
          status: 'published',
          publishTime: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  // 撤回公告
  async withdraw(id: string): Promise<Notice> {
    return this.noticeModel
      .findByIdAndUpdate(id, { status: 'draft' }, { new: true })
      .exec();
  }

  // 检查并更新过期公告
  async checkAndUpdateExpiredNotices() {
    const now = new Date();
    await this.noticeModel.updateMany(
      {
        status: 'published',
        expireTime: { $lt: now },
      },
      {
        status: 'expired',
      },
    );
  }
}
