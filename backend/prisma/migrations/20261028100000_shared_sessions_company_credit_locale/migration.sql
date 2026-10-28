-- Sessions and the sign-in lockout live in the database, so every server instance sees them
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sessionsRevokedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "RevokedToken" (
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RevokedToken_pkey" PRIMARY KEY ("tokenHash")
);
CREATE INDEX IF NOT EXISTS "RevokedToken_expiresAt_idx" ON "RevokedToken"("expiresAt");

CREATE TABLE IF NOT EXISTS "LoginAttempt" (
    "email" TEXT NOT NULL,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("email")
);

-- Language of the emails a person receives
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "locale" TEXT NOT NULL DEFAULT 'ar';

-- Company money in members' wallets: spent first, returned when the member leaves, optional monthly limit
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companySpendLimit" DOUBLE PRECISION;
ALTER TABLE "Wallet" ADD COLUMN IF NOT EXISTS "companyCredit" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Wallet" ADD COLUMN IF NOT EXISTS "companyCreditCompanyId" TEXT;
ALTER TABLE "WalletTransaction" ADD COLUMN IF NOT EXISTS "companyAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
