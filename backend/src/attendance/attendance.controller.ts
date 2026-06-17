import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('construction/attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Get()
  list(@Query('projectId') projectId: string, @Query('date') date?: string) {
    return this.service.list(projectId, date);
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.service.create(body);
  }

  @Post('batch')
  async createBatch(@Body() body: { projectId: string; date?: string; records: Record<string, unknown>[] }) {
    return this.service.createBatch(body.projectId, body.date, body.records);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Get('dashboard')
  dashboard(@Query('projectId') projectId: string, @Query('date') date?: string) {
    return this.service.dashboard(projectId, date);
  }
}
