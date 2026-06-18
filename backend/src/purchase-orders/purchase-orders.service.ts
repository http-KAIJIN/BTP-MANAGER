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
          supplier: { select: { id: true, name: true, phone: true, email: true, address: true, contactPerson: true, ice: true, ifTax: true, website: true } },
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
      unit: item.unit || 'unité',
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
        contractReference: dto.contractReference,
        siteReference: dto.siteReference,
        projectReference: dto.projectReference,
        workPhase: dto.workPhase,
        projectManager: dto.projectManager,
        advancePayment: dto.advancePayment !== undefined ? new Prisma.Decimal(dto.advancePayment) : undefined,
        advancePercentage: dto.advancePercentage !== undefined ? new Prisma.Decimal(dto.advancePercentage) : undefined,
        paymentSchedule: dto.paymentSchedule,
        paymentTerms: dto.paymentTerms,
        retentionGuarantee: dto.retentionGuarantee !== undefined ? new Prisma.Decimal(dto.retentionGuarantee) : undefined,
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
    ['contractReference', 'siteReference', 'projectReference', 'workPhase', 'projectManager', 'paymentSchedule', 'paymentTerms'].forEach((field) => {
      if ((dto as any)[field] !== undefined) updateData[field] = (dto as any)[field];
    });
    ['advancePayment', 'advancePercentage', 'retentionGuarantee'].forEach((field) => {
      if ((dto as any)[field] !== undefined) updateData[field] = (dto as any)[field] === null ? null : new Prisma.Decimal((dto as any)[field]);
    });

    if (dto.items) {
      const items = dto.items.map((item, idx) => ({
        description: item.description,
        quantity: new Prisma.Decimal(item.quantity),
        unit: item.unit || 'unité',
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
        supplier: { select: { name: true, phone: true, email: true, address: true, contactPerson: true, ice: true, ifTax: true, website: true, category: true } },
        project: { select: { name: true, city: true, address: true } },
        items: { orderBy: { sortOrder: 'asc' } },
        createdBy: { select: { fullName: true } },
        updatedBy: { select: { fullName: true } },
      },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    const company = await this.prisma.companyProfile.findFirst();

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 44, size: 'A4', bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const left = 44;
      const right = doc.page.width - 44;
      const pageWidth = right - left;
      const primaryColor = '#1f3a5f';
      const accent = '#f97316';
      const lightGray = '#6b7280';
      const ink = '#111827';
      const line = '#e5e7eb';
      const soft = '#f8fafc';

      doc.roundedRect(left, 38, 148, 72, 10).fillAndStroke('#ffffff', line);
      doc.rect(left, 38, 5, 72).fill(accent);
      if (company?.logoPath && fs.existsSync(company.logoPath) && path.extname(company.logoPath).toLowerCase() !== '.svg') {
        try {
          doc.image(company.logoPath, left + 18, 51, { fit: [104, 44] });
        } catch {}
      } else {
        doc.font('Helvetica-Bold').fontSize(13).fillColor(primaryColor).text(company?.companyName ?? 'BTP Manager', left + 18, 56, { width: 110, align: 'center' });
      }

      const companyLines = [
        company?.address,
        [company?.phone, company?.email].filter(Boolean).join(' | '),
        company?.website,
        [company?.ice ? `ICE: ${company.ice}` : '', company?.ifTax ? `IF: ${company.ifTax}` : ''].filter(Boolean).join(' | '),
        [company?.rc ? `RC: ${company.rc}` : '', company?.cnss ? `CNSS: ${company.cnss}` : ''].filter(Boolean).join(' | '),
      ].filter(Boolean) as string[];
      doc.font('Helvetica-Bold').fontSize(11).fillColor(ink).text(company?.companyName ?? '', right - 270, 43, { width: 270, align: 'right' });
      let infoY = 61;
      doc.font('Helvetica').fontSize(7.2).fillColor(lightGray);
      companyLines.forEach((lineText) => { doc.text(lineText, right - 270, infoY, { width: 270, align: 'right' }); infoY += 10.5; });

      const titleY = 132;
      doc.roundedRect(left, titleY, pageWidth, 66, 8).fillAndStroke(soft, line);
      doc.rect(left, titleY, 5, 66).fill(accent);
      doc.font('Helvetica-Bold').fontSize(24).fillColor(primaryColor).text('BON DE COMMANDE', left + 18, titleY + 13);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(lightGray).text(`N° ${po.orderNumber}`, left + 20, titleY + 45);
      doc.font('Helvetica-Bold').fontSize(8).fillColor(lightGray).text('Date', right - 190, titleY + 17, { width: 90, align: 'right' });
      doc.font('Helvetica-Bold').fontSize(9).fillColor(ink).text(this.formatDate(po.orderDate), right - 90, titleY + 17, { width: 90, align: 'right' });
      doc.font('Helvetica-Bold').fontSize(8).fillColor(lightGray).text('Livraison prévue', right - 190, titleY + 38, { width: 90, align: 'right' });
      doc.font('Helvetica-Bold').fontSize(9).fillColor(ink).text(po.expectedDate ? this.formatDate(po.expectedDate) : '-', right - 90, titleY + 38, { width: 90, align: 'right' });

      let y = titleY + 94;
      const blockW = (pageWidth - 18) / 2;
      doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor).text('FOURNISSEUR', left, y);
      doc.roundedRect(left, y + 16, blockW, 96, 8).fillAndStroke('#ffffff', line);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(ink).text(po.supplier.name, left + 14, y + 30, { width: blockW - 28 });
      const supplierLines = [
        po.supplier.category ? `Catégorie: ${po.supplier.category}` : '',
        po.supplier.contactPerson ? `Contact: ${po.supplier.contactPerson}` : '',
        po.supplier.phone ? `Tél: ${po.supplier.phone}` : '',
        po.supplier.email ? `Email: ${po.supplier.email}` : '',
        po.supplier.ice ? `ICE: ${po.supplier.ice}` : '',
        po.supplier.ifTax ? `IF: ${po.supplier.ifTax}` : '',
        po.supplier.address ? `Adresse: ${po.supplier.address}` : '',
      ];
      doc.font('Helvetica').fontSize(8).fillColor(lightGray);
      let sy = y + 50;
      supplierLines.filter(Boolean).forEach((lineText) => { doc.text(lineText, left + 14, sy, { width: blockW - 28 }); sy += 11; });

      doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor).text('LIVRAISON', left + blockW + 18, y);
      doc.roundedRect(left + blockW + 18, y + 16, blockW, 96, 8).fillAndStroke('#ffffff', line);
      const deliveryLines = [
        po.project ? `Projet: ${po.project.name}` : '',
        po.projectReference ? `Réf. projet: ${po.projectReference}` : '',
        po.contractReference ? `Contrat: ${po.contractReference}` : '',
        po.siteReference ? `Code chantier: ${po.siteReference}` : '',
        po.workPhase ? `Phase/Lot: ${po.workPhase}` : '',
        po.projectManager ? `Chef de projet: ${po.projectManager}` : '',
        po.project?.city ? `Ville: ${po.project.city}` : '',
        po.project?.address ? `Adresse chantier: ${po.project.address}` : company?.address ? `Adresse livraison: ${company.address}` : '',
        po.expectedDate ? `Date prévue: ${this.formatDate(po.expectedDate)}` : '',
      ];
      doc.font('Helvetica').fontSize(8).fillColor(lightGray);
      let dy = y + 31;
      deliveryLines.filter(Boolean).forEach((lineText) => { doc.text(lineText, left + blockW + 32, dy, { width: blockW - 28 }); dy += 12; });

      y += 140;
      const colWidths = [28, 226, 56, 50, 76, 70];
      const headers = ['#', 'Désignation', 'Qté', 'Unité', 'PU HT', 'Total HT'];
      doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor).text('DÉTAIL DE LA COMMANDE', left, y - 16);
      doc.roundedRect(left, y, pageWidth, 24, 5).fill(primaryColor);
      let cx = left;
      headers.forEach((header, index) => {
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff').text(header, cx + 7, y + 8, { width: colWidths[index] - 14, align: index >= 2 ? 'right' : 'left' });
        cx += colWidths[index];
      });

      y += 28;
      po.items.forEach((item, index) => {
        if (y > 680) { doc.addPage(); y = 76; }
        const rowHeight = Math.max(29, doc.heightOfString(item.description, { width: colWidths[1] - 14 }) + 16);
        doc.rect(left, y - 2, pageWidth, rowHeight).fill(index % 2 === 0 ? '#ffffff' : '#fbfdff');
        cx = left;
        [String(index + 1), item.description, this.formatQty(item.quantity), item.unit || 'unité', this.formatPrice(item.unitPrice), this.formatPrice(item.totalHT)].forEach((value, valueIndex) => {
          doc.fontSize(8).font(valueIndex === 4 ? 'Helvetica-Bold' : 'Helvetica').fillColor(ink).text(value, cx + 7, y + 7, { width: colWidths[valueIndex] - 14, align: valueIndex >= 2 ? 'right' : 'left' });
          cx += colWidths[valueIndex];
        });
        y += rowHeight;
      });

      y += 26;
      if (y > 610) { doc.addPage(); y = 76; }
      const totalsX = right - 215;
      const totalLine = (label: string, value: string, bold = false) => {
        doc.roundedRect(totalsX, y, 215, bold ? 31 : 24, bold ? 5 : 0).fill(bold ? primaryColor : '#ffffff');
        doc.fontSize(bold ? 11 : 8.5).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(bold ? '#ffffff' : ink).text(label, totalsX + 12, y + (bold ? 10 : 8));
        doc.text(value, totalsX + 12, y + (bold ? 10 : 8), { align: 'right', width: 191 });
        y += bold ? 33 : 24;
      };
      const notesY = y - 26;
      doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor).text('CONDITIONS ET INSTRUCTIONS', left, notesY);
      doc.roundedRect(left, notesY + 16, 285, 86, 8).fillAndStroke(soft, line);
      const companyDefaults = company as typeof company & { defaultNotes?: string | null };
      const noteLines = [
        po.advancePayment ? `Avance: ${this.formatPrice(po.advancePayment)}` : '',
        po.advancePercentage ? `Avance: ${this.formatQty(po.advancePercentage)}%` : '',
        po.retentionGuarantee ? `Retenue de garantie: ${this.formatQty(po.retentionGuarantee)}%` : '',
        po.paymentSchedule ? `Échéancier: ${po.paymentSchedule}` : '',
        po.paymentTerms ? `Termes: ${po.paymentTerms}` : '',
        po.notes,
        companyDefaults?.defaultNotes,
        !po.paymentTerms ? company?.defaultPaymentTerms : '',
      ].filter(Boolean) as string[];
      doc.font('Helvetica').fontSize(8).fillColor(lightGray);
      let ny = notesY + 30;
      (noteLines.length ? noteLines : ['Merci de rappeler le numéro du bon de commande sur chaque livraison.']).forEach((lineText) => { doc.text(lineText, left + 14, ny, { width: 257 }); ny += 12; });
      totalLine('Sous-total HT', this.formatPrice(po.subtotalHT));
      if (Number(po.taxRate) > 0) totalLine(`TVA (${po.taxRate}%)`, this.formatPrice(po.taxAmount));
      totalLine('Total TTC', this.formatPrice(po.totalTTC), true);

      const signatureY = Math.max(y + 24, notesY + 126);
      if (signatureY > 690) { doc.addPage(); y = 76; } else { y = signatureY; }
      doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor).text('VALIDATION INTERNE', left, y);
      const sigW = (pageWidth - 18) / 2;
      doc.roundedRect(left, y + 16, sigW, 64, 8).stroke(line);
      doc.roundedRect(left + sigW + 18, y + 16, sigW, 64, 8).stroke(line);
      doc.font('Helvetica-Bold').fontSize(8).fillColor(ink).text('Préparé par', left + 14, y + 30);
      doc.font('Helvetica').fontSize(8).fillColor(lightGray).text(po.createdBy?.fullName ?? '-', left + 14, y + 44, { width: sigW - 28 });
      doc.moveTo(left + 14, y + 66).lineTo(left + sigW - 14, y + 66).stroke(line);
      doc.font('Helvetica').fontSize(7).fillColor(lightGray).text('Signature', left + 14, y + 70, { width: sigW - 28, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(8).fillColor(ink).text('Approuvé par', left + sigW + 32, y + 30);
      doc.font('Helvetica').fontSize(8).fillColor(lightGray).text(po.updatedBy?.fullName ?? '-', left + sigW + 32, y + 44, { width: sigW - 28 });
      doc.moveTo(left + sigW + 32, y + 66).lineTo(right - 14, y + 66).stroke(line);
      doc.font('Helvetica').fontSize(7).fillColor(lightGray).text('Signature', left + sigW + 32, y + 70, { width: sigW - 28, align: 'center' });

      const footerLines = [
        company?.companyName,
        [company?.address, company?.phone, company?.email, company?.website].filter(Boolean).join(' | '),
        [company?.ice ? `ICE: ${company.ice}` : '', company?.ifTax ? `IF: ${company.ifTax}` : '', company?.rc ? `RC: ${company.rc}` : '', company?.cnss ? `CNSS: ${company.cnss}` : ''].filter(Boolean).join(' | '),
        company?.defaultDocumentFooter,
      ].filter(Boolean) as string[];
      this.drawFootersWithPageNumbers(doc, footerLines, left, right, lightGray, line);

      doc.end();
    });
  }

  private drawFootersWithPageNumbers(doc: PDFKit.PDFDocument, lines: string[], left: number, right: number, muted: string, line: string) {
    const range = doc.bufferedPageRange();
    for (let index = 0; index < range.count; index += 1) {
      doc.switchToPage(range.start + index);
      const footerY = doc.page.height - 82;
      doc.rect(left, footerY, right - left, 1).fill(line);
      doc.font('Helvetica').fontSize(6.8).fillColor(muted);
      let y = footerY + 8;
      lines.slice(0, 3).forEach((value) => {
        doc.text(this.compactLine(value), left, y, { width: right - left, align: 'center', lineBreak: false });
        y += 8.5;
      });
    }
  }

  private formatDate(d: Date | string): string {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private formatPrice(val: any): string {
    return Number(val).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[\u00a0\u202f]/g, ' ') + ' MAD';
  }

  private compactLine(value: string): string {
    return value.length > 150 ? `${value.slice(0, 147)}...` : value;
  }

  private formatQty(val: any): string {
    const num = Number(val);
    return num % 1 === 0 ? num.toString() : num.toLocaleString('fr-FR', { minimumFractionDigits: 2 });
  }
}
