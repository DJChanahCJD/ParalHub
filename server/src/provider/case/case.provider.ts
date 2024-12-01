import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Case } from 'src/schema/case.schema';
import { UsersService } from 'src/provider/users/users.service';
import { Article } from 'src/schema/article.schema';
import { CaseQuery } from 'src/dto/pagination';
import { NotificationService } from 'src/provider/notification/notification.service';
import { getCollectionName, ModelName } from '@/utils/model-name.util';

@Injectable()
export class CaseProvider {
  constructor(
    @InjectModel(Case.name) private readonly caseModel: Model<Case>,
    private readonly usersService: UsersService,
    @InjectModel(Article.name) private readonly articleModel: Model<Article>,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * 获取案例列表，支持分页、排序和多条件筛选
   * @param params 查询参数对象
   * @returns 案例列表和总数
   */
  async findAll(params: {
    current?: number;
    pageSize?: number;
    title?: string;
    description?: string;
    content?: string;
    tags?: string[];
    authorId?: string;
    sortField?: string;
    sortOrder?: 'ascend' | 'descend';
  }): Promise<{ items: Case[]; total: number; success: boolean }> {
    const {
      current = 1,
      pageSize = 10,
      title,
      description,
      content,
      tags,
      authorId,
      sortField = 'createdAt',
      sortOrder = 'descend',
    } = params;
    console.log('params from case provider', params);
    // 构建基础查询条件
    const query: any = {};

    if (title) query.title = { $regex: title, $options: 'i' };
    if (description) query.description = { $regex: description, $options: 'i' };
    if (content) query.content = { $regex: content, $options: 'i' };
    if (tags?.length) query.tags = { $all: tags };
    if (authorId) query.authorId = authorId.toString(); // 精准匹配
    // 使用 Mongoose 的 populate 功能
    const [items, total] = await Promise.all([
      this.caseModel
        .find(query)
        .sort({ [sortField]: sortOrder === 'ascend' ? 1 : -1 })
        .skip((Number(current) - 1) * Number(pageSize))
        .limit(Number(pageSize))
        .populate('tags', 'name')
        .populate('authorId', 'username email avatar')
        .lean(),
      this.caseModel.countDocuments(query),
    ]);

    return {
      items: items as Case[],
      total,
      success: true,
    };
  }

  /**
   * 根据ID查找单个案例
   * @param id 案例ID
   * @returns 案例详情
   */
  async findById(id: string): Promise<Case> {
    const result = await this.caseModel
      .findById(id)
      .populate('tags', 'name')
      .populate('authorId', 'username email avatar')
      .lean();
    return result as Case;
  }

  /**
   * 创建新案例
   * @param data 案例数据
   * @returns 创建的案例
   */
  async create(data: Partial<Case>): Promise<Case> {
    const newCase = await this.caseModel.create(data);
    const authorCollection = getCollectionName(data.authorModel as ModelName);

    // 创建新案例通知
    await this.notificationService.createCaseNotification(
      data.authorId.toString(),
      authorCollection,
      newCase._id.toString(),
      newCase.title,
    );

    return newCase;
  }

  /**
   * 更新案例
   * @param id 案例ID
   * @param data 更新的数据
   * @returns 更新后的案例
   */
  async update(id: string, data: Partial<Case>) {
    return this.caseModel.findByIdAndUpdate(id, data, { new: true });
  }

  /**
   * 删除案例
   * @param id 案例ID
   * @returns 删除的案例
   */
  async delete(id: string) {
    return this.caseModel.findByIdAndDelete(id);
  }

  /**
   * 切换案例的收藏状态
   * @param id 案例ID
   * @param userId 用户ID
   * @param role 用户角色
   * @returns 更新后的案例信息
   */
  async star(id: string, userId: string, role: string) {
    try {
      // 更新用户的收藏状态，并获取新的收藏状态
      const isStarred = await this.usersService.toggleCaseStar(
        userId,
        role,
        id,
      );

      // 更新案例的收藏计数
      // const updatedCase = await this.caseModel
      //   .findByIdAndUpdate(
      //     id,
      //     { $inc: { stars: isStarred ? 1 : -1 } }, // 更新计数
      //     { new: true },
      //   )
      //   .populate('tags', 'name')
      //   .populate('authorId', 'username email avatar');

      return {
        success: true,
        data: [],
        isStarred,
      };
    } catch (error) {
      throw new BadRequestException(`收藏操作失败: ${error.message}`);
    }
  }

  /**
   * 获取案例的文章列表
   * @param caseId 案例ID
   * @returns 文章列表
   */
  async getArticles(caseId: string) {
    return this.articleModel
      .find({ caseId })
      .populate('authorId', 'username avatar')
      .sort({ createdAt: -1 });
  }

  /**
   * 创建案例文章
   * @param data 文章数据
   * @returns 创建的文章
   */
  async createArticle(data: {
    title: string;
    description?: string;
    tags: string[];
    content: string;
    caseId: string;
    authorId: string;
    authorModel: string;
  }) {
    // 创建文章
    const article = await this.articleModel.create({
      content: data.content,
      title: data.title,
      description: data.description || data.content.slice(0, 64),
      tags: data.tags,
      caseId: data.caseId,
      authorId: data.authorId,
      authorModel: data.authorModel,
    });

    // 创建新文章通知
    await this.notificationService.createArticleNotification(
      data.authorId,
      getCollectionName(data.authorModel as ModelName),
      article._id.toString(),
      article.title,
      data.caseId,
    );

    // 更新案例的文章列表
    await this.caseModel.findByIdAndUpdate(data.caseId, {
      $push: { articleIds: article._id },
    });

    return article.populate('authorId', 'username avatar');
  }

  /**
   * 获取案例文章详情
   * @param caseId 案例ID
   * @param articleId 文章ID
   * @returns 文章详情
   */
  async getArticleDetail(caseId: string, articleId: string) {
    return this.articleModel
      .findById(articleId)
      .populate('authorId', 'username avatar');
  }

  /**
   * 点赞文章
   * @param caseId 案例ID
   * @param articleId 文章ID
   * @param userId 用户ID
   * @returns 点赞结果
   */
  async likeArticle(
    caseId: string,
    articleId: string,
    userId: string,
    role: string,
  ) {
    try {
      const isLiked = await this.usersService.toggleArticleLike(
        userId,
        role,
        articleId,
      );

      const updatedArticle = await this.articleModel
        .findByIdAndUpdate(articleId, {
          $inc: { likes: isLiked ? 1 : -1 },
        })
        .populate('authorId', 'username avatar role');

      return {
        success: true,
        data: updatedArticle,
        isLiked,
      };
    } catch (error) {
      throw new BadRequestException(`点赞操作失败: ${error.message}`);
    }
  }

  // 浏览文章
  async viewArticle(caseId: string, articleId: string) {
    return this.articleModel.findByIdAndUpdate(articleId, {
      $inc: { views: 1 },
    });
  }

  // 获取用户收藏的案例列表
  async getStarCasesByUserId(userId: string, role: string, query: CaseQuery) {
    const { current = 1, pageSize = 10 } = query;
    const starIds = await this.usersService.getStarIds(userId, role);

    // 计算要跳过的文档数量
    const skip = (current - 1) * pageSize;

    // 查询总数
    const total = await this.caseModel.countDocuments({
      _id: { $in: starIds },
    });

    // 分页查询数据
    const data = await this.caseModel
      .find({ _id: { $in: starIds } })
      .skip(skip)
      .limit(pageSize)
      .populate('tags', 'name')
      .populate('authorId', 'username email avatar')
      .exec();

    return {
      data,
      total,
      current,
      pageSize,
    };
  }
}
