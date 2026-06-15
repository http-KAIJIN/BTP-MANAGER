import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { ConstructionController } from './construction.controller';
import { ConstructionService } from './construction.service';

@Module({
  imports: [PrismaModule],
  controllers: [ConstructionController],
  providers: [ConstructionService],
})
export class ConstructionModule {}
