import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { InvoicesService } from './invoices.service';
import { PdfService } from './pdf.service';
import { CreateInvoiceDto, RegisterPaymentDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  @Permissions('payments.read')
  findAll(@Query() query: InvoiceQueryDto) {
    return this.invoicesService.findAll(query);
  }

  @Get(':id')
  @Permissions('payments.read')
  findOne(@Param('id', UuidValidationPipe) id: string) {
    return this.invoicesService.findOne(id);
  }

  @Post()
  @Permissions('payments.create')
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: AuthenticatedUser) {
    return this.invoicesService.create(dto, user.id);
  }

  @Post('from-quote/:quoteId')
  @Permissions('payments.create')
  createFromQuote(
    @Param('quoteId', UuidValidationPipe) quoteId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invoicesService.createFromQuote(quoteId, user.id);
  }

  @Patch(':id')
  @Permissions('payments.update')
  update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: UpdateInvoiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invoicesService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Permissions('payments.archive')
  remove(@Param('id', UuidValidationPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.invoicesService.softDelete(id, user.id);
  }

  @Post(':id/restore')
  @Permissions('payments.archive')
  restore(@Param('id', UuidValidationPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.invoicesService.restore(id, user.id);
  }

  @Post(':id/send')
  @Permissions('payments.update')
  send(@Param('id', UuidValidationPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.invoicesService.transitionStatus(id, 'SENT', user.id);
  }

  @Post(':id/payments')
  @Permissions('payments.create')
  registerPayment(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: RegisterPaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invoicesService.registerPayment(id, dto, user.id);
  }

  @Get(':id/pdf')
  @Permissions('payments.read')
  async downloadPdf(@Param('id', UuidValidationPipe) id: string, @Res() res: Response) {
    const buffer = await this.pdfService.generateInvoicePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${id.slice(0, 8)}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
