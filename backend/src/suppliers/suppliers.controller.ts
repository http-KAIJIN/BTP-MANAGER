import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { FinancialService } from '../financial/financial.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { SupplierQueryDto } from './dto/supplier-query.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

@ApiTags('Suppliers')
@ApiBearerAuth()
@Controller('suppliers')
export class SuppliersController {
  constructor(
    private readonly suppliersService: SuppliersService,
    private readonly financialService: FinancialService,
  ) {}

  @Get()
  @Permissions('suppliers.read')
  findAll(@Query() query: SupplierQueryDto) {
    return this.suppliersService.findAll(query);
  }

  @Post()
  @Permissions('suppliers.create')
  create(
    @Body() dto: CreateSupplierDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.suppliersService.create(dto, user.id);
  }

  @Get(':id')
  @Permissions('suppliers.read')
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Get(':id/financial-summary')
  @Permissions('suppliers.read')
  financialSummary(@Param('id') id: string) {
    return this.financialService.getSupplierFinancialSummary(id);
  }

  @Patch(':id')
  @Permissions('suppliers.update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.suppliersService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Permissions('suppliers.archive')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.suppliersService.softDelete(id, user.id);
  }

  @Post(':id/restore')
  @Permissions('suppliers.archive')
  restore(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.suppliersService.restore(id, user.id);
  }
}
