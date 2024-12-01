import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from '../provider/dashboard/dashboard.service';
import { JwtAuthGuard } from '../guards/auth.guard';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getOverview() {
    return this.dashboardService.getOverview();
  }
}
