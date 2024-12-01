import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ArticleQuery } from 'src/dto/pagination';
import { Article } from 'src/schema/article.schema';
import { Case } from 'src/schema/case.schema';
import { NotificationService } from 'src/provider/notification/notification.service';
import { ModelName, getCollectionName } from 'src/utils/model-name.util';

@Injectable()
export class ArticleProvider {
  constructor(
    @InjectModel(Article.name) private readonly articleModel: Model<Article>,
    @InjectModel(Case.name) private readonly caseModel: Model<Case>,
    private readonly notificationService: NotificationService,
  ) {}

  // 创建文章
  async create(data: Partial<Article>): Promise<Article> {
    const article = await this.articleModel.create(data);

    // 更新对应案例的 articleIds
    await this.caseModel.findByIdAndUpdate(data.caseId, {
      $push: { articleIds: article._id },
    });

    // 发送通知
    await this.notificationService.createArticleNotification(
      article.authorId.toString(),
      getCollectionName(article.authorModel as ModelName),
      article._id.toString(),
      article.title,
      article.caseId.toString(),
    );

    return article;
  }

  // 更新文章
  async update(id: string, data: Partial<Article>): Promise<Article | null> {
    return this.articleModel.findByIdAndUpdate(id, data, { new: true });
  }

  // 删除文章
  async delete(id: string): Promise<boolean> {
    const article = await this.articleModel.findById(id);
    if (!article) return false;

    // 从对应案例的 articleIds 中移除
    await this.caseModel.findByIdAndUpdate(article.caseId, {
      $pull: { articleIds: new Types.ObjectId(id) },
    });

    await article.deleteOne();
    return true;
  }

  // 获取文章列表
  async findAll(
    params: ArticleQuery,
  ): Promise<{ items: Article[]; total: number; success: boolean }> {
    const {
      current = 1,
      pageSize = 10,
      caseId,
      tags,
      title,
      content,
      authorId,
      sortField = 'createdAt',
      sortOrder = 'descend',
    } = params;

    const query: any = {};

    // 构建查询条件
    if (title) query.title = { $regex: title, $options: 'i' };
    if (content) query.content = { $regex: content, $options: 'i' };
    if (caseId) query.caseId = caseId || new Types.ObjectId(caseId);
    if (tags?.length) query.tags = { $in: tags };
    if (authorId) query.authorId = authorId.toString(); // 精准匹配

    const skip = (Number(current) - 1) * Number(pageSize);
    const sortOptions: any = {
      [sortField]: sortOrder === 'ascend' ? 1 : -1,
    };

    const [items, total] = await Promise.all([
      this.articleModel
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(pageSize))
        .populate('authorId', 'username email avatar')
        .populate('caseId', 'title')
        .populate('tags', 'name')
        .lean(),
      this.articleModel.countDocuments(query),
    ]);

    return {
      items: items as any,
      total,
      success: true,
    };
  }

  // 获取单篇文章详情
  async findById(id: string): Promise<Article | null> {
    return this.articleModel
      .findById(id)
      .populate('authorId', 'username avatar')
      .populate('caseId', 'title description')
      .populate('tags', 'name');
  }

  // 获取案例的所有相关文章
  async findByCaseId(caseId: string): Promise<Article[]> {
    return this.articleModel
      .find({ caseId })
      .populate('authorId', 'username avatar')
      .sort({ createdAt: -1 });
  }

  // 点赞文章
  async like(id: string): Promise<Article | null> {
    return this.articleModel.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true },
    );
  }

  // 浏览文章
  async view(id: string): Promise<Article | null> {
    return this.articleModel.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true },
    );
  }
}
