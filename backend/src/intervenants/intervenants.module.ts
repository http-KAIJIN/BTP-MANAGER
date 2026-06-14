import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { FinancialModule } from '../financial/financial.module';
import { IntervenantsController } from './intervenants.controller';
import { IntervenantsService } from './intervenants.service';

@Module({
  imports: [PrismaModule, FinancialModule],
  controllers: [IntervenantsController],
  providers: [IntervenantsService],
})
export class IntervenantsModule {}
