import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SiteJournalService } from './site-journal.service';

@ApiTags('Site Journal')
@ApiBearerAuth()
@Controller('construction/journals')
export class SiteJournalController {
  constructor(private readonly service: SiteJournalService) {}

  @Get()
  list(@Query('projectId') projectId: string, @Query('date') date?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.list(projectId, date, page ? Number(page) : 1, limit ? Number(limit) : 20);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
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
