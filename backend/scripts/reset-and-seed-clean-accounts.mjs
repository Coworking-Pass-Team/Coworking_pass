/** Destructive QA-only reset. Run with: npx tsx scripts/reset-and-seed-clean-accounts.mjs --confirm-qa-reset */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { deleteUserCascade } from '../lib/db/cascade-delete.ts';

try { process.loadEnvFile('.env'); } catch { /* Environment may already be configured. */ }
if (!process.argv.includes('--confirm-qa-reset') || process.env.NODE_ENV === 'production') {
  throw new Error('QA reset requires --confirm-qa-reset and must not run with NODE_ENV=production.');
}
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
const db = new PrismaClient();
try {
  const passwordHash = await bcrypt.hash('Password@1324', 10);
  await db.$transaction(async tx => {
    const users = await tx.user.findMany({ select: { id: true } });
    for (const user of users) await deleteUserCascade(tx, user.id);
    await tx.loginAttempt.deleteMany();
    await tx.otpThrottle.deleteMany();
    const createUser = (email, name, role, companyId = null) => tx.user.create({
      data: { email, name, role, passwordHash, companyId, emailVerified: true, isBanned: false },
    });
    await createUser('admin@muttaka.sa', 'QA Super Admin', 'SUPER_ADMIN');
    await createUser('anas.g.algamdi@gmail.com', 'Super Admin', 'SUPER_ADMIN');
    const hr = await createUser('hr@muttaka.sa', 'QA HR Admin', 'HR_ADMIN');
    const company = await tx.company.create({ data: { companyName: 'Muttaka Tech Ltd', hrAdminId: hr.id, balance: 5000 } });
    await tx.user.update({ where: { id: hr.id }, data: { companyId: company.id } });
    await createUser('employee@muttaka.sa', 'QA Employee', 'B2C', company.id);
    const individual = await createUser('user@muttaka.sa', 'QA Member', 'B2C');
    await tx.wallet.create({ data: { userId: individual.id, balance: 500 } });
    await tx.loyaltyPoint.create({ data: { userId: individual.id, totalEarned: 200, totalRedeemed: 0, availableBalance: 200 } });
    await createUser('partner@muttaka.sa', 'QA Partner', 'PARTNER_ADMIN');
    const partner = await tx.partner.create({ data: { brandName: 'Muttaka QA Partner', contactEmail: 'partner@muttaka.sa', taxNumber: '300000000000003', revenueSharePercentage: 15, status: 'APPROVED' } });
    await tx.workspace.create({ data: {
      partnerId: partner.id, name: 'Muttaka QA Hub', nameAr: 'مساحة متكأ التجريبية', city: 'Riyadh', cityAr: 'الرياض',
      address: 'Olaya Street, Riyadh', dailyRate: 60, monthlyRate: 900, yearlyRate: 9000,
      passVisitValue: 15, totalCapacity: 20, isVisible: true,
      sections: { create: [{ type: 'DESK', name: 'Shared desks', nameAr: 'مكاتب مشتركة', capacity: 20, dailyRate: 60 }] },
    } });
  }, { timeout: 300000, maxWait: 30000 });
  console.log('QA accounts reset and seeded.');
} finally { await db.$disconnect(); }
