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

@Injectable()
export class OcrService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.aISettings.findFirst();
    if (!settings) {
      settings = await this.prisma.aISettings.create({ data: {} });
    }
    return this.toSafeSettings(settings);
  }

  async updateSettings(dto: UpdateAiSettingsDto) {
    let settings = await this.prisma.aISettings.findFirst();
    if (!settings) {
      settings = await this.prisma.aISettings.create({ data: {} });
    }
    const data = { ...dto } as Record<string, unknown>;
    if (!data.apiKey) delete data.apiKey;
    const updated = await this.prisma.aISettings.update({
      where: { id: settings.id },
      data,
    });
    return this.toSafeSettings(updated);
  }

  async scan(file: Express.Multer.File, dto: OcrRequestDto, userId: string) {
    const settings = await this.prisma.aISettings.findFirst() ?? await this.prisma.aISettings.create({ data: {} });
    const usage = await this.getUsage();

    if (!settings.enabled) {
      throw new BadRequestException('OCR is disabled. Enable it in AI settings first.');
    }

    if (usage.currentMonthCost + ESTIMATED_COST_PER_SCAN > usage.monthlyBudget) {
      await this.prisma.aISettings.update({
        where: { id: settings.id },
        data: { enabled: false, currentMonthCost: usage.currentMonthCost },
      });
      throw new BadRequestException(
        'Monthly budget exceeded. Increase the budget or wait until next month.',
      );
    }

    if (settings.provider !== 'gemini') {
      throw new BadRequestException('Only Gemini OCR provider is supported.');
    }

    if (!settings.apiKey) {
      throw new BadRequestException('Gemini API key is required.');
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

    const { extracted, tokens } = await this.extractWithGemini(
      settings.apiKey,
      file,
      dto.documentType,
    );

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
        tokens,
        estimatedCost: ESTIMATED_COST_PER_SCAN,
        documentType: dto.documentType,
        fileName: file.originalname || 'unknown',
        fileSize: file.size,
        extractedData: extracted,
      },
    });

    const newCost = usage.currentMonthCost + ESTIMATED_COST_PER_SCAN;
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

  async confirm(body: {
    logId: string;
    projectId: string;
    categoryId: string;
    supplierId?: string;
    paymentMode: string;
    notes?: string;
  }, userId: string) {
    const log = await this.prisma.aIUsageLog.findUnique({
      where: { id: body.logId },
    });
    if (!log) {
      throw new NotFoundException('Usage log not found');
    }
    if (log.userId !== userId) {
      throw new NotFoundException('Usage log not found');
    }
    const extracted = log.extractedData as Record<string, unknown> | null;
    if (!extracted) {
      throw new BadRequestException('No extracted data found');
    }
    if (extracted.confirmed || extracted.expenseId) {
      throw new BadRequestException('This OCR result has already been confirmed');
    }
    const amount = Number(extracted.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('OCR amount must be greater than zero');
    }

    const [project, category, supplier] = await Promise.all([
      this.prisma.project.findFirst({ where: { id: body.projectId, deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.expenseCategory.findFirst({ where: { id: body.categoryId, deletedAt: null, isActive: true } }),
      body.supplierId
        ? this.prisma.supplier.findFirst({ where: { id: body.supplierId, deletedAt: null } })
        : Promise.resolve(null),
    ]);
    if (!project) throw new BadRequestException('Selected project is not available');
    if (!category) throw new BadRequestException('Selected category is not available');
    if (body.supplierId && !supplier) throw new BadRequestException('Selected supplier is not available');

    const expense = await this.prisma.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: {
          projectId: body.projectId,
          categoryId: body.categoryId,
          supplierId: body.supplierId || null,
          description: String(extracted.description || 'OCR expense'),
          amount,
          expenseDate: new Date(String(extracted.date || new Date().toISOString())),
          paymentMode: this.normalizePaymentMode(body.paymentMode),
          notes: body.notes,
          createdById: userId,
        },
      });
      await tx.aIUsageLog.update({
        where: { id: body.logId },
        data: { extractedData: { ...extracted, confirmed: true, expenseId: created.id } },
      });
      return created;
    });
    return { success: true, expenseId: expense.id };
  }

  async getUsage() {
    const settings = await this.prisma.aISettings.findFirst() ?? await this.prisma.aISettings.create({ data: {} });
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
      Number(settings.monthlyBudget) - totalCost,
    );

    if (totalCost !== Number(settings.currentMonthCost)) {
      await this.prisma.aISettings.update({
        where: { id: settings.id },
        data: {
          currentMonthCost: totalCost,
          ...(totalCost >= Number(settings.monthlyBudget) ? { enabled: false } : {}),
        },
      });
    }

    return {
      totalCost,
      totalScans,
      remainingBudget,
      enabled: settings.enabled,
      monthlyBudget: Number(settings.monthlyBudget),
      currentMonthCost: totalCost,
    };
  }

  private async extractWithGemini(apiKey: string, file: Express.Multer.File, documentType: string) {
    const prompt = `Extract supplier invoice or receipt data from this ${documentType}. Return only valid JSON with keys supplierName, date as YYYY-MM-DD, invoiceNumber, amount, tva, currency, description.`;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType: file.mimetype, data: file.buffer.toString('base64') } },
            ],
          }],
        }),
      },
    );

    if (!response.ok) {
      throw new BadRequestException(`Gemini OCR failed: ${response.statusText}`);
    }

    const json = await response.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      usageMetadata?: { totalTokenCount?: number };
    };
    const text = json.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n') || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new BadRequestException('Gemini did not return structured OCR data');
    }
    const extracted = JSON.parse(match[0]) as Record<string, unknown>;
    return {
      extracted: {
        supplierName: String(extracted.supplierName || ''),
        date: String(extracted.date || new Date().toISOString().slice(0, 10)),
        invoiceNumber: String(extracted.invoiceNumber || ''),
        amount: Number(extracted.amount || 0),
        tva: Number(extracted.tva || 0),
        currency: String(extracted.currency || 'MAD'),
        description: String(extracted.description || documentType),
      },
      tokens: json.usageMetadata?.totalTokenCount ?? 0,
    };
  }

  private normalizePaymentMode(value: string): 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' {
    if (value === 'cash' || value === 'CASH') return 'CASH';
    if (value === 'cheque' || value === 'CHEQUE') return 'CHEQUE';
    if (value === 'bank_transfer' || value === 'BANK_TRANSFER') return 'BANK_TRANSFER';
    throw new BadRequestException('Invalid payment mode');
  }

  private toSafeSettings(settings: {
    provider: string;
    apiKey: string | null;
    enabled: boolean;
    monthlyBudget: unknown;
    currentMonthCost: unknown;
  }) {
    return {
      provider: settings.provider,
      apiKey: null,
      hasApiKey: Boolean(settings.apiKey),
      enabled: settings.enabled,
      monthlyBudget: Number(settings.monthlyBudget),
      currentMonthCost: Number(settings.currentMonthCost),
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
