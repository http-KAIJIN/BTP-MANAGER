-- CreateEnum
CREATE TYPE "ConstructionPhaseStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "construction_phases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "status" "ConstructionPhaseStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "start_date" DATE,
    "end_date" DATE,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,
    CONSTRAINT "construction_phases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_construction_phase_project_name" ON "construction_phases"("project_id", "name");

-- CreateIndex
CREATE INDEX "idx_construction_phase_project" ON "construction_phases"("project_id");

-- CreateIndex
CREATE INDEX "idx_construction_phase_status" ON "construction_phases"("status");

-- CreateIndex
CREATE INDEX "idx_construction_phase_deleted_at" ON "construction_phases"("deleted_at");

-- AddForeignKey
ALTER TABLE "construction_phases" ADD CONSTRAINT "construction_phases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "construction_phases" ADD CONSTRAINT "construction_phases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "construction_phases" ADD CONSTRAINT "construction_phases_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "construction_phases" ADD CONSTRAINT "construction_phases_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
