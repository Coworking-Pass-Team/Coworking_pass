import { api, db, makeUser, check, summary, removeWorkspaces, signIn, TEAM, TEAM_PASSWORD } from './lib.mjs';
await db.connect();
const run = Date.now().toString(36);
const loginAs = async (email, pw) => {
  const r = await signIn(email, pw);
  if (!r.userId) return { l: r.login };
  return { token: r.token, userId: r.userId, l: r.login };
};
const mk = (n, role = 'B2C', x = {}) => makeUser('QA ' + n, `qa.${n}.${run}@test.local`.toLowerCase(), role, x);
const day = () => new Date(Date.now() + (20 + Math.floor(Math.random() * 600)) * 864e5).toISOString().slice(0, 10);

// Seeded super admin: docs/Accounts.md and scripts/team-accounts.json (override with QA_ADMIN_EMAIL / QA_ADMIN_PASSWORD)
const admin = await loginAs(process.env.QA_ADMIN_EMAIL || TEAM.superAdmin.email, process.env.QA_ADMIN_PASSWORD || TEAM_PASSWORD);
check('seeded super admin can sign in locally', !!admin.token);

// ---------- Provider onboarding & moderation ----------
console.log('\n## Provider onboarding');
const provA = await mk('provA', 'PARTNER_ADMIN', { businessName: 'QA Venue A ' + run, crNumber: '1010123456' });
const provB = await mk('provB', 'PARTNER_ADMIN', { businessName: 'QA Venue B ' + run, crNumber: '1010654321' });
check('pending provider cannot sign in', provA.login.status === 403 && provA.login.body?.code === 'PARTNER_PENDING_APPROVAL', 'status ' + provA.login.status);
const pA = (await db.query(`select id from "Partner" where lower("contactEmail")=lower($1)`, [provA.email])).rows[0].id;
const pB = (await db.query(`select id from "Partner" where lower("contactEmail")=lower($1)`, [provB.email])).rows[0].id;
const ind = await mk('ind');
check('B2C cannot approve a partner', (await api('/partners/' + pA, { method: 'PUT', token: ind.token, body: { status: 'APPROVED' } })).status === 403);
check('admin approves provider A', (await api('/partners/' + pA, { method: 'PUT', token: admin.token, body: { status: 'APPROVED' } })).status === 200);
check('admin rejects provider B', (await api('/partners/' + pB, { method: 'PUT', token: admin.token, body: { status: 'REJECTED', rejectionReason: 'QA' } })).status === 200);
const A = await loginAs(provA.email, provA.pw);
check('approved provider can sign in', !!A.token);
const rejected = await loginAs(provB.email, provB.pw);
check('rejected provider cannot sign in', !rejected.token && rejected.l.status === 403 && rejected.l.body?.code === 'PARTNER_REJECTED', 'status ' + rejected.l.status);

// ---------- Provider workspace management ----------
console.log('\n## Provider workspaces');
const wsBody = (n) => ({ name: n, city: 'Riyadh', dailyRate: 100, monthlyRate: 1500, totalCapacity: 20, openingTime: '08:00', closingTime: '22:00', amenities: ['WiFi'] });
check('B2C cannot add a workspace', (await api('/workspaces', { method: 'POST', token: ind.token, body: wsBody('Nope ' + run) })).status === 403);
const hrTmp = await mk('hrtmp', 'HR_ADMIN', { companyName: 'Tmp ' + run });
check('HR admin cannot add a workspace', (await api('/workspaces', { method: 'POST', token: hrTmp.token, body: wsBody('Nope2 ' + run) })).status === 403);
const created = await api('/workspaces', { method: 'POST', token: A.token, body: wsBody('QA Space A ' + run) });
check('approved provider creates a workspace', created.status === 201, 'status ' + created.status);
const wsA = created.body?.id || created.body?.workspace?.id;
const owner = wsA ? (await db.query('select "partnerId" from "Workspace" where id=$1', [wsA])).rows[0]?.partnerId : null;
check('workspace is owned by the provider\'s own partner', owner === pA, `owner=${owner}`);
const other = await api('/workspaces', { method: 'POST', token: A.token, body: { ...wsBody('QA Hijack ' + run), partnerId: '9d383cda-8646-4e33-bdde-e18f567ff38b' } });
const otherOwner = (other.body?.id || other.body?.workspace?.id) ? (await db.query('select "partnerId" from "Workspace" where id=$1', [other.body?.id || other.body?.workspace?.id])).rows[0]?.partnerId : null;
check('provider cannot create a workspace under another partner', other.status === 403 || (otherOwner && otherOwner === pA), `status ${other.status} owner=${otherOwner}`);
const provC = await mk('provC', 'PARTNER_ADMIN', { businessName: 'QA Venue C ' + run, crNumber: '1010999999' });
const pC = (await db.query(`select id from "Partner" where lower("contactEmail")=lower($1)`, [provC.email])).rows[0].id;
await api('/partners/' + pC, { method: 'PUT', token: admin.token, body: { status: 'APPROVED' } });
const C = await loginAs(provC.email, provC.pw);
const edit = await api('/workspaces/' + wsA, { method: 'PUT', token: C.token, body: { name: 'HACKED ' + run } });
check('other provider cannot edit my workspace', edit.status === 403 || edit.status === 404, 'status ' + edit.status);
const editOwn = await api('/workspaces/' + wsA, { method: 'PUT', token: A.token, body: { name: 'QA Space A edited ' + run, dailyRate: 120 } });
check('provider edits own workspace (rates)', editOwn.status === 200, 'status ' + editOwn.status);
const delOther = await api('/workspaces/' + wsA, { method: 'DELETE', token: C.token });
check('other provider cannot delete my workspace', delOther.status === 403 || delOther.status === 404, 'status ' + delOther.status);

// ---------- Hall configuration, bookings visibility, QR ----------
console.log('\n## Halls, bookings visibility, QR check-in');
const sec = await api('/workspace-sections', { method: 'POST', token: A.token, body: { workspaceId: wsA, type: 'MEETING_ROOM', name: 'Hall 1', capacity: 30, dailyRate: 400 } });
check('provider adds a hall with capacity', sec.status === 201, 'status ' + sec.status + ' ' + (sec.body?.error || ''));
const secId = sec.body?.id || sec.body?.section?.id;
const secOther = await api('/workspace-sections', { method: 'POST', token: C.token, body: { workspaceId: wsA, type: 'THEATER', name: 'Sneaky', capacity: 5 } });
check('other provider cannot add a hall to my workspace', secOther.status === 403 || secOther.status === 404, 'status ' + secOther.status);
const d = day();
const bk = await api('/hourly-bookings', { method: 'POST', token: ind.token, body: { workspaceId: wsA, sectionId: secId, sectionType: 'MEETING_ROOM', startDate: d, endDate: d, startTime: '10:00', endTime: '12:00', durationHours: 2 } });
check('customer books the provider\'s hall', bk.status === 201, 'status ' + bk.status + ' ' + (bk.body?.error || ''));
const seenA = await api('/hourly-bookings', { token: A.token });
check('provider sees bookings of own workspace', seenA.status === 200 && seenA.body.some(b => b.id === bk.body?.id));
const seenC = await api('/hourly-bookings', { token: C.token });
check('other provider does not see them', seenC.status === 200 && !seenC.body.some(b => b.id === bk.body?.id));
const qr0 = await api('/qr-check-ins', { token: A.token });
const n0 = (qr0.body || []).filter(x => x.workspaceId === wsA).length;
// A check-in is only valid with a booking for this venue right now (a future booking does not count)
const early = await api('/qr-check-ins', { method: 'POST', token: ind.token, body: { workspaceId: wsA, sectionId: secId } });
check('customer without a booking for today is refused at check-in', early.status === 403 && early.body?.code === 'NO_ACTIVE_BOOKING', 'status ' + early.status);
const todayKsa = () => { const t = new Date(Date.now() + 3 * 3600000); return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), 9)); };
const bookToday = (userId) => db.query(
  `insert into "DirectBooking" (id,"userId","workspaceId","sectionId","durationType","durationDetails","bookingDate",seats,status) values (gen_random_uuid(),$1,$2,$3,'DAILY','1 Days',$4,1,'CONFIRMED')`,
  [userId, wsA, secId, todayKsa()]
);
await bookToday(ind.userId);
const scan = await api('/qr-check-ins', { method: 'POST', token: ind.token, body: { workspaceId: wsA, sectionId: secId } });
check('customer QR scan recorded', scan.status === 201, 'status ' + scan.status);
const qr1 = await api('/qr-check-ins', { token: A.token });
check('provider "QR check-ins" count increments', (qr1.body || []).filter(x => x.workspaceId === wsA).length === n0 + 1);
const qrC = await api('/qr-check-ins', { token: C.token });
check('other provider cannot see my check-ins', !(qrC.body || []).some(x => x.workspaceId === wsA));

// The partner scanner: staff record a check-in for the customer whose QR they scanned
const walkIn = await mk('walkin');
check('provider cannot check in a customer without a booking', (await api('/qr-check-ins', { method: 'POST', token: A.token, body: { userId: walkIn.userId, workspaceId: wsA, sectionId: secId } })).status === 403);
await bookToday(walkIn.userId);
const staffScan = await api('/qr-check-ins', { method: 'POST', token: A.token, body: { userId: walkIn.userId, workspaceId: wsA, sectionId: secId } });
check('provider scans a customer QR at their own venue', staffScan.status === 201 && staffScan.body?.userId === walkIn.userId, 'status ' + staffScan.status);
const qr2 = await api('/qr-check-ins', { token: A.token });
check('"QR Check-ins Today" counts the scanned customer', (qr2.body || []).filter(x => x.workspaceId === wsA).length === n0 + 2);
check('other provider cannot scan customers into my venue', (await api('/qr-check-ins', { method: 'POST', token: C.token, body: { userId: walkIn.userId, workspaceId: wsA, sectionId: secId } })).status === 403);
check('a customer cannot check in somebody else', (await api('/qr-check-ins', { method: 'POST', token: ind.token, body: { userId: walkIn.userId, workspaceId: wsA, sectionId: secId } })).status === 403);
const summaryRes = await api('/qr-check-ins?summary=today');
check('public "check-ins today" counters need no sign-in', summaryRes.status === 200 && (summaryRes.body?.counts?.[wsA] ?? 0) >= 2, 'status ' + summaryRes.status + ' count=' + summaryRes.body?.counts?.[wsA]);
check('the public counters expose no personal data', !/email|userId|name/i.test(JSON.stringify(summaryRes.body)));
check('anonymous check-in refused', (await api('/qr-check-ins', { method: 'POST', body: { userId: walkIn.userId, workspaceId: wsA, sectionId: secId } })).status === 401);

// ---------- HR admin ----------
console.log('\n## HR admin');
const hr = await mk('hr', 'HR_ADMIN', { companyName: 'QA Corp ' + run });
const hr2 = await mk('hr2', 'HR_ADMIN', { companyName: 'QA Corp2 ' + run });
const cid = (await db.query('select id from "Company" where "hrAdminId"=$1', [hr.userId])).rows[0].id;
const cid2 = (await db.query('select id from "Company" where "hrAdminId"=$1', [hr2.userId])).rows[0].id;
const emp = await mk('emp', 'B2C', { companyId: cid });
await db.query('update "User" set "companyId"=$1 where id=$2', [cid, emp.userId]);
const outsider = await mk('outsider');
const hrCo = await api('/companies', { token: hr.token });
check('HR sees only own company', hrCo.status === 200 && hrCo.body.length === 1 && hrCo.body[0].id === cid, 'n=' + hrCo.body?.length);
check('HR company list has no credential hashes', !/passwordHash|\$2[aby]\$/.test(JSON.stringify(hrCo.body)));
check('employee can read own company', (await api('/companies/' + cid, { token: emp.token })).status === 200);
check('HR cannot read another company', (await api('/companies/' + cid2, { token: hr.token })).status === 403);
check('outsider cannot read a company', (await api('/companies/' + cid, { token: outsider.token })).status === 403);
const hack = await api('/companies', { method: 'POST', token: outsider.token, body: { companyName: 'HACKED', hrAdminId: hr.userId, totalPassesAllocated: 9999 } });
check('B2C cannot rename/alter a company', hack.status === 403, 'status ' + hack.status);
const selfAlloc = await api('/companies', { method: 'POST', token: hr.token, body: { companyName: 'QA Corp renamed ' + run, hrAdminId: hr.userId, totalPassesAllocated: 9999 } });
const alloc = Number((await db.query('select "totalPassesAllocated" n from "Company" where id=$1', [cid])).rows[0].n);
check('HR cannot self-assign pass allocation via create/update', selfAlloc.status < 300 && alloc !== 9999, `status ${selfAlloc.status} alloc=${alloc}`);
check('HR cannot change another company', (await api('/companies', { method: 'POST', token: hr.token, body: { companyName: 'X', hrAdminId: hr2.userId } })).status === 403);
const wsId = (await db.query(`select s.id sid, w.id wid from "WorkspaceSection" s join "Workspace" w on w.id=s."workspaceId" where s.type='DESK' limit 1`)).rows[0];
const dbk = await api('/direct-bookings', { method: 'POST', token: emp.token, body: { workspaceId: wsId.wid, sectionId: wsId.sid, durationType: 'DAILY', bookingDate: day(), seats: 1 } });
check('employee books a desk', dbk.status === 201, 'status ' + dbk.status + ' ' + (dbk.body?.error || ''));
const hb = await api('/hourly-bookings', { token: hr.token });
check('HR hourly bookings view excludes non-team users', hb.status === 200 && !hb.body.some(b => b.userId === outsider.userId));

// ---------- Loyalty points ----------
console.log('\n## Loyalty points');
const pt = await mk('pts');
const ptsPost = (t, b) => api('/points-transactions', { method: 'POST', token: t, body: b });
check('anonymous cannot post points', (await ptsPost(undefined, { userId: pt.userId, type: 'EARNED', points: 500 })).status === 401);
check('anonymous cannot list loyalty balances', (await api('/loyalty-points')).status === 401);
check('earning without a booking reference rejected', (await ptsPost(pt.token, { userId: pt.userId, type: 'EARNED', points: 500 })).status === 400);
check('earning for someone else\'s booking rejected', (await ptsPost(pt.token, { userId: pt.userId, type: 'EARNED', points: 50, referenceId: bk.body?.id })).status === 403);
const ptBk = await api('/hourly-bookings', { method: 'POST', token: pt.token, body: { workspaceId: wsA, sectionId: secId, sectionType: 'MEETING_ROOM', startDate: d, endDate: d, startTime: '14:00', endTime: '16:00', durationHours: 2 } });
check('earn points for own booking', (await ptsPost(pt.token, { userId: pt.userId, type: 'EARNED', points: 50, referenceId: ptBk.body?.id })).status === 201);
check('same booking cannot earn twice', (await ptsPost(pt.token, { userId: pt.userId, type: 'EARNED', points: 50, referenceId: ptBk.body?.id })).status === 409);
check('negative points rejected', (await ptsPost(pt.token, { userId: pt.userId, type: 'REDEEMED', points: -100 })).status === 400);
check('unknown type rejected', (await ptsPost(pt.token, { userId: pt.userId, type: 'MINT', points: 100 })).status === 400);
const other2 = await mk('pts2');
await ptsPost(pt.token, { userId: other2.userId, type: 'REDEEMED', points: 10 });
const mine = await api('/loyalty-points', { token: pt.token });
check('loyalty list is scoped to the caller', mine.status === 200 && mine.body.every(x => x.userId === pt.userId));
const spy = await api('/loyalty-points?userId=' + other2.userId, { token: pt.token });
check('cannot read another user\'s loyalty balance', spy.status === 200 && spy.body.every(x => x.userId === pt.userId));
const hist = await api('/points-transactions', { token: pt.token });
check('points history scoped to the caller', hist.status === 200 && hist.body.every(x => x.userId === pt.userId));
const before = Number((await db.query('select "availableBalance" n from "LoyaltyPoint" where "userId"=$1', [pt.userId])).rows[0].n);
const par = await Promise.all(Array.from({ length: 6 }, () => ptsPost(pt.token, { userId: pt.userId, type: 'REDEEMED', points: before })));
const bal = Number((await db.query('select "availableBalance" n from "LoyaltyPoint" where "userId"=$1', [pt.userId])).rows[0].n);
check('6 concurrent full redemptions -> redeemed once, never negative', par.filter(r => r.status === 201).length === 1 && bal === 0, `ok=${par.filter(r => r.status === 201).length} bal=${bal}`);

// ---------- Partner data privacy ----------
console.log('\n## Partner & platform privacy');
const pubList = await api('/partners', { token: ind.token });
check('customers see no partner tax numbers / emails', pubList.status === 200 && !/taxNumber|contactEmail|revenueShare/.test(JSON.stringify(pubList.body)));
check('B2C cannot create partners', (await api('/partners', { method: 'POST', token: ind.token, body: { brandName: 'Evil', contactEmail: 'evil@x.com', taxNumber: '1', revenueSharePercentage: 0 } })).status === 403);
const ownList = await api('/partners', { token: A.token });
check('provider sees only their own partner record', ownList.status === 200 && ownList.body.length === 1 && ownList.body[0].id === pA);
const adminList = await api('/partners', { token: admin.token });
check('admin sees full partner records', adminList.status === 200 && adminList.body.length >= 3 && 'taxNumber' in adminList.body[0]);

// ---------- Admin portal ----------
console.log('\n## Admin portal');
const rep = await api('/admin/reports', { token: admin.token });
check('admin reports return metrics', rep.status === 200 && ['revenue', 'totalBookings', 'activeBookings'].every(k => k in rep.body), Object.keys(rep.body || {}).slice(0, 8).join(','));
const st = await api('/stats', { token: admin.token });
check('admin stats return counters', st.status === 200 && ['totalUsers', 'activeBookings', 'totalWorkspaces', 'totalRevenue'].every(k => k in st.body));
for (const [who, t] of [['B2C', ind.token], ['HR', hr.token], ['provider', A.token]]) {
  check(`${who} blocked from admin reports`, (await api('/admin/reports', { token: t })).status === 403);
  check(`${who} blocked from platform stats`, (await api('/stats', { token: t })).status === 403);
  check(`${who} blocked from user directory`, [401, 403].includes((await api('/users', { token: t })).status));
}
const users = await api('/users', { token: admin.token });
check('admin user list excludes credential hashes', users.status === 200 && !/passwordHash|\$2[aby]\$/.test(JSON.stringify(users.body)));
const allPay = await api('/payments', { token: admin.token });
check('admin can read all payments', allPay.status === 200 && Array.isArray(allPay.body));
const ban = await api('/users/' + outsider.userId, { method: 'PUT', token: admin.token, body: { isBanned: true } });
check('admin suspends a user', ban.status === 200);
const banned = await api('/wallet?userId=' + outsider.userId, { token: outsider.token });
check('suspended user gets 403 ACCOUNT_SUSPENDED', banned.status === 403 && banned.body?.code === 'ACCOUNT_SUSPENDED', 'status ' + banned.status);
check('B2C cannot suspend users', (await api('/users/' + hr.userId, { method: 'PUT', token: ind.token, body: { isBanned: true } })).status === 403);

await removeWorkspaces([wsA, other.body?.id || other.body?.workspace?.id]);
summary(); await db.end();
