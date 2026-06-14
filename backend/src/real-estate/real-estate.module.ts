import { Module } from '@nestjs/common';
import { RealEstateController } from './real-estate.controller';
import { PropertiesService } from './properties.service';
import { SalesService } from './sales.service';

@Module({
  controllers: [RealEstateController],
  providers: [PropertiesService, SalesService],
  exports: [],
})
export class RealEstateModule {}
