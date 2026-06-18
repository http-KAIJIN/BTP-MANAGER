import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { QuotesService } from './quotes.service';
import { PdfService } from '../invoices/pdf.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuoteQueryDto } from './dto/quote-query.dto';

@ApiTags('Quotes')
@ApiBearerAuth()
@Controller('quotes')
export class QuotesController {
  constructor(
    private readonly quotesService: QuotesService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  @Permissions('commitments.read')
  findAll(@Query() query: QuoteQueryDto) {
    return this.quotesService.findAll(query);
  }

  @Get(':id')
  @Permissions('commitments.read')
  findOne(@Param('id', UuidValidationPipe) id: string) {
    return this.quotesService.findOne(id);
  }

  @Post()
  @Permissions('commitments.create')
  create(@Body() dto: CreateQuoteDto, @CurrentUser() user: AuthenticatedUser) {
    return this.quotesService.create(dto, user.id);
  }

  @Patch(':id')
  @Permissions('commitments.update')
  update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: UpdateQuoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.quotesService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Permissions('commitments.archive')
  remove(@Param('id', UuidValidationPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.quotesService.softDelete(id, user.id);
  }

  @Post(':id/restore')
  @Permissions('commitments.archive')
  restore(@Param('id', UuidValidationPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.quotesService.restore(id, user.id);
  }

  @Post(':id/send')
  @Permissions('commitments.update')
  send(@Param('id', UuidValidationPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.quotesService.transitionStatus(id, 'SENT', user.id);
  }

  @Post(':id/accept')
  @Permissions('commitments.update')
  accept(@Param('id', UuidValidationPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.quotesService.transitionStatus(id, 'ACCEPTED', user.id);
  }

  @Post(':id/reject')
  @Permissions('commitments.update')
  reject(@Param('id', UuidValidationPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.quotesService.transitionStatus(id, 'REJECTED', user.id);
  }

  @Get(':id/pdf')
  @Permissions('commitments.read')
  async downloadPdf(@Param('id', UuidValidationPipe) id: string, @Res() res: Response) {
    const buffer = await this.pdfService.generateQuotePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="quote-${id.slice(0, 8)}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
