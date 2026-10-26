/**
 * Creates (or resets) the team's accounts, one verified account per role, with a little data to click through.
 *
 *   npm run seed:accounts                                   # local database
 *   node scripts/seed-accounts.mjs --allow-remote           # the database on Render / Neon
 *
 * The real emails and the shared password are NOT in the repository (it is public). They are read from
 * scripts/team-accounts.json, which is git-ignored; scripts/team-accounts.example.json shows the shape. Another
 * file can be named with TEAM_ACCOUNTS_FILE. ACCOUNTS.md lists the roles and what each account holds.
 *
 * A database that is not on localhost is refused unless --allow-remote is passed. Sign-in needs a one-time code
 * sent by email, so every email address in the file must be a mailbox the team can read.
 * Safe to run again: existing accounts are updated, not duplicated.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

try { process.loadEnvFile('.env'); } catch { /* DATABASE_URL may already be in the environment */ }

const args = process.argv.slice(2);
const allowRemote = args.includes('--allow-remote');

const url = process.env.DATABASE_URL || '';
const host = (() => { try { return new URL(url).hostname; } catch { return ''; } })();
const isLocal = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(host);
if (!host) {
  console.error('Refusing to seed accounts: DATABASE_URL is not set.');
  process.exit(1);
}
if (!isLocal && !allowRemote) {
  console.error(`Refusing to seed accounts: DATABASE_URL host is "${host}", not localhost. Pass --allow-remote to seed that database on purpose.`);
  process.exit(1);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const realFile = process.env.TEAM_ACCOUNTS_FILE || path.join(here, 'team-accounts.json');
const exampleFile = path.join(here, 'team-accounts.example.json');
const usingExample = !fs.existsSync(realFile);
if (usingExample && !isLocal) {
  console.error(`Refusing to seed a remote database with the example accounts. Create ${realFile} (see team-accounts.example.json) first.`);
  process.exit(1);
}
const config = JSON.parse(fs.readFileSync(usingExample ? exampleFile : realFile, 'utf8'));
if (usingExample) console.warn('scripts/team-accounts.json not found: seeding the example accounts (local use only).');
const A = config.accounts;
const accountsPassword = config.password;
if (!accountsPassword || !['superAdmin', 'partner', 'hr', 'employee1', 'employee2', 'individual'].every((k) => A?.[k]?.email)) {
  console.error('The accounts file must have "password" and an "accounts" entry (with an email) for superAdmin, partner, hr, employee1, employee2 and individual.');
  process.exit(1);
}
if (!isLocal) console.warn(`Seeding accounts into the REMOTE database at ${host}.`);

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
const individual = await upsertUser({ email: A.individual.email, name: A.individual.name, role: 'B2C' });
await setWallet(individual.id, 500);
await prisma.loyaltyPoint.upsert({
  where: { userId: individual.id },
  update: { totalEarned: 300, totalRedeemed: 100, availableBalance: 200 },
  create: { userId: individual.id, totalEarned: 300, totalRedeemed: 100, availableBalance: 200 },
});

// 2. HR admin with a company, a shared wallet and two employees
const hr = await upsertUser({ email: A.hr.email, name: A.hr.name, role: 'HR_ADMIN' });
const company = await prisma.company.upsert({
  where: { hrAdminId: hr.id },
  update: { companyName: 'Test Company Ltd', balance: 5000, totalPassesAllocated: 10 },
  create: { companyName: 'Test Company Ltd', hrAdminId: hr.id, balance: 5000, totalPassesAllocated: 10 },
});
await prisma.user.update({ where: { id: hr.id }, data: { companyId: company.id } });
await upsertUser({ email: A.employee1.email, name: A.employee1.name, role: 'B2C', companyId: company.id });
await upsertUser({ email: A.employee2.email, name: A.employee2.name, role: 'B2C', companyId: company.id });

// 3. Approved venue partner with a workspace (a desk area and a meeting room with an hourly package)
const partnerUser = await upsertUser({ email: A.partner.email, name: A.partner.name, role: 'PARTNER_ADMIN' });
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

// 4. Super admin
await upsertUser({ email: A.superAdmin.email, name: A.superAdmin.name, role: 'SUPER_ADMIN' });

// 6. Booking history for the individual member and notifications (both rebuilt on every run, so the
// "upcoming" and "past" bookings always sit at the same distance from today)
{
  const oldHourly = await prisma.hourlyBooking.findMany({ where: { userId: individual.id, workspaceId: workspace.id }, select: { id: true } });
  const oldDirect = await prisma.directBooking.findMany({ where: { userId: individual.id, workspaceId: workspace.id }, select: { id: true } });
  const oldIds = [...oldHourly, ...oldDirect].map((b) => b.id);
  if (oldIds.length > 0) {
    await prisma.payment.deleteMany({ where: { referenceId: { in: oldIds } } });
    await prisma.hourlyBooking.deleteMany({ where: { id: { in: oldHourly.map((b) => b.id) } } });
    await prisma.directBooking.deleteMany({ where: { id: { in: oldDirect.map((b) => b.id) } } });
  }
}
{
  const day = (offset, hour) => new Date(Date.UTC(...(() => { const d = new Date(Date.now() + 3 * 3600000 + offset * 86400000); return [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hour]; })()));
  const upcoming = await prisma.hourlyBooking.create({
    data: { userId: individual.id, workspaceId: workspace.id, sectionId: meetingRoom.id, packageId: pkg.id, startDate: day(3, 10), endDate: day(3, 12), hoursUsed: 2, seats: 4, status: 'ACTIVE' },
  });
  await prisma.payment.create({ data: { userId: individual.id, workspaceId: workspace.id, amount: 150, method: 'MADA', paymentFor: 'HOURLY_BOOKING', referenceId: upcoming.id, status: 'SUCCESS' } });
  await prisma.hourlyBooking.create({
    data: { userId: individual.id, workspaceId: workspace.id, sectionId: meetingRoom.id, packageId: pkg.id, startDate: day(-5, 14), endDate: day(-5, 16), hoursUsed: 2, seats: 2, status: 'EXPIRED' },
  });
}

// Daily passes: one that already ended and one coming up, to check how past bookings are shown (rebuilt above)
{
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

console.log(`Accounts are ready (${usingExample ? 'example file' : 'team-accounts.json'}). Sign-in codes are sent by email.`);
await prisma.$disconnect();
