import { api, db, makeUser, check, summary } from './lib.mjs';
await db.connect();
const run = Date.now().toString(36);
const u = await makeUser('QA lifecycle', `qa.lc.${run}@test.local`.toLowerCase(), 'B2C');
const sec = (await db.query(`select s.id sid, w.id wid from "WorkspaceSection" s join "Workspace" w on w.id=s."workspaceId" where s.type='DESK' limit 1`)).rows[0];
const hall = (await db.query(`select s.id sid, w.id wid from "WorkspaceSection" s join "Workspace" w on w.id=s."workspaceId" where s.type='MEETING_ROOM' limit 1`)).rows[0];
const pkg = (await db.query(`select id from "HourlyPackage" where "sectionId"=$1 limit 1`, [hall.sid])).rows[0]
  || (await db.query(`insert into "HourlyPackage" (id,"sectionId","packageName","hoursAmount","periodType",price) values (gen_random_uuid(),$1,'QA lc pkg',2,'PER_DAY',100) returning id`, [hall.sid])).rows[0];
const ksa = (offsetDays, hour = 0) => { const d = new Date(Date.now() + 3 * 3600000 + offsetDays * 86400000); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hour)); };
const direct = async (when, type, details) => (await db.query(
  `insert into "DirectBooking" (id,"userId","workspaceId","sectionId","durationType","durationDetails","bookingDate",seats,status) values (gen_random_uuid(),$1,$2,$3,$4,$5,$6,1,'CONFIRMED') returning id`,
  [u.userId, sec.wid, sec.sid, type, details, when])).rows[0].id;
const hourly = async (start, end) => (await db.query(
  `insert into "HourlyBooking" (id,"userId","workspaceId","sectionId","packageId","startDate","endDate","hoursUsed",seats,status) values (gen_random_uuid(),$1,$2,$3,$4,$5,$6,2,1,'ACTIVE') returning id`,
  [u.userId, hall.wid, hall.sid, pkg.id, start, end])).rows[0].id;

console.log('\n## Past bookings are no longer reported as active');
const dPast = await direct(ksa(-40), 'DAILY', '1 Days');
const dFuture = await direct(ksa(30), 'DAILY', '1 Days');
const dMonthlyPast = await direct(ksa(-70), 'MONTHLY', '1 Months');
const dMonthlyRunning = await direct(ksa(-5), 'MONTHLY', '1 Months');
const list = (await api('/direct-bookings', { token: u.token })).body;
const st = (id) => list.find((b) => b.id === id)?.effectiveStatus;
check('a daily booking from 40 days ago is COMPLETED', st(dPast) === 'COMPLETED', st(dPast));
check('a daily booking next month is still CONFIRMED', st(dFuture) === 'CONFIRMED', st(dFuture));
check('a monthly pass that ended is COMPLETED', st(dMonthlyPast) === 'COMPLETED', st(dMonthlyPast));
check('a monthly pass still running is CONFIRMED', st(dMonthlyRunning) === 'CONFIRMED', st(dMonthlyRunning));
check('the stored status is left untouched (reports still count it)', list.find((b) => b.id === dPast)?.status === 'CONFIRMED');

const hPast = await hourly(ksa(-3, 10), ksa(-3, 12));
const hFuture = await hourly(ksa(20, 10), ksa(20, 12));
const hlist = (await api('/hourly-bookings', { token: u.token })).body;
const hs = (id) => hlist.find((b) => b.id === id)?.effectiveStatus;
check('an hourly session that ended is EXPIRED', hs(hPast) === 'EXPIRED', hs(hPast));
check('an upcoming hourly session is ACTIVE', hs(hFuture) === 'ACTIVE', hs(hFuture));

console.log('\n## Lists come newest first');
const dates = list.map((b) => new Date(b.bookingDate).getTime());
check('direct bookings are ordered by booking date, newest first', dates.every((t, i) => i === 0 || dates[i - 1] >= t), JSON.stringify(list.map((b) => b.bookingDate.slice(0, 10))));
const starts = hlist.map((b) => new Date(b.startDate).getTime());
check('hourly bookings are ordered by start, newest first', starts.every((t, i) => i === 0 || starts[i - 1] >= t));

await db.query(`delete from "DirectBooking" where "userId"=$1`, [u.userId]);
await db.query(`delete from "HourlyBooking" where "userId"=$1`, [u.userId]);
await db.end();
summary();
process.exit(0);
