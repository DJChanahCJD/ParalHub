import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Article, ArticleSchema } from 'src/schema/article.schema';
import { Case, CaseSchema } from 'src/schema/case.schema';
import { ArticleController } from 'src/controller/article.controller';
import { ArticleProvider } from 'src/provider/article/article.provider';
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
