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
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly financialService: FinancialService,
  ) {}

  @Get()
  @Permissions('projects.read')
  findAll(@Query() query: ProjectQueryDto) {
    return this.projectsService.findAll(query);
  }

  @Post()
  @Permissions('projects.create')
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.create(dto, user.id);
  }

  @Get(':id')
  @Permissions('projects.read')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Get(':id/financial-summary')
  @Permissions('projects.read')
  financialSummary(@Param('id') id: string) {
    return this.financialService.getProjectFinancialSummary(id);
  }

  @Patch(':id')
  @Permissions('projects.update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Permissions('projects.archive')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.softDelete(id, user.id);
  }

  @Post(':id/restore')
  @Permissions('projects.archive')
  restore(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.restore(id, user.id);
  }
}
