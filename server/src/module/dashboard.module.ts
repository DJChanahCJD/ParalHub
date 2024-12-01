import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from '../controller/dashboard.controller';
import { DashboardService } from '../provider/dashboard/dashboard.service';
import { Case, CaseSchema } from '../schema/case.schema';
import { Article, ArticleSchema } from '../schema/article.schema';
import {
  AdminUser,
  AdminUserSchema,
  DeveloperUser,
  DeveloperUserSchema,
  EnterpriseUser,
  EnterpriseUserSchema,
} from '../schema/users.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Case.name, schema: CaseSchema },
      { name: Article.name, schema: ArticleSchema },
      { name: AdminUser.name, schema: AdminUserSchema },
      { name: DeveloperUser.name, schema: DeveloperUserSchema },
      { name: EnterpriseUser.name, schema: EnterpriseUserSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
