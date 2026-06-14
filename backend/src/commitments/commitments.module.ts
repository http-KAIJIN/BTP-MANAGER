import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { FinancialModule } from '../financial/financial.module';
import { CommitmentsController } from './commitments.controller';
import { CommitmentsService } from './commitments.service';

@Module({
  imports: [PrismaModule, FinancialModule],
  controllers: [CommitmentsController],
  providers: [CommitmentsService],
})
export class CommitmentsModule {}
