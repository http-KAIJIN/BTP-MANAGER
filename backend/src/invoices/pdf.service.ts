import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import PDFDocument from 'pdfkit';

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

    const company = await this.prisma.company.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

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

        doc.fontSize(22).font('Helvetica-Bold').fillColor(primaryColor)
          .text('FACTURE', 60, 42);

        doc.fontSize(10).font('Helvetica').fillColor(lightGray)
          .text(`N° ${invoice.invoiceNumber}`, 60, 68);

        doc.fontSize(8).font('Helvetica').fillColor(lightGray)
          .text(`Émis le: ${this.formatDate(invoice.invoiceDate)}`, rightX, 42, { align: 'right' })
          .text(`Échéance: ${invoice.dueDate ? this.formatDate(invoice.dueDate) : '---'}`, rightX, 55, { align: 'right' });

        if (company) {
          doc.fontSize(8).font('Helvetica').fillColor(lightGray)
            .text(`Statut: ${this.statusLabel(invoice.status)}`, rightX, 72, { align: 'right' });
        }
      };

      const drawCompanyInfo = () => {
        let y = 110;
        if (company) {
          doc.fontSize(12).font('Helvetica-Bold').fillColor('#111827')
            .text(company.name, 50, y);
          y += 16;
          doc.fontSize(9).font('Helvetica').fillColor(lightGray);
          if (company.address) {
            doc.text(company.address, 50, y);
            y += 13;
          }
          if (company.ice) {
            doc.text(`ICE: ${company.ice}`, 50, y);
            y += 13;
          }
          if (company.phone || company.email) {
            doc.text([company.phone, company.email].filter(Boolean).join(' | '), 50, y);
            y += 13;
          }
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
      };

      const drawFooter = () => {
        const footerY = doc.page.height - 80;
        doc.rect(50, footerY, pageWidth, 1).fill('#e5e7eb');
        doc.fontSize(7).font('Helvetica').fillColor(lightGray)
          .text(
            'BTP Manager - Logiciel de gestion de chantier\nMerci de votre confiance.',
            50,
            footerY + 8,
            { align: 'center', width: pageWidth },
          );
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
}
