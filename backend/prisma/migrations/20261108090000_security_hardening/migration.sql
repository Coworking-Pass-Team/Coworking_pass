ALTER TYPE "PaymentMethod" ADD VALUE 'WALLET';
-- Fail deployment on invalid existing amounts; repair them explicitly before retrying.
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_amount_nonnegative" CHECK ("amount" >= 0 AND "amount" < 'Infinity'::float8);
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_amount_nonnegative" CHECK ("amount" >= 0 AND "amount" < 'Infinity'::float8);
ALTER TABLE "CompanyWalletTransaction" ADD CONSTRAINT "CompanyWalletTransaction_amount_nonnegative" CHECK ("amount" >= 0 AND "amount" < 'Infinity'::float8);
ALTER TABLE "DirectBooking" ADD COLUMN "payableAmount" DOUBLE PRECISION;
ALTER TABLE "HourlyBooking" ADD COLUMN "payableAmount" DOUBLE PRECISION;
ALTER TABLE "MembershipPlan" ADD COLUMN "durationDays" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Subscription" ADD COLUMN "payableAmount" DOUBLE PRECISION;
CREATE TABLE "IdempotencyRecord" ("id" TEXT PRIMARY KEY, "requestHash" TEXT NOT NULL, "status" INTEGER NOT NULL, "body" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "OtpThrottle" ("userId" TEXT PRIMARY KEY, "failures" INTEGER NOT NULL DEFAULT 0, "lockedUntil" TIMESTAMP(3), "lastSentAt" TIMESTAMP(3));
-- Invalidate pending codes when deploying stricter verification rules.
UPDATE "OtpCode" SET "isUsed" = true WHERE "isUsed" = false;

UPDATE "User" SET "sessionsRevokedAt" = CURRENT_TIMESTAMP WHERE "role" = 'SUPER_ADMIN';
