// Bookings made for team members (attendees), the locked-down booking PUT, validated rescheduling with price
// differences, amenity request routing and the customer side of the support conversation.
// the customer side of the support conversation.
import { api, db, makeUser, check, summary } from './lib.mjs';
await db.connect();
const run = Date.now().toString(36);
const mk = (n, role = 'B2C', extra = {}) => makeUser('QA ' + n, `qa.${n}.${run}@test.local`.toLowerCase(), role, extra);
const loginAs = async (email, pw) => {
  const l = await api('/auth/login', { method: 'POST', body: { email, password: pw } });
  const v = await api('/auth/verify-login', { method: 'POST', body: { userId: l.body.userId, code: '123456' } });
  return { token: v.body?.token, userId: l.body.userId };
};
const ksaNow = () => new Date(Date.now() + 3 * 3600_000);
const ksaAt = (days, hour) => { const d = ksaNow(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days, hour)); };
const ymd = (d) => d.toISOString().slice(0, 10);
const fmt = (d) => d.toISOString().slice(0, 16).replace('T', ' ');
const col = async (sql, params) => (await db.query(sql, params)).rows[0]?.v;
const num = async (sql, params) => Number((await db.query(sql, params)).rows[0]?.v ?? 0);

// ---------- Venue and rooms with known prices ----------
const ws = (await db.query(`select id from "Workspace" where "openingTime"='08:00' and "closingTime"='22:00' and "is24Hours"=false limit 1`)).rows[0];
const otherWs = (await db.query(`select w.id wid, s.id sid from "Workspace" w join "WorkspaceSection" s on s."workspaceId"=w.id where w.id<>$1 and s.type='MEETING_ROOM' limit 1`, [ws.id])).rows[0];
const desk = (await db.query(`select s.id sid, w.id wid from "WorkspaceSection" s join "Workspace" w on w.id=s."workspaceId" where s.type='DESK' limit 1`)).rows[0];
const createdSections = [];
const mkRoom = async (label, rate) => {
  const sid = (await db.query(
    `insert into "WorkspaceSection" (id,"workspaceId",type,name,capacity,"hourlyRate","dailyRate") values (gen_random_uuid(),$1,'MEETING_ROOM',$2,8,$3,$4) returning id`,
    [ws.id, `QA ${label} ${run}`, rate, rate * 4])).rows[0].id;
  const pid = (await db.query(`insert into "HourlyPackage" (id,"sectionId","packageName","hoursAmount","periodType",price) values (gen_random_uuid(),$1,'QA pkg',2,'PER_DAY',$2) returning id`, [sid, rate * 2])).rows[0].id;
  createdSections.push(sid);
  return { sid, pid };
};
const roomA = await mkRoom('Room A', 100);
const roomB = await mkRoom('Room B', 150);
const roomC = await mkRoom('Room C', 60);
const roomQr = await mkRoom('Room QR', 80);

const hb = async (ownerId, room, start, end, attendees = []) => (await db.query(
  `insert into "HourlyBooking" (id,"userId","workspaceId","sectionId","packageId","startDate","endDate","hoursUsed",seats,status,"attendeeIds") values (gen_random_uuid(),$1,$2,$3,$4,$5::timestamp,$6::timestamp,2,1,'ACTIVE',$7::text[]) returning id`,
  [ownerId, ws.id, room.sid, room.pid, start.toISOString(), end.toISOString(), attendees])).rows[0].id;
const pay = async (ownerId, bookingId, amount, paymentFor = 'HOURLY_BOOKING') => (await db.query(
  `insert into "Payment" (id,"userId","workspaceId",amount,method,"paymentFor","referenceId",status) values (gen_random_uuid(),$1,$2,$3,'MADA',$4::"PaymentFor",$5,'SUCCESS') returning id`,
  [ownerId, ws.id, amount, paymentFor, bookingId])).rows[0].id;
const paidFor = (bookingId) => num(`select coalesce(sum(amount),0) v from "Payment" where "referenceId"=$1 and status='SUCCESS' and method<>'REFUND'`, [bookingId]);
const walletOf = (userId) => num(`select balance v from "Wallet" where "userId"=$1`, [userId]);
const companyBalance = (id) => num(`select balance v from "Company" where id=$1`, [id]);
const resched = (u, id, body) => api(`/hourly-bookings/${id}/reschedule`, { method: 'POST', token: u.token, body });
const slotBody = (days, time, extra = {}) => ({ startDate: ymd(ksaAt(days, 0)), startTime: time, ...extra });

// ---------- Company with two members ----------
const hr = await mk('stHr', 'HR_ADMIN', { companyName: 'QA Spend Co ' + run });
let companyId = (await db.query('select id from "Company" where "hrAdminId"=$1', [hr.userId])).rows[0]?.id;
if (!companyId) {
  companyId = (await db.query(`insert into "Company" (id,"companyName","hrAdminId") values (gen_random_uuid(),$1,$2) returning id`, ['QA Spend Co ' + run, hr.userId])).rows[0].id;
  await db.query('update "User" set "companyId"=$1 where id=$2', [companyId, hr.userId]);
}
const emp1 = await mk('stEmp1');
const emp2 = await mk('stEmp2');
const outsider = await mk('stOutsider');
for (const m of [emp1, emp2]) await api(`/companies/${companyId}/employees`, { method: 'POST', token: hr.token, body: { email: m.email } });
await api(`/companies/${companyId}/deposit`, { method: 'POST', token: hr.token, body: { amount: 1000 } });

console.log('\n## Bookings made for team members');
const day = 8 + (Date.now() % 5);
const teamBody = (extra = {}) => ({ workspaceId: ws.id, sectionId: roomA.sid, packageId: roomA.pid, sectionType: 'MEETING_ROOM', startDate: ymd(ksaAt(day, 0)), endDate: ymd(ksaAt(day, 0)), startTime: '10:00', endTime: '12:00', durationHours: 2, ...extra });
const teamBk = await api('/hourly-bookings', { method: 'POST', token: hr.token, body: teamBody({ attendeeIds: [emp1.userId, outsider.userId, hr.userId, 'not-a-user'] }) });
check('the HR admin books a session for the team', teamBk.status === 201, teamBk.status + ' ' + JSON.stringify(teamBk.body));
const attendees = (await db.query('select "attendeeIds" a from "HourlyBooking" where id=$1', [teamBk.body?.id])).rows[0]?.a ?? [];
check('only real members of the HR admin\'s own company are kept as attendees', attendees.length === 1 && attendees[0] === emp1.userId, JSON.stringify(attendees));
const e1List = (await api('/hourly-bookings', { token: emp1.token })).body || [];
check('the employee sees the booking in their own list', e1List.some((b) => b.id === teamBk.body?.id));
check('someone else does not', !((await api('/hourly-bookings', { token: outsider.token })).body || []).some((b) => b.id === teamBk.body?.id));
check('the employee is told it was booked for them', (await num(`select count(*)::int v from "Notification" where "userId"=$1 and title='Booked for you by your company'`, [emp1.userId])) === 1);
check('the employee cannot cancel it', (await api(`/hourly-bookings/${teamBk.body?.id}`, { method: 'PUT', token: emp1.token, body: { status: 'CANCELLED' } })).status === 403);
check('the employee cannot reschedule it', (await resched(emp1, teamBk.body?.id, slotBody(day + 1, '10:00 AM'))).status === 403);
const deskDay = 15 + (Date.now() % 5);
const teamDirect = await api('/direct-bookings', { method: 'POST', token: hr.token, body: { workspaceId: desk.wid, sectionId: desk.sid, durationType: 'DAILY', bookingDate: ymd(ksaAt(deskDay, 0)), seats: 2, attendeeIds: [emp2.userId] } });
check('the HR admin books a desk for a team member', teamDirect.status === 201, teamDirect.status + ' ' + JSON.stringify(teamDirect.body).slice(0, 120));
check('the member sees the desk booking, an outsider does not',
  ((await api('/direct-bookings', { token: emp2.token })).body || []).some((b) => b.id === teamDirect.body?.id) &&
  !((await api('/direct-bookings', { token: outsider.token })).body || []).some((b) => b.id === teamDirect.body?.id));
const now = ksaNow();
const liveBk = await hb(hr.userId, roomQr, new Date(now.getTime() - 10 * 60_000), new Date(now.getTime() + 110 * 60_000), [emp1.userId]);
const scan = await api('/qr-check-ins', { method: 'POST', token: emp1.token, body: { workspaceId: ws.id, sectionId: roomQr.sid } });
check('the employee checks in with their own QR code for a booking made for them', scan.status === 201 || scan.status === 200, scan.status + ' ' + JSON.stringify(scan.body));
check('an outsider cannot check in to it', (await api('/qr-check-ins', { method: 'POST', token: outsider.token, body: { workspaceId: ws.id, sectionId: roomQr.sid } })).status === 403);

console.log('\n## The booking PUT is closed to arbitrary changes');
const dBk = (await db.query(
  `insert into "DirectBooking" (id,"userId","workspaceId","sectionId","durationType","durationDetails","bookingDate",seats,status) values (gen_random_uuid(),$1,$2,$3,'DAILY','1 Days',$4::timestamp,1,'CONFIRMED') returning id`,
  [outsider.userId, desk.wid, desk.sid, ksaAt(20, 9).toISOString()])).rows[0].id;
const moveViaPut = await api(`/direct-bookings/${dBk}`, { method: 'PUT', token: outsider.token, body: { bookingDate: ymd(ksaAt(2, 0)) } });
check('an owner cannot change the date through PUT', moveViaPut.status === 400 && moveViaPut.body?.code === 'USE_RESCHEDULE', moveViaPut.status + ' ' + JSON.stringify(moveViaPut.body));
check('nor the room', (await api(`/direct-bookings/${dBk}`, { method: 'PUT', token: outsider.token, body: { sectionId: roomA.sid } })).status === 400);
check('the booking date is unchanged', (await col(`select to_char("bookingDate",'YYYY-MM-DD HH24:MI') v from "DirectBooking" where id=$1`, [dBk])) === fmt(ksaAt(20, 9)));
check('an owner can still cancel through PUT', (await api(`/direct-bookings/${dBk}`, { method: 'PUT', token: outsider.token, body: { status: 'CANCELLED' } })).status === 200);
check('but cannot bring a cancelled booking back', (await api(`/direct-bookings/${dBk}`, { method: 'PUT', token: outsider.token, body: { status: 'CONFIRMED' } })).status === 400);
const hClosed = await hb(outsider.userId, roomA, ksaAt(21, 10), ksaAt(21, 12));
check('hourly: an invalid status is a 400', (await api(`/hourly-bookings/${hClosed}`, { method: 'PUT', token: outsider.token, body: { status: 'FOO' } })).status === 400);
check('hourly: an owner cannot activate or expire a booking', (await api(`/hourly-bookings/${hClosed}`, { method: 'PUT', token: outsider.token, body: { status: 'EXPIRED' } })).status === 400);
check('hourly: an owner can cancel', (await api(`/hourly-bookings/${hClosed}`, { method: 'PUT', token: outsider.token, body: { status: 'CANCELLED' } })).status === 200);
check('hourly: a cancelled booking cannot be reactivated', (await api(`/hourly-bookings/${hClosed}`, { method: 'PUT', token: outsider.token, body: { status: 'ACTIVE' } })).status === 400);

console.log('\n## Rescheduling an hourly session');
const mine = await hb(outsider.userId, roomA, ksaAt(3, 10), ksaAt(3, 12));
await pay(outsider.userId, mine, 200);
const moved = await resched(outsider, mine, slotBody(5, '2:00 PM'));
check('the owner moves the session to a free session', moved.status === 200 && moved.body?.priceDifference === 0, moved.status + ' ' + JSON.stringify(moved.body));
const movedRow = (await db.query(`select to_char("startDate",'YYYY-MM-DD HH24:MI') s, to_char("endDate",'YYYY-MM-DD HH24:MI') e, "rescheduleCount" c, to_char("rescheduledFrom",'YYYY-MM-DD HH24:MI') f from "HourlyBooking" where id=$1`, [mine])).rows[0];
check('the new slot, the counter and the original start are saved', movedRow.s === fmt(ksaAt(5, 14)) && movedRow.e === fmt(ksaAt(5, 16)) && movedRow.c === 1 && movedRow.f === fmt(ksaAt(3, 10)), JSON.stringify(movedRow));
const second = await resched(outsider, mine, slotBody(6, '10:00 AM'));
check('a second reschedule is refused (one free change)', second.status === 400 && second.body?.code === 'RESCHEDULE_LIMIT', second.status + ' ' + second.body?.code);
check('the owner is told', (await num(`select count(*)::int v from "Notification" where "userId"=$1 and title='Booking Rescheduled'`, [outsider.userId])) === 1);

const soon = await hb(outsider.userId, roomA, new Date(ksaNow().getTime() + 4 * 3600_000), new Date(ksaNow().getTime() + 6 * 3600_000));
const tooLate = await resched(outsider, soon, slotBody(6, '10:00 AM'));
check('an individual cannot reschedule inside 6 hours of the start', tooLate.status === 400 && tooLate.body?.code === 'RESCHEDULE_WINDOW' && tooLate.body?.requiredHours === 6, tooLate.status + ' ' + JSON.stringify(tooLate.body));
const eightHours = await hb(outsider.userId, roomA, new Date(ksaNow().getTime() + 8 * 3600_000), new Date(ksaNow().getTime() + 10 * 3600_000));
check('8 hours ahead is enough for an individual', (await resched(outsider, eightHours, slotBody(7, '10:00 AM'))).status === 200);
const empSoon = await hb(emp1.userId, roomA, new Date(ksaNow().getTime() + 5 * 3600_000), new Date(ksaNow().getTime() + 7 * 3600_000));
const empLate = await resched(emp1, empSoon, slotBody(7, '10:00 AM'));
check('a company employee\'s own booking follows the 6-hour rule', empLate.status === 400 && empLate.body?.requiredHours === 6, empLate.status + ' ' + JSON.stringify(empLate.body));
const hrSoon = await hb(hr.userId, roomA, new Date(ksaNow().getTime() + 12 * 3600_000), new Date(ksaNow().getTime() + 14 * 3600_000));
check('an HR admin\'s own booking needs 24 hours of notice', (await resched(hr, hrSoon, slotBody(7, '10:00 AM'))).body?.requiredHours === 24);
const started = await hb(outsider.userId, roomA, new Date(ksaNow().getTime() - 30 * 60_000), new Date(ksaNow().getTime() + 90 * 60_000));
check('a session that already started cannot be moved', (await resched(outsider, started, slotBody(7, '10:00 AM'))).body?.code === 'NOT_ELIGIBLE');

const target = await hb(outsider.userId, roomA, ksaAt(4, 10), ksaAt(4, 12));
const blocker = await mk('stBlocker');
await hb(blocker.userId, roomA, ksaAt(9, 14), ksaAt(9, 16));
const clash = await resched(outsider, target, slotBody(9, '2:00 PM'));
check('a session another customer holds is refused', clash.status === 409 && clash.body?.code === 'SLOT_UNAVAILABLE', clash.status + ' ' + JSON.stringify(clash.body));
check('the booking stayed where it was', (await col(`select to_char("startDate",'YYYY-MM-DD HH24:MI') v from "HourlyBooking" where id=$1`, [target])) === fmt(ksaAt(4, 10)));
check('outside operating hours is refused', (await resched(outsider, target, slotBody(9, '6:00 AM'))).status === 400);
check('a stranger cannot reschedule it', (await resched(blocker, target, slotBody(9, '10:00 AM'))).status === 403);
check('the same session is refused', (await resched(outsider, target, slotBody(4, '10:00 AM'))).body?.code === 'NOT_CHANGED');
check('more than 30 days ahead is refused', (await resched(outsider, target, slotBody(60, '10:00 AM'))).body?.code === 'SLOT_TOO_FAR');
check('a room of another venue is refused', (await resched(outsider, target, slotBody(9, '10:00 AM', { sectionId: otherWs?.sid ?? 'x' }))).body?.code === 'ROOM_NOT_ALLOWED');
check('an unknown booking is a 404', (await resched(outsider, '00000000-0000-0000-0000-000000000000', slotBody(9, '10:00 AM'))).status === 404);
check('an anonymous request is a 401', (await api(`/hourly-bookings/${target}/reschedule`, { method: 'POST', body: slotBody(9, '10:00 AM') })).status === 401);

console.log('\n## Price differences settle on the wallet that paid');
await db.query('update "Wallet" set balance=500 where "userId"=$1', [outsider.userId]);
const dearer = await hb(outsider.userId, roomA, ksaAt(4, 8), ksaAt(4, 10));
await pay(outsider.userId, dearer, 300);
const up = await resched(outsider, dearer, slotBody(10, '10:00 AM', { sectionId: roomB.sid }));
check('a dearer room charges the difference (300 x 150/100 = 450, so 150 more)', up.status === 200 && up.body?.priceDifference === 150 && up.body?.settledOn === 'PERSONAL', up.status + ' ' + JSON.stringify(up.body));
check('the wallet that paid was charged', (await walletOf(outsider.userId)) === 350, String(await walletOf(outsider.userId)));
check('the recorded payment now shows the new total', (await paidFor(dearer)) === 450, String(await paidFor(dearer)));
check('the booking is in the new room and uses that room\'s package', (await db.query('select "sectionId" s, "packageId" p from "HourlyBooking" where id=$1', [dearer])).rows[0].s === roomB.sid && (await col('select "packageId" v from "HourlyBooking" where id=$1', [dearer])) === roomB.pid);
await db.query('update "Wallet" set balance=10 where "userId"=$1', [outsider.userId]);
const broke2 = await hb(outsider.userId, roomA, ksaAt(4, 8), ksaAt(4, 10));
await pay(outsider.userId, broke2, 300);
const noMoney = await resched(outsider, broke2, slotBody(11, '10:00 AM', { sectionId: roomB.sid }));
check('without enough balance the move is refused', noMoney.status === 400 && noMoney.body?.code === 'INSUFFICIENT_BALANCE', noMoney.status + ' ' + JSON.stringify(noMoney.body));
check('nothing changed: same room, same payment, same wallet', (await db.query('select "sectionId" s, "rescheduleCount" c from "HourlyBooking" where id=$1', [broke2])).rows[0].s === roomA.sid && (await paidFor(broke2)) === 300 && (await walletOf(outsider.userId)) === 10);
const cheaper = await hb(outsider.userId, roomB, ksaAt(4, 8), ksaAt(4, 10));
await pay(outsider.userId, cheaper, 300);
const down = await resched(outsider, cheaper, slotBody(12, '10:00 AM', { sectionId: roomC.sid }));
check('a cheaper room refunds the difference (300 x 60/150 = 120, so 180 back)', down.status === 200 && down.body?.priceDifference === -180, down.status + ' ' + JSON.stringify(down.body));
check('the wallet got it back and the payment shows the new total', (await walletOf(outsider.userId)) === 190 && (await paidFor(cheaper)) === 120, `${await walletOf(outsider.userId)} / ${await paidFor(cheaper)}`);

console.log('\n## An HR admin\'s price difference uses the company wallet');
await db.query(`update "Company" set balance=1000 where id=$1`, [companyId]);
const hrBk = await hb(hr.userId, roomA, ksaAt(5, 8), ksaAt(5, 10));
await pay(hr.userId, hrBk, 300);
const hrUp = await resched(hr, hrBk, slotBody(13, '10:00 AM', { sectionId: roomB.sid }));
check('the HR admin\'s dearer move is charged to the company wallet', hrUp.status === 200 && hrUp.body?.settledOn === 'COMPANY' && (await companyBalance(companyId)) === 850, hrUp.status + ' ' + JSON.stringify(hrUp.body) + ' balance ' + await companyBalance(companyId));
const hrBroke = await hb(hr.userId, roomA, ksaAt(5, 8), ksaAt(5, 10));
await pay(hr.userId, hrBroke, 3000);
await db.query(`update "Company" set balance=10 where id=$1`, [companyId]);
const hrNoMoney = await resched(hr, hrBroke, slotBody(14, '10:00 AM', { sectionId: roomB.sid }));
check('a company wallet that cannot cover the difference refuses the move', hrNoMoney.status === 400 && hrNoMoney.body?.code === 'INSUFFICIENT_BALANCE' && (await companyBalance(companyId)) === 10, hrNoMoney.status + ' ' + JSON.stringify(hrNoMoney.body));

console.log('\n## Rescheduling a daily booking');
const dDirect = (await db.query(
  `insert into "DirectBooking" (id,"userId","workspaceId","sectionId","durationType","durationDetails","bookingDate",seats,status) values (gen_random_uuid(),$1,$2,$3,'DAILY','1 Days',$4::timestamp,1,'CONFIRMED') returning id`,
  [blocker.userId, desk.wid, desk.sid, ksaAt(10, 9).toISOString()])).rows[0].id;
const mvDirect = await api(`/direct-bookings/${dDirect}/reschedule`, { method: 'POST', token: blocker.token, body: { bookingDate: ymd(ksaAt(12, 0)) } });
check('the owner moves a daily booking to another date', mvDirect.status === 200, mvDirect.status + ' ' + JSON.stringify(mvDirect.body).slice(0, 120));
check('the date and the counter are saved', (await col(`select to_char("bookingDate",'YYYY-MM-DD HH24:MI') v from "DirectBooking" where id=$1`, [dDirect])) === fmt(ksaAt(12, 9)) && (await col('select "rescheduleCount" v from "DirectBooking" where id=$1', [dDirect])) === 1);
check('a second move is refused', (await api(`/direct-bookings/${dDirect}/reschedule`, { method: 'POST', token: blocker.token, body: { bookingDate: ymd(ksaAt(14, 0)) } })).body?.code === 'RESCHEDULE_LIMIT');
check('a stranger cannot move it', (await api(`/direct-bookings/${dDirect}/reschedule`, { method: 'POST', token: outsider.token, body: { bookingDate: ymd(ksaAt(14, 0)) } })).status === 403);
const dToday = (await db.query(
  `insert into "DirectBooking" (id,"userId","workspaceId","sectionId","durationType","durationDetails","bookingDate",seats,status) values (gen_random_uuid(),$1,$2,$3,'DAILY','1 Days',$4::timestamp,1,'CONFIRMED') returning id`,
  [outsider.userId, desk.wid, desk.sid, new Date(ksaNow().getTime() + 3 * 3600_000).toISOString()])).rows[0].id;
check('a booking starting within the notice window cannot be moved', (await api(`/direct-bookings/${dToday}/reschedule`, { method: 'POST', token: outsider.token, body: { bookingDate: ymd(ksaAt(14, 0)) } })).body?.code === 'RESCHEDULE_WINDOW');
check('an invalid date is refused', (await api(`/direct-bookings/${dDirect}/reschedule`, { method: 'POST', token: blocker.token, body: {} })).status === 400);

console.log('\n## Amenity requests reach the Super Admins');
const admin = await loginAs(process.env.QA_ADMIN_EMAIL || 'superadmin@cwp-test.local', process.env.QA_ADMIN_PASSWORD || 'Test@12345');
const partner = await mk('stPartner', 'PARTNER_ADMIN', { businessName: 'QA Amenity Venue ' + run, crNumber: '1010333333' });
const partnerId = (await db.query(`select id from "Partner" where lower("contactEmail")=lower($1)`, [partner.email])).rows[0]?.id;
await api('/partners/' + partnerId, { method: 'PUT', token: admin.token, body: { status: 'APPROVED' } });
Object.assign(partner, await loginAs(partner.email, partner.pw));
const adminsBefore = await num(`select count(*)::int v from "Notification" where "userId"=$1 and title='New Custom Amenity Request'`, [admin.userId]);
const partnerBefore = await num(`select count(*)::int v from "Notification" where "userId"=$1 and title='New Custom Amenity Request'`, [partner.userId]);
const amenity = await api('/amenities', { method: 'POST', token: partner.token, body: { name: 'QA Podcast Booth ' + run, icon: 'Mic', isDefault: false, requestedBy: outsider.userId, spaceName: 'QA Venue' } });
check('the partner files an amenity request', amenity.status === 201, amenity.status + ' ' + JSON.stringify(amenity.body));
check('the request is filed under the partner, whatever the browser sends', (await db.query('select "requestedBy" r from "AmenityCatalog" where id=$1', [amenity.body?.amenity?.id])).rows[0]?.r === partner.userId);
check('the Super Admin is notified', (await num(`select count(*)::int v from "Notification" where "userId"=$1 and title='New Custom Amenity Request'`, [admin.userId])) === adminsBefore + 1);
check('the partner is not notified of their own request', (await num(`select count(*)::int v from "Notification" where "userId"=$1 and title='New Custom Amenity Request'`, [partner.userId])) === partnerBefore);
const approve = await api('/amenities/' + amenity.body?.amenity?.id, { method: 'PUT', token: admin.token, body: { status: 'APPROVED' } });
check('the Super Admin approves it', approve.status === 200);
check('the partner is told the decision', (await num(`select count(*)::int v from "Notification" where "userId"=$1 and title='Amenity Request Approved'`, [partner.userId])) === 1);
check('a partner cannot decide on amenity requests', (await api('/amenities/' + amenity.body?.amenity?.id, { method: 'PUT', token: partner.token, body: { status: 'REJECTED' } })).status === 403);

console.log('\n## The customer side of a support ticket');
const ticket = await api('/tickets', { method: 'POST', token: emp1.token, body: { subject: 'QA help ' + run, message: 'I need a hand with my booking.', category: 'general' } });
check('a member opens a ticket', ticket.status === 201, ticket.status);
const tid = ticket.body?.ticket?.id;
const mineList = await api('/tickets', { token: emp1.token });
check('they see it in their own list and nobody else\'s', mineList.status === 200 && mineList.body.some((t) => t.id === tid) && mineList.body.every((t) => t.userId === emp1.userId));
const adminReply = await api('/ticket-replies', { method: 'POST', token: admin.token, body: { ticketId: tid, message: 'Happy to help.' } });
check('support replies', adminReply.status === 201);
const afterReply = (await api('/tickets', { token: emp1.token })).body.find((t) => t.id === tid);
check('the member sees the answer and the ticket moved to in progress', afterReply?.replies?.length === 1 && afterReply.status === 'IN_PROGRESS', JSON.stringify(afterReply?.replies?.length) + ' ' + afterReply?.status);
const adminNotifsBefore = await num(`select count(*)::int v from "Notification" where "userId"=$1 and title='New reply on a support ticket'`, [admin.userId]);
const myReply = await api('/ticket-replies', { method: 'POST', token: emp1.token, body: { ticketId: tid, message: 'Thank you, one more question.' } });
check('the member answers back', myReply.status === 201);
check('the Super Admins are told', (await num(`select count(*)::int v from "Notification" where "userId"=$1 and title='New reply on a support ticket'`, [admin.userId])) === adminNotifsBefore + 1);
check('another customer cannot read or answer it', (await api('/ticket-replies', { method: 'POST', token: outsider.token, body: { ticketId: tid, message: 'hi' } })).status === 403);
check('a customer cannot move the ticket along', (await api('/tickets/' + tid, { method: 'PUT', token: emp1.token, body: { status: 'OPEN' } })).status === 403);
check('a customer can close their own ticket', (await api('/tickets/' + tid, { method: 'PUT', token: emp1.token, body: { status: 'CLOSED' } })).status === 200);
check('a closed ticket cannot be answered by the customer', (await api('/ticket-replies', { method: 'POST', token: emp1.token, body: { ticketId: tid, message: 'reopen?' } })).status === 400);
check('nor reopened', (await api('/tickets/' + tid, { method: 'PUT', token: emp1.token, body: { status: 'OPEN' } })).status === 403);

// ---------- Cleanup of the rooms created for this run ----------
await db.query(`delete from "QrCheckIn" where "sectionId" = any($1)`, [createdSections]);
await db.query(`delete from "HourlyBooking" where "sectionId" = any($1) or "packageId" in (select id from "HourlyPackage" where "sectionId" = any($1))`, [createdSections]);
await db.query(`delete from "HourlyPackage" where "sectionId" = any($1)`, [createdSections]);
await db.query(`delete from "WorkspaceSection" where id = any($1)`, [createdSections]);
await db.query(`delete from "DirectBooking" where "userId" = any($1)`, [[outsider.userId, blocker.userId, hr.userId, emp1.userId, emp2.userId]]);
await db.query(`delete from "QrCheckIn" where "userId" = any($1)`, [[emp1.userId]]);
await db.end();
summary();
process.exit(0);
