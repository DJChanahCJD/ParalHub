import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CaseController } from '../controller/case.controller';
import { CaseProvider } from '../provider/case/case.provider';
import { Case, CaseSchema } from '../schema/case.schema';
import { Article, ArticleSchema } from '../schema/article.schema';
import { CommonModule } from './common.module';
import { ArticleProvider } from '../provider/article/article.provider';
import { UsersModule } from './users.module';
import { NotificationModule } from './notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Case.name, schema: CaseSchema },
      { name: Article.name, schema: ArticleSchema },
    ]),
    CommonModule,
    NotificationModule,
    UsersModule,
  ],
  controllers: [CaseController],
  providers: [CaseProvider, ArticleProvider],
  exports: [CaseProvider],
})
export class CaseModule {}
