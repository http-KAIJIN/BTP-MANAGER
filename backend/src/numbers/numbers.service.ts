import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class NumbersService {
  constructor(private readonly prisma: PrismaService) {}

  async nextNumber(entityType: 'QUOTE' | 'INVOICE' | 'PURCHASE_ORDER' | 'GOODS_RECEIPT'): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const prefix =
      entityType === 'QUOTE' ? 'DEV'
      : entityType === 'INVOICE' ? 'FAC'
      : entityType === 'PURCHASE_ORDER' ? 'BC'
      : 'BR';

    const seq = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.numberingSequence.findUnique({
        where: { entityType_year: { entityType, year } },
      });
      if (existing) {
        return tx.numberingSequence.update({
          where: { id: existing.id },
          data: { lastNumber: { increment: 1 } },
        });
      }
      return tx.numberingSequence.create({
        data: { entityType, prefix, year, lastNumber: 1 },
      });
    });

    const num = String(seq.lastNumber).padStart(4, '0');
    return `${prefix}-${year}-${num}`;
  }
}
