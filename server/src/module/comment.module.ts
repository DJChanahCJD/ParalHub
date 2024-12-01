// 评论模块

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CommentController,
  AdminCommentController,
} from '../controller/comment.controller';
import { CommentService } from '../provider/comment/comment.service';
import {
  BaseComment,
  BaseCommentSchema,
  CommentSchema,
  ReplySchema,
} from '../schema/comment.schema';
import { Article, ArticleSchema } from '../schema/article.schema';
import { DatabaseModule } from './database.module';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeatureAsync([
      {
        name: BaseComment.name,
        useFactory: () => {
          const schema = BaseCommentSchema;
          schema.discriminator('comment', CommentSchema);
          schema.discriminator('reply', ReplySchema);
          return schema;
        },
      },
      {
        name: Article.name,
        useFactory: () => {
          return ArticleSchema;
        },
      },
    ]),
  ],
  controllers: [CommentController, AdminCommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
