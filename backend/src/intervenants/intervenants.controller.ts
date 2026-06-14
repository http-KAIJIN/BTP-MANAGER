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
import { CreateIntervenantDto } from './dto/create-intervenant.dto';
import { IntervenantQueryDto } from './dto/intervenant-query.dto';
import { UpdateIntervenantDto } from './dto/update-intervenant.dto';
import { IntervenantsService } from './intervenants.service';

@ApiTags('Intervenants')
@ApiBearerAuth()
@Controller('intervenants')
export class IntervenantsController {
  constructor(private readonly intervenantsService: IntervenantsService) {}

  @Get()
  @Permissions('intervenants.read')
  findAll(@Query() query: IntervenantQueryDto) {
    return this.intervenantsService.findAll(query);
  }

  @Post()
  @Permissions('intervenants.create')
  create(
    @Body() dto: CreateIntervenantDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.intervenantsService.create(dto, user.id);
  }

  @Get(':id')
  @Permissions('intervenants.read')
  findOne(@Param('id') id: string) {
    return this.intervenantsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('intervenants.update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateIntervenantDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.intervenantsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Permissions('intervenants.archive')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.intervenantsService.softDelete(id, user.id);
  }

  @Post(':id/restore')
  @Permissions('intervenants.archive')
  restore(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.intervenantsService.restore(id, user.id);
  }
}
