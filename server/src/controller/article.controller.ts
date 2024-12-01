import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  ValidationPipe,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ArticleProvider } from 'src/provider/article/article.provider';
import { Article } from 'src/schema/article.schema';
import { CommonProvider } from 'src/provider/common/common.provider';
import { JwtAuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/decorators/user.decorator';
import { JwtPayload } from '@/types/auth.types';
import { ArticleQuery } from 'src/dto/pagination';
import { Public } from '@/decorators/public.decorator';

@Controller('article')
@UseGuards(JwtAuthGuard)
export class ArticleController {
  constructor(
    private readonly articleProvider: ArticleProvider,
    private readonly commonProvider: CommonProvider,
  ) {}

  @Post()
  async create(
    @Body() data: Partial<Article>,
    @CurrentUser() user: JwtPayload,
  ) {
    try {
      if (!user.role) {
        throw new BadRequestException('User role is missing');
      }

      if (data.tags?.length) {
        const validTags = await this.commonProvider.validateTags(
          data.tags.map((tag) => tag.toString()),
        );
        if (!validTags) {
          throw new BadRequestException('Invalid tags');
        }
      }
      const authorModel = `${user.role.charAt(0).toUpperCase() + user.role.slice(1)}User`;
      return this.articleProvider.create({
        ...data,
        authorId: user.userId,
        authorModel,
      });
    } catch (error) {
      console.error('Article creation error:', error);
      throw new BadRequestException(
        error.message || 'Failed to create article',
      );
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<Article>) {
    return this.articleProvider.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.articleProvider.delete(id);
  }

  @Get()
  @Public()
  async findAll(
    @Query(new ValidationPipe({ transform: true }))
    query: ArticleQuery,
  ) {
    return this.articleProvider.findAll(query);
  }

  @Public()
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.articleProvider.findById(id);
  }

  @Public()
  @Get('user/:userId')
  async findByUserId(
    @Param('userId') userId: string,
    @Query() query: Partial<ArticleQuery>,
  ) {
    if (!query.authorId && !userId) {
      throw new BadRequestException('Correct author ID is required');
    }
    query.authorId = userId;
    return this.articleProvider.findAll(query);
  }

  @Public()
  @Get('case/:caseId')
  async findByCaseId(@Param('caseId') caseId: string) {
    return this.articleProvider.findByCaseId(caseId);
  }

  @Post(':id/like')
  async like(@Param('id') id: string) {
    return this.articleProvider.like(id);
  }

  @Public()
  @Post(':id/view')
  async view(@Param('id') id: string) {
    return this.articleProvider.view(id);
  }
}
