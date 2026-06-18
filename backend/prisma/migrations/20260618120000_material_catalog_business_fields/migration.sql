ALTER TABLE "material_catalog"
  ADD COLUMN "default_supplier" VARCHAR(180),
  ADD COLUMN "purchase_price_ht" DECIMAL(14, 2),
  ADD COLUMN "tva_rate" DECIMAL(5, 2) NOT NULL DEFAULT 20;

UPDATE "material_catalog"
SET "purchase_price_ht" = "unit_price"
WHERE "purchase_price_ht" IS NULL AND "unit_price" IS NOT NULL;
