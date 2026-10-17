import { api, db, makeUser, check, summary } from './lib.mjs';
await db.connect();
const u = await makeUser('QA past', `qa.past.${Date.now().toString(36)}@test.local`, 'B2C');
const s = (await db.query(`select s.id sid, w.id wid from "WorkspaceSection" s join "Workspace" w on w.id=s."workspaceId" where s.type='MEETING_ROOM' and w."openingTime"='08:00' and w."closingTime"='22:00' and w."is24Hours"=false order by random() limit 1`)).rows[0];
const ksa = new Date(Date.now() + 3 * 3600e3);
const today = ksa.toISOString().slice(0, 10);
const b = (st, en) => api('/hourly-bookings', { method: 'POST', token: u.token, body: { workspaceId: s.wid, sectionId: s.sid, sectionType: 'MEETING_ROOM', startDate: today, endDate: today, startTime: st, endTime: en, durationHours: 2 } });
const past = await b('08:00', '10:00');
check('already-ended session today rejected', past.status === 400, past.status + ' ' + (past.body?.error || ''));
const h = ksa.getUTCHours();
if (h < 20) {
  const st = String(Math.max(h + 1, 8)).padStart(2, '0') + ':00', en = String(Math.max(h + 1, 8) + 2).padStart(2, '0') + ':00';
  const fut = await b(st, en);
  check(`later session today (${st}-${en}) accepted`, fut.status === 201, fut.status + ' ' + (fut.body?.error || ''));
}
summary(); await db.end();
