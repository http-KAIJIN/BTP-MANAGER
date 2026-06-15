import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { FinancialModule } from '../financial/financial.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [PrismaModule, FinancialModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
