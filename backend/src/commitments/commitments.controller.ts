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
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { FinancialService } from '../financial/financial.service';
import { CommitmentsService } from './commitments.service';
import { CommitmentQueryDto } from './dto/commitment-query.dto';
import { CreateCommitmentDto } from './dto/create-commitment.dto';
import { UpdateCommitmentDto } from './dto/update-commitment.dto';

@ApiTags('Commitments')
@ApiBearerAuth()
@Controller('commitments')
export class CommitmentsController {
  constructor(
    private readonly commitmentsService: CommitmentsService,
    private readonly financialService: FinancialService,
  ) {}

  @Get()
  @Permissions('commitments.read')
  findAll(@Query() query: CommitmentQueryDto) {
    return this.commitmentsService.findAll(query);
  }

  @Post()
  @Permissions('commitments.create')
  create(
    @Body() dto: CreateCommitmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.commitmentsService.create(dto, user.id);
  }

  @Get(':id/balance')
  @Permissions('commitments.read')
  balance(@Param('id', UuidValidationPipe) id: string) {
    return this.financialService.getCommitmentBalance(id);
  }

  @Get(':id')
  @Permissions('commitments.read')
  findOne(@Param('id', UuidValidationPipe) id: string) {
    return this.commitmentsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('commitments.update')
  update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: UpdateCommitmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.commitmentsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Permissions('commitments.archive')
  remove(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.commitmentsService.softDelete(id, user.id);
  }

  @Post(':id/restore')
  @Permissions('commitments.archive')
  restore(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.commitmentsService.restore(id, user.id);
  }
}
