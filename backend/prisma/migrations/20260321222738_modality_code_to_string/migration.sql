-- Convert code column from enum to text, preserving existing data

-- 1. Add a temporary text column
ALTER TABLE "degree_modalities" ADD COLUMN "code_new" TEXT;

-- 2. Copy enum values as text
UPDATE "degree_modalities" SET "code_new" = "code"::TEXT;

-- 3. Drop the unique index on the old column
DROP INDEX IF EXISTS "degree_modalities_code_key";

-- 4. Drop the old enum column
ALTER TABLE "degree_modalities" DROP COLUMN "code";

-- 5. Rename the new column
ALTER TABLE "degree_modalities" RENAME COLUMN "code_new" TO "code";

-- 6. Make it NOT NULL
ALTER TABLE "degree_modalities" ALTER COLUMN "code" SET NOT NULL;

-- 7. Re-create the unique index
CREATE UNIQUE INDEX "degree_modalities_code_key" ON "degree_modalities"("code");

-- 8. Drop the enum type (no longer needed)
DROP TYPE IF EXISTS "degree_modality_code";
