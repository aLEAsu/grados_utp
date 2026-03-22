-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('STUDENT', 'ADVISOR', 'SECRETARY', 'ADMIN', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "academic_status" AS ENUM ('ACTIVE', 'INACTIVE', 'GRADUATED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "degree_modality_code" AS ENUM ('THESIS', 'INTERNSHIP', 'RESEARCH_LINE', 'DIPLOMA');

-- CreateEnum
CREATE TYPE "process_status" AS ENUM ('DRAFT', 'ACTIVE', 'IN_REVIEW', 'APPROVED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "document_status" AS ENUM ('POR_CARGAR', 'PENDIENTE', 'EN_REVISION', 'EN_CORRECCION', 'APROBADO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "approval_type" AS ENUM ('ACADEMIC', 'ADMINISTRATIVE');

-- CreateEnum
CREATE TYPE "approval_decision" AS ENUM ('APPROVED', 'REJECTED', 'REVISION_REQUESTED');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('DOCUMENT_UPLOADED', 'REVIEW_REQUESTED', 'APPROVAL_GRANTED', 'REVISION_REQUIRED', 'PROCESS_COMPLETED', 'SIGNATURE_APPLIED', 'GENERAL');

-- CreateTable
CREATE TABLE "seeds" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "seeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "role" "user_role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "google_id" TEXT,
    "institutional_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "student_code" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "faculty" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "academic_status" "academic_status" NOT NULL,
    "has_completed_subjects" BOOLEAN NOT NULL DEFAULT false,
    "external_student_id" TEXT,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advisor_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "department" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "max_active_processes" INTEGER NOT NULL DEFAULT 5,
    "current_active_processes" INTEGER NOT NULL DEFAULT 0,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advisor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "degree_modalities" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" "degree_modality_code" NOT NULL,
    "description" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "degree_modalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_types" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "accepted_mime_types" TEXT[],
    "max_file_size_mb" INTEGER NOT NULL DEFAULT 10,
    "template_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modality_requirements" (
    "id" UUID NOT NULL,
    "modality_id" UUID NOT NULL,
    "document_type_id" UUID NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL,
    "instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modality_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "degree_processes" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "advisor_id" UUID,
    "modality_id" UUID NOT NULL,
    "status" "process_status" NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "degree_processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirement_instances" (
    "id" UUID NOT NULL,
    "degree_process_id" UUID NOT NULL,
    "modality_requirement_id" UUID NOT NULL,
    "status" "document_status" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requirement_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" UUID NOT NULL,
    "requirement_instance_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "original_file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size_byte" INTEGER NOT NULL,
    "storage_path" TEXT NOT NULL,
    "hash_sha256" TEXT NOT NULL,
    "uploaded_by_id" UUID NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL,
    "comment" TEXT,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" UUID NOT NULL,
    "requirement_instance_id" UUID NOT NULL,
    "document_version_id" UUID NOT NULL,
    "approver_user_id" UUID NOT NULL,
    "type" "approval_type" NOT NULL,
    "decision" "approval_decision" NOT NULL,
    "observations" TEXT,
    "approved_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_signatures" (
    "id" UUID NOT NULL,
    "requirement_instance_id" UUID NOT NULL,
    "document_version_id" UUID NOT NULL,
    "signed_by_id" UUID NOT NULL,
    "signature_hash" TEXT NOT NULL,
    "certificate_serial" TEXT,
    "signed_document_path" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "digital_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observations" (
    "id" UUID NOT NULL,
    "requirement_instance_id" UUID NOT NULL,
    "document_version_id" UUID,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "notification_type" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "user_role" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "previous_value" JSONB,
    "new_value" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seeds_name_key" ON "seeds"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_institutional_email_key" ON "users"("institutional_email");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_user_id_key" ON "student_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_student_code_key" ON "student_profiles"("student_code");

-- CreateIndex
CREATE UNIQUE INDEX "advisor_profiles_user_id_key" ON "advisor_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "degree_modalities_name_key" ON "degree_modalities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "degree_modalities_code_key" ON "degree_modalities"("code");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_code_key" ON "document_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "modality_requirements_modality_id_document_type_id_key" ON "modality_requirements"("modality_id", "document_type_id");

-- CreateIndex
CREATE INDEX "degree_processes_student_id_idx" ON "degree_processes"("student_id");

-- CreateIndex
CREATE INDEX "degree_processes_advisor_id_idx" ON "degree_processes"("advisor_id");

-- CreateIndex
CREATE INDEX "degree_processes_status_idx" ON "degree_processes"("status");

-- CreateIndex
CREATE INDEX "requirement_instances_degree_process_id_idx" ON "requirement_instances"("degree_process_id");

-- CreateIndex
CREATE INDEX "requirement_instances_status_idx" ON "requirement_instances"("status");

-- CreateIndex
CREATE UNIQUE INDEX "requirement_instances_degree_process_id_modality_requiremen_key" ON "requirement_instances"("degree_process_id", "modality_requirement_id");

-- CreateIndex
CREATE INDEX "document_versions_requirement_instance_id_idx" ON "document_versions"("requirement_instance_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "audit_events_entity_entity_id_idx" ON "audit_events"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_events_user_id_idx" ON "audit_events"("user_id");

-- CreateIndex
CREATE INDEX "audit_events_timestamp_idx" ON "audit_events"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_key" ON "sessions"("refresh_token");

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_profiles" ADD CONSTRAINT "advisor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modality_requirements" ADD CONSTRAINT "modality_requirements_modality_id_fkey" FOREIGN KEY ("modality_id") REFERENCES "degree_modalities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modality_requirements" ADD CONSTRAINT "modality_requirements_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "degree_processes" ADD CONSTRAINT "degree_processes_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "degree_processes" ADD CONSTRAINT "degree_processes_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "degree_processes" ADD CONSTRAINT "degree_processes_modality_id_fkey" FOREIGN KEY ("modality_id") REFERENCES "degree_modalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_instances" ADD CONSTRAINT "requirement_instances_degree_process_id_fkey" FOREIGN KEY ("degree_process_id") REFERENCES "degree_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_instances" ADD CONSTRAINT "requirement_instances_modality_requirement_id_fkey" FOREIGN KEY ("modality_requirement_id") REFERENCES "modality_requirements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_requirement_instance_id_fkey" FOREIGN KEY ("requirement_instance_id") REFERENCES "requirement_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_requirement_instance_id_fkey" FOREIGN KEY ("requirement_instance_id") REFERENCES "requirement_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_document_version_id_fkey" FOREIGN KEY ("document_version_id") REFERENCES "document_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approver_user_id_fkey" FOREIGN KEY ("approver_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_signatures" ADD CONSTRAINT "digital_signatures_requirement_instance_id_fkey" FOREIGN KEY ("requirement_instance_id") REFERENCES "requirement_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_signatures" ADD CONSTRAINT "digital_signatures_document_version_id_fkey" FOREIGN KEY ("document_version_id") REFERENCES "document_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_signatures" ADD CONSTRAINT "digital_signatures_signed_by_id_fkey" FOREIGN KEY ("signed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_requirement_instance_id_fkey" FOREIGN KEY ("requirement_instance_id") REFERENCES "requirement_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_document_version_id_fkey" FOREIGN KEY ("document_version_id") REFERENCES "document_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
