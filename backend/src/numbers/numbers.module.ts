import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { NumbersService } from './numbers.service';

@Module({
  imports: [PrismaModule],
  providers: [NumbersService],
  exports: [NumbersService],
})
export class NumbersModule {}
