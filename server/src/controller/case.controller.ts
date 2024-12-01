import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { CaseProvider } from '../provider/case/case.provider';
import { Case } from '../schema/case.schema';
import { CommonProvider } from '../provider/common/common.provider';
import { ArticleQuery, CaseQuery } from '../dto/pagination';
import { JwtAuthGuard } from '../guards/auth.guard';
import { CurrentUser } from '../decorators/user.decorator';
import { JwtPayload } from '../types/auth.types';
import { ArticleProvider } from '../provider/article/article.provider';
import { Public } from '../decorators/public.decorator';
@Controller('/case')
@UseGuards(JwtAuthGuard)
export class CaseController {
  constructor(
    private readonly caseProvider: CaseProvider,
    private readonly articleProvider: ArticleProvider,
    private readonly commonProvider: CommonProvider,
  ) {}

  @Get()
  @Public()
  async findAll(
    @Query(new ValidationPipe({ transform: true }))
    query: CaseQuery,
  ) {
    const { current = 1, pageSize = 10, ...rest } = query;
    console.log('query', query);
    console.log('rest.tags', rest.tags);
    if (rest.tags && rest.tags.length > 0) {
      const validTags = await this.commonProvider.validateTags(
        rest.tags.map((tag) => tag.toString()),
      );
      if (!validTags) {
        throw new BadRequestException('标签不存在');
      }
    }
    return this.caseProvider.findAll({
      current,
      pageSize,
      ...rest,
    });
  }

  //CURD
  @Post()
  async create(@Body() data: Partial<Case>, @CurrentUser() user: JwtPayload) {
    try {
      const payload = user;
      console.log('Verified payload:', payload);

      if (!payload.role) {
        throw new BadRequestException('User role is missing');
      }

      if (data.tags?.length) {
        const validTags = await this.commonProvider.validateTags(
          data.tags.map((tag) => tag.toString()),
        );
        if (!validTags) {
          throw new BadRequestException('标签不存在，请选择已有标签');
        }
      }

      const authorModel = `${payload.role.charAt(0).toUpperCase() + payload.role.slice(1)}User`;

      return this.caseProvider.create({
        ...data,
        authorId: payload.userId,
        authorModel,
      });
    } catch (error) {
      console.error('Case creation error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        '创建失败：' + (error.message || '未知错误'),
      );
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<Case>) {
    return this.caseProvider.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.caseProvider.delete(id);
  }

  @Public()
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.caseProvider.findById(id);
  }

  @Post(':id/star')
  async star(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    try {
      // 验证用户身份
      const payload = user;

      // 调用 provider 处理收藏逻辑
      return this.caseProvider.star(id, payload.userId, payload.role);
    } catch (error) {
      throw new BadRequestException(
        '收藏失败：' + (error.message || '未知错误'),
      );
    }
  }

  @Public()
  @Get(':id/articles')
  async getArticles(@Param('id') caseId: string, @Query() query: ArticleQuery) {
    try {
      const articles = await this.articleProvider.findAll({
        ...query,
        caseId,
      });
      console.log('articles from case controller', articles);
      return articles;
    } catch (error) {
      throw new BadRequestException(
        '获取文章失败：' + (error.message || '未知错误'),
      );
    }
  }

  @Post(':id/articles')
  async createArticle(
    @Param('id') caseId: string,
    @Body()
    data: {
      content: string;
      title: string;
      description?: string;
      tags: string[];
      caseId: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    try {
      const payload = user;
      if (!payload.role) {
        throw new BadRequestException('User role is missing');
      }
      if (
        !data.title ||
        !data.content ||
        !data.tags ||
        data.tags.length === 0
      ) {
        throw new BadRequestException('请输入标题、内容和标签');
      }

      console.log('data from case controller', data);
      const authorModel = `${payload.role.charAt(0).toUpperCase() + payload.role.slice(1)}User`;

      return this.caseProvider.createArticle({
        content: data.content,
        title: data.title,
        description: data.description,
        tags: data.tags,
        caseId,
        authorId: payload.userId,
        authorModel,
      });
    } catch (error) {
      throw new BadRequestException(
        '创建题解失败：' + (error.message || '未知错误'),
      );
    }
  }

  @Public()
  @Get(':caseId/articles/:articleId')
  async getArticleDetail(
    @Param('caseId') caseId: string,
    @Param('articleId') articleId: string,
  ) {
    try {
      const article = await this.caseProvider.getArticleDetail(
        caseId,
        articleId,
      );
      return article;
    } catch (error) {
      throw new BadRequestException(
        '获取文章详情失败：' + (error.message || '未知错误'),
      );
    }
  }

  @Post(':caseId/articles/:articleId/like')
  async likeArticle(
    @Param('caseId') caseId: string,
    @Param('articleId') articleId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    try {
      const payload = user;
      return this.caseProvider.likeArticle(
        caseId,
        articleId,
        payload.userId,
        payload.role,
      );
    } catch (error) {
      throw new BadRequestException(
        '点赞失败：' + (error.message || '未知错误'),
      );
    }
  }

  @Public()
  @Post(':caseId/articles/:articleId/view')
  async viewArticle(
    @Param('caseId') caseId: string,
    @Param('articleId') articleId: string,
  ) {
    try {
      return this.caseProvider.viewArticle(caseId, articleId);
    } catch (error) {
      throw new BadRequestException(
        '更新观看量失败：' + (error.message || '未知错误'),
      );
    }
  }

  @Public()
  @Get('/user/:userId/cases')
  async getCasesByUserId(
    @Param('userId') userId: string,
    @Query() query: CaseQuery,
  ) {
    if (!query.authorId && !userId) {
      throw new BadRequestException('Correct author ID is required');
    }
    return this.caseProvider.findAll({
      ...query,
      authorId: userId,
    });
  }

  @Get('/user/:userId/star-cases')
  async getStarCasesByUserId(
    @Param('userId') userId: string,
    @CurrentUser() user: JwtPayload,
    @Query() query: CaseQuery,
  ) {
    console.log('query from case controller getStarCasesByUserId', query);
    if (!user.role || userId !== user.userId) {
      throw new BadRequestException(
        "User role is missing or user ID does not match(Can't check other user's star cases)",
      );
    }
    return this.caseProvider.getStarCasesByUserId(userId, user.role, query);
  }
}
