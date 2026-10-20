/**
 * Creates (or resets) one verified test account for every role, with a little data to click through.
 *
 *   npm run seed:test-accounts                                   # local database
 *   node scripts/seed-test-accounts.mjs --allow-remote           # QA database on Render / Neon
 *
 * The accounts are listed in TEST_ACCOUNTS.md, which is public (the repository is public). Therefore:
 * - A database that is not on localhost is refused unless --allow-remote is passed.
 * - On a remote database the super admin test account is NOT created, unless --include-admin is passed
 *   together with a private TEST_ADMIN_PASSWORD (the published password is never used for an admin there).
 * - TEST_ACCOUNTS_PASSWORD sets a private password for the other accounts; without it the published one is used
 *   and a warning is printed.
 * Safe to run again: existing test accounts are updated, not duplicated. Remove them before the real launch
 * (see PRODUCTION_CHECKLIST.md).
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

try { process.loadEnvFile('.env'); } catch { /* DATABASE_URL may already be in the environment */ }

const args = process.argv.slice(2);
const allowRemote = args.includes('--allow-remote');
const includeAdmin = args.includes('--include-admin');

const url = process.env.DATABASE_URL || '';
const host = (() => { try { return new URL(url).hostname; } catch { return ''; } })();
const isLocal = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(host);
if (!host) {
  console.error('Refusing to seed test accounts: DATABASE_URL is not set.');
  process.exit(1);
}
if (!isLocal && !allowRemote) {
  console.error(`Refusing to seed test accounts: DATABASE_URL host is "${host}", not localhost. Pass --allow-remote to seed a QA database on purpose.`);
  process.exit(1);
}

export const TEST_PASSWORD = 'Test@12345';
const accountsPassword = process.env.TEST_ACCOUNTS_PASSWORD || TEST_PASSWORD;
if (!isLocal) {
  console.warn(`Seeding test accounts into the REMOTE database at ${host}.`);
  if (!process.env.TEST_ACCOUNTS_PASSWORD) {
    console.warn('WARNING: using the password published in TEST_ACCOUNTS.md. Anyone who reads the public repository can sign in to these accounts. Set TEST_ACCOUNTS_PASSWORD to use a private one.');
  }
}
const prisma = new PrismaClient();
const passwordHash = await bcrypt.hash(accountsPassword, 10);

async function upsertUser({ email, name, role, companyId = null, isBanned = false, hash = passwordHash }) {
  const data = { name, role, passwordHash: hash, companyId, emailVerified: true, isBanned };
  return prisma.user.upsert({ where: { email }, update: data, create: { email, ...data } });
}

async function setWallet(userId, balance) {
  await prisma.wallet.upsert({ where: { userId }, update: { balance }, create: { userId, balance } });
}

// 1. Individual member, with wallet balance, loyalty points and a booking history
const individual = await upsertUser({ email: 'individual@cwp-test.local', name: 'Test Individual', role: 'B2C' });
await setWallet(individual.id, 500);
await prisma.loyaltyPoint.upsert({
  where: { userId: individual.id },
  update: { totalEarned: 300, totalRedeemed: 100, availableBalance: 200 },
  create: { userId: individual.id, totalEarned: 300, totalRedeemed: 100, availableBalance: 200 },
});
await upsertUser({ email: 'newmember@cwp-test.local', name: 'Test New Member', role: 'B2C' });

// 2. HR admin with a company, a shared wallet and two employees
const hr = await upsertUser({ email: 'hr@cwp-test.local', name: 'Test HR Admin', role: 'HR_ADMIN' });
const company = await prisma.company.upsert({
  where: { hrAdminId: hr.id },
  update: { companyName: 'Test Company Ltd', balance: 5000, totalPassesAllocated: 10 },
  create: { companyName: 'Test Company Ltd', hrAdminId: hr.id, balance: 5000, totalPassesAllocated: 10 },
});
await prisma.user.update({ where: { id: hr.id }, data: { companyId: company.id } });
await upsertUser({ email: 'employee1@cwp-test.local', name: 'Test Employee One', role: 'B2C', companyId: company.id });
await upsertUser({ email: 'employee2@cwp-test.local', name: 'Test Employee Two', role: 'B2C', companyId: company.id });

// 3. Approved venue partner with a workspace (a desk area and a meeting room with an hourly package)
const partnerUser = await upsertUser({ email: 'partner@cwp-test.local', name: 'Test Venue Partner', role: 'PARTNER_ADMIN' });
const partnerData = { brandName: 'Test Partner Venues', contactEmail: partnerUser.email, taxNumber: '300000000000003', revenueSharePercentage: 15, status: 'APPROVED' };
const partner = (await prisma.partner.findFirst({ where: { contactEmail: partnerUser.email } }))
  ? await prisma.partner.update({ where: { id: (await prisma.partner.findFirst({ where: { contactEmail: partnerUser.email } })).id }, data: partnerData })
  : await prisma.partner.create({ data: partnerData });

let workspace = await prisma.workspace.findFirst({ where: { partnerId: partner.id, name: 'Test Partner Hub' }, include: { sections: { include: { hourlyPackages: true } } } });
if (!workspace) {
  workspace = await prisma.workspace.create({
    data: {
      partnerId: partner.id,
      name: 'Test Partner Hub',
      nameAr: 'مركز الشريك التجريبي',
      description: 'A workspace created for testing.',
      descriptionAr: 'مساحة عمل أُنشئت للاختبار.',
      address: 'Olaya Street, Riyadh',
      addressAr: 'شارع العليا، الرياض',
      city: 'Riyadh',
      cityAr: 'الرياض',
      dailyRate: 60,
      monthlyRate: 900,
      yearlyRate: 9000,
      passVisitValue: 15,
      totalCapacity: 20,
      openingTime: '08:00',
      closingTime: '22:00',
      isVisible: true,
      sections: {
        create: [
          { type: 'DESK', name: 'Private Offices', nameAr: 'المكاتب الخاصة', subType: 'private-office', capacity: 20, dailyRate: 60, monthlyRate: 900, yearlyRate: 9000 },
          { type: 'MEETING_ROOM', name: 'Meeting Room A', nameAr: 'غرفة الاجتماعات A', subType: 'meeting-room', capacity: 8, hourlyRate: 75, dailyRate: 400 },
        ],
      },
    },
    include: { sections: { include: { hourlyPackages: true } } },
  });
}
for (const sec of workspace.sections) {
  const patch = sec.type === 'DESK'
    ? { name: 'Private Offices', nameAr: 'المكاتب الخاصة', subType: 'private-office' }
    : sec.type === 'MEETING_ROOM' ? { nameAr: sec.nameAr || 'غرفة الاجتماعات A', subType: 'meeting-room' } : null;
  if (patch && (sec.subType !== patch.subType || sec.nameAr !== patch.nameAr || (patch.name && sec.name !== patch.name))) {
    await prisma.workspaceSection.update({ where: { id: sec.id }, data: patch });
  }
}
const meetingRoom = workspace.sections.find((s) => s.type === 'MEETING_ROOM');
let pkg = meetingRoom.hourlyPackages[0];
if (!pkg) {
  pkg = await prisma.hourlyPackage.create({ data: { sectionId: meetingRoom.id, packageName: 'Meeting Room - 2 Hours', hoursAmount: 2, periodType: 'PER_DAY', price: 150 } });
}

// 4. A venue partner still waiting for approval, to test the approval flow
const pending = await upsertUser({ email: 'partner.pending@cwp-test.local', name: 'Test Pending Partner', role: 'PARTNER_ADMIN' });
const pendingData = { brandName: 'Test Pending Venues', contactEmail: pending.email, taxNumber: '300000000000004', revenueSharePercentage: 15, status: 'PENDING_APPROVAL' };
const existingPending = await prisma.partner.findFirst({ where: { contactEmail: pending.email } });
if (existingPending) await prisma.partner.update({ where: { id: existingPending.id }, data: pendingData });
else await prisma.partner.create({ data: pendingData });

// 5. Super admin and a suspended account. On a remote database the admin needs --include-admin and a private
//    TEST_ADMIN_PASSWORD: with the published password and the master code anyone could take over the site.
if (isLocal) {
  await upsertUser({ email: 'superadmin@cwp-test.local', name: 'Test Super Admin', role: 'SUPER_ADMIN' });
} else if (includeAdmin && process.env.TEST_ADMIN_PASSWORD && process.env.TEST_ADMIN_PASSWORD !== TEST_PASSWORD) {
  const adminHash = await bcrypt.hash(process.env.TEST_ADMIN_PASSWORD, 10);
  await upsertUser({ email: 'superadmin@cwp-test.local', name: 'Test Super Admin', role: 'SUPER_ADMIN', hash: adminHash });
  console.log('Super admin test account created with the private TEST_ADMIN_PASSWORD.');
} else {
  console.log('Skipped the super admin test account on the remote database (use --include-admin with a private TEST_ADMIN_PASSWORD).');
}
await upsertUser({ email: 'suspended@cwp-test.local', name: 'Test Suspended Member', role: 'B2C', isBanned: true });

// 6. Booking history for the individual member (created once) and notifications (reset on every run)
const hasHistory = await prisma.hourlyBooking.count({ where: { userId: individual.id, workspaceId: workspace.id } });
if (!hasHistory) {
  const day = (offset, hour) => new Date(Date.UTC(...(() => { const d = new Date(Date.now() + 3 * 3600000 + offset * 86400000); return [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hour]; })()));
  const upcoming = await prisma.hourlyBooking.create({
    data: { userId: individual.id, workspaceId: workspace.id, sectionId: meetingRoom.id, packageId: pkg.id, startDate: day(3, 10), endDate: day(3, 12), hoursUsed: 2, seats: 4, status: 'ACTIVE' },
  });
  await prisma.payment.create({ data: { userId: individual.id, workspaceId: workspace.id, amount: 150, method: 'MADA', paymentFor: 'HOURLY_BOOKING', referenceId: upcoming.id, status: 'SUCCESS' } });
  await prisma.hourlyBooking.create({
    data: { userId: individual.id, workspaceId: workspace.id, sectionId: meetingRoom.id, packageId: pkg.id, startDate: day(-5, 14), endDate: day(-5, 16), hoursUsed: 2, seats: 2, status: 'EXPIRED' },
  });
}

// Daily passes: one that already ended and one coming up, to check how past bookings are shown
const hasDirect = await prisma.directBooking.count({ where: { userId: individual.id, workspaceId: workspace.id } });
if (!hasDirect) {
  const deskSection = workspace.sections.find((sec) => sec.type === 'DESK');
  const dayStart = (offset) => { const d = new Date(Date.now() + 3 * 3600000 + offset * 86400000); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); };
  await prisma.directBooking.createMany({
    data: [
      { userId: individual.id, workspaceId: workspace.id, sectionId: deskSection.id, durationType: 'DAILY', durationDetails: '1 Days', bookingDate: dayStart(-40), seats: 1, status: 'CONFIRMED' },
      { userId: individual.id, workspaceId: workspace.id, sectionId: deskSection.id, durationType: 'DAILY', durationDetails: '1 Days', bookingDate: dayStart(10), seats: 1, status: 'CONFIRMED' },
    ],
  });
}

// Notifications are reset on every run, so tests always start from the same three entries
await prisma.notification.deleteMany({ where: { userId: individual.id } });
await prisma.notification.createMany({
  data: [
    { userId: individual.id, type: 'MEETING_BOOKED', title: 'Session Booked', message: 'Your session at Test Partner Hub (Meeting Room A) has been confirmed.', channel: 'IN_APP', isRead: false, sentAt: new Date() },
    { userId: individual.id, type: 'PAYMENT_SUCCESS', title: 'Payment Successful', message: 'Payment of SAR 150 received successfully.', channel: 'IN_APP', isRead: false, sentAt: new Date() },
    { userId: individual.id, type: 'PASS_EXPIRING', title: 'Pass Expiring Soon', message: 'Your pass will renew in 3 days.', channel: 'IN_APP', isRead: true, sentAt: new Date(Date.now() - 2 * 86400000) },
  ],
});

console.log(process.env.TEST_ACCOUNTS_PASSWORD
  ? 'Test accounts are ready with the private TEST_ACCOUNTS_PASSWORD (verification code 123456).'
  : `Test accounts are ready. Password for all of them: ${TEST_PASSWORD} (verification code 123456)`);
await prisma.$disconnect();
