ALTER TABLE "suppliers"
  ADD COLUMN "email" VARCHAR(180),
  ADD COLUMN "address" TEXT,
  ADD COLUMN "contact_person" VARCHAR(150),
  ADD COLUMN "ice" VARCHAR(50),
  ADD COLUMN "if_tax" VARCHAR(50),
  ADD COLUMN "website" VARCHAR(255);

ALTER TABLE "quote_items" ADD COLUMN "unit" VARCHAR(30) NOT NULL DEFAULT 'unité';
ALTER TABLE "invoice_items" ADD COLUMN "unit" VARCHAR(30) NOT NULL DEFAULT 'unité';
ALTER TABLE "purchase_order_items" ADD COLUMN "unit" VARCHAR(30) NOT NULL DEFAULT 'unité';

ALTER TABLE "quotes"
  ADD COLUMN "contract_reference" VARCHAR(100),
  ADD COLUMN "site_reference" VARCHAR(100),
  ADD COLUMN "project_reference" VARCHAR(100),
  ADD COLUMN "work_phase" VARCHAR(120),
  ADD COLUMN "project_manager" VARCHAR(150),
  ADD COLUMN "advance_payment" DECIMAL(14, 2),
  ADD COLUMN "advance_percentage" DECIMAL(5, 2),
  ADD COLUMN "payment_schedule" TEXT,
  ADD COLUMN "payment_terms" TEXT,
  ADD COLUMN "retention_guarantee" DECIMAL(5, 2);

ALTER TABLE "invoices"
  ADD COLUMN "contract_reference" VARCHAR(100),
  ADD COLUMN "site_reference" VARCHAR(100),
  ADD COLUMN "project_reference" VARCHAR(100),
  ADD COLUMN "work_phase" VARCHAR(120),
  ADD COLUMN "project_manager" VARCHAR(150),
  ADD COLUMN "advance_payment" DECIMAL(14, 2),
  ADD COLUMN "advance_percentage" DECIMAL(5, 2),
  ADD COLUMN "payment_schedule" TEXT,
  ADD COLUMN "payment_terms" TEXT,
  ADD COLUMN "retention_guarantee" DECIMAL(5, 2);

ALTER TABLE "purchase_orders"
  ADD COLUMN "contract_reference" VARCHAR(100),
  ADD COLUMN "site_reference" VARCHAR(100),
  ADD COLUMN "project_reference" VARCHAR(100),
  ADD COLUMN "work_phase" VARCHAR(120),
  ADD COLUMN "project_manager" VARCHAR(150),
  ADD COLUMN "advance_payment" DECIMAL(14, 2),
  ADD COLUMN "advance_percentage" DECIMAL(5, 2),
  ADD COLUMN "payment_schedule" TEXT,
  ADD COLUMN "payment_terms" TEXT,
  ADD COLUMN "retention_guarantee" DECIMAL(5, 2);
