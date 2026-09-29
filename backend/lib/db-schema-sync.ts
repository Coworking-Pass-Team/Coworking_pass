import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

let isSchemaEnsured = false;

/**
 * Idempotent database schema self-healing and admin account synchronization.
 * Guarantees that any missing columns on Neon PostgreSQL are added seamlessly
 * and the Super Admin account (admin@coworkingpass.sa / password) is provisioned.
 */
export async function ensureDatabaseSchema(force = false): Promise<{ success: boolean; message: string; details?: any }> {
  if (isSchemaEnsured && !force) {
    return { success: true, message: "Database schema already synchronized." };
  }

  const executedStatements: string[] = [];

  try {
    // 1. Ensure Partner table has status and createdAt
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'ApprovalStatus'
        ) THEN
          CREATE TYPE "ApprovalStatus" AS ENUM ('APPROVED', 'PENDING_APPROVAL', 'REJECTED');
        END IF;
      END $$;
    `).catch((err) => console.warn("[Schema Sync] ApprovalStatus type check warning:", err));

    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Partner" ADD COLUMN IF NOT EXISTS "status" "ApprovalStatus" NOT NULL DEFAULT \'APPROVED\';'
    ).then(() => executedStatements.push('Partner.status'));

    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Partner" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;'
    ).then(() => executedStatements.push('Partner.createdAt'));

    // 2. Ensure User table has isBanned
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isBanned" BOOLEAN NOT NULL DEFAULT false;'
    ).then(() => executedStatements.push('User.isBanned'));

    // 3. Ensure Company table has balance
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "balance" DOUBLE PRECISION NOT NULL DEFAULT 0;'
    ).then(() => executedStatements.push('Company.balance'));

    // 4. Ensure DirectBooking, HourlyBooking, and Payment columns
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "DirectBooking" ADD COLUMN IF NOT EXISTS "durationDetails" TEXT;'
    ).then(() => executedStatements.push('DirectBooking.durationDetails'));

    await prisma.$executeRawUnsafe(
      'ALTER TABLE "HourlyBooking" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;'
    ).then(() => executedStatements.push('HourlyBooking.workspaceId'));

    await prisma.$executeRawUnsafe(
      'ALTER TABLE "HourlyBooking" ADD COLUMN IF NOT EXISTS "durationDetails" TEXT;'
    ).then(() => executedStatements.push('HourlyBooking.durationDetails'));

    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;'
    ).then(() => executedStatements.push('Payment.workspaceId'));

    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;'
    ).then(() => executedStatements.push('Payment.createdAt'));

    await prisma.$executeRawUnsafe(
      'ALTER TABLE "DirectBooking" ADD COLUMN IF NOT EXISTS "seats" INTEGER NOT NULL DEFAULT 1;'
    ).then(() => executedStatements.push('DirectBooking.seats'));

    await prisma.$executeRawUnsafe(
      'ALTER TABLE "HourlyBooking" ADD COLUMN IF NOT EXISTS "seats" INTEGER NOT NULL DEFAULT 1;'
    ).then(() => executedStatements.push('HourlyBooking.seats'));

    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "openingTime" TEXT NOT NULL DEFAULT '08:00';`
    ).then(() => executedStatements.push('Workspace.openingTime'));

    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "closingTime" TEXT NOT NULL DEFAULT '22:00';`
    ).then(() => executedStatements.push('Workspace.closingTime'));

    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "is24Hours" BOOLEAN NOT NULL DEFAULT false;'
    ).then(() => executedStatements.push('Workspace.is24Hours'));

    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "isVisible" BOOLEAN NOT NULL DEFAULT true;'
    ).then(() => executedStatements.push('Workspace.isVisible'));

    // Support tickets can be raised by individuals and partners, who have no company
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Ticket" ALTER COLUMN "companyId" DROP NOT NULL;'
    ).then(() => executedStatements.push('Ticket.companyId nullable')).catch((err) => console.warn("[Schema Sync] Ticket.companyId warning:", err));
    for (const column of ['message', 'category', 'priority']) {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "${column}" TEXT;`
      ).then(() => executedStatements.push(`Ticket.${column}`)).catch((err) => console.warn("[Schema Sync] Ticket column warning:", err));
    }

    // Bilingual (English / Arabic) workspace content, authored by providers and admins
    for (const column of ['nameAr', 'description', 'descriptionAr', 'address', 'addressAr', 'cityAr']) {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "${column}" TEXT;`
      ).then(() => executedStatements.push(`Workspace.${column}`)).catch((err) => console.warn("[Schema Sync] Workspace bilingual column warning:", err));
    }

    // 4b. Ensure the corporate wallet ledger table exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CompanyWalletTransaction" (
        "id" TEXT NOT NULL,
        "companyId" TEXT NOT NULL,
        "userId" TEXT,
        "amount" DOUBLE PRECISION NOT NULL,
        "type" TEXT NOT NULL,
        "description" TEXT,
        "referenceId" TEXT,
        "balanceAfter" DOUBLE PRECISION NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CompanyWalletTransaction_pkey" PRIMARY KEY ("id")
      );
    `).then(() => executedStatements.push('CompanyWalletTransaction'));

    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "CompanyWalletTransaction_companyId_createdAt_idx" ON "CompanyWalletTransaction"("companyId", "createdAt");'
    ).catch((err) => console.warn("[Schema Sync] CompanyWalletTransaction index warning:", err));

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CompanyWalletTransaction_companyId_fkey') THEN
          ALTER TABLE "CompanyWalletTransaction" ADD CONSTRAINT "CompanyWalletTransaction_companyId_fkey"
            FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `).catch((err) => console.warn("[Schema Sync] CompanyWalletTransaction FK warning:", err));

    // 5. Ensure Super Admin Account is provisioned with unified password "password"
    const adminEmail = "admin@coworkingpass.sa";
    const unifiedPassword = "password";
    const passwordHash = await bcrypt.hash(unifiedPassword, 10);

    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: adminEmail },
          { role: "SUPER_ADMIN" },
        ],
      },
    });

    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          name: "Platform Super Admin",
          email: adminEmail,
          passwordHash,
          role: "SUPER_ADMIN",
          emailVerified: true,
          isBanned: false,
        },
      });
      executedStatements.push('Created Super Admin user (admin@coworkingpass.sa)');
    } else {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          email: adminEmail,
          passwordHash,
          role: "SUPER_ADMIN",
          emailVerified: true,
          isBanned: false,
        },
      });
      executedStatements.push('Synchronized Super Admin user password to "password"');
    }

    isSchemaEnsured = true;
    return {
      success: true,
      message: "Database schema and Super Admin account synchronized successfully.",
      details: executedStatements,
    };
  } catch (error: any) {
    console.error("[Schema Sync Error]:", error);
    return {
      success: false,
      message: error?.message || "Database schema synchronization failed.",
      details: error,
    };
  }
}
