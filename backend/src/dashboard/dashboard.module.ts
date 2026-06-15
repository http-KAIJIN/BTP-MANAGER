import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { FinancialModule } from '../financial/financial.module';

@Module({
  imports: [PrismaModule, FinancialModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
