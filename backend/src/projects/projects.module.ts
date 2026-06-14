import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { FinancialModule } from '../financial/financial.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [PrismaModule, FinancialModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
