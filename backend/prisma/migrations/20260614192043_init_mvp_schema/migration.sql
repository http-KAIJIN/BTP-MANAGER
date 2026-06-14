-- Required for database-generated UUID primary keys.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProjectOwnershipType" AS ENUM ('INTERNAL_COMPANY', 'EXTERNAL_CLIENT');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BeneficiaryType" AS ENUM ('SUPPLIER', 'INTERVENANT');

-- CreateEnum
CREATE TYPE "CommitmentStatus" AS ENUM ('OPEN', 'PARTIALLY_PAID', 'PAID', 'OVERPAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'CHEQUE', 'BANK_TRANSFER');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(180) NOT NULL,
    "phone" VARCHAR(40),
    "password_hash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(80) NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(180) NOT NULL,
    "ice" VARCHAR(50),
    "address" TEXT,
    "phone" VARCHAR(40),
    "email" VARCHAR(180),
    "manager_name" VARCHAR(150),
    "notes" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "city" VARCHAR(120) NOT NULL,
    "start_date" DATE NOT NULL,
    "expected_end_date" DATE,
    "actual_end_date" DATE,
    "project_type" VARCHAR(120),
    "ownership_type" "ProjectOwnershipType" NOT NULL,
    "owner_company_id" UUID,
    "external_client_name" VARCHAR(180),
    "external_client_phone" VARCHAR(40),
    "external_client_company" VARCHAR(180),
    "executing_company_id" UUID NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(180) NOT NULL,
    "phone" VARCHAR(40),
    "category" VARCHAR(120),
    "notes" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intervenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(180) NOT NULL,
    "phone" VARCHAR(40),
    "trade" VARCHAR(120) NOT NULL,
    "notes" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "intervenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commitments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "beneficiary_type" "BeneficiaryType" NOT NULL,
    "supplier_id" UUID,
    "intervenant_id" UUID,
    "description" TEXT NOT NULL,
    "agreed_amount" DECIMAL(14,2) NOT NULL,
    "commitment_date" DATE NOT NULL,
    "notes" TEXT,
    "status" "CommitmentStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "commitments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "commitment_id" UUID NOT NULL,
    "beneficiary_type" "BeneficiaryType" NOT NULL,
    "supplier_id" UUID,
    "intervenant_id" UUID,
    "payment_date" DATE NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "payment_mode" "PaymentMode" NOT NULL,
    "cheque_number" VARCHAR(80),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "supplier_id" UUID,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "expense_date" DATE NOT NULL,
    "payment_mode" "PaymentMode" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_status" ON "users"("status");

-- CreateIndex
CREATE INDEX "idx_users_deleted_at" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE INDEX "idx_roles_code" ON "roles"("code");

-- CreateIndex
CREATE INDEX "idx_roles_deleted_at" ON "roles"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "idx_permissions_code" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "idx_permissions_deleted_at" ON "permissions"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_user_roles_user" ON "user_roles"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_roles_role" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "idx_user_roles_deleted_at" ON "user_roles"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_roles_user_role" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "idx_role_permissions_role" ON "role_permissions"("role_id");

-- CreateIndex
CREATE INDEX "idx_role_permissions_permission" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "idx_role_permissions_deleted_at" ON "role_permissions"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_role_permissions_role_permission" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "companies_ice_key" ON "companies"("ice");

-- CreateIndex
CREATE INDEX "idx_companies_name" ON "companies"("name");

-- CreateIndex
CREATE INDEX "idx_companies_ice" ON "companies"("ice");

-- CreateIndex
CREATE INDEX "idx_companies_status" ON "companies"("status");

-- CreateIndex
CREATE INDEX "idx_companies_deleted_at" ON "companies"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_projects_name" ON "projects"("name");

-- CreateIndex
CREATE INDEX "idx_projects_city" ON "projects"("city");

-- CreateIndex
CREATE INDEX "idx_projects_owner_company" ON "projects"("owner_company_id");

-- CreateIndex
CREATE INDEX "idx_projects_executing_company" ON "projects"("executing_company_id");

-- CreateIndex
CREATE INDEX "idx_projects_status" ON "projects"("status");

-- CreateIndex
CREATE INDEX "idx_projects_dates" ON "projects"("start_date", "expected_end_date");

-- CreateIndex
CREATE INDEX "idx_projects_deleted_at" ON "projects"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_suppliers_name" ON "suppliers"("name");

-- CreateIndex
CREATE INDEX "idx_suppliers_category" ON "suppliers"("category");

-- CreateIndex
CREATE INDEX "idx_suppliers_status" ON "suppliers"("status");

-- CreateIndex
CREATE INDEX "idx_suppliers_deleted_at" ON "suppliers"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_intervenants_name" ON "intervenants"("name");

-- CreateIndex
CREATE INDEX "idx_intervenants_trade" ON "intervenants"("trade");

-- CreateIndex
CREATE INDEX "idx_intervenants_status" ON "intervenants"("status");

-- CreateIndex
CREATE INDEX "idx_intervenants_deleted_at" ON "intervenants"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_commitments_project" ON "commitments"("project_id");

-- CreateIndex
CREATE INDEX "idx_commitments_supplier" ON "commitments"("supplier_id");

-- CreateIndex
CREATE INDEX "idx_commitments_intervenant" ON "commitments"("intervenant_id");

-- CreateIndex
CREATE INDEX "idx_commitments_date" ON "commitments"("commitment_date");

-- CreateIndex
CREATE INDEX "idx_commitments_status" ON "commitments"("status");

-- CreateIndex
CREATE INDEX "idx_commitments_deleted_at" ON "commitments"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_payments_project" ON "payments"("project_id");

-- CreateIndex
CREATE INDEX "idx_payments_commitment" ON "payments"("commitment_id");

-- CreateIndex
CREATE INDEX "idx_payments_date" ON "payments"("payment_date");

-- CreateIndex
CREATE INDEX "idx_payments_mode" ON "payments"("payment_mode");

-- CreateIndex
CREATE INDEX "idx_payments_supplier" ON "payments"("supplier_id");

-- CreateIndex
CREATE INDEX "idx_payments_intervenant" ON "payments"("intervenant_id");

-- CreateIndex
CREATE INDEX "idx_payments_deleted_at" ON "payments"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_name_key" ON "expense_categories"("name");

-- CreateIndex
CREATE INDEX "idx_expense_categories_name" ON "expense_categories"("name");

-- CreateIndex
CREATE INDEX "idx_expense_categories_is_active" ON "expense_categories"("is_active");

-- CreateIndex
CREATE INDEX "idx_expense_categories_deleted_at" ON "expense_categories"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_expenses_project" ON "expenses"("project_id");

-- CreateIndex
CREATE INDEX "idx_expenses_category" ON "expenses"("category_id");

-- CreateIndex
CREATE INDEX "idx_expenses_supplier" ON "expenses"("supplier_id");

-- CreateIndex
CREATE INDEX "idx_expenses_date" ON "expenses"("expense_date");

-- CreateIndex
CREATE INDEX "idx_expenses_payment_mode" ON "expenses"("payment_mode");

-- CreateIndex
CREATE INDEX "idx_expenses_deleted_at" ON "expenses"("deleted_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_company_id_fkey" FOREIGN KEY ("owner_company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_executing_company_id_fkey" FOREIGN KEY ("executing_company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervenants" ADD CONSTRAINT "intervenants_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervenants" ADD CONSTRAINT "intervenants_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervenants" ADD CONSTRAINT "intervenants_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_intervenant_id_fkey" FOREIGN KEY ("intervenant_id") REFERENCES "intervenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_commitment_id_fkey" FOREIGN KEY ("commitment_id") REFERENCES "commitments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_intervenant_id_fkey" FOREIGN KEY ("intervenant_id") REFERENCES "intervenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Production business constraints not directly represented by Prisma schema.
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "roles" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "permissions" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "user_roles" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "role_permissions" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "companies" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "projects" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "suppliers" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "intervenants" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "commitments" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "payments" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "expense_categories" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "expenses" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "projects" ADD CONSTRAINT "chk_projects_expected_end_date" CHECK ("expected_end_date" IS NULL OR "expected_end_date" >= "start_date");
ALTER TABLE "projects" ADD CONSTRAINT "chk_projects_actual_end_date" CHECK ("actual_end_date" IS NULL OR "actual_end_date" >= "start_date");
ALTER TABLE "projects" ADD CONSTRAINT "chk_projects_ownership_data" CHECK (
  (
    "ownership_type" = 'INTERNAL_COMPANY'
    AND "owner_company_id" IS NOT NULL
    AND "external_client_name" IS NULL
  )
  OR
  (
    "ownership_type" = 'EXTERNAL_CLIENT'
    AND "owner_company_id" IS NULL
    AND "external_client_name" IS NOT NULL
  )
);

ALTER TABLE "commitments" ADD CONSTRAINT "chk_commitments_positive_amount" CHECK ("agreed_amount" > 0);
ALTER TABLE "commitments" ADD CONSTRAINT "chk_commitments_beneficiary_data" CHECK (
  (
    "beneficiary_type" = 'SUPPLIER'
    AND "supplier_id" IS NOT NULL
    AND "intervenant_id" IS NULL
  )
  OR
  (
    "beneficiary_type" = 'INTERVENANT'
    AND "supplier_id" IS NULL
    AND "intervenant_id" IS NOT NULL
  )
);

ALTER TABLE "payments" ADD CONSTRAINT "chk_payments_positive_amount" CHECK ("amount" > 0);
ALTER TABLE "payments" ADD CONSTRAINT "chk_payments_cheque_number" CHECK ("payment_mode" <> 'CHEQUE' OR NULLIF(TRIM("cheque_number"), '') IS NOT NULL);
ALTER TABLE "payments" ADD CONSTRAINT "chk_payments_beneficiary_data" CHECK (
  (
    "beneficiary_type" = 'SUPPLIER'
    AND "supplier_id" IS NOT NULL
    AND "intervenant_id" IS NULL
  )
  OR
  (
    "beneficiary_type" = 'INTERVENANT'
    AND "supplier_id" IS NULL
    AND "intervenant_id" IS NOT NULL
  )
);

ALTER TABLE "expenses" ADD CONSTRAINT "chk_expenses_positive_amount" CHECK ("amount" > 0);

CREATE OR REPLACE FUNCTION validate_payment_commitment_consistency()
RETURNS trigger AS $$
DECLARE
  commitment_project_id UUID;
  commitment_beneficiary_type "BeneficiaryType";
  commitment_supplier_id UUID;
  commitment_intervenant_id UUID;
BEGIN
  SELECT "project_id", "beneficiary_type", "supplier_id", "intervenant_id"
    INTO commitment_project_id, commitment_beneficiary_type, commitment_supplier_id, commitment_intervenant_id
  FROM "commitments"
  WHERE "id" = NEW."commitment_id";

  IF commitment_project_id IS NULL THEN
    RAISE EXCEPTION 'Payment commitment does not exist';
  END IF;

  IF NEW."project_id" <> commitment_project_id THEN
    RAISE EXCEPTION 'Payment project must match commitment project';
  END IF;

  IF NEW."beneficiary_type" <> commitment_beneficiary_type THEN
    RAISE EXCEPTION 'Payment beneficiary type must match commitment beneficiary type';
  END IF;

  IF NEW."supplier_id" IS DISTINCT FROM commitment_supplier_id THEN
    RAISE EXCEPTION 'Payment supplier must match commitment supplier';
  END IF;

  IF NEW."intervenant_id" IS DISTINCT FROM commitment_intervenant_id THEN
    RAISE EXCEPTION 'Payment intervenant must match commitment intervenant';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trg_validate_payment_commitment_consistency"
BEFORE INSERT OR UPDATE ON "payments"
FOR EACH ROW EXECUTE FUNCTION validate_payment_commitment_consistency();
