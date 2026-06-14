import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { FinancialModule } from '../financial/financial.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [PrismaModule, FinancialModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
