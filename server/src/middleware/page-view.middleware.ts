import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../provider/dashboard/dashboard.service';

@Injectable()
export class PageViewMiddleware implements NestMiddleware {
  constructor(private dashboardService: DashboardService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 只统计GET请求
    if (req.method === 'GET') {
      await this.dashboardService.incrementPageView();
    }
    next();
  }
}
