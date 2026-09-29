-- AlterTable: bilingual (English / Arabic) workspace content
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "nameAr" TEXT;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "descriptionAr" TEXT;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "addressAr" TEXT;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "cityAr" TEXT;
