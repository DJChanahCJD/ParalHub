import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from 'src/provider/dashboard/dashboard.service';
import { JwtAuthGuard } from 'src/guards/auth.guard';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getOverview() {
    return this.dashboardService.getOverview();
  }
}
