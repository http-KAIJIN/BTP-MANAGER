import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { ConstructionService } from './construction.service';
import { UpdateConstructionPhaseDto } from './dto/update-phase.dto';

@ApiTags('Construction')
@ApiBearerAuth()
@Controller('construction')
export class ConstructionController {
  constructor(private readonly constructionService: ConstructionService) {}

  @Get('projects/:projectId/phases')
  @Permissions('construction.read')
  getPhases(@Param('projectId') projectId: string) {
    return this.constructionService.getPhases(projectId);
  }

  @Get('projects/:projectId/progress')
  @Permissions('construction.read')
  getProgress(@Param('projectId') projectId: string) {
    return this.constructionService.getProjectGlobalProgress(projectId);
  }

  @Patch('projects/:projectId/phases/:phaseName')
  @Permissions('construction.update')
  updatePhase(
    @Param('projectId') projectId: string,
    @Param('phaseName') phaseName: string,
    @Body() dto: UpdateConstructionPhaseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.constructionService.updatePhase(
      projectId,
      phaseName,
      dto,
      user.id,
    );
  }
}
