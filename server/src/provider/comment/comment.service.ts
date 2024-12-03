import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ReplyQuery, ArticleCommentQuery } from '../../dto/pagination';
import { CreateCommentDto, CreateReplyDto } from '../../dto/comment';
import { BaseComment, Comment, Reply } from '../../schema/comment.schema';
import { AdminCommentQuery } from '../../dto/admin.comment';
import { Article } from '../../schema/article.schema';
@Injectable()
export class CommentService {
  constructor(
    @InjectModel(BaseComment.name)
    private readonly commentModel: Model<BaseComment>,
    @InjectModel(Article.name)
    private readonly articleModel: Model<Article>,
  ) {}

  private toObjectId(id: string): Types.ObjectId {
    return new Types.ObjectId(id);
  }

  // 创建评论的基础方法
  private async baseCreateComment(
    userId: string,
    userModel: string,
    dto: CreateCommentDto,
  ) {
    const comment = await this.commentModel.create({
      ...dto,
      type: 'comment',
      userId: this.toObjectId(userId),
      userModel,
      articleId: this.toObjectId(dto.articleId),
      replyCount: 0,
    });
    // 增加文章的评论计数
    await this.articleModel.findByIdAndUpdate(dto.articleId, {
      $inc: { commentsCount: 1 },
    });
    return comment.populate([
      { path: 'userId', select: 'username avatar' },
      { path: 'articleId', select: 'title' },
    ]);
  }

  // 创建回复的基础方法
  private async baseCreateReply(
    userId: string,
    userModel: string,
    dto: CreateReplyDto,
  ) {
    console.log('dto from baseCreateReply', dto);
    const parentComment = await this.commentModel.findById(dto.parentId);
    if (!parentComment) {
      throw new NotFoundException('父评论不存在');
    }

    // 验证回复目标是否存在
    const replyTo = await this.commentModel.findById(dto.replyToId);
    if (!replyTo) {
      throw new NotFoundException('回复目标评论不存在');
    }

    const reply = await this.commentModel.create({
      ...dto,
      content: dto.content.trim(),
      type: 'reply',
      userId: this.toObjectId(userId),
      articleId: this.toObjectId(dto.articleId),
      userModel,
      parentId: this.toObjectId(dto.parentId),
      replyToId: this.toObjectId(dto.replyToId),
      replyToUserId: this.toObjectId(dto.replyToUserId),
    });

    // 增加父评论的回复计数
    await this.commentModel.findByIdAndUpdate(dto.parentId, {
      $inc: { replyCount: 1 },
    });

    return reply.populate([
      { path: 'userId', select: 'username avatar' },
      { path: 'articleId', select: 'title' },
      { path: 'replyToUserId', select: 'username' },
    ]);
  }

  // 普通用户创建评论
  async createComment(userId: string, role: string, dto: CreateCommentDto) {
    const userModel = `${role[0].toUpperCase()}${role.slice(1)}User`;
    return this.baseCreateComment(userId, userModel, dto);
  }

  // 普通用户创建回复
  async createReply(userId: string, role: string, dto: CreateReplyDto) {
    console.log('dto from createReply in comment.service', dto);
    const userModel = `${role[0].toUpperCase()}${role.slice(1)}User`;
    return this.baseCreateReply(userId, userModel, dto);
  }

  // 管理员创建评论
  async createAdminComment(userId: string, dto: CreateCommentDto) {
    return this.baseCreateComment(userId, 'AdminUser', dto);
  }

  // 管理员创建回复
  async createAdminReply(userId: string, dto: CreateReplyDto) {
    return this.baseCreateReply(userId, 'AdminUser', dto);
  }

  // 获取评论数量
  async getCommentsCount(articleId: string) {
    return this.commentModel.countDocuments({
      articleId: new Types.ObjectId(articleId),
    });
  }

  // 获取文章评论列表
  async getArticleComments(
    articleId: string,
    params: ArticleCommentQuery,
  ): Promise<{ data: Comment[]; total: number; caseId: string }> {
    const {
      pageSize = 10,
      current = 1,
      sortField = 'createdAt',
      sortOrder = 'descend',
    } = params;

    // 获取文章信息以获取 caseId
    const article = await this.articleModel
      .findById(articleId)
      .select('caseId')
      .lean();

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    // 只获取主评论，不包含回复
    const comments = await this.commentModel
      .find({
        articleId: new Types.ObjectId(articleId),
        type: 'comment',
      })
      .sort({ [sortField]: sortOrder === 'ascend' ? 1 : -1 })
      .skip((current - 1) * pageSize)
      .limit(pageSize)
      .populate('userId', 'username avatar')
      .lean();

    const total = await this.commentModel.countDocuments({
      articleId: new Types.ObjectId(articleId),
      type: 'comment',
    });

    // 为每个评论添加回复计数
    const commentsWithReplyCount = await Promise.all(
      comments.map(async (comment) => {
        const replyCount = await this.commentModel.countDocuments({
          parentId: comment._id,
          type: 'reply',
        });
        return { ...comment, replyCount };
      }),
    );

    return {
      data: commentsWithReplyCount as unknown as Comment[],
      total,
      caseId: article.caseId.toString(), // 添加 caseId 到返回结果
    };
  }

  // 获取评论的回复列表
  async getReplies(
    commentId: string,
    params: ReplyQuery,
  ): Promise<{ data: Reply[]; total: number }> {
    const {
      pageSize = 10,
      current = 1,
      sortField = 'createdAt',
      sortOrder = 'descend',
    } = params;

    const replies = await this.commentModel
      .find({
        parentId: new Types.ObjectId(commentId),
        type: 'reply',
      })
      .sort({ [sortField]: sortOrder === 'ascend' ? 1 : -1 })
      .skip((current - 1) * pageSize)
      .limit(pageSize)
      .populate('userId', 'username avatar')
      .populate('replyToUserId', 'username')
      .lean();

    const total = await this.commentModel.countDocuments({
      parentId: new Types.ObjectId(commentId),
      type: 'reply',
    });

    return {
      data: replies as unknown as Reply[],
      total,
    };
  }

  // 点赞/取消点赞
  async toggleLike(userId: string, commentId: string) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new Error('评论不存在');
    }

    const userIdObj = new Types.ObjectId(userId);
    const isLiked = comment.likedBy.includes(userIdObj);

    if (isLiked) {
      // 取消点赞
      await this.commentModel.findByIdAndUpdate(commentId, {
        $pull: { likedBy: userIdObj },
        $inc: { likes: -1 },
      });
      return { likes: comment.likes - 1, isLiked: false };
    } else {
      // 添加点赞
      await this.commentModel.findByIdAndUpdate(commentId, {
        $addToSet: { likedBy: userIdObj },
        $inc: { likes: 1 },
      });
      return { likes: comment.likes + 1, isLiked: true };
    }
  }

  // 生成用户查询的 lookup stages
  private generateLookupStages() {
    const userTypes = ['admin', 'developer', 'enterprise'];
    return userTypes.map((type) => ({
      $lookup: {
        from: `${type}_users`,
        let: {
          userId: '$userId',
          userModel: '$userModel',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$_id', '$$userId'] },
                  {
                    $eq: [
                      '$$userModel',
                      `${type[0].toUpperCase()}${type.slice(1)}User`,
                    ],
                  },
                ],
              },
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
        as: `${type}User`,
      },
    }));
  }

  // 生成用户信息合并阶段
  private generateUserMergeStage() {
    return {
      $addFields: {
        userInfo: {
          $cond: [
            { $eq: ['$userModel', 'AdminUser'] },
            { $arrayElemAt: ['$adminUser', 0] },
            {
              $cond: [
                { $eq: ['$userModel', 'DeveloperUser'] },
                { $arrayElemAt: ['$developerUser', 0] },
                { $arrayElemAt: ['$enterpriseUser', 0] },
              ],
            },
          ],
        },
      },
    };
  }

  // 生成文章查询的 lookup stage
  private generateArticleLookupStage() {
    return {
      $lookup: {
        from: 'article',
        let: { articleId: '$articleId' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$_id', '$$articleId'] },
            },
          },
          {
            $project: {
              _id: 1,
              title: 1,
              caseId: 1, // 确保包含 caseId
              // ... 其他需要的文章字段
            },
          },
        ],
        as: 'articleInfo',
      },
    };
  }

  // 生成基础的分页排序阶段
  private generatePaginationStages(
    current: number,
    pageSize: number,
    sortField = 'createdAt',
    sortOrder: 'ascend' | 'descend' = 'descend',
  ) {
    return [
      {
        $sort: { [sortField]: sortOrder === 'ascend' ? 1 : -1 },
      },
      {
        $skip: (Number(current) - 1) * Number(pageSize),
      },
      {
        $limit: Number(pageSize),
      },
    ];
  }

  // 获取管理员评论列表
  async getAdminComments(params: AdminCommentQuery): Promise<{
    items: Comment[];
    total: number;
    success: boolean;
  }> {
    const {
      current = 1,
      pageSize = 10,
      content,
      'userId.username': username,
      'articleId.title': articleTitle,
      'articleId._id': articleId,
      type,
      parentId,
      sortField = 'createdAt',
      sortOrder = 'descend',
    } = params;

    const aggregation = [];

    // 构建基础查询条件
    const matchStage: any = {};
    if (content) matchStage.content = { $regex: content, $options: 'i' };
    if (type) matchStage.type = type;
    if (articleId) matchStage.articleId = new Types.ObjectId(articleId);
    if (parentId) matchStage.parentId = new Types.ObjectId(parentId);

    if (Object.keys(matchStage).length > 0) {
      aggregation.push({ $match: matchStage });
    }

    // 添加用户查询和合并阶段
    aggregation.push(
      ...this.generateLookupStages(),
      this.generateUserMergeStage(),
    );

    // 添加用户名匹配条件
    if (username) {
      aggregation.push({
        $match: {
          'userInfo.username': { $regex: username, $options: 'i' },
        },
      });
    }

    // 添加文章查询
    aggregation.push(this.generateArticleLookupStage());

    // 添加文章标题匹配条件
    if (articleTitle) {
      aggregation.push({
        $match: {
          'articleInfo.title': { $regex: articleTitle, $options: 'i' },
        },
      });
    }

    // 格式化输出字段
    aggregation.push({
      $project: {
        _id: 1,
        content: 1,
        type: 1,
        likes: 1,
        replyCount: 1,
        createdAt: 1,
        updatedAt: 1,
        userId: '$userInfo',
        articleId: { $arrayElemAt: ['$articleInfo', 0] },
        caseId: { $toString: { $arrayElemAt: ['$articleInfo.caseId', 0] } }, // 添加 caseId
        parentId: 1,
        replyToId: 1,
        replyToUserId: 1,
        userModel: 1,
      },
    });

    // 添加分页和排序
    aggregation.push(
      ...this.generatePaginationStages(current, pageSize, sortField, sortOrder),
    );

    const items = await this.commentModel.aggregate(aggregation);

    // 获取总数
    const countPipeline = [...aggregation];
    countPipeline.splice(countPipeline.length - 3, 3); // 移除分页和排序阶段
    countPipeline.push({ $count: 'total' });
    const countResult = await this.commentModel.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    return {
      items: items as unknown as Comment[],
      total,
      success: true,
    };
  }

  // 删除评论
  async deleteComment(id: string) {
    const comment = await this.commentModel.findById(id);
    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    // 如果是主评论，同时删除其下的所有回复
    if (comment.type === 'comment') {
      await this.commentModel.deleteMany({ parentId: comment._id });
    }
    await comment.deleteOne();

    // 减少文章的评论计数
    await this.articleModel.findByIdAndUpdate(comment.articleId, {
      $inc: { commentsCount: -1 },
    });
    return { success: true };
  }

  // 批量删除评论
  async batchDeleteComments(ids: string[]) {
    const comments = await this.commentModel.find({ _id: { $in: ids } });

    // 收集所有主评论的 ID
    const mainCommentIds = comments
      .filter((comment) => comment.type === 'comment')
      .map((comment) => comment._id);

    // 删除主评论下的所有回复
    if (mainCommentIds.length > 0) {
      await this.commentModel.deleteMany({ parentId: { $in: mainCommentIds } });
    }

    // 删除选中的评论
    await this.commentModel.deleteMany({ _id: { $in: ids } });

    // 减少文章的评论计数
    await this.articleModel.findByIdAndUpdate(comments[0].articleId, {
      $inc: { commentsCount: -ids.length },
    });
    return { success: true };
  }
}
