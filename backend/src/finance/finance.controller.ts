import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../common/decorators/permissions.decorator';
import { FinanceService } from './finance.service';

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('dashboard')
  @Permissions('dashboard.read')
  getDashboard() {
    return this.financeService.getDashboard();
  }

  @Get('budget-vs-actual')
  @Permissions('reports.read')
  getBudgetVsActual(@Query('projectId') projectId?: string) {
    return this.financeService.getBudgetVsActual(projectId);
  }

  @Get('projects/:projectId/profitability')
  @Permissions('reports.read')
  getProjectProfitability(@Param('projectId') projectId: string) {
    return this.financeService.getProjectProfitability(projectId);
  }

  @Get('journal')
  @Permissions('reports.read')
  getJournal(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('projectId') projectId?: string,
    @Query('search') search?: string,
  ) {
    return this.financeService.getJournal({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
      type,
      projectId,
      search,
    });
  }

  @Get('cash-flow')
  @Permissions('reports.read')
  getCashFlow() {
    return this.financeService.getCashFlow();
  }
}
