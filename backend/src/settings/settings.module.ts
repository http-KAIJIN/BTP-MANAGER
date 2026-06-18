import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PrismaModule } from '../database/prisma.module';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({ storage: memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 1 } }),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
