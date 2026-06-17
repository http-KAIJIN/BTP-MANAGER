import {
  Controller, Get, Post, Delete, Param, Query, UseInterceptors, UploadedFile, Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { SitePhotoService } from './site-photo.service';

@ApiTags('Site Photos')
@ApiBearerAuth()
@Controller('construction')
export class SitePhotoController {
  constructor(private readonly service: SitePhotoService) {}

  @Post('journals/:journalId/photos')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  upload(@Param('journalId') journalId: string, @UploadedFile() file: Express.Multer.File, @Query('type') type?: string) {
    return this.service.upload(journalId, file, type || 'GENERAL');
  }

  @Get('journals/:journalId/photos')
  listByJournal(@Param('journalId') journalId: string) {
    return this.service.listByJournal(journalId);
  }

  @Get('projects/:projectId/photos')
  galleryByProject(@Param('projectId') projectId: string, @Query('page') page?: string) {
    return this.service.galleryByProject(projectId, page ? Number(page) : 1);
  }

  @Get('photos/:id/file')
  async serveFile(@Param('id') id: string, @Res() res: Response) {
    const photo = await this.service.getPhoto(id);
    res.sendFile(photo.filename, { root: this.service.getStorageDir() });
  }

  @Get('photos/:id/thumbnail')
  async serveThumbnail(@Param('id') id: string, @Res() res: Response) {
    const photo = await this.service.getPhoto(id);
    const thumbPath = await this.service.getThumbnail(photo);
    res.sendFile(thumbPath);
  }

  @Delete('photos/:id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
