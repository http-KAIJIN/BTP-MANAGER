import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { SiteJournalController } from './site-journal.controller';
import { SiteJournalService } from './site-journal.service';
import { SitePhotoController } from './site-photo.controller';
import { SitePhotoService } from './site-photo.service';

@Module({
  imports: [PrismaModule],
  controllers: [SiteJournalController, SitePhotoController],
  providers: [SiteJournalService, SitePhotoService],
  exports: [SiteJournalService],
})
export class SiteJournalModule {}
