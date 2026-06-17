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
import { ConsumeMaterialDto } from './dto/consume-material.dto';
import { CreateMaterialCatalogDto } from './dto/create-material-catalog.dto';
import { CreateMaterialCategoryDto } from './dto/create-material-category.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { MaterialQueryDto } from './dto/material-query.dto';
import { StockQueryDto } from './dto/stock-query.dto';
import { UpdateMaterialCatalogDto } from './dto/update-material-catalog.dto';
import { UpdateMaterialCategoryDto } from './dto/update-material-category.dto';
import { StockService } from './stock.service';

@ApiTags('Stock')
@ApiBearerAuth()
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // ─── Categories ───────────────────────────────────────────────────────

  @Get('categories')
  @Permissions('stock.read')
  findAllCategories() {
    return this.stockService.findAllCategories();
  }

  @Post('categories')
  @Permissions('stock.create')
  createCategory(@Body() dto: CreateMaterialCategoryDto) {
    return this.stockService.createCategory(dto);
  }

  @Patch('categories/:id')
  @Permissions('stock.update')
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialCategoryDto,
  ) {
    return this.stockService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @Permissions('stock.archive')
  deleteCategory(@Param('id') id: string) {
    return this.stockService.deleteCategory(id);
  }

  // ─── Materials ────────────────────────────────────────────────────────

  @Get('materials')
  @Permissions('stock.read')
  findAllMaterials(@Query() query: MaterialQueryDto) {
    return this.stockService.findAllMaterials(query);
  }

  @Get('materials/:id')
  @Permissions('stock.read')
  findOneMaterial(@Param('id') id: string) {
    return this.stockService.findOneMaterial(id);
  }

  @Post('materials')
  @Permissions('stock.create')
  createMaterial(@Body() dto: CreateMaterialCatalogDto) {
    return this.stockService.createMaterial(dto);
  }

  @Patch('materials/:id')
  @Permissions('stock.update')
  updateMaterial(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialCatalogDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.stockService.updateMaterial(id, dto, user.id);
  }

  @Delete('materials/:id')
  @Permissions('stock.archive')
  removeMaterial(@Param('id') id: string) {
    return this.stockService.softDeleteMaterial(id);
  }

  @Post('materials/:id/restore')
  @Permissions('stock.archive')
  restoreMaterial(@Param('id') id: string) {
    return this.stockService.restoreMaterial(id);
  }

  // ─── Movements ────────────────────────────────────────────────────────

  @Get('movements')
  @Permissions('stock.read')
  findAllMovements(@Query() query: StockQueryDto) {
    return this.stockService.findAllMovements(query);
  }

  @Post('movements')
  @Permissions('stock.create')
  createMovement(
    @Body() dto: CreateStockMovementDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.stockService.createMovement(dto, user.id);
  }

  // ─── Dashboard ────────────────────────────────────────────────────────

  @Get('dashboard')
  @Permissions('stock.read')
  getDashboard() {
    return this.stockService.getDashboard();
  }

  // ─── Site Consumption ─────────────────────────────────────────────────

  @Post('consume')
  @Permissions('stock.create')
  consume(
    @Body() dto: ConsumeMaterialDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.stockService.consume(dto, user.id);
  }
}
