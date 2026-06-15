import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../common/decorators/permissions.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @Permissions('dashboard.read')
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('recent-payments')
  @Permissions('dashboard.read')
  getRecentPayments(@Query('limit') limit?: string) {
    return this.dashboardService.getRecentPayments(limit ? Number(limit) : 5);
  }

  @Get('outstanding-commitments')
  @Permissions('dashboard.read')
  getOutstandingCommitments(@Query('limit') limit?: string) {
    return this.dashboardService.getOutstandingCommitments(
      limit ? Number(limit) : 10,
    );
  }
}
