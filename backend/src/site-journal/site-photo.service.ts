import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';

@Injectable()
export class SitePhotoService {
  private readonly storageDir: string;

  constructor(private readonly prisma: PrismaService) {
    this.storageDir = process.env.UPLOAD_STORAGE_PATH || path.join(process.cwd(), 'uploads');
    this.ensureDir(path.join(this.storageDir, 'site-photos'));
    this.ensureDir(path.join(this.storageDir, 'site-photos-thumbnails'));
  }

  getStorageDir() {
    return path.join(this.storageDir, 'site-photos');
  }

  private getThumbDir() {
    return path.join(this.storageDir, 'site-photos-thumbnails');
  }

  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  async upload(journalId: string, file: Express.Multer.File, photoType: string) {
    const journal = await this.prisma.siteJournal.findFirst({ where: { id: journalId, deletedAt: null } });
    if (!journal) throw new NotFoundException('Journal not found');

    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${journalId.slice(0, 8)}-${Date.now()}${ext}`;
    const filePath = path.join(this.getStorageDir(), filename);

    // Resize large images to max 1920px width, save as JPEG
    const buffer = await sharp(file.buffer)
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    fs.writeFileSync(filePath, buffer);

    // Generate thumbnail (300px)
    const thumbBuffer = await sharp(buffer).resize(300, 200, { fit: 'cover' }).jpeg({ quality: 60 }).toBuffer();
    const thumbPath = path.join(this.getThumbDir(), filename);
    fs.writeFileSync(thumbPath, thumbBuffer);

    return this.prisma.siteJournalPhoto.create({
      data: {
        journalId,
        filename,
        originalName: file.originalname,
        mimeType: 'image/jpeg',
        size: buffer.length,
        photoType,
      },
    });
  }

  async listByJournal(journalId: string) {
    return this.prisma.siteJournalPhoto.findMany({
      where: { journalId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async galleryByProject(projectId: string, page = 1) {
    const limit = 20;
    const journals = await this.prisma.siteJournal.findMany({
      where: { projectId, deletedAt: null },
      select: { id: true },
    });
    const journalIds = journals.map((j) => j.id);

    const [data, total] = await Promise.all([
      this.prisma.siteJournalPhoto.findMany({
        where: { journalId: { in: journalIds }, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.siteJournalPhoto.count({
        where: { journalId: { in: journalIds }, deletedAt: null },
      }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getPhoto(id: string) {
    const photo = await this.prisma.siteJournalPhoto.findFirst({ where: { id, deletedAt: null } });
    if (!photo) throw new NotFoundException('Photo not found');
    return photo;
  }

  async getThumbnail(photo: { id: string; filename: string }) {
    const thumbPath = path.join(this.getThumbDir(), photo.filename);
    if (fs.existsSync(thumbPath)) return thumbPath;
    // Fallback to original if thumbnail doesn't exist
    return path.join(this.getStorageDir(), photo.filename);
  }

  async delete(id: string) {
    const photo = await this.getPhoto(id);
    // Delete files
    try {
      fs.unlinkSync(path.join(this.getStorageDir(), photo.filename));
      fs.unlinkSync(path.join(this.getThumbDir(), photo.filename));
    } catch {}
    await this.prisma.siteJournalPhoto.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }
}
