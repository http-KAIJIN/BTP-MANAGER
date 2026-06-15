import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Permissions } from '../common/decorators/permissions.decorator';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('projects/:projectId')
  @Permissions('reports.read')
  getProjectReport(@Param('projectId') projectId: string) {
    return this.reportsService.getProjectReport(projectId);
  }

  @Get('suppliers/:supplierId')
  @Permissions('reports.read')
  getSupplierReport(@Param('supplierId') supplierId: string) {
    return this.reportsService.getSupplierReport(supplierId);
  }

  @Get('intervenants/:intervenantId')
  @Permissions('reports.read')
  getIntervenantReport(@Param('intervenantId') intervenantId: string) {
    return this.reportsService.getIntervenantReport(intervenantId);
  }

  @Get('projects/csv')
  @Permissions('reports.export')
  async exportProjectsCsv(@Res() res: Response) {
    const csv = await this.reportsService.getProjectsCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="projects-report.csv"',
    );
    res.send(csv);
  }
}
