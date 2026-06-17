import {
  Controller, Get, Post, Put, Delete, Body, UploadedFile, UseInterceptors, Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get('profile')
  getProfile() {
    return this.service.getProfile();
  }

  @Put('profile')
  upsertProfile(@Body() body: Record<string, unknown>) {
    return this.service.upsertProfile(body);
  }

  @Post('logo')
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    return this.service.uploadLogo(file);
  }

  @Delete('logo')
  removeLogo() {
    return this.service.removeLogo();
  }

  @Public()
  @Get('logo/file')
  async serveLogo(@Res() res: Response) {
    const filename = await this.service.getLogoFilename();
    if (!filename) {
      res.status(404).json({ message: 'No logo uploaded' });
      return;
    }
    res.sendFile(filename, { root: this.service.getLogoPath() });
  }
}
