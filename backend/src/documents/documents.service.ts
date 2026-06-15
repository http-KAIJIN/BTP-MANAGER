import { Injectable, NotFoundException } from '@nestjs/common';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { PrismaService } from '../database/prisma.service';

const UPLOAD_DIR = process.env.UPLOAD_STORAGE_PATH ?? '/app/uploads';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(projectId: string) {
    return this.prisma.document.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, deletedAt: null },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async upload(
    projectId: string,
    file: Express.Multer.File,
    category: string,
    actorId: string,
  ) {
    const projectDir = path.join(UPLOAD_DIR, projectId);
    await fs.mkdir(projectDir, { recursive: true });

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(projectDir, fileName);
    await fs.writeFile(filePath, file.buffer);

    return this.prisma.document.create({
      data: {
        projectId,
        name: file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        category,
        filePath,
        createdById: actorId,
      },
    });
  }

  async delete(id: string, actorId: string) {
    const doc = await this.findOne(id);
    await this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: actorId },
    });
    return { success: true };
  }

  async getFilePath(id: string): Promise<string> {
    const doc = await this.findOne(id);
    return doc.filePath;
  }
}
