import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { NumbersModule } from '../numbers/numbers.module';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { PdfService } from './pdf.service';

@Module({
  imports: [PrismaModule, NumbersModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, PdfService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
