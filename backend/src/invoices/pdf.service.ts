import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class PdfService {
  constructor(private readonly prisma: PrismaService) {}

  async generateInvoicePdf(invoiceId: string): Promise<Buffer> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, deletedAt: null },
      include: {
        client: { select: { name: true, phone: true, address: true, cin: true } },
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

      const drawHeader = () => {
        doc.rect(50, 30, pageWidth, 60).fill('#f8fafc');
        doc.rect(50, 30, pageWidth, 3).fill(primaryColor);
        doc.rect(50, 87, pageWidth, 3).fill(primaryColor);

        // Logo on the left
        let logoX = 60;
        if (company?.logoPath && fs.existsSync(company.logoPath)) {
          try {
            const logoExt = path.extname(company.logoPath).toLowerCase();
            if (logoExt === '.svg') {
              // SVG not supported by PDFKit, skip
            } else {
              doc.image(company.logoPath, logoX, 35, { width: 50, height: 40 });
              logoX += 60;
            }
          } catch {}
        }

        const titleX = Math.max(logoX, 60);
        doc.fontSize(22).font('Helvetica-Bold').fillColor(primaryColor)
          .text('FACTURE', titleX, 42);

        doc.fontSize(10).font('Helvetica').fillColor(lightGray)
          .text(`N° ${invoice.invoiceNumber}`, titleX, 68);

        doc.fontSize(8).font('Helvetica').fillColor(lightGray)
          .text(`Émis le: ${this.formatDate(invoice.invoiceDate)}`, rightX, 42, { align: 'right' })
          .text(`Échéance: ${invoice.dueDate ? this.formatDate(invoice.dueDate) : '---'}`, rightX, 55, { align: 'right' })
          .text(`Statut: ${this.statusLabel(invoice.status)}`, rightX, 72, { align: 'right' });
      };

      const drawCompanyInfo = () => {
        let y = 110;
        if (company) {
          doc.fontSize(12).font('Helvetica-Bold').fillColor('#111827')
            .text(company.companyName, 50, y);
          y += 16;
          doc.fontSize(9).font('Helvetica').fillColor(lightGray);
          const lines: string[] = [];
          if (company.address) lines.push(company.address);
          if (company.ice) lines.push(`ICE: ${company.ice}`);
          if (company.ifTax) lines.push(`IF: ${company.ifTax}`);
          if (company.rc) lines.push(`RC: ${company.rc}`);
          if (company.cnss) lines.push(`CNSS: ${company.cnss}`);
          if (company.phone || company.email) {
            lines.push([company.phone, company.email].filter(Boolean).join(' | '));
          }
          if (company.website) lines.push(company.website);
          lines.forEach((line) => {
            doc.text(line, 50, y);
            y += 13;
          });
        }
      };

      const drawClientInfo = () => {
        const boxX = rightX - 200;
        doc.roundedRect(boxX, 110, 200, 80, 4).stroke('#e5e7eb');
        doc.rect(boxX, 110, 200, 22).fill('#f9fafb');

        doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151')
          .text('CLIENT', boxX + 10, 115);

        doc.fontSize(9).font('Helvetica').fillColor('#111827')
          .text(invoice.client.name, boxX + 10, 137);

        doc.fontSize(8).font('Helvetica').fillColor(lightGray);
        let y = 153;
        if (invoice.client.cin) {
          doc.text(`CIN: ${invoice.client.cin}`, boxX + 10, y);
          y += 12;
        }
        if (invoice.client.phone) {
          doc.text(`Tél: ${invoice.client.phone}`, boxX + 10, y);
          y += 12;
        }
        if (invoice.client.address) {
          doc.text(invoice.client.address, boxX + 10, y);
        }
      };

      const drawItemsTable = () => {
        const tableTop = 215;
        const colWidths = [30, 220, 70, 80, 80];
        const headers = ['#', 'Désignation', 'Qté', 'Prix unitaire', 'Montant'];
        const startX = 50;

        doc.rect(startX, tableTop, pageWidth, 18).fill(primaryColor);
        let cx = startX;
        headers.forEach((h, i) => {
          doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff')
            .text(h, cx + 4, tableTop + 5, { width: colWidths[i] - 8, align: i >= 2 ? 'right' : 'left' });
          cx += colWidths[i];
        });

        let y = tableTop + 24;
        invoice.items.forEach((item, idx) => {
          if (y > 700) {
            doc.addPage();
            y = 50;
          }
          const bg = idx % 2 === 0 ? '#ffffff' : '#f9fafb';
          doc.rect(startX, y - 4, pageWidth, 20).fill(bg);

          cx = startX;
          const vals = [
            String(idx + 1),
            item.description,
            this.formatQty(item.quantity),
            this.formatPrice(item.unitPrice),
            this.formatPrice(item.totalHT),
          ];
          vals.forEach((v, i) => {
            doc.fontSize(8).font('Helvetica').fillColor('#374151')
              .text(v, cx + 4, y, { width: colWidths[i] - 8, align: i >= 2 ? 'right' : 'left' });
            cx += colWidths[i];
          });
          y += 20;
        });

        y += 8;
        const totalsX = rightX - 200;

        const drawTotalLine = (label: string, value: string, bold = false, color = '#374151') => {
          doc.rect(totalsX, y, 200, bold ? 24 : 20).fill(bold ? '#f8fafc' : '#ffffff');
          doc.fontSize(bold ? 11 : 9).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(color)
            .text(label, totalsX + 8, y + (bold ? 6 : 5));
          doc.text(value, totalsX + 8, y + (bold ? 6 : 5), { align: 'right', width: 184 });
          y += bold ? 24 : 20;
        };

        drawTotalLine('Sous-total HT', this.formatPrice(invoice.subtotalHT));
        if (Number(invoice.taxRate) > 0) {
          drawTotalLine(`TVA (${invoice.taxRate}%)`, this.formatPrice(invoice.taxAmount));
        }
        drawTotalLine('Total TTC', this.formatPrice(invoice.totalTTC), true, primaryColor);

        if (Number(invoice.paidAmount) > 0) {
          drawTotalLine('Déjà payé', this.formatPrice(invoice.paidAmount), false, '#059669');
          drawTotalLine('Reste à payer', this.formatPrice(invoice.remainingAmount), true, '#dc2626');
        }

        // Show payments if any
        if (invoice.payments.length > 0) {
          y += 12;
          doc.fontSize(8).font('Helvetica-Bold').fillColor('#374151')
            .text('Historique des paiements:', totalsX, y);
          y += 12;
          invoice.payments.forEach((p) => {
            doc.fontSize(7).font('Helvetica').fillColor(lightGray)
              .text(`${this.formatDate(p.paymentDate)} - ${this.formatPrice(p.amount)} (${this.paymentModeLabel(p.paymentMode)})`, totalsX + 5, y);
            y += 10;
          });
        }
      };

      const drawFooter = () => {
        const footerY = doc.page.height - 80;
        doc.rect(50, footerY, pageWidth, 1).fill('#e5e7eb');

        const footerLines: string[] = [];
        if (company?.companyName) footerLines.push(company.companyName);
        if (company?.address) footerLines.push(company.address);
        if (company?.ice) footerLines.push(`ICE: ${company.ice}`);
        if (company?.ifTax) footerLines.push(`IF: ${company.ifTax}`);
        if (company?.rc) footerLines.push(`RC: ${company.rc}`);
        if (company?.cnss) footerLines.push(`CNSS: ${company.cnss}`);
        if (company?.phone || company?.email || company?.website) {
          footerLines.push([company.phone, company.email, company.website].filter(Boolean).join(' | '));
        }
        if (company?.bankName && company?.bankRib) footerLines.push(`${company.bankName}: ${company.bankRib}`);
        if (company?.defaultDocumentFooter) footerLines.push(company.defaultDocumentFooter);

        doc.fontSize(7).font('Helvetica').fillColor(lightGray);
        let fy = footerY + 8;
        footerLines.forEach((line) => {
          doc.text(line, 50, fy, { align: 'center', width: pageWidth });
          fy += 9;
        });
      };

      drawHeader();
      drawCompanyInfo();
      drawClientInfo();
      drawItemsTable();
      drawFooter();

      doc.end();
    });
  }

  async generateQuotePdf(quoteId: string): Promise<Buffer> {
    const quote = await this.prisma.quote.findFirst({
      where: { id: quoteId, deletedAt: null },
      include: {
        client: { select: { name: true, phone: true, address: true, cin: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!quote) throw new NotFoundException('Quote not found');

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

      const drawHeader = () => {
        doc.rect(50, 30, pageWidth, 60).fill('#f8fafc');
        doc.rect(50, 30, pageWidth, 3).fill(primaryColor);
        doc.rect(50, 87, pageWidth, 3).fill(primaryColor);

        let logoX = 60;
        if (company?.logoPath && fs.existsSync(company.logoPath)) {
          try {
            const logoExt = path.extname(company.logoPath).toLowerCase();
            if (logoExt !== '.svg') {
              doc.image(company.logoPath, logoX, 35, { width: 50, height: 40 });
              logoX += 60;
            }
          } catch {}
        }

        const titleX = Math.max(logoX, 60);
        doc.fontSize(22).font('Helvetica-Bold').fillColor(primaryColor)
          .text('DEVIS', titleX, 42);

        doc.fontSize(10).font('Helvetica').fillColor(lightGray)
          .text(`N° ${quote.quoteNumber}`, titleX, 68);

        doc.fontSize(8).font('Helvetica').fillColor(lightGray)
          .text(`Date: ${this.formatDate(quote.quoteDate)}`, rightX, 42, { align: 'right' })
          .text(`Valable jusqu'au: ${quote.validUntil ? this.formatDate(quote.validUntil) : '---'}`, rightX, 55, { align: 'right' })
          .text(`Statut: ${this.quoteStatusLabel(quote.status)}`, rightX, 72, { align: 'right' });
      };

      const drawCompanyInfo = () => {
        let y = 110;
        if (company) {
          doc.fontSize(12).font('Helvetica-Bold').fillColor('#111827')
            .text(company.companyName, 50, y);
          y += 16;
          doc.fontSize(9).font('Helvetica').fillColor(lightGray);
          const lines: string[] = [];
          if (company.address) lines.push(company.address);
          if (company.ice) lines.push(`ICE: ${company.ice}`);
          if (company.ifTax) lines.push(`IF: ${company.ifTax}`);
          if (company.rc) lines.push(`RC: ${company.rc}`);
          if (company.cnss) lines.push(`CNSS: ${company.cnss}`);
          if (company.phone || company.email) {
            lines.push([company.phone, company.email].filter(Boolean).join(' | '));
          }
          if (company.website) lines.push(company.website);
          lines.forEach((line) => {
            doc.text(line, 50, y);
            y += 13;
          });
        }
      };

      const drawClientInfo = () => {
        const boxX = rightX - 200;
        doc.roundedRect(boxX, 110, 200, 80, 4).stroke('#e5e7eb');
        doc.rect(boxX, 110, 200, 22).fill('#f9fafb');

        doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151')
          .text('CLIENT', boxX + 10, 115);

        doc.fontSize(9).font('Helvetica').fillColor('#111827')
          .text(quote.client.name, boxX + 10, 137);

        doc.fontSize(8).font('Helvetica').fillColor(lightGray);
        let y = 153;
        if (quote.client.cin) {
          doc.text(`CIN: ${quote.client.cin}`, boxX + 10, y);
          y += 12;
        }
        if (quote.client.phone) {
          doc.text(`Tél: ${quote.client.phone}`, boxX + 10, y);
          y += 12;
        }
        if (quote.client.address) {
          doc.text(quote.client.address, boxX + 10, y);
        }
      };

      const drawItemsTable = () => {
        const tableTop = 215;
        const colWidths = [30, 220, 70, 80, 80];
        const headers = ['#', 'Désignation', 'Qté', 'Prix unitaire', 'Montant'];
        const startX = 50;

        doc.rect(startX, tableTop, pageWidth, 18).fill(primaryColor);
        let cx = startX;
        headers.forEach((h, i) => {
          doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff')
            .text(h, cx + 4, tableTop + 5, { width: colWidths[i] - 8, align: i >= 2 ? 'right' : 'left' });
          cx += colWidths[i];
        });

        let y = tableTop + 24;
        quote.items.forEach((item, idx) => {
          if (y > 700) {
            doc.addPage();
            y = 50;
          }
          const bg = idx % 2 === 0 ? '#ffffff' : '#f9fafb';
          doc.rect(startX, y - 4, pageWidth, 20).fill(bg);

          cx = startX;
          const vals = [
            String(idx + 1),
            item.description,
            this.formatQty(item.quantity),
            this.formatPrice(item.unitPrice),
            this.formatPrice(item.totalHT),
          ];
          vals.forEach((v, i) => {
            doc.fontSize(8).font('Helvetica').fillColor('#374151')
              .text(v, cx + 4, y, { width: colWidths[i] - 8, align: i >= 2 ? 'right' : 'left' });
            cx += colWidths[i];
          });
          y += 20;
        });

        y += 8;
        const totalsX = rightX - 200;

        const drawTotalLine = (label: string, value: string, bold = false, color = '#374151') => {
          doc.rect(totalsX, y, 200, bold ? 24 : 20).fill(bold ? '#f8fafc' : '#ffffff');
          doc.fontSize(bold ? 11 : 9).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(color)
            .text(label, totalsX + 8, y + (bold ? 6 : 5));
          doc.text(value, totalsX + 8, y + (bold ? 6 : 5), { align: 'right', width: 184 });
          y += bold ? 24 : 20;
        };

        drawTotalLine('Sous-total HT', this.formatPrice(quote.subtotalHT));
        if (Number(quote.taxRate) > 0) {
          drawTotalLine(`TVA (${quote.taxRate}%)`, this.formatPrice(quote.taxAmount));
        }
        drawTotalLine('Total TTC', this.formatPrice(quote.totalTTC), true, primaryColor);
      };

      const drawFooter = () => {
        const footerY = doc.page.height - 80;
        doc.rect(50, footerY, pageWidth, 1).fill('#e5e7eb');

        const footerLines: string[] = [];
        if (company?.companyName) footerLines.push(company.companyName);
        if (company?.address) footerLines.push(company.address);
        if (company?.ice) footerLines.push(`ICE: ${company.ice}`);
        if (company?.ifTax) footerLines.push(`IF: ${company.ifTax}`);
        if (company?.rc) footerLines.push(`RC: ${company.rc}`);
        if (company?.cnss) footerLines.push(`CNSS: ${company.cnss}`);
        if (company?.phone || company?.email || company?.website) {
          footerLines.push([company.phone, company.email, company.website].filter(Boolean).join(' | '));
        }
        if (company?.bankName && company?.bankRib) footerLines.push(`${company.bankName}: ${company.bankRib}`);
        if (company?.defaultDocumentFooter) footerLines.push(company.defaultDocumentFooter);

        doc.fontSize(7).font('Helvetica').fillColor(lightGray);
        let fy = footerY + 8;
        footerLines.forEach((line) => {
          doc.text(line, 50, fy, { align: 'center', width: pageWidth });
          fy += 9;
        });
      };

      drawHeader();
      drawCompanyInfo();
      drawClientInfo();
      drawItemsTable();
      drawFooter();

      doc.end();
    });
  }

  private formatDate(d: Date | string): string {
    const date = new Date(d);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private formatPrice(val: any): string {
    const num = Number(val);
    return num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD';
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
