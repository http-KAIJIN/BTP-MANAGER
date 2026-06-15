import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import * as fs from 'node:fs';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { DocumentsService } from './documents.service';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('projects/:projectId')
  @Permissions('projects.read')
  findAll(@Param('projectId') projectId: string) {
    return this.documentsService.findAll(projectId);
  }

  @Post('projects/:projectId/upload')
  @Permissions('projects.update')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('category') category: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.upload(
      projectId,
      file,
      category ?? 'Other',
      user.id,
    );
  }

  @Get(':id/download')
  @Permissions('projects.read')
  async download(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.documentsService.findOne(id);
    const filePath = await this.documentsService.getFilePath(id);
    const fileStream = fs.createReadStream(filePath);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${doc.originalName}"`,
    );
    res.setHeader('Content-Type', doc.mimeType);
    fileStream.pipe(res);
  }

  @Delete(':id')
  @Permissions('projects.archive')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.delete(id, user.id);
  }
}
