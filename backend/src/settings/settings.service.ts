import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class SettingsService {
  private readonly storageDir: string;

  constructor(private readonly prisma: PrismaService) {
    this.storageDir = process.env.UPLOAD_STORAGE_PATH || '/app/uploads';
    this.ensureDir(path.join(this.storageDir, 'company-logo'));
  }

  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  async getProfile() {
    const profile = await this.prisma.companyProfile.findFirst();
    if (!profile) return null;
    return {
      ...profile,
      defaultTvaRate: Number(profile.defaultTvaRate),
    };
  }

  async upsertProfile(data: Record<string, unknown>) {
    const existing = await this.prisma.companyProfile.findFirst();
    const updateData: Record<string, unknown> = {};
    const fields = [
      'companyName', 'ice', 'ifTax', 'rc', 'cnss', 'address',
      'phone', 'email', 'website', 'bankName', 'bankRib',
      'defaultPaymentTerms', 'defaultDocumentFooter',
    ];
    for (const f of fields) {
      if (data[f] !== undefined) updateData[f] = data[f];
    }
    if (data.defaultTvaRate !== undefined) {
      updateData.defaultTvaRate = Number(data.defaultTvaRate);
    }

    if (existing) {
      return this.prisma.companyProfile.update({
        where: { id: existing.id },
        data: updateData,
      });
    }
    return this.prisma.companyProfile.create({ data: updateData as any });
  }

  async uploadLogo(file: Express.Multer.File) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: PNG, JPG, SVG, WebP');
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('File too large. Max 2MB');
    }

    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `company-logo${ext}`;
    const filePath = path.join(this.storageDir, 'company-logo', filename);

    // Remove old logo if exists
    const existing = await this.prisma.companyProfile.findFirst();
    if (existing?.logoPath) {
      try { fs.unlinkSync(existing.logoPath); } catch {}
    }

    fs.writeFileSync(filePath, file.buffer);

    // Also save an optimized version for PDF
    const pdfFilename = `company-logo-pdf${ext}`;
    const pdfPath = path.join(this.storageDir, 'company-logo', pdfFilename);
    fs.writeFileSync(pdfPath, file.buffer);

    if (existing) {
      return this.prisma.companyProfile.update({
        where: { id: existing.id },
        data: { logoPath: filePath },
      });
    }
    return this.prisma.companyProfile.create({
      data: { companyName: 'My Company', logoPath: filePath } as any,
    });
  }

  async removeLogo() {
    const existing = await this.prisma.companyProfile.findFirst();
    if (existing?.logoPath) {
      try { fs.unlinkSync(existing.logoPath); } catch {}
      const pdfPath = existing.logoPath.replace('company-logo', 'company-logo-pdf');
      try { fs.unlinkSync(pdfPath); } catch {}
    }
    if (existing) {
      return this.prisma.companyProfile.update({
        where: { id: existing.id },
        data: { logoPath: null },
      });
    }
    return { success: true };
  }

  getLogoPath() {
    return path.join(this.storageDir, 'company-logo');
  }

  async getLogoFilename() {
    const profile = await this.prisma.companyProfile.findFirst();
    if (!profile?.logoPath) return null;
    return path.basename(profile.logoPath);
  }
}
