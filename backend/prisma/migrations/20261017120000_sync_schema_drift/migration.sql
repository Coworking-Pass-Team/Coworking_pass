-- Closes the drift between schema.prisma and the migration history
-- (columns and constraints that only existed on databases synced with `db push`).

ALTER TABLE "HourlyBooking" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "HourlyBooking" ADD COLUMN IF NOT EXISTS "durationDetails" TEXT;
ALTER TABLE "DirectBooking" ADD COLUMN IF NOT EXISTS "durationDetails" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

ALTER TABLE "Partner" ALTER COLUMN "status" SET DEFAULT 'PENDING_APPROVAL';

ALTER TABLE "Ticket" DROP CONSTRAINT IF EXISTS "Ticket_companyId_fkey";
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HourlyBooking" DROP CONSTRAINT IF EXISTS "HourlyBooking_workspaceId_fkey";
ALTER TABLE "HourlyBooking" ADD CONSTRAINT "HourlyBooking_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_workspaceId_fkey";
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
