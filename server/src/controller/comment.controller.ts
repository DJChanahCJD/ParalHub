import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { CurrentUser } from 'src/decorators/user.decorator';
import { CommentService } from 'src/provider/comment/comment.service';
import { ArticleCommentQuery, ReplyQuery } from 'src/dto/pagination';
import { JwtAuthGuard } from 'src/guards/auth.guard';
import { JwtPayload } from '@/types/auth.types';
import { CreateCommentDto, CreateReplyDto } from 'src/dto/comment';
import { AdminCommentQuery } from 'src/dto/admin.comment';
import { Public } from '@/decorators/public.decorator';
@Controller('comment')
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // 获取评论数量
  @Public()
  @Get('article/:articleId/count')
  async getCommentsCount(@Param('articleId') articleId: string) {
    return this.commentService.getCommentsCount(articleId);
  }

  // 创建主评论
  @Post('article/:articleId')
  async createComment(
    @CurrentUser() user: JwtPayload,
    @Param('articleId') articleId: string,
    @Body() dto: Omit<CreateCommentDto, 'articleId'>,
  ) {
    return this.commentService.createComment(user.userId, user.role, {
      ...dto,
      articleId,
      type: 'comment',
    });
  }

  // 创建回复
  @Post(':commentId/reply')
  async createReply(
    @CurrentUser() user: JwtPayload,
    @Param('commentId') commentId: string,
    @Body() dto: CreateReplyDto,
  ) {
    console.log('dto from createReply', dto);
    return this.commentService.createReply(user.userId, user.role, {
      ...dto,
      parentId: dto.parentId || commentId,
      type: 'reply',
    });
  }

  // 获取文章评论列表
  @Public()
  @Get('article/:articleId')
  async getArticleComments(
    @Param('articleId') articleId: string,
    @Query() query: ArticleCommentQuery,
  ) {
    return this.commentService.getArticleComments(articleId, query);
  }

  // 获取评论的回复列表
  @Public()
  @Get(':commentId/replies')
  async getReplies(
    @Param('commentId') commentId: string,
    @Query() query: ReplyQuery,
  ) {
    return this.commentService.getReplies(commentId, query);
  }

  // 点赞/取消点赞
  @Post(':commentId/like')
  async toggleLike(
    @CurrentUser() user: JwtPayload,
    @Param('commentId') commentId: string,
  ) {
    return this.commentService.toggleLike(user.userId, commentId);
  }

  @Delete('delete/:id')
  async deleteComment(@Param('id') id: string) {
    return this.commentService.deleteComment(id);
  }
}

@Controller('admin/comment')
@UseGuards(JwtAuthGuard)
export class AdminCommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get('list')
  async getComments(@Query() query: AdminCommentQuery) {
    console.log('query from getComments', query);
    return this.commentService.getAdminComments(query);
  }

  @Post('create')
  async createComment(
    @Body() dto: CreateCommentDto | CreateReplyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    console.log('dto from createComment', dto);
    if (dto.type === 'reply') {
      return this.commentService.createReply(
        user.userId,
        user.role,
        dto as CreateReplyDto,
      );
    }
    return this.commentService.createComment(
      user.userId,
      user.role,
      dto as CreateCommentDto,
    );
  }

  @Delete('delete/:id')
  async deleteComment(@Param('id') id: string) {
    return this.commentService.deleteComment(id);
  }
}
