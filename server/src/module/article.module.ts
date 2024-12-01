import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Article, ArticleSchema } from '../schema/article.schema';
import { Case, CaseSchema } from '../schema/case.schema';
import { ArticleController } from '../controller/article.controller';
import { ArticleProvider } from '../provider/article/article.provider';
import { NotificationModule } from './notification.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Article.name, schema: ArticleSchema },
      { name: Case.name, schema: CaseSchema },
    ]),
    NotificationModule,
  ],
  controllers: [ArticleController],
  providers: [ArticleProvider],
  exports: [ArticleProvider],
})
export class ArticleModule {}
