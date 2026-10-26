// Single-record access: a booking or payment is only visible to (and changeable by) its customer,
// a super admin, or the partner that owns the workspace. Other customers and unrelated partners are refused.
import { api, db, makeUser, check, summary, plantOtp } from './lib.mjs';
await db.connect();
const run = Date.now().toString(36);
const mk = (n, role = 'B2C', extra = {}) => makeUser('QA ' + n, `qa.${n}.${run}@test.local`.toLowerCase(), role, extra);
const refused = (r) => r.status === 401 || r.status === 403 || r.status === 404;

const owner = await mk('ownA');
const other = await mk('ownB');

// An approved partner that owns no workspace in this test
const strangerReg = await mk('ownP', 'PARTNER_ADMIN', { businessName: 'QA Stranger ' + run, crNumber: '1010777777' });
await db.query(`update "Partner" set status='APPROVED' where lower("contactEmail")=lower($1)`, [strangerReg.email]);
const stranger = await (async () => {
  const login = await api('/auth/login', { method: 'POST', body: { email: strangerReg.email, password: strangerReg.pw } });
  const stId = login.body?.userId || strangerReg.userId;
  const v = await api('/auth/verify-login', { method: 'POST', body: { userId: stId, code: await plantOtp(stId, 'LOGIN') } });
  return { ...strangerReg, token: v.body?.token };
})();
check('unrelated partner can sign in', !!stranger.token);

const sec = (await db.query(`select s.id sid, w.id wid from "WorkspaceSection" s join "Workspace" w on w.id=s."workspaceId" where s.type='MEETING_ROOM' and w."is24Hours"=false and w."openingTime"='08:00' and w."closingTime"='22:00' limit 1`)).rows[0];
const day = new Date(Date.now() + (30 + Math.floor(Math.random() * 600)) * 864e5).toISOString().slice(0, 10);

console.log('\n## Hourly booking');
const hb = await api('/hourly-bookings', { method: 'POST', token: owner.token, body: { workspaceId: sec.wid, sectionId: sec.sid, sectionType: 'MEETING_ROOM', startDate: day, endDate: day, startTime: '14:00', endTime: '16:00', durationHours: 2 } });
check('customer books a hall', hb.status === 201, 'status ' + hb.status);
const hid = hb.body?.id;
check('the customer can read their booking', (await api('/hourly-bookings/' + hid, { token: owner.token })).status === 200);
check("another customer cannot read it", refused(await api('/hourly-bookings/' + hid, { token: other.token })));
check("another customer cannot change it", refused(await api('/hourly-bookings/' + hid, { method: 'PUT', token: other.token, body: { status: 'CANCELLED' } })));
check("another customer cannot delete it", refused(await api('/hourly-bookings/' + hid, { method: 'DELETE', token: other.token })));
check("an unrelated partner cannot read it", refused(await api('/hourly-bookings/' + hid, { token: stranger.token })));
check("an unrelated partner cannot change it", refused(await api('/hourly-bookings/' + hid, { method: 'PUT', token: stranger.token, body: { status: 'CANCELLED' } })));
check('the booking still exists and is active', (await db.query('select status from "HourlyBooking" where id=$1', [hid])).rows[0]?.status === 'ACTIVE');

console.log('\n## Payment');
const pay = await api('/payments', { method: 'POST', token: owner.token, body: { amount: 150, method: 'MADA', paymentFor: 'HOURLY_BOOKING', referenceId: hid, workspaceId: sec.wid } });
check('customer records a payment', pay.status === 201, 'status ' + pay.status);
const pid = pay.body?.id || pay.body?.payment?.id;
check('the customer can read their payment', (await api('/payments/' + pid, { token: owner.token })).status === 200);
check('another customer cannot read it', refused(await api('/payments/' + pid, { token: other.token })));
check('an unrelated partner cannot read it', refused(await api('/payments/' + pid, { token: stranger.token })));
const strangerList = (await api('/payments', { token: stranger.token })).body || [];
check("an unrelated partner's payment list excludes it", Array.isArray(strangerList) && !strangerList.some((p) => p.id === pid));

console.log('\n## Subscriptions');
const subs = await api('/subscriptions', { token: stranger.token });
check("a partner's subscription list holds no other users' passes", subs.status === 200 && (subs.body || []).every((s) => s.userId === stranger.userId));

await db.end();
summary();
