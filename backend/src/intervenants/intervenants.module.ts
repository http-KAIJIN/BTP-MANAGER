import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { IntervenantsController } from './intervenants.controller';
import { IntervenantsService } from './intervenants.service';

@Module({
  imports: [PrismaModule],
  controllers: [IntervenantsController],
  providers: [IntervenantsService],
})
export class IntervenantsModule {}
