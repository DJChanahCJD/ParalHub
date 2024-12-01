import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from 'src/controller/dashboard.controller';
import { DashboardService } from 'src/provider/dashboard/dashboard.service';
import { Case, CaseSchema } from 'src/schema/case.schema';
import { Article, ArticleSchema } from 'src/schema/article.schema';
import {
  AdminUser,
  AdminUserSchema,
  DeveloperUser,
  DeveloperUserSchema,
  EnterpriseUser,
  EnterpriseUserSchema,
} from 'src/schema/users.schema';
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
