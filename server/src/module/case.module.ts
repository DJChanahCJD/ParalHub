import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CaseController } from 'src/controller/case.controller';
import { CaseProvider } from 'src/provider/case/case.provider';
import { Case, CaseSchema } from 'src/schema/case.schema';
import { Article, ArticleSchema } from 'src/schema/article.schema';
import { CommonModule } from 'src/module/common.module';
import { ArticleProvider } from 'src/provider/article/article.provider';
import { UsersModule } from '@/module/users.module';
import { NotificationModule } from '@/module/notification.module';

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
