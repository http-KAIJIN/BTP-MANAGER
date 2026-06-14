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
import { CompaniesService } from './companies.service';
import { CompanyQueryDto } from './dto/company-query.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @Permissions('companies.read')
  findAll(@Query() query: CompanyQueryDto) {
    return this.companiesService.findAll(query);
  }

  @Post()
  @Permissions('companies.create')
  create(
    @Body() dto: CreateCompanyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companiesService.create(dto, user.id);
  }

  @Get(':id')
  @Permissions('companies.read')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('companies.update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companiesService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Permissions('companies.archive')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.companiesService.softDelete(id, user.id);
  }

  @Post(':id/restore')
  @Permissions('companies.archive')
  restore(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.companiesService.restore(id, user.id);
  }
}
