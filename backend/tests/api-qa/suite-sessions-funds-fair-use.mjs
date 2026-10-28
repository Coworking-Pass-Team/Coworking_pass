// Fixes for the gaps listed in the supervisor report:
//   - partner sign-up accepts the unified 700 number and registrations from every region (not only 1010),
//   - sign-out, "end every session" and the sign-in lockout are stored in the database (shared by all instances),
//   - company money in members' wallets is spent first, can be capped per month and returns to the company,
//   - the "Unlimited*" plans allow at most five meeting room or theater sessions per person per week,
//   - the email language is saved from the site language.
import { api, db, makeUser, check, summary, strongPassword, plantOtp, signIn, TEAM, TEAM_PASSWORD } from './lib.mjs';
await db.connect();
const run = Date.now().toString(36);
const mail = (n) => `qa.${n}.${run}@test.local`.toLowerCase();
const mk = (n, role = 'B2C', extra = {}) => makeUser('QA ' + n, mail(n), role, extra);
const num = async (sql, params) => Number((await db.query(sql, params)).rows[0]?.v ?? 0);

// ---------- Commercial registration ----------
console.log('\n## Partner sign-up: unified number and every region');
const reg = (n, crNumber) => api('/auth/register', { method: 'POST', body: { name: 'QA ' + n, email: mail(n), password: strongPassword(), role: 'PARTNER_ADMIN', businessName: 'QA CR ' + n + ' ' + run, crNumber } });
check('a unified number starting with 7 is accepted', (await reg('cr700', '7001234567')).status === 201);
check('a Jeddah registration (4030) is accepted', (await reg('cr4030', '4030123456')).status === 201);
const arabicDigits = await reg('crArabic', '٧٠٠٩٨٧٦٥٤٣');
const storedCr = (await db.query('select "taxNumber" v from "Partner" where "contactEmail"=$1', [mail('crArabic')])).rows[0]?.v;
check('Arabic-Indic digits are accepted and stored as Western digits', arabicDigits.status === 201 && storedCr === '7009876543', `${arabicDigits.status} ${storedCr}`);
const badCr = await reg('crBad', '6001234567');
check('a number that is neither form is refused with the new message', badCr.status === 400 && /unified number starting with 7/.test(badCr.body?.error || ''), JSON.stringify(badCr.body));

// ---------- Email language ----------
console.log('\n## Email language follows the site language');
const locale = (email) => db.query('select locale v from "User" where email=$1', [email]).then((r) => r.rows[0]?.v);
const enPw = strongPassword();
await api('/auth/register', { method: 'POST', body: { name: 'QA en', email: mail('langEn'), password: enPw, locale: 'en' } });
check('signing up in English saves English', (await locale(mail('langEn'))) === 'en');
await api('/auth/register', { method: 'POST', body: { name: 'QA ar', email: mail('langAr'), password: strongPassword() } });
check('without a language the default is Arabic', (await locale(mail('langAr'))) === 'ar');
await db.query('update "User" set "emailVerified"=true where email=$1', [mail('langEn')]);
await api('/auth/login', { method: 'POST', body: { email: mail('langEn'), password: enPw, locale: 'ar' } });
check('signing in in Arabic switches the saved language', (await locale(mail('langEn'))) === 'ar');

// ---------- Sessions and lockout ----------
console.log('\n## Sign-out and ended sessions are shared');
const sess = await mk('sess');
const second = await signIn(sess.email, sess.pw);
const me = (t) => api('/wallet?userId=' + sess.userId, { token: t });
check('two devices are signed in', (await me(sess.token)).status === 200 && (await me(second.token)).status === 200);
check('signing out answers 200', (await api('/auth/logout', { method: 'POST', token: sess.token })).status === 200);
check('the signed-out token is refused', (await me(sess.token)).status === 401);
check('the other device stays signed in', (await me(second.token)).status === 200);
check('the sign-out is stored as a hash, not the token', (await num('select count(*)::int v from "RevokedToken" where "tokenHash"=encode(sha256($1::bytea), \'hex\')', [sess.token])) === 1);
check('signing out with a garbage token stores nothing', (await api('/auth/logout', { method: 'POST', token: 'not-a-jwt' })).status === 200);

console.log('\n## Password reset ends every session');
const resetUser = await mk('reset');
const resetPw = strongPassword();
await api('/auth/forgot-password', { method: 'POST', body: { email: resetUser.email } });
const resetCode = await plantOtp(resetUser.userId, 'PASSWORD_RESET');
await new Promise((r) => setTimeout(r, 1100));
const resetRes = await api('/auth/reset-password', { method: 'POST', body: { email: resetUser.email, code: resetCode, newPassword: resetPw } });
check('the password is reset', resetRes.status === 200, JSON.stringify(resetRes.body));
check('the old session no longer works', (await api('/wallet?userId=' + resetUser.userId, { token: resetUser.token })).status === 401);
const afterReset = await signIn(resetUser.email, resetPw);
check('signing in with the new password works', afterReset.ok);

console.log('\n## Suspension ends sessions; reinstatement needs a new sign-in');
// Seeded super admin: docs/Accounts.md and scripts/team-accounts.json (override with QA_ADMIN_EMAIL / QA_ADMIN_PASSWORD)
const admin = await signIn(process.env.QA_ADMIN_EMAIL || TEAM.superAdmin.email, process.env.QA_ADMIN_PASSWORD || TEAM_PASSWORD);
const victim = await mk('victim');
await new Promise((r) => setTimeout(r, 1100));
check('the super admin suspends the account', (await api('/users/' + victim.userId, { method: 'PUT', token: admin.token, body: { isBanned: true } })).status === 200);
const suspended = await api('/wallet?userId=' + victim.userId, { token: victim.token });
check('a suspended account gets 403 ACCOUNT_SUSPENDED', suspended.status === 403 && suspended.body?.code === 'ACCOUNT_SUSPENDED', 'status ' + suspended.status);
await api('/users/' + victim.userId, { method: 'PUT', token: admin.token, body: { isBanned: false } });
check('after reinstatement the old token stays signed out', (await api('/wallet?userId=' + victim.userId, { token: victim.token })).status === 401);
check('and a new sign-in works', (await signIn(victim.email, victim.pw)).ok);

console.log('\n## The sign-in lockout lives in the database');
const locked = await mk('locked');
for (let i = 0; i < 5; i++) await api('/auth/login', { method: 'POST', body: { email: locked.email, password: 'Wrong#Pass9x' } });
check('five failures are counted in the shared table', (await num('select failures v from "LoginAttempt" where email=$1', [locked.email])) === 5);
const sixth = await api('/auth/login', { method: 'POST', body: { email: locked.email, password: locked.pw } });
check('the sixth try is locked even with the right password', sixth.status === 429, 'status ' + sixth.status);
await db.query(`update "LoginAttempt" set "windowStart"=(now() at time zone 'utc') - interval '16 minutes' where email=$1`, [locked.email]);
const later = await api('/auth/login', { method: 'POST', body: { email: locked.email, password: locked.pw } });
check('after the 15-minute window the right password works again', later.status === 200 && !!later.body?.userId, 'status ' + later.status);
check('a successful password step clears the counter', (await num('select count(*)::int v from "LoginAttempt" where email=$1', [locked.email])) === 0);

// ---------- Company money in members' wallets ----------
console.log('\n## Company money: spent first, monthly limit, returned when a member leaves');
const hr = await mk('fundsHr', 'HR_ADMIN', { companyName: 'QA Funds Co ' + run });
const companyId = (await db.query('select id from "Company" where "hrAdminId"=$1', [hr.userId])).rows[0]?.id;
const e1 = await mk('fundsE1');
const outsider = await mk('fundsOut');
await api(`/companies/${companyId}/employees`, { method: 'POST', token: hr.token, body: { email: e1.email } });
await api(`/companies/${companyId}/deposit`, { method: 'POST', token: hr.token, body: { amount: 1000 } });
const companyBalance = () => num('select balance v from "Company" where id=$1', [companyId]);
const walletRow = async () => (await db.query('select balance, "companyCredit" credit from "Wallet" where "userId"=$1', [e1.userId])).rows[0];
const wallet = (body) => api('/wallet', { method: 'POST', token: e1.token, body: { userId: e1.userId, ...body } });

await api(`/companies/${companyId}/allocate`, { method: 'POST', token: hr.token, body: { requestId: `req-${run}-funds1`, mode: 'SPECIFIC', allocations: [{ userId: e1.userId, amount: 300 }] } });
let w = await walletRow();
check('an allocation is held as company money', w?.balance === 300 && w?.credit === 300, JSON.stringify(w));
await wallet({ amount: 100, type: 'DEPOSIT', description: 'Own top-up' });
const cashTooMuch = await wallet({ amount: 150, type: 'WITHDRAW', description: 'Cash out' });
check('company money cannot be cashed out', cashTooMuch.status === 400 && cashTooMuch.body?.code === 'INSUFFICIENT_BALANCE', JSON.stringify(cashTooMuch.body));
check('own money can be cashed out', (await wallet({ amount: 50, type: 'WITHDRAW', description: 'Cash out' })).status === 201);
w = await walletRow();
check('cashing out left the company money untouched', w?.balance === 350 && w?.credit === 300, JSON.stringify(w));

check('an employee cannot read the members\' funds', (await api(`/companies/${companyId}/funds`, { token: e1.token })).status === 403);
check('an employee cannot set a limit', (await api(`/companies/${companyId}/funds`, { method: 'PUT', token: e1.token, body: { userId: e1.userId, monthlyLimit: 9999 } })).status === 403);
check('a negative limit is refused', (await api(`/companies/${companyId}/funds`, { method: 'PUT', token: hr.token, body: { userId: e1.userId, monthlyLimit: -5 } })).status === 400);
check('a limit for someone outside the team is refused', (await api(`/companies/${companyId}/funds`, { method: 'PUT', token: hr.token, body: { userId: outsider.userId, monthlyLimit: 50 } })).status === 404);
check('the HR admin sets a 120 SAR monthly limit', (await api(`/companies/${companyId}/funds`, { method: 'PUT', token: hr.token, body: { userId: e1.userId, monthlyLimit: 120 } })).status === 200);

const pay1 = await wallet({ amount: 100, type: 'WITHDRAW', description: 'Booking payment', referenceId: `pay1-${run}` });
check('a payment spends company money first', pay1.status === 201 && pay1.body?.transaction?.companyAmount === 100, JSON.stringify(pay1.body?.transaction));
const overLimit = await wallet({ amount: 80, type: 'WITHDRAW', description: 'Booking payment', referenceId: `pay2-${run}` });
check('past the limit the rest must come from own money (not enough: refused)', overLimit.status === 400 && overLimit.body?.code === 'COMPANY_SPEND_LIMIT', JSON.stringify(overLimit.body));
const pay3 = await wallet({ amount: 60, type: 'WITHDRAW', description: 'Booking payment', referenceId: `pay3-${run}` });
check('past the limit own money pays the rest', pay3.status === 201 && pay3.body?.transaction?.companyAmount === 20, JSON.stringify(pay3.body?.transaction));
w = await walletRow();
check('balances after the payments', w?.balance === 190 && w?.credit === 180, JSON.stringify(w));

const refund1 = await wallet({ amount: 100, type: 'REFUND', description: 'Refund', referenceId: `pay1-${run}:refund` });
w = await walletRow();
check('a refund of a company-funded payment returns as company money', refund1.status === 201 && w?.balance === 290 && w?.credit === 280, JSON.stringify(w));

const funds = await api(`/companies/${companyId}/funds`, { token: hr.token });
const row = (funds.body || []).find((r) => r.userId === e1.userId);
check('the HR admin sees unspent money, spending this month and the limit', row?.companyCredit === 280 && row?.spentThisMonth === 20 && row?.monthlyLimit === 120, JSON.stringify(row));
const own = await api('/wallet?userId=' + e1.userId, { token: e1.token });
check('the member sees the company money in their wallet', own.body?.companyCredit === 280 && own.body?.companySpendLimit === 120, JSON.stringify({ c: own.body?.companyCredit, l: own.body?.companySpendLimit }));

const removed = await api(`/companies/${companyId}/employees/${e1.userId}`, { method: 'DELETE', token: hr.token });
check('removing the member returns their unspent company money', removed.status === 200 && removed.body?.reclaimed === 280, JSON.stringify(removed.body));
w = await walletRow();
check('the member keeps only their own money', w?.balance === 10 && w?.credit === 0, JSON.stringify(w));
check('the company wallet got it back', (await companyBalance()) === 980, String(await companyBalance()));
check('both ledgers record the return', (await num(`select count(*)::int v from "WalletTransaction" where "userId"=$1 and type='RECLAIM' and "companyAmount"=280`, [e1.userId])) === 1
  && (await num(`select count(*)::int v from "CompanyWalletTransaction" where "companyId"=$1 and type='RECLAIM' and amount=280`, [companyId])) === 1);
check('the limit is cleared with the membership', (await num('select count(*)::int v from "User" where id=$1 and "companySpendLimit" is null', [e1.userId])) === 1);

const lateRefund = await wallet({ amount: 60, type: 'REFUND', description: 'Refund', referenceId: `pay3-${run}:refund` });
w = await walletRow();
check('a later refund sends the company-funded part back to the company', lateRefund.status === 201 && w?.balance === 50 && w?.credit === 0, JSON.stringify(w));
check('the company wallet is whole again', (await companyBalance()) === 1000, String(await companyBalance()));

// ---------- Fair use ----------
console.log('\n## "Unlimited*" plans: five sessions per person per week');
const planId = (await api('/membership-plans')).body?.find?.((p) => /business/i.test(p.planName))?.id
  || (await db.query(`select id v from "MembershipPlan" where "planName" ilike '%business%' limit 1`)).rows[0]?.v;
const fairHr = await mk('fairHr', 'HR_ADMIN', { companyName: 'QA Fair Co ' + run });
const fairCompany = (await db.query('select id from "Company" where "hrAdminId"=$1', [fairHr.userId])).rows[0]?.id;
const member = await mk('fairMember');
const individual = await mk('fairIndividual');
await api(`/companies/${fairCompany}/employees`, { method: 'POST', token: fairHr.token, body: { email: member.email } });
await db.query(`insert into "Subscription" (id, "userId", "planId", "startDate", "endDate", "visitsUsed", status)
  values (gen_random_uuid()::text, $1, $2, now() at time zone 'utc' - interval '1 day', now() at time zone 'utc' + interval '1500 days', 0, 'ACTIVE')`, [fairHr.userId, planId]);

const sec = (await db.query(`select s.id sid, w.id wid from "WorkspaceSection" s join "Workspace" w on w.id=s."workspaceId"
  where s.type='MEETING_ROOM' and w."is24Hours"=false and w."openingTime"='08:00' and w."closingTime"='22:00' and w."isVisible"=true and w."totalCapacity" >= 5 limit 1`)).rows[0];
// A Monday far ahead, so the Sunday-to-Saturday week is free of other bookings
const base = new Date(Date.now() + (900 + Math.floor(Math.random() * 300)) * 864e5);
base.setUTCDate(base.getUTCDate() + ((8 - base.getUTCDay()) % 7 || 7));
const dayStr = (d) => d.toISOString().slice(0, 10);
const weekDay = (offset) => dayStr(new Date(base.getTime() + offset * 864e5));
const [monday, tuesday, wednesday, thursday] = [0, 1, 2, 3].map(weekDay);
const nextMonday = weekDay(7);
const pad = (h) => String(h).padStart(2, '0');
// Meeting rooms are booked in fixed 2-hour sessions, one booking per room and session
const session = (u, day, start, attendeeIds) => api('/hourly-bookings', { method: 'POST', token: u.token, body: { workspaceId: sec.wid, sectionId: sec.sid, sectionType: 'MEETING_ROOM', startDate: day, endDate: day, startTime: `${pad(start)}:00`, endTime: `${pad(start + 2)}:00`, durationHours: 2, ...(attendeeIds ? { attendeeIds } : {}) } });
const slots = [8, 10, 12, 14, 16];

let okCount = 0;
for (const h of slots) if ((await session(fairHr, monday, h)).status === 201) okCount++;
check('five sessions in one week are allowed', okCount === 5, `${okCount}/5`);
const sixthSession = await session(fairHr, monday, 18);
check('the sixth in the same week is refused (FAIR_USE_LIMIT)', sixthSession.status === 409 && sixthSession.body?.code === 'FAIR_USE_LIMIT' && /you already have 5 bookings/.test(sixthSession.body?.error || ''), JSON.stringify(sixthSession.body));
const nextWeekSession = await session(fairHr, nextMonday, 8);
check('a session the next week is allowed', nextWeekSession.status === 201, JSON.stringify(nextWeekSession.body));

let forMember = 0;
for (const h of slots) if ((await session(fairHr, tuesday, h, [member.userId])).status === 201) forMember++;
check('the HR admin books five sessions for a member (they count against the member)', forMember === 5, `${forMember}/5`);
const memberSixth = await session(fairHr, tuesday, 18, [member.userId]);
check('a sixth for that member is refused and names them', memberSixth.status === 409 && memberSixth.body?.error?.includes('QA fairMember already has 5 bookings'), JSON.stringify(memberSixth.body));
const memberOwn = await session(member, wednesday, 8);
check('the member cannot add a sixth of their own either', memberOwn.status === 409 && memberOwn.body?.code === 'FAIR_USE_LIMIT', 'status ' + memberOwn.status);

const moveBack = await api(`/hourly-bookings/${nextWeekSession.body?.id}/reschedule`, { method: 'POST', token: fairHr.token, body: { startDate: monday, startTime: '20:00' } });
check('moving a session into a full week is refused', moveBack.status === 409 && moveBack.body?.code === 'FAIR_USE_LIMIT', JSON.stringify(moveBack.body));

let plain = 0;
for (const h of [...slots, 18]) if ((await session(individual, thursday, h)).status === 201) plain++;
check('people without an unlimited plan are not limited', plain === 6, `${plain}/6`);

await db.query(`delete from "HourlyBooking" where "userId" = any($1)`, [[fairHr.userId, member.userId, individual.userId]]);
await db.end();
summary();
