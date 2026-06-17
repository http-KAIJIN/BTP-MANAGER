import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OcrRequestDto } from './dto/ocr-request.dto';
import { UpdateAiSettingsDto } from './dto/update-ai-settings.dto';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ESTIMATED_COST_PER_SCAN = 0.001;

const MOCK_SUPPLIERS = [
  'Fournitures BTP SARL',
  'Matériaux de Construction Atlas',
  'Cimenterie Nationale',
  'Aciérie du Maroc',
  'Quincaillerie Générale',
  'Électricité Bâtiment',
  'Plomberie Pro Services',
  'Bois et Dérivés',
  'Carrelage et Sanitaire',
  'Location Engins BTP',
];

const MOCK_DESCRIPTIONS = [
  'Fourniture de matériaux de construction pour projet en cours',
  'Achat de ciment et agrégats',
  'Fourniture d\'acier pour béton armé',
  'Matériel électrique et câblage',
  'Équipements de plomberie et chauffage',
  'Fourniture de bois pour coffrage',
  'Carrelage et revêtements muraux',
  'Location de pelleteuse et engins',
  'Peinture et revêtements',
  'Fourniture de menuiserie aluminium',
];

@Injectable()
export class OcrService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.aISettings.findFirst();
    if (!settings) {
      settings = await this.prisma.aISettings.create({ data: {} });
    }
    return settings;
  }

  async updateSettings(dto: UpdateAiSettingsDto) {
    let settings = await this.prisma.aISettings.findFirst();
    if (!settings) {
      settings = await this.prisma.aISettings.create({ data: {} });
    }
    return this.prisma.aISettings.update({
      where: { id: settings.id },
      data: dto,
    });
  }

  async scan(file: Express.Multer.File, dto: OcrRequestDto, userId: string) {
    const settings = await this.getSettings();

    if (!settings.enabled) {
      throw new BadRequestException('OCR is disabled. Enable it in AI settings first.');
    }

    if (Number(settings.currentMonthCost) >= Number(settings.monthlyBudget)) {
      throw new BadRequestException(
        'Monthly budget exceeded. Increase the budget or wait until next month.',
      );
    }

    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new PayloadTooLargeException('File exceeds maximum size of 10MB');
    }

    const extracted = this.generateMockExtraction();

    const [suppliers, categories, projects] = await Promise.all([
      this.prisma.supplier.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true },
      }),
      this.prisma.expenseCategory.findMany({
        where: { deletedAt: null, isActive: true },
        select: { id: true, name: true },
      }),
      this.prisma.project.findMany({
        where: { deletedAt: null, status: 'ACTIVE' },
        select: { id: true, name: true },
      }),
    ]);

    const suggestedSupplier = this.bestMatch(
      extracted.supplierName,
      suppliers,
    );
    const suggestedCategory = categories.length > 0
      ? categories[Math.floor(Math.random() * categories.length)]
      : null;
    const suggestedProject = projects.length > 0
      ? projects[Math.floor(Math.random() * projects.length)]
      : null;

    const log = await this.prisma.aIUsageLog.create({
      data: {
        userId,
        provider: settings.provider,
        tokens: Math.floor(Math.random() * 500) + 100,
        estimatedCost: ESTIMATED_COST_PER_SCAN,
        documentType: dto.documentType,
        fileName: file.originalname || 'unknown',
        fileSize: file.size,
        extractedData: extracted,
      },
    });

    const newCost =
      Number(settings.currentMonthCost) + ESTIMATED_COST_PER_SCAN;
    const disableOcr = newCost >= Number(settings.monthlyBudget);

    await this.prisma.aISettings.update({
      where: { id: settings.id },
      data: {
        currentMonthCost: newCost,
        ...(disableOcr ? { enabled: false } : {}),
      },
    });

    return {
      success: true,
      data: extracted,
      suggestedCategory: suggestedCategory
        ? { id: suggestedCategory.id, name: suggestedCategory.name }
        : null,
      suggestedSupplier: suggestedSupplier
        ? { id: suggestedSupplier.id, name: suggestedSupplier.name }
        : null,
      suggestedProject: suggestedProject
        ? { id: suggestedProject.id, name: suggestedProject.name }
        : null,
      logId: log.id,
    };
  }

  async confirm(logId: string) {
    const log = await this.prisma.aIUsageLog.findUnique({
      where: { id: logId },
    });
    if (!log) {
      throw new NotFoundException('Usage log not found');
    }
    await this.prisma.aIUsageLog.update({
      where: { id: logId },
      data: { extractedData: { ...(log.extractedData as Record<string, unknown> ?? {}), confirmed: true } },
    });
    return { success: true };
  }

  async getUsage() {
    const settings = await this.getSettings();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
    );

    const agg = await this.prisma.aIUsageLog.aggregate({
      where: {
        date: { gte: startOfMonth, lt: startOfNextMonth },
      },
      _sum: { estimatedCost: true },
      _count: true,
    });

    const totalCost = Number(agg._sum.estimatedCost ?? 0);
    const totalScans = agg._count;
    const remainingBudget = Math.max(
      0,
      Number(settings.monthlyBudget) - Number(settings.currentMonthCost),
    );

    return {
      totalCost,
      totalScans,
      remainingBudget,
      enabled: settings.enabled,
      monthlyBudget: Number(settings.monthlyBudget),
      currentMonthCost: Number(settings.currentMonthCost),
    };
  }

  private generateMockExtraction() {
    const idx = Math.floor(Math.random() * MOCK_SUPPLIERS.length);
    const amount = parseFloat(
      (Math.random() * 50000 + 1000).toFixed(2),
    );
    const tvaRate = [10, 14, 20][Math.floor(Math.random() * 3)];
    const tva = parseFloat((amount * (tvaRate / 100)).toFixed(2));
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');

    return {
      supplierName: MOCK_SUPPLIERS[idx],
      date: `2026-${month}-${day}`,
      invoiceNumber: `FACT-${String(Math.floor(Math.random() * 9999) + 1000)}`,
      amount,
      tva,
      currency: 'MAD',
      description: MOCK_DESCRIPTIONS[idx],
    };
  }

  private bestMatch(
    name: string,
    candidates: { id: string; name: string }[],
  ) {
    if (candidates.length === 0) return null;
    const normalized = name.toLowerCase();
    const scored = candidates.map((c) => {
      const cNorm = c.name.toLowerCase();
      let score = 0;
      const words = normalized.split(/\s+/);
      for (const word of words) {
        if (word.length > 2 && cNorm.includes(word)) {
          score += word.length;
        }
      }
      return { ...c, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0].score > 0 ? scored[0] : null;
  }
}
