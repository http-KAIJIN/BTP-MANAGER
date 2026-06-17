import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { GoodsReceiptsService } from './goods-receipts.service';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto';
import { UpdateGoodsReceiptDto } from './dto/update-goods-receipt.dto';
import { GoodsReceiptQueryDto } from './dto/goods-receipt-query.dto';

@ApiTags('Goods Receipts')
@ApiBearerAuth()
@Controller('goods-receipts')
export class GoodsReceiptsController {
  constructor(private readonly goodsReceiptsService: GoodsReceiptsService) {}

  @Get()
  findAll(@Query() query: GoodsReceiptQueryDto) {
    return this.goodsReceiptsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', UuidValidationPipe) id: string) {
    return this.goodsReceiptsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateGoodsReceiptDto, @CurrentUser() user: AuthenticatedUser) {
    return this.goodsReceiptsService.create(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: UpdateGoodsReceiptDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.goodsReceiptsService.update(id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id', UuidValidationPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.goodsReceiptsService.remove(id, user.id);
  }

  @Get('by-order/:orderId')
  findByOrder(@Param('orderId', UuidValidationPipe) orderId: string) {
    return this.goodsReceiptsService.findByOrder(orderId);
  }
}
