import { api, db, makeUser, check, summary } from './lib.mjs';
await db.connect();
const run = Date.now().toString(36);
const loginAs = async (email, pw) => {
  const l = await api('/auth/login', { method: 'POST', body: { email, password: pw } });
  const v = await api('/auth/verify-login', { method: 'POST', body: { userId: l.body.userId, code: '123456' } });
  return { token: v.body?.token, userId: l.body.userId };
};
const mk = (n, role = 'B2C', x = {}) => makeUser('QA ' + n, `qa.${n}.${run}@test.local`.toLowerCase(), role, x);
const admin = await loginAs('admin@coworkingpass.sa', 'password');
const c = await mk('cust'), c2 = await mk('cust2');
const denied = (r) => r.status === 401 || r.status === 403;

// Fixtures are created fresh in the database so the suite never depends on earlier runs
const planId = (await db.query(
  `insert into "MembershipPlan" (id,"planName",type,"totalVisitsAllowed",price) values (gen_random_uuid(), $1, 'B2C', 10, 100) returning id`,
  ['QA plan ' + run])).rows[0].id;
const ruleId = (await db.query(
  `insert into "LoyaltyRule" (id,"ruleName","ruleType","pointsValue","monetaryValue",status,"proposedBy","isActive") values (gen_random_uuid(), $1, 'EARNING', 10, 1, 'APPROVED', $2, true) returning id`,
  ['QA rule ' + run, admin.userId])).rows[0].id;
const amenId = (await db.query(
  `insert into "AmenityCatalog" (id,name,"isDefault",status) values (gen_random_uuid(), $1, true, 'APPROVED') returning id`,
  ['QA amenity ' + run])).rows[0].id;
const hallSec = (await db.query(`select id from "WorkspaceSection" where type='MEETING_ROOM' limit 1`)).rows[0].id;
const pk = (await db.query(
  `insert into "HourlyPackage" (id,"sectionId","packageName","hoursAmount","periodType",price) values (gen_random_uuid(), $1, 'QA pkg', 2, 'PER_DAY', 100) returning id, "sectionId"`,
  [hallSec])).rows[0];

console.log('\n## Admin-only configuration (a customer must be refused)');
check('customer cannot edit a membership plan price', denied(await api('/membership-plans/' + planId, { method: 'PUT', token: c.token, body: { price: 1 } })));
check('customer cannot delete a membership plan', denied(await api('/membership-plans/' + planId, { method: 'DELETE', token: c.token })));
check('customer cannot create a membership plan', denied(await api('/membership-plans', { method: 'POST', token: c.token, body: { planName: 'Free ' + run, type: 'B2C', totalVisitsAllowed: 999, price: 0 } })));
check('customer cannot approve/edit a loyalty rule', denied(await api('/loyalty-rules/' + ruleId, { method: 'PUT', token: c.token, body: { status: 'APPROVED' } })));
check('customer cannot delete a loyalty rule', denied(await api('/loyalty-rules/' + ruleId, { method: 'DELETE', token: c.token })));
check('customer cannot create a loyalty rule', denied(await api('/loyalty-rules', { method: 'POST', token: c.token, body: { ruleName: 'x', ruleType: 'EARNING', pointsValue: 1000, monetaryValue: 1, proposedBy: c.userId } })));
check('customer cannot edit an amenity', denied(await api('/amenities/' + amenId, { method: 'PUT', token: c.token, body: { name: 'HACKED' } })));
check('customer cannot delete an amenity', denied(await api('/amenities/' + amenId, { method: 'DELETE', token: c.token })));
check('customer cannot create an amenity', denied(await api('/amenities', { method: 'POST', token: c.token, body: { name: 'Spam ' + run } })));
check('fixtures untouched by the refused calls', Number((await db.query(
  `select (select count(*) from "MembershipPlan" where id=$1)+(select count(*) from "LoyaltyRule" where id=$2)+(select count(*) from "AmenityCatalog" where id=$3) n`,
  [planId, ruleId, amenId])).rows[0].n) === 3);
check('admin can edit a membership plan', (await api('/membership-plans/' + planId, { method: 'PUT', token: admin.token, body: { price: 120 } })).status < 300);

console.log('\n## Partner loyalty proposals cannot self-approve');
const prov = await mk('provl', 'PARTNER_ADMIN', { businessName: 'QA LV ' + run, crNumber: '1010777777' });
const pid = (await db.query(`select id from "Partner" where lower("contactEmail")=lower($1)`, [prov.email])).rows[0].id;
await api('/partners/' + pid, { method: 'PUT', token: admin.token, body: { status: 'APPROVED' } });
const P = await loginAs(prov.email, prov.pw);
const prop = await api('/loyalty-rules', { method: 'POST', token: P.token, body: { ruleName: 'QA proposal', ruleType: 'EARNING', pointsValue: 5, monetaryValue: 1, proposedBy: admin.userId, status: 'APPROVED' } });
check('partner can propose a rule', prop.status === 201, 'status ' + prop.status);
check('proposal is attributed to the partner and stays pending', prop.body?.proposedBy === P.userId && prop.body?.status === 'PENDING_APPROVAL' && prop.body?.isActive === false, JSON.stringify({ by: prop.body?.proposedBy === P.userId, st: prop.body?.status }));
check('partner cannot approve their own proposal', denied(await api('/loyalty-rules/' + prop.body?.id, { method: 'PUT', token: P.token, body: { status: 'APPROVED' } })));
check('partner cannot delete rules they did not propose', denied(await api('/loyalty-rules/' + ruleId, { method: 'DELETE', token: P.token })));
check('partner can withdraw their own proposal', (await api('/loyalty-rules/' + prop.body?.id, { method: 'DELETE', token: P.token })).status === 200);

console.log('\n## Hourly packages (pricing) belong to the venue owner');
check('customer cannot change a package price', denied(await api('/hourly-packages/' + pk.id, { method: 'PUT', token: c.token, body: { price: 1 } })));
check('customer cannot delete a package', denied(await api('/hourly-packages/' + pk.id, { method: 'DELETE', token: c.token })));
check('customer cannot create a package', denied(await api('/hourly-packages', { method: 'POST', token: c.token, body: { sectionId: pk.sectionId, packageName: 'x', hoursAmount: 2, price: 1, periodType: 'PER_DAY' } })));
check('unrelated partner cannot change a package', denied(await api('/hourly-packages/' + pk.id, { method: 'PUT', token: P.token, body: { price: 1 } })));
check('package price unchanged', Number((await db.query('select price from "HourlyPackage" where id=$1', [pk.id])).rows[0].price) === 100);
check('admin can change a package', (await api('/hourly-packages/' + pk.id, { method: 'PUT', token: admin.token, body: { price: 110, sectionId: 'ignored' } })).status < 300);
check('package cannot be moved to another section via PUT', (await db.query('select "sectionId" from "HourlyPackage" where id=$1', [pk.id])).rows[0].sectionId === pk.sectionId);

console.log('\n## Payment records');
const pay = await api('/payments', { method: 'POST', token: c.token, body: { amount: 120, method: 'VISA', paymentFor: 'DIRECT_BOOKING' } });
const payId = pay.body?.id;
check('customer created a payment record', pay.status === 201 && !!payId);
check('customer cannot edit a payment amount/status', denied(await api('/payments/' + payId, { method: 'PUT', token: c.token, body: { amount: 1, status: 'FAILED' } })));
check('customer cannot delete a payment', denied(await api('/payments/' + payId, { method: 'DELETE', token: c.token })));
check('another customer cannot read my payment', denied(await api('/payments/' + payId, { token: c2.token })));
check('owner can read own payment', (await api('/payments/' + payId, { token: c.token })).status === 200);
check('admin can read any payment', (await api('/payments/' + payId, { token: admin.token })).status === 200);
const gw = await api('/payment-gateway/refund', { method: 'POST', token: c2.token, body: { transactionId: 'TX-1', amount: 120, userId: c.userId } });
check('gateway refund refuses requests for someone else\'s payment', denied(gw), 'status ' + gw.status);
check('admin can delete a payment', (await api('/payments/' + payId, { method: 'DELETE', token: admin.token })).status < 300);

console.log('\n## Waitlist & ticket replies');
const ws = (await db.query(`select id from "Workspace" limit 1`)).rows[0].id;
const wsec = (await db.query('select id from "WorkspaceSection" where "workspaceId"=$1 limit 1', [ws])).rows[0].id;
const wl = await api('/waitlist', { method: 'POST', token: c.token, body: { userId: c2.userId, workspaceId: ws, sectionId: wsec, durationType: 'DAILY', bookingDate: '2030-01-01' } });
const wlId = wl.body?.id;
check('customer joins a waitlist', wl.status === 201, 'status ' + wl.status);
check('waitlist entry belongs to the caller, not the userId in the body', wl.body?.userId === c.userId);
check('another customer cannot remove my waitlist entry', denied(await api('/waitlist/' + wlId, { method: 'DELETE', token: c2.token })));
check('owner can leave the waitlist', (await api('/waitlist/' + wlId, { method: 'DELETE', token: c.token })).status < 300);
const booking = (await db.query(
  `insert into "DirectBooking" (id,"userId","workspaceId","sectionId","durationType","bookingDate",status,seats,"createdAt") values (gen_random_uuid(), $1, $2, $3, 'DAILY', now(), 'CONFIRMED', 1, now()) returning id`,
  [c.userId, ws, wsec])).rows[0].id;
check('confirmed booking cannot be deleted through the waitlist endpoint', (await api('/waitlist/' + booking, { method: 'DELETE', token: c.token })).status === 400);
check('stranger cannot delete a booking through the waitlist endpoint', denied(await api('/waitlist/' + booking, { method: 'DELETE', token: c2.token })));
check('booking still exists', Number((await db.query('select count(*) n from "DirectBooking" where id=$1', [booking])).rows[0].n) === 1);
const mine = await api('/waitlist', { token: c2.token });
check('waitlist list is scoped to the caller', mine.status === 200 && mine.body.every(x => x.userId === c2.userId));

summary(); await db.end();
