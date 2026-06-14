-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APPARTEMENT', 'LOCAL_COMMERCIAL', 'BUREAU', 'ENTREPOT');
CREATE TYPE "PropertyStatus" AS ENUM ('DISPONIBLE', 'RESERVE', 'VENDU');
CREATE TYPE "SaleStatus" AS ENUM ('EN_COURS', 'TERMINE', 'ANNULE');

-- CreateTable: properties
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "reference" VARCHAR(60) NOT NULL,
    "type" "PropertyType" NOT NULL,
    "surface" DECIMAL(10,2) NOT NULL,
    "project_id" UUID NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'DISPONIBLE',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable: sales
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "client_id" UUID NOT NULL,
    "property_id" TEXT NOT NULL,
    "sale_price" DECIMAL(12,2) NOT NULL,
    "down_payment" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sale_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "status" "SaleStatus" NOT NULL DEFAULT 'EN_COURS',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable: sale_payments
CREATE TABLE "sale_payments" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "sale_payments_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "idx_properties_project" ON "properties"("project_id");
CREATE INDEX "idx_properties_status" ON "properties"("status");
CREATE INDEX "idx_properties_reference" ON "properties"("reference");
CREATE INDEX "idx_properties_deleted_at" ON "properties"("deleted_at");

CREATE INDEX "idx_sales_client" ON "sales"("client_id");
CREATE INDEX "idx_sales_property" ON "sales"("property_id");
CREATE INDEX "idx_sales_date" ON "sales"("sale_date");
CREATE INDEX "idx_sales_status" ON "sales"("status");
CREATE INDEX "idx_sales_deleted_at" ON "sales"("deleted_at");

CREATE INDEX "idx_sale_payments_sale" ON "sale_payments"("sale_id");
CREATE INDEX "idx_sale_payments_date" ON "sale_payments"("payment_date");
CREATE INDEX "idx_sale_payments_deleted_at" ON "sale_payments"("deleted_at");

-- Foreign keys
ALTER TABLE "properties" ADD CONSTRAINT "properties_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "properties" ADD CONSTRAINT "properties_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "properties" ADD CONSTRAINT "properties_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "properties" ADD CONSTRAINT "properties_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales" ADD CONSTRAINT "sales_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
