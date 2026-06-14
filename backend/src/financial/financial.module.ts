import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { FinancialService } from './financial.service';

@Module({
  imports: [PrismaModule],
  providers: [FinancialService],
  exports: [FinancialService],
})
export class FinancialModule {}
