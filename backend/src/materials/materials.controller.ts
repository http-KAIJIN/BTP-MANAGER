import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MaterialsService } from './materials.service';

@ApiTags('Materials')
@ApiBearerAuth()
@Controller('construction/materials')
export class MaterialsController {
  constructor(private readonly service: MaterialsService) {}

  @Get()
  list(@Query('projectId') projectId: string, @Query('page') page?: string) {
    return this.service.list(projectId, page ? Number(page) : 1);
  }

  @Get('reports')
  reports(@Query('projectId') projectId: string) {
    return this.service.reports(projectId);
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
