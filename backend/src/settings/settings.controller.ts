import {
  Controller, Get, Post, Put, Delete, Body, UploadedFile, UseInterceptors, Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get('profile')
  @Permissions('dashboard.read')
  getProfile() {
    return this.service.getProfile();
  }

  @Put('profile')
  @Permissions('admin.roles.manage')
  upsertProfile(@Body() body: Record<string, unknown>) {
    return this.service.upsertProfile(body);
  }

  @Post('logo')
  @Permissions('admin.roles.manage')
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    return this.service.uploadLogo(file);
  }

  @Delete('logo')
  @Permissions('admin.roles.manage')
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
