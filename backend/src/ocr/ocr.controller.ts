import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { OcrRequestDto } from './dto/ocr-request.dto';
import { UpdateAiSettingsDto } from './dto/update-ai-settings.dto';
import { OcrService } from './ocr.service';

@ApiTags('OCR / AI')
@ApiBearerAuth()
@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Get('settings')
  @Permissions('ocr.settings')
  getSettings() {
    return this.ocrService.getSettings();
  }

  @Put('settings')
  @Permissions('ocr.settings')
  updateSettings(@Body() dto: UpdateAiSettingsDto) {
    return this.ocrService.updateSettings(dto);
  }

  @Post('scan')
  @Permissions('ocr.scan')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        documentType: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  scan(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: OcrRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ocrService.scan(file, dto, user.id);
  }

  @Post('confirm')
  @Permissions('ocr.confirm')
  confirm(@Body() body: { logId: string }) {
    return this.ocrService.confirm(body.logId);
  }

  @Get('usage')
  @Permissions('ocr.usage')
  getUsage() {
    return this.ocrService.getUsage();
  }
}
