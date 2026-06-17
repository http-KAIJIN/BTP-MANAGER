export class OcrResponseDto {
  success: boolean;
  data: {
    supplierName: string;
    date: string;
    invoiceNumber: string;
    amount: number;
    tva: number;
    currency: string;
    description: string;
  };
  suggestedCategory: { id: string; name: string } | null;
  suggestedSupplier: { id: string; name: string } | null;
  suggestedProject: { id: string; name: string } | null;
}
