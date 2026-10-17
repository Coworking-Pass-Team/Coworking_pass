import { api, db, makeUser, check, summary } from './lib.mjs';
await db.connect();
const run = Date.now().toString(36);
const mk = (n, role = 'B2C', x = {}) => makeUser('QA ' + n, `qa.${n}.${run}@test.local`, role, x);
const A = await mk('a'), Bu = await mk('b');

// ---------- Security ----------
console.log('\n## Security');
{
  const email = `qa.nopw.${run}@test.local`;
  await api('/auth/register', { method: 'POST', body: { name: 'NoPw', email, password: 'Xx#12345678', role: 'B2C' } });
  await db.query('update "User" set "emailVerified"=true where email=$1', [email]);
  const uid = (await db.query('select id from "User" where email=$1', [email])).rows[0].id;
  const v = await api('/auth/verify-login', { method: 'POST', body: { userId: uid, code: '123456' } });
  console.log('KNOWN (dev master OTP 123456, must be disabled in production): verify-login without password -> status ' + v.status + ' token=' + !!v.body?.token);
}
{
  const r = await api('/wallet?userId=' + Bu.userId, { token: A.token });
  check('IDOR: user cannot read another wallet', r.status === 403, 'status ' + r.status);
  const r2 = await api('/wallet', { method: 'POST', token: A.token, body: { userId: Bu.userId, amount: 10, type: 'DEPOSIT' } });
  check('IDOR: user cannot credit another wallet', r2.status === 403, 'status ' + r2.status);
  const r3 = await api('/users/' + Bu.userId, { token: A.token });
  check('IDOR: user cannot read another profile', r3.status === 403 || r3.status === 404, 'status ' + r3.status);
  const r4 = await api('/admin/reports', { token: A.token });
  check('RBAC: B2C blocked from admin reports', r4.status === 401 || r4.status === 403, 'status ' + r4.status);
  const r5 = await api('/users', { token: A.token });
  check('RBAC: B2C cannot list all users', r5.status === 401 || r5.status === 403, 'status ' + r5.status);
  const r6 = await api('/qr-check-ins', { token: A.token });
  check('QR check-ins list scoped to caller', r6.status === 200 && r6.body.every(x => x.userId === A.userId), 'status ' + r6.status + ' n=' + (r6.body?.length));
  const bad = await api('/wallet?userId=' + A.userId, { token: A.token + 'x' });
  check('Tampered JWT rejected', bad.status === 401, 'status ' + bad.status);
}

// ---------- Wallet ----------
console.log('\n## Wallet');
const wal = (u) => api('/wallet?userId=' + u.userId, { token: u.token });
const dep = (u, amount, extra = {}) => api('/wallet', { method: 'POST', token: u.token, body: { userId: u.userId, amount, type: 'DEPOSIT', ...extra } });
const wd = (u, amount, extra = {}) => api('/wallet', { method: 'POST', token: u.token, body: { userId: u.userId, amount, type: 'WITHDRAW', ...extra } });
{
  check('zero-balance wallet starts at 0', (await wal(A)).body.balance === 0);
  check('negative deposit rejected', (await dep(A, -50)).status === 400);
  check('zero deposit rejected', (await dep(A, 0)).status === 400);
  check('string amount rejected', (await dep(A, '50')).status === 400);
  check('withdraw with zero balance rejected', (await wd(A, 10)).status === 400);
  await dep(A, 100, { referenceId: 'topup-1' });
  check('deposit credits balance', (await wal(A)).body.balance === 100);
  const dup = await dep(A, 100, { referenceId: 'topup-1' });
  check('duplicate deposit referenceId applied once', (await wal(A)).body.balance === 100 && dup.body?.duplicate === true);
  check('insufficient funds rejected', (await wd(A, 500)).status === 400);
  const par = await Promise.all(Array.from({ length: 10 }, () => wd(A, 30, { referenceId: 'click-1' })));
  const ok = par.filter(r => r.status === 201).length;
  const b1 = (await wal(A)).body.balance;
  check('10 rapid identical debits (same idempotency key) -> exactly 1 charge', ok === 1 && b1 === 70, `created=${ok} balance=${b1}`);
  const par2 = await Promise.all(Array.from({ length: 10 }, (_, i) => wd(A, 30, { referenceId: 'distinct-' + i })));
  const ok2 = par2.filter(r => r.status === 201).length;
  const bal = (await wal(A)).body.balance;
  check('concurrent distinct debits never overdraw', bal >= 0 && ok2 === 2 && bal === 10, `created=${ok2} balance=${bal}`);
}

// ---------- Hourly slots ----------
console.log('\n## Hall / theater slots');
const sec = (await db.query(`select s.id sid, s.capacity, w.id wid from "WorkspaceSection" s join "Workspace" w on w.id=s."workspaceId" where s.type='MEETING_ROOM' and w."is24Hours"=false and w."openingTime"='08:00' and w."closingTime"='22:00' limit 1`)).rows[0];
console.log('hall', sec);
const day = new Date(Date.now() + (20 + Math.floor(Math.random() * 600)) * 864e5).toISOString().slice(0, 10);
const book = (u, st, en, extra = {}) => api('/hourly-bookings', { method: 'POST', token: u.token, body: { workspaceId: sec.wid, sectionId: sec.sid, sectionType: 'MEETING_ROOM', startDate: day, endDate: day, startTime: st, endTime: en, durationHours: 2, ...extra } });
{
  check('slot at exact opening 08:00-10:00 accepted', (await book(A, '08:00', '10:00')).status === 201);
  check('slot ending exactly at closing 20:00-22:00 accepted', (await book(A, '20:00', '22:00')).status === 201);
  const early = await book(A, '07:00', '09:00'); check('slot before opening rejected', early.status === 400, early.body?.error);
  const late = await book(A, '21:00', '23:00'); check('slot after closing rejected', late.status === 400, late.body?.error);
  const three = await book(A, '12:00', '15:00', { durationHours: 3 }); check('3-hour hall booking rejected', three.status === 400, three.body?.error);
  const one = await book(A, '12:00', '13:00', { durationHours: 1 }); check('1-hour hall booking rejected', one.status === 400, one.body?.error);
  const same = await book(Bu, '08:00', '10:00'); check('same room+slot second booking -> 409', same.status === 409, same.body?.error);
  const other = await book(Bu, '11:00', '13:00'); check('other slot unaffected by earlier bookings', other.status === 201, other.body?.error);
  const users = []; for (let i = 0; i < 8; i++) users.push(await mk('c' + i));
  const rs = await Promise.all(users.map(u => book(u, '14:00', '16:00')));
  const created = rs.filter(r => r.status === 201).length;
  check('8 concurrent requests, same room+slot -> exactly 1 booking (no overbooking)', created === 1, `created=${created} statuses=${rs.map(r => r.status).join(',')}`);
}

// Direct booking capacity is covered in suite-company-capacity-payments.mjs

// ---------- Payments / refund ----------
console.log('\n## Payments & refund');
{
  const neg = await api('/payments', { method: 'POST', token: A.token, body: { amount: -500, method: 'VISA', paymentFor: 'DIRECT_BOOKING' } });
  check('negative payment amount rejected', neg.status === 400, 'status ' + neg.status);
  const zero = await api('/payments', { method: 'POST', token: A.token, body: { amount: 0, method: 'VISA', paymentFor: 'DIRECT_BOOKING' } });
  check('zero payment amount rejected', zero.status === 400, 'status ' + zero.status);
  const nan = await api('/payments', { method: 'POST', token: A.token, body: { amount: 'abc', method: 'VISA', paymentFor: 'DIRECT_BOOKING' } });
  check('non-numeric payment amount rejected', nan.status === 400, 'status ' + nan.status);
  const bk = await book(A, '17:00', '19:00');
  const bid = bk.body?.id;
  await api('/payments', { method: 'POST', token: A.token, body: { amount: 360, method: 'VISA', paymentFor: 'HOURLY_BOOKING', referenceId: bid } });
  const before = (await wal(A)).body.balance;
  const rf = await Promise.all([1, 2, 3, 4].map(() => api('/refund', { method: 'POST', token: A.token, body: { bookingId: bid } })));
  const okr = rf.filter(r => r.status === 200).length;
  const after = (await wal(A)).body.balance;
  check('4 concurrent refunds of one booking -> credited once', okr === 1 && after - before === 360, `ok=${okr} delta=${after - before} statuses=${rf.map(r => r.status).join(',')} err=${rf.find(r => r.status !== 200)?.body?.error}`);
  const rb = await api('/refund', { method: 'POST', token: Bu.token, body: { bookingId: bid } });
  check('other user cannot refund my booking', [400, 403, 404].includes(rb.status), 'status ' + rb.status);
}

// ---------- Input handling ----------
console.log('\n## Input');
{
  const bad = await fetch('http://localhost:3001/api/wallet', { method: 'POST', headers: { authorization: 'Bearer ' + A.token, 'content-type': 'application/json' }, body: '{bad' });
  check('malformed JSON body does not crash (no 5xx)', bad.status < 500, 'status ' + bad.status);
}
summary(); await db.end();
