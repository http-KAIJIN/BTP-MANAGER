import { Module } from '@nestjs/common';
import { FinancialModule } from '../financial/financial.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [FinancialModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
