import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { NumbersModule } from '../numbers/numbers.module';
import { GoodsReceiptsController } from './goods-receipts.controller';
import { GoodsReceiptsService } from './goods-receipts.service';

@Module({
  imports: [PrismaModule, NumbersModule],
  controllers: [GoodsReceiptsController],
  providers: [GoodsReceiptsService],
  exports: [GoodsReceiptsService],
})
export class GoodsReceiptsModule {}
