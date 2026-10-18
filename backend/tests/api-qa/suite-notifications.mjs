import { api, db, makeUser, check, summary } from './lib.mjs';
await db.connect();
const run = Date.now().toString(36);
const mk = (n, role = 'B2C') => makeUser('QA ' + n, `qa.${n}.${run}@test.local`.toLowerCase(), role);
const a = await mk('ntfA'), b = await mk('ntfB');
const denied = (r) => r.status === 401 || r.status === 403;
const post = (u, body) => api('/notifications', { method: 'POST', token: u.token, body: { userId: u.userId, channel: 'IN_APP', ...body } });
const mine = async (u) => (await api('/notifications', { token: u.token })).body || [];

console.log('\n## Creating and reading');
check('guests cannot read notifications', denied(await api('/notifications')));
check('an unknown type is a 400, not a server error', (await post(a, { type: 'NOT_A_TYPE', title: 'x', message: 'y' })).status === 400);
const n1 = await post(a, { type: 'BOOKING_CONFIRMED', title: 'One', message: 'first' });
const n2 = await post(a, { type: 'PAYMENT_SUCCESS', title: 'Two', message: 'second' });
const n3 = await post(a, { type: 'PASS_EXPIRING', title: 'Three', message: 'third' });
check('a member can create their own notifications', [n1, n2, n3].every((r) => r.status === 201));
check('a member sees only their own notifications', (await mine(a)).length >= 3 && (await mine(b)).length === 0);

console.log('\n## Read state');
check('mark one as read', (await api('/notifications', { method: 'PUT', token: a.token, body: { id: n1.body.id, isRead: true } })).status === 200);
check("another member cannot mark someone else's notification", denied(await api('/notifications', { method: 'PUT', token: b.token, body: { id: n2.body.id, isRead: true } })));
const bulk = await api('/notifications', { method: 'PUT', token: a.token, body: { all: true, isRead: true } });
check('mark all as read in one call', bulk.status === 200 && (await mine(a)).every((n) => n.isRead), JSON.stringify(bulk.body));
check('bulk read never touches other accounts', (await api('/notifications', { method: 'POST', token: b.token, body: { userId: b.userId, type: 'BOOKING_CONFIRMED', title: 'B', message: 'b', channel: 'IN_APP' } })).status === 201 && (await mine(b)).every((n) => !n.isRead));
check('mark one as unread again', (await api('/notifications', { method: 'PUT', token: a.token, body: { id: n1.body.id, isRead: false } })).status === 200 && (await mine(a)).find((n) => n.id === n1.body.id)?.isRead === false);

console.log('\n## Deleting');
check('guests cannot delete', denied(await api('/notifications?id=' + n1.body.id, { method: 'DELETE' })));
check("another member cannot delete someone else's notification", denied(await api('/notifications?id=' + n1.body.id, { method: 'DELETE', token: b.token })));
check('delete without an id is a 400', (await api('/notifications', { method: 'DELETE', token: a.token })).status === 400);
check('the owner deletes one notification', (await api('/notifications?id=' + n1.body.id, { method: 'DELETE', token: a.token })).status === 200 && !(await mine(a)).some((n) => n.id === n1.body.id));
check('deleting it again is a 404', (await api('/notifications?id=' + n1.body.id, { method: 'DELETE', token: a.token })).status === 404);
const bBefore = (await mine(b)).length;
check('clear all removes every notification of the caller', (await api('/notifications?all=true', { method: 'DELETE', token: a.token })).status === 200 && (await mine(a)).length === 0);
check('clear all leaves other accounts alone', (await mine(b)).length === bBefore && bBefore > 0);

console.log('\n## Server-side events create a notification');
const sec = (await db.query(`select s.id sid, w.id wid from "WorkspaceSection" s join "Workspace" w on w.id=s."workspaceId" where s.type='MEETING_ROOM' and w."is24Hours"=false and w."openingTime"='08:00' and w."closingTime"='22:00' limit 1`)).rows[0];
const day = new Date(Date.now() + (700 + Math.floor(Math.random() * 300)) * 864e5).toISOString().slice(0, 10);
const hb = await api('/hourly-bookings', { method: 'POST', token: a.token, body: { workspaceId: sec.wid, sectionId: sec.sid, sectionType: 'MEETING_ROOM', startDate: day, endDate: day, startTime: '10:00', endTime: '12:00', durationHours: 2 } });
check('an hourly booking is created', hb.status === 201, 'status ' + hb.status);
const got = (await mine(a)).find((n) => n.type === 'MEETING_BOOKED');
check('the guest is notified that the session is confirmed', !!got && /confirmed/i.test(got.message), JSON.stringify(got?.message));

await db.end();
summary();
process.exit(0);
