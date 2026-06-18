import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../database/prisma.service';

type DocumentKind = 'invoice' | 'quote';

@Injectable()
export class PdfService {
  constructor(private readonly prisma: PrismaService) {}

  async generateInvoicePdf(invoiceId: string): Promise<Buffer> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, deletedAt: null },
      include: {
        client: { select: { name: true, phone: true, address: true, cin: true } },
        project: { select: { name: true, city: true } },
        items: { orderBy: { sortOrder: 'asc' } },
        payments: {
          where: { deletedAt: null },
          orderBy: { paymentDate: 'desc' },
          select: { amount: true, paymentDate: true, paymentMode: true },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const company = await this.prisma.companyProfile.findFirst();
    return this.generateCommercialPdf('invoice', invoice, company);
  }

  async generateQuotePdf(quoteId: string): Promise<Buffer> {
    const quote = await this.prisma.quote.findFirst({
      where: { id: quoteId, deletedAt: null },
      include: {
        client: { select: { name: true, phone: true, address: true, cin: true } },
        project: { select: { name: true, city: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!quote) throw new NotFoundException('Quote not found');

    const company = await this.prisma.companyProfile.findFirst();
    return this.generateCommercialPdf('quote', quote, company);
  }

  private generateCommercialPdf(kind: DocumentKind, document: any, company: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 44, size: 'A4', bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const left = 44;
      const right = doc.page.width - 44;
      const width = right - left;
      const primary = '#1f3a5f';
      const accent = '#f97316';
      const ink = '#111827';
      const muted = '#6b7280';
      const line = '#e5e7eb';
      const soft = '#f8fafc';
      const softer = '#fbfdff';
      const title = kind === 'invoice' ? 'FACTURE' : 'DEVIS';
      const number = kind === 'invoice' ? document.invoiceNumber : document.quoteNumber;
      const issueDate = kind === 'invoice' ? document.invoiceDate : document.quoteDate;
      const secondaryDate = kind === 'invoice' ? document.dueDate : document.validUntil;
      const secondaryLabel = kind === 'invoice' ? 'Échéance' : 'Valable jusqu\'au';

      const drawTextBlock = (lines: string[], x: number, y: number, blockWidth: number, options: { align?: 'left' | 'right'; size?: number } = {}) => {
        doc.font('Helvetica').fontSize(options.size ?? 8).fillColor(muted);
        let currentY = y;
        for (const value of lines.filter(Boolean)) {
          doc.text(value, x, currentY, { width: blockWidth, align: options.align ?? 'left', lineGap: 1 });
          currentY += 11;
        }
        return currentY;
      };

      const companyLines = this.companyInfoLines(company);
      const footerLines = this.footerLines(company);

      const drawHeader = () => {
        let logoBottom = 44;
        doc.roundedRect(left, 38, 148, 72, 10).fillAndStroke('#ffffff', line);
        doc.rect(left, 38, 5, 72).fill(accent);
        if (company?.logoPath && fs.existsSync(company.logoPath) && path.extname(company.logoPath).toLowerCase() !== '.svg') {
          try {
            doc.image(company.logoPath, left + 18, 51, { fit: [104, 44] });
            logoBottom = 104;
          } catch {}
        } else {
          doc.font('Helvetica-Bold').fontSize(13).fillColor(primary).text(company?.companyName ?? 'BTP Manager', left + 18, 56, { width: 110, align: 'center' });
          logoBottom = 72;
        }

        doc.font('Helvetica-Bold').fontSize(11).fillColor(ink).text(company?.companyName ?? '', right - 270, 43, { width: 270, align: 'right' });
        drawTextBlock(companyLines, right - 270, 61, 270, { align: 'right', size: 7.2 });

        const titleY = Math.max(132, logoBottom + 24);
        doc.roundedRect(left, titleY, width, 66, 8).fillAndStroke(soft, line);
        doc.rect(left, titleY, 5, 66).fill(accent);
        doc.font('Helvetica-Bold').fontSize(26).fillColor(primary).text(title, left + 18, titleY + 13);
        doc.font('Helvetica-Bold').fontSize(9).fillColor(muted).text(`N° ${number}`, left + 20, titleY + 45);

        const metaX = right - 190;
        doc.font('Helvetica-Bold').fontSize(8).fillColor(muted).text('Date', metaX, titleY + 17, { width: 90, align: 'right' });
        doc.font('Helvetica-Bold').fontSize(9).fillColor(ink).text(this.formatDate(issueDate), metaX + 100, titleY + 17, { width: 90, align: 'right' });
        doc.font('Helvetica-Bold').fontSize(8).fillColor(muted).text(secondaryLabel, metaX, titleY + 38, { width: 90, align: 'right' });
        doc.font('Helvetica-Bold').fontSize(9).fillColor(ink).text(secondaryDate ? this.formatDate(secondaryDate) : '-', metaX + 100, titleY + 38, { width: 90, align: 'right' });
        return titleY + 94;
      };

      const drawPartyBlocks = (startY: number) => {
        const blockW = (width - 18) / 2;
        doc.font('Helvetica-Bold').fontSize(9).fillColor(primary).text('CLIENT', left, startY);
        doc.roundedRect(left, startY + 16, blockW, 90, 8).fillAndStroke('#ffffff', line);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(ink).text(document.client.name, left + 14, startY + 30, { width: blockW - 28 });
        const clientLines = [
          document.client.cin ? `CIN: ${document.client.cin}` : '',
          document.client.phone ? `Tél: ${document.client.phone}` : '',
          document.client.address ?? '',
        ];
        drawTextBlock(clientLines, left + 14, startY + 49, blockW - 28, { size: 8 });

        doc.font('Helvetica-Bold').fontSize(9).fillColor(primary).text('RÉFÉRENCE', left + blockW + 18, startY);
        doc.roundedRect(left + blockW + 18, startY + 16, blockW, 90, 8).fillAndStroke('#ffffff', line);
        const referenceLines = [
          `Statut: ${kind === 'invoice' ? this.statusLabel(document.status) : this.quoteStatusLabel(document.status)}`,
          document.project ? `Projet: ${document.project.name}${document.project.city ? ` - ${document.project.city}` : ''}` : '',
          document.title ? `Objet: ${document.title}` : '',
        ];
        drawTextBlock(referenceLines, left + blockW + 32, startY + 31, blockW - 28, { size: 8 });
        return startY + 126;
      };

      const drawTableHeader = (y: number) => {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(primary).text('DÉTAIL DES PRESTATIONS', left, y - 16);
        doc.roundedRect(left, y, width, 24, 5).fill(primary);
        const columns = [24, 260, 56, 82, 82];
        const headers = ['#', 'Désignation', 'Qté', 'Prix unitaire', 'Total HT'];
        let x = left;
        headers.forEach((header, index) => {
          doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff').text(header, x + 7, y + 8, { width: columns[index] - 14, align: index >= 2 ? 'right' : 'left' });
          x += columns[index];
        });
        return y + 26;
      };

      const drawItems = (startY: number) => {
        const columns = [24, 260, 56, 82, 82];
        let y = drawTableHeader(startY);
        document.items.forEach((item: any, index: number) => {
          if (y > 680) {
            doc.addPage();
            y = drawTableHeader(76);
          }
          const rowHeight = Math.max(29, doc.heightOfString(item.description, { width: columns[1] - 14 }) + 16);
          doc.rect(left, y - 2, width, rowHeight).fill(index % 2 === 0 ? '#ffffff' : softer);
          const values = [String(index + 1), item.description, this.formatQty(item.quantity), this.formatPrice(item.unitPrice), this.formatPrice(item.totalHT)];
          let x = left;
          values.forEach((value, columnIndex) => {
            doc.font(columnIndex === 4 ? 'Helvetica-Bold' : 'Helvetica').fontSize(8).fillColor(ink).text(value, x + 7, y + 7, { width: columns[columnIndex] - 14, align: columnIndex >= 2 ? 'right' : 'left' });
            x += columns[columnIndex];
          });
          y += rowHeight;
        });
        return y + 26;
      };

      const drawTotalsAndTerms = (startY: number) => {
        if (startY > 610) {
          doc.addPage();
          startY = 76;
        }

        const termsWidth = 285;
        doc.font('Helvetica-Bold').fontSize(9).fillColor(primary).text(kind === 'invoice' ? 'INFORMATIONS DE PAIEMENT' : 'CONDITIONS COMMERCIALES', left, startY);
        const terms = [
          company?.defaultPaymentTerms ? `Termes: ${company.defaultPaymentTerms}` : '',
          company?.defaultNotes ? `Notes: ${company.defaultNotes}` : '',
          kind === 'invoice' && company?.bankName ? `Banque: ${company.bankName}` : '',
          kind === 'invoice' && company?.bankRib ? `RIB: ${company.bankRib}` : '',
          kind === 'invoice' && company?.accountInfo ? company.accountInfo : '',
          document.notes ? `Document: ${document.notes}` : '',
        ].filter(Boolean);
        if (kind === 'invoice') {
          doc.roundedRect(left, startY + 16, termsWidth, 92, 8).fillAndStroke(soft, line);
          drawTextBlock(terms.length ? terms : ['-'], left + 14, startY + 30, termsWidth - 28, { size: 8 });
        } else {
          doc.roundedRect(left, startY + 16, termsWidth, 78, 8).fillAndStroke('#ffffff', line);
          drawTextBlock(terms.length ? terms : ['-'], left + 14, startY + 30, termsWidth - 28, { size: 8 });
        }

        const totalsX = right - 215;
        let y = startY;
        const lineTotal = (label: string, value: string, strong = false, color = ink) => {
          doc.roundedRect(totalsX, y, 215, strong ? 31 : 24, strong ? 5 : 0).fill(strong ? primary : '#ffffff');
          doc.font(strong ? 'Helvetica-Bold' : 'Helvetica').fontSize(strong ? 11 : 8.5).fillColor(strong ? '#ffffff' : color).text(label, totalsX + 12, y + (strong ? 10 : 8));
          doc.text(value, totalsX + 12, y + (strong ? 10 : 8), { width: 191, align: 'right' });
          y += strong ? 33 : 24;
        };
        lineTotal('Sous-total HT', this.formatPrice(document.subtotalHT));
        if (Number(document.taxRate) > 0) lineTotal(`TVA (${document.taxRate}%)`, this.formatPrice(document.taxAmount));
        lineTotal('Total TTC', this.formatPrice(document.totalTTC), true, primary);
        if (kind === 'invoice') {
          if (Number(document.paidAmount) > 0) lineTotal('Déjà payé', this.formatPrice(document.paidAmount), false, '#047857');
          lineTotal('Solde à payer', this.formatPrice(document.remainingAmount), true, Number(document.remainingAmount) > 0 ? '#b91c1c' : '#047857');
        }
        return Math.max(y, startY + (kind === 'invoice' ? 124 : 104));
      };

      const drawSignature = (startY: number) => {
        if (kind !== 'quote') return startY;
        const y = startY > 636 ? 76 : startY + 28;
        if (startY > 650) doc.addPage();
        doc.font('Helvetica-Bold').fontSize(9).fillColor(primary).text('ACCEPTATION CLIENT', left, y);
        doc.roundedRect(left, y + 16, width, 74, 8).fillAndStroke('#ffffff', line);
        const sigW = (width - 48) / 3;
        ['Signature', 'Nom', 'Date'].forEach((label, index) => {
          const x = left + 16 + index * (sigW + 16);
          doc.moveTo(x, y + 67).lineTo(x + sigW, y + 67).stroke(line);
          doc.font('Helvetica').fontSize(7.5).fillColor(muted).text(label, x, y + 72, { width: sigW, align: 'center' });
        });
        return y + 106;
      };

      const drawPreparedBy = (startY: number) => {
        if (kind !== 'invoice') return startY;
        const y = startY > 680 ? 76 : startY + 20;
        if (startY > 680) doc.addPage();
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(primary).text('PRÉPARÉ PAR', left, y);
        doc.roundedRect(left, y + 14, 210, 44, 7).stroke(line);
        doc.moveTo(left + 16, y + 45).lineTo(left + 194, y + 45).stroke(line);
        doc.font('Helvetica').fontSize(7).fillColor(muted).text('Nom et signature', left + 16, y + 49, { width: 178, align: 'center' });
        return y + 70;
      };

      let y = drawHeader();
      y = drawPartyBlocks(y);
      y = drawItems(y);
      y = drawTotalsAndTerms(y);
      y = drawSignature(y);
      y = drawPreparedBy(y);

      if (kind === 'invoice' && document.payments?.length) {
        const historyY = y > 690 ? 54 : y + 8;
        if (y > 690) doc.addPage();
        doc.font('Helvetica-Bold').fontSize(8).fillColor(primary).text('Historique des paiements', left, historyY);
        let py = historyY + 13;
        document.payments.slice(0, 5).forEach((payment: any) => {
          doc.font('Helvetica').fontSize(7.5).fillColor(muted).text(`${this.formatDate(payment.paymentDate)} - ${this.formatPrice(payment.amount)} (${this.paymentModeLabel(payment.paymentMode)})`, left, py);
          py += 10;
        });
      }

      this.drawFootersWithPageNumbers(doc, footerLines, left, right, muted, line);
      doc.end();
    });
  }

  private drawFooter(doc: PDFKit.PDFDocument, lines: string[], left: number, right: number, muted: string, line: string) {
    const footerY = doc.page.height - 72;
    doc.rect(left, footerY, right - left, 1).fill(line);
    doc.font('Helvetica').fontSize(6.8).fillColor(muted);
    let y = footerY + 8;
    lines.slice(0, 5).forEach((value) => {
      doc.text(value, left, y, { width: right - left, align: 'center' });
      y += 8.5;
    });
  }

  private drawFootersWithPageNumbers(doc: PDFKit.PDFDocument, lines: string[], left: number, right: number, muted: string, line: string) {
    const range = doc.bufferedPageRange();
    for (let index = 0; index < range.count; index += 1) {
      doc.switchToPage(range.start + index);
      const footerY = doc.page.height - 72;
      doc.rect(left, footerY, right - left, 1).fill(line);
      doc.font('Helvetica').fontSize(6.8).fillColor(muted);
      let y = footerY + 8;
      lines.slice(0, 4).forEach((value) => {
        doc.text(value, left, y, { width: right - left, align: 'center' });
        y += 8.5;
      });
      doc.font('Helvetica-Bold').fontSize(7).fillColor(muted).text(`Page ${index + 1} / ${range.count}`, left, doc.page.height - 22, { width: right - left, align: 'center' });
    }
  }

  private companyInfoLines(company: any): string[] {
    if (!company) return [];
    return [
      company.address,
      [company.phone, company.email].filter(Boolean).join(' | '),
      company.website,
      [company.ice ? `ICE: ${company.ice}` : '', company.ifTax ? `IF: ${company.ifTax}` : ''].filter(Boolean).join(' | '),
      [company.rc ? `RC: ${company.rc}` : '', company.cnss ? `CNSS: ${company.cnss}` : ''].filter(Boolean).join(' | '),
    ].filter(Boolean);
  }

  private footerLines(company: any): string[] {
    if (!company) return [];
    return [
      company.companyName,
      [company.address, company.phone, company.email, company.website].filter(Boolean).join(' | '),
      [company.ice ? `ICE: ${company.ice}` : '', company.ifTax ? `IF: ${company.ifTax}` : '', company.rc ? `RC: ${company.rc}` : '', company.cnss ? `CNSS: ${company.cnss}` : ''].filter(Boolean).join(' | '),
      company.bankName && company.bankRib ? `${company.bankName}: ${company.bankRib}` : '',
      company.defaultDocumentFooter,
    ].filter(Boolean);
  }

  private formatDate(d: Date | string): string {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private formatPrice(val: any): string {
    return `${Number(val).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
  }

  private formatQty(val: any): string {
    const num = Number(val);
    return num % 1 === 0 ? num.toString() : num.toLocaleString('fr-FR', { minimumFractionDigits: 2 });
  }

  private statusLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Brouillon',
      SENT: 'Envoyée',
      PARTIALLY_PAID: 'Payée partiellement',
      PAID: 'Payée',
      CANCELLED: 'Annulée',
    };
    return labels[status] || status;
  }

  private quoteStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Brouillon',
      SENT: 'Envoyé',
      ACCEPTED: 'Accepté',
      REJECTED: 'Refusé',
      CONVERTED_TO_INVOICE: 'Converti en facture',
      CANCELLED: 'Annulé',
    };
    return labels[status] || status;
  }

  private paymentModeLabel(mode: string): string {
    const labels: Record<string, string> = {
      CASH: 'Espèces',
      CHEQUE: 'Chèque',
      BANK_TRANSFER: 'Virement',
    };
    return labels[mode] || mode;
  }
}
