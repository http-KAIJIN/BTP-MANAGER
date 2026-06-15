import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PropertiesService } from './properties.service';
import { SalesService } from './sales.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyQueryDto } from './dto/property-query.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SaleQueryDto } from './dto/sale-query.dto';
import { CreateSalePaymentDto } from './dto/create-sale-payment.dto';

@ApiTags('Real Estate')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('real-estate')
export class RealEstateController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly salesService: SalesService,
  ) {}

  // ---- Properties ----
  @Get('properties')
  findAllProperties(@Query() query: PropertyQueryDto) {
    return this.propertiesService.findAll(query);
  }

  @Get('properties/:id')
  findOneProperty(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Post('properties')
  createProperty(@Body() dto: CreatePropertyDto, @Req() req: any) {
    return this.propertiesService.create(dto, req.user.id);
  }

  @Patch('properties/:id')
  updateProperty(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
    @Req() req: any,
  ) {
    return this.propertiesService.update(id, dto, req.user.id);
  }

  @Delete('properties/:id')
  deleteProperty(@Param('id') id: string, @Req() req: any) {
    return this.propertiesService.softDelete(id, req.user.id);
  }

  // ---- Sales ----
  @Get('sales')
  findAllSales(@Query() query: SaleQueryDto) {
    return this.salesService.findAll(query);
  }

  @Get('sales/:id')
  findOneSale(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Post('sales')
  createSale(@Body() dto: CreateSaleDto, @Req() req: any) {
    return this.salesService.create(dto, req.user.id);
  }

  @Patch('sales/:id')
  updateSale(
    @Param('id') id: string,
    @Body() dto: UpdateSaleDto,
    @Req() req: any,
  ) {
    return this.salesService.update(id, dto, req.user.id);
  }

  @Delete('sales/:id')
  deleteSale(@Param('id') id: string, @Req() req: any) {
    return this.salesService.softDelete(id, req.user.id);
  }

  // ---- Sale Payments ----
  @Get('sales/:id/payments')
  findSalePayments(@Param('id') id: string) {
    return this.salesService.findPayments(id);
  }

  @Post('sales/:id/payments')
  createSalePayment(
    @Param('id') id: string,
    @Body() dto: CreateSalePaymentDto,
    @Req() req: any,
  ) {
    return this.salesService.createPayment(id, dto, req.user.id);
  }

  @Delete('sales/:id/payments/:paymentId')
  deleteSalePayment(
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.salesService.deletePayment(id, paymentId);
  }
}
