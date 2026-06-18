import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NumbersService } from '../numbers/numbers.service';
import { getPagination, paginatedResponse } from '../common/utils/pagination';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseOrderQueryDto } from './dto/purchase-order-query.dto';
import { Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbers: NumbersService,
  ) {}

  async findAll(query: PurchaseOrderQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.PurchaseOrderWhereInput = {
      ...(query.includeArchived ? {} : { deletedAt: null }),
      ...(query.supplierId ? { supplierId: query.supplierId } : {}),
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.status ? { status: query.status as any } : {}),
      ...(query.search
        ? {
            OR: [
              { orderNumber: { contains: query.search, mode: 'insensitive' } },
              { title: { contains: query.search, mode: 'insensitive' } },
              { supplier: { name: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.PurchaseOrderOrderByWithRelationInput[] = [];
    if (query.sortBy === 'supplier') {
      orderBy.push({ supplier: { name: query.sortOrder } });
    } else {
      orderBy.push({ [query.sortBy || 'createdAt']: query.sortOrder || 'desc' });
    }

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          supplier: { select: { id: true, name: true, phone: true } },
          _count: { select: { items: true, receipts: true } },
        },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return paginatedResponse(data, total, page, limit);
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, deletedAt: null },
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
        project: { select: { id: true, name: true, city: true } },
        items: { orderBy: { sortOrder: 'asc' } },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async create(dto: CreatePurchaseOrderDto, actorId: string) {
    const orderNumber = await this.numbers.nextNumber('PURCHASE_ORDER');
    const items = dto.items.map((item, idx) => ({
      description: item.description,
      quantity: new Prisma.Decimal(item.quantity),
      unitPrice: new Prisma.Decimal(item.unitPrice),
      totalHT: new Prisma.Decimal(item.quantity * item.unitPrice),
      sortOrder: idx,
      ...(item.materialId ? { materialId: item.materialId } : {}),
    }));
    const subtotalHT = items.reduce((s, i) => s + Number(i.totalHT), 0);
    const taxRate = dto.taxRate ?? 0;
    const taxAmount = subtotalHT * (taxRate / 100);
    const totalTTC = subtotalHT + taxAmount;

    return this.prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: dto.supplierId,
        projectId: dto.projectId,
        orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(),
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : null,
        title: dto.title,
        notes: dto.notes,
        subtotalHT: new Prisma.Decimal(subtotalHT),
        taxRate: new Prisma.Decimal(taxRate),
        taxAmount: new Prisma.Decimal(taxAmount),
        totalTTC: new Prisma.Decimal(totalTTC),
        createdById: actorId,
        items: { create: items },
      },
      include: {
        supplier: { select: { id: true, name: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async update(id: string, dto: UpdatePurchaseOrderDto, actorId: string) {
    const existing = await this.prisma.purchaseOrder.findFirst({
      where: { id, deletedAt: null },
      include: { items: true },
    });
    if (!existing) throw new NotFoundException('Purchase order not found');
    if (existing.status !== 'DRAFT') throw new ConflictException('Only draft purchase orders can be edited');

    const updateData: any = { updatedById: actorId };
    if (dto.supplierId !== undefined) updateData.supplierId = dto.supplierId;
    if (dto.projectId !== undefined) updateData.projectId = dto.projectId;
    if (dto.orderDate !== undefined) updateData.orderDate = new Date(dto.orderDate);
    if (dto.expectedDate !== undefined) updateData.expectedDate = dto.expectedDate ? new Date(dto.expectedDate) : null;
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    if (dto.items) {
      const items = dto.items.map((item, idx) => ({
        description: item.description,
        quantity: new Prisma.Decimal(item.quantity),
        unitPrice: new Prisma.Decimal(item.unitPrice),
        totalHT: new Prisma.Decimal(item.quantity * item.unitPrice),
        sortOrder: idx,
        materialId: item.materialId ?? null,
      }));
      const subtotalHT = items.reduce((s, i) => s + Number(i.totalHT), 0);
      const taxRate = dto.taxRate ?? Number(existing.taxRate);
      const taxAmount = subtotalHT * (taxRate / 100);
      const totalTTC = subtotalHT + taxAmount;
      updateData.subtotalHT = new Prisma.Decimal(subtotalHT);
      updateData.taxRate = new Prisma.Decimal(taxRate);
      updateData.taxAmount = new Prisma.Decimal(taxAmount);
      updateData.totalTTC = new Prisma.Decimal(totalTTC);

      await this.prisma.purchaseOrderItem.deleteMany({ where: { orderId: id } });
      await this.prisma.purchaseOrderItem.createMany({ data: items.map((i) => ({ ...i, orderId: id })) });
    } else if (dto.taxRate !== undefined) {
      const taxRate = dto.taxRate;
      const taxAmount = Number(existing.subtotalHT) * (taxRate / 100);
      updateData.taxRate = new Prisma.Decimal(taxRate);
      updateData.taxAmount = new Prisma.Decimal(taxAmount);
      updateData.totalTTC = new Prisma.Decimal(Number(existing.subtotalHT) + taxAmount);
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        supplier: { select: { id: true, name: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async transitionStatus(id: string, status: string, actorId: string) {
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id, deletedAt: null } });
    if (!po) throw new NotFoundException('Purchase order not found');

    const transitions: Record<string, string[]> = {
      SENT: ['DRAFT'],
      APPROVED: ['SENT'],
      CANCELLED: ['DRAFT', 'SENT', 'APPROVED'],
    };

    const allowed = transitions[status];
    if (!allowed || !allowed.includes(po.status)) {
      throw new BadRequestException(`Cannot transition from ${po.status} to ${status}`);
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: status as any, updatedById: actorId },
      select: { id: true, orderNumber: true, status: true },
    });
  }

  async softDelete(id: string, actorId: string) {
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id, deletedAt: null } });
    if (!po) throw new NotFoundException('Purchase order not found');
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: actorId, status: 'CANCELLED' as any },
    });
  }

  async restore(id: string, actorId: string) {
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id, deletedAt: { not: null } } });
    if (!po) throw new NotFoundException('Archived purchase order not found');
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { deletedAt: null, deletedById: null, updatedById: actorId, status: 'DRAFT' as any },
    });
  }

  async generatePdf(id: string): Promise<Buffer> {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, deletedAt: null },
      include: {
        supplier: { select: { name: true, phone: true, category: true } },
        project: { select: { name: true, city: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    const company = await this.prisma.companyProfile.findFirst();

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - 100;
      const rightX = doc.page.width - 50;
      const primaryColor = '#1e40af';
      const lightGray = '#6b7280';

      let logoX = 60;
      doc.rect(50, 30, pageWidth, 60).fill('#f8fafc');
      doc.rect(50, 30, pageWidth, 3).fill(primaryColor);
      doc.rect(50, 87, pageWidth, 3).fill(primaryColor);
      if (company?.logoPath && fs.existsSync(company.logoPath) && path.extname(company.logoPath).toLowerCase() !== '.svg') {
        try {
          doc.image(company.logoPath, logoX, 35, { width: 50, height: 40 });
          logoX += 60;
        } catch {}
      }
      const titleX = Math.max(logoX, 60);
      doc.fontSize(22).font('Helvetica-Bold').fillColor(primaryColor).text('BON DE COMMANDE', titleX, 42);
      doc.fontSize(10).font('Helvetica').fillColor(lightGray).text(`N° ${po.orderNumber}`, titleX, 68);
      doc.fontSize(8).font('Helvetica').fillColor(lightGray)
        .text(`Date: ${this.formatDate(po.orderDate)}`, rightX, 42, { align: 'right' })
        .text(`Livraison: ${po.expectedDate ? this.formatDate(po.expectedDate) : '---'}`, rightX, 55, { align: 'right' })
        .text(`Statut: ${po.status}`, rightX, 72, { align: 'right' });

      let y = 110;
      if (company) {
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#111827').text(company.companyName, 50, y);
        y += 16;
        const lines = [
          company.address,
          company.ice ? `ICE: ${company.ice}` : null,
          company.ifTax ? `IF: ${company.ifTax}` : null,
          company.rc ? `RC: ${company.rc}` : null,
          company.cnss ? `CNSS: ${company.cnss}` : null,
          [company.phone, company.email, company.website].filter(Boolean).join(' | '),
        ].filter(Boolean) as string[];
        doc.fontSize(9).font('Helvetica').fillColor(lightGray);
        lines.forEach((line) => { doc.text(line, 50, y); y += 13; });
      }

      const boxX = rightX - 210;
      doc.roundedRect(boxX, 110, 210, 92, 4).stroke('#e5e7eb');
      doc.rect(boxX, 110, 210, 22).fill('#f9fafb');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151').text('FOURNISSEUR', boxX + 10, 115);
      doc.fontSize(9).font('Helvetica').fillColor('#111827').text(po.supplier.name, boxX + 10, 138);
      doc.fontSize(8).fillColor(lightGray);
      if (po.supplier.phone) doc.text(`Tél: ${po.supplier.phone}`, boxX + 10, 154);
      if (po.supplier.category) doc.text(`Catégorie: ${po.supplier.category}`, boxX + 10, 168);
      if (po.project) doc.text(`Projet: ${po.project.name}`, boxX + 10, 182);

      const tableTop = 230;
      const colWidths = [30, 250, 60, 70, 70];
      const headers = ['#', 'Désignation', 'Qté', 'PU', 'Montant'];
      doc.rect(50, tableTop, pageWidth, 18).fill(primaryColor);
      let cx = 50;
      headers.forEach((header, index) => {
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff').text(header, cx + 4, tableTop + 5, { width: colWidths[index] - 8, align: index >= 2 ? 'right' : 'left' });
        cx += colWidths[index];
      });

      y = tableTop + 24;
      po.items.forEach((item, index) => {
        if (y > 700) { doc.addPage(); y = 50; }
        doc.rect(50, y - 4, pageWidth, 20).fill(index % 2 === 0 ? '#ffffff' : '#f9fafb');
        cx = 50;
        [String(index + 1), item.description, this.formatQty(item.quantity), this.formatPrice(item.unitPrice), this.formatPrice(item.totalHT)].forEach((value, valueIndex) => {
          doc.fontSize(8).font('Helvetica').fillColor('#374151').text(value, cx + 4, y, { width: colWidths[valueIndex] - 8, align: valueIndex >= 2 ? 'right' : 'left' });
          cx += colWidths[valueIndex];
        });
        y += 20;
      });

      y += 10;
      const totalsX = rightX - 200;
      const totalLine = (label: string, value: string, bold = false) => {
        doc.rect(totalsX, y, 200, bold ? 24 : 20).fill(bold ? '#f8fafc' : '#ffffff');
        doc.fontSize(bold ? 11 : 9).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(bold ? primaryColor : '#374151').text(label, totalsX + 8, y + 5);
        doc.text(value, totalsX + 8, y + 5, { align: 'right', width: 184 });
        y += bold ? 24 : 20;
      };
      totalLine('Sous-total HT', this.formatPrice(po.subtotalHT));
      if (Number(po.taxRate) > 0) totalLine(`TVA (${po.taxRate}%)`, this.formatPrice(po.taxAmount));
      totalLine('Total TTC', this.formatPrice(po.totalTTC), true);

      const companyDefaults = company as typeof company & { defaultNotes?: string | null };
      if (po.notes || companyDefaults?.defaultNotes || company?.defaultPaymentTerms) {
        y += 18;
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151').text('Notes', 50, y);
        y += 14;
        doc.fontSize(8).font('Helvetica').fillColor(lightGray).text([po.notes, companyDefaults?.defaultNotes, company?.defaultPaymentTerms].filter(Boolean).join('\n'), 50, y, { width: 280 });
      }

      const footerY = doc.page.height - 80;
      doc.rect(50, footerY, pageWidth, 1).fill('#e5e7eb');
      const footerLines = [
        company?.companyName,
        company?.address,
        company?.ice ? `ICE: ${company.ice}` : null,
        company?.ifTax ? `IF: ${company.ifTax}` : null,
        company?.rc ? `RC: ${company.rc}` : null,
        company?.cnss ? `CNSS: ${company.cnss}` : null,
        [company?.phone, company?.email, company?.website].filter(Boolean).join(' | '),
        company?.defaultDocumentFooter,
      ].filter(Boolean) as string[];
      doc.fontSize(7).font('Helvetica').fillColor(lightGray);
      let fy = footerY + 8;
      footerLines.forEach((line) => { doc.text(line, 50, fy, { align: 'center', width: pageWidth }); fy += 9; });

      doc.end();
    });
  }

  private formatDate(d: Date | string): string {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private formatPrice(val: any): string {
    return Number(val).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD';
  }

  private formatQty(val: any): string {
    const num = Number(val);
    return num % 1 === 0 ? num.toString() : num.toLocaleString('fr-FR', { minimumFractionDigits: 2 });
  }
}
