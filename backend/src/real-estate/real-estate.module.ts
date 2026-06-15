import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { RealEstateController } from './real-estate.controller';
import { PropertiesService } from './properties.service';
import { SalesService } from './sales.service';

@Module({
  imports: [PrismaModule],
  controllers: [RealEstateController],
  providers: [PropertiesService, SalesService],
  exports: [],
})
export class RealEstateModule {}
