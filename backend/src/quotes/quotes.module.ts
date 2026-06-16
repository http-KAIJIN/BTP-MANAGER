import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { NumbersModule } from '../numbers/numbers.module';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [PrismaModule, NumbersModule],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
