import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseOrderQueryDto } from './dto/purchase-order-query.dto';

@ApiTags('Purchase Orders')
@ApiBearerAuth()
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(
    private readonly purchaseOrdersService: PurchaseOrdersService,
  ) {}

  @Get()
  findAll(@Query() query: PurchaseOrderQueryDto) {
    return this.purchaseOrdersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', UuidValidationPipe) id: string) {
    return this.purchaseOrdersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePurchaseOrderDto, @CurrentUser() user: AuthenticatedUser) {
    return this.purchaseOrdersService.create(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: UpdatePurchaseOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.purchaseOrdersService.update(id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id', UuidValidationPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.purchaseOrdersService.softDelete(id, user.id);
  }

  @Post(':id/restore')
  restore(@Param('id', UuidValidationPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.purchaseOrdersService.restore(id, user.id);
  }

  @Post(':id/send')
  send(@Param('id', UuidValidationPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.purchaseOrdersService.transitionStatus(id, 'SENT', user.id);
  }

  @Post(':id/approve')
  approve(@Param('id', UuidValidationPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.purchaseOrdersService.transitionStatus(id, 'APPROVED', user.id);
  }

  @Post(':id/cancel')
  cancel(@Param('id', UuidValidationPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.purchaseOrdersService.transitionStatus(id, 'CANCELLED', user.id);
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id', UuidValidationPipe) id: string, @Res() res: Response) {
    const buffer = await this.purchaseOrdersService.generatePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="po-${id.slice(0, 8)}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
