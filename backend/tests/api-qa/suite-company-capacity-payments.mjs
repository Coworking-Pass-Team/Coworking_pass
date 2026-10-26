import { api, db, makeUser, check, summary } from './lib.mjs';
await db.connect();
const run = Date.now().toString(36);
const mk = (n, role = 'B2C', x = {}) => makeUser('QA ' + n, `qa.${n}.${run}@test.local`, role, x);

// ---------- Direct booking capacity (room capacity 2) ----------
console.log('\n## Direct booking capacity');
{
  const d = (await db.query(`select w.id wid, s.id sid from "Workspace" w join "WorkspaceSection" s on s."workspaceId"=w.id where s.type='DESK' and w."isVisible"=true limit 1 offset 3`)).rows[0];
  await db.query('update "Workspace" set "totalCapacity"=2 where id=$1', [d.wid]);
  await db.query('update "WorkspaceSection" set capacity=2 where "workspaceId"=$1', [d.wid]);
  const users = []; for (let i = 0; i < 8; i++) users.push(await mk('e' + i));
  const when = new Date(Date.now() + (20 + Math.floor(Math.random() * 600)) * 864e5).toISOString().slice(0, 10);
  const rs = await Promise.all(users.map(u => api('/direct-bookings', { method: 'POST', token: u.token, body: { workspaceId: d.wid, sectionId: d.sid, durationType: 'DAILY', bookingDate: when, seats: 1 } })));
  const created = rs.filter(r => r.status === 201).length;
  const seats = Number((await db.query(`select coalesce(sum(seats),0) n from "DirectBooking" where "workspaceId"=$1 and status='CONFIRMED' and "bookingDate"::date=$2::date`, [d.wid, when])).rows[0].n);
  check('8 concurrent desk bookings, capacity 2 -> never more than 2 seats', seats <= 2 && created <= 2, `created=${created} seats=${seats} statuses=${rs.map(r => r.status).join(',')}`);
  const winner = users[rs.findIndex(r => r.status === 201)];
  const again = await api('/direct-bookings', { method: 'POST', token: winner.token, body: { workspaceId: d.wid, sectionId: d.sid, durationType: 'DAILY', bookingDate: when, seats: 1 } });
  check('same user cannot hold a second active booking', again.status === 400, 'status ' + again.status);
}

// ---------- Corporate wallet ----------
console.log('\n## Corporate wallet');
{
  const hr = await mk('hr', 'HR_ADMIN', { companyName: 'QA Corp ' + run });
  const other = await mk('hr2', 'HR_ADMIN', { companyName: 'Other Corp ' + run });
  const cid = (await db.query('select id from "Company" where "hrAdminId"=$1', [hr.userId])).rows[0].id;
  const ocid = (await db.query('select id from "Company" where "hrAdminId"=$1', [other.userId])).rows[0].id;
  const bal = async () => Number((await db.query('select balance from "Company" where id=$1', [cid])).rows[0].balance);
  const dep = (a, extra = {}) => api(`/companies/${cid}/deposit`, { method: 'POST', token: hr.token, body: { amount: a, ...extra } });
  const wd = (a, extra = {}) => api(`/companies/${cid}/withdraw`, { method: 'POST', token: hr.token, body: { amount: a, ...extra } });
  check('company starts with zero balance', (await bal()) === 0);
  check('withdraw from empty wallet rejected', (await wd(100)).status === 400);
  check('negative deposit rejected', (await dep(-5)).status === 400);
  check('deposit credits company wallet', (await dep(1000, { referenceId: 'top-1' })).status < 300 && (await bal()) === 1000, 'bal ' + (await bal()));
  await dep(1000, { referenceId: 'top-1' });
  check('duplicate deposit key applied once', (await bal()) === 1000, 'bal ' + (await bal()));
  const par = await Promise.all(Array.from({ length: 10 }, () => wd(300, { referenceId: 'book-1' })));
  check('10 rapid identical withdrawals -> one debit', (await bal()) === 700, `bal ${await bal()} ok=${par.filter(r => r.status < 300 && !r.body?.duplicate).length}`);
  await Promise.all(Array.from({ length: 6 }, (_, i) => wd(300, { referenceId: 'm-' + i })));
  const b2 = await bal();
  check('concurrent distinct withdrawals never overdraw', b2 >= 0 && b2 === 100, `bal ${b2}`);
  const ledger = Number((await db.query('select count(*) n from "CompanyWalletTransaction" where "companyId"=$1', [cid])).rows[0].n);
  check('ledger rows match successful movements (1 dep + 1 + 2 withdrawals)', ledger === 4, 'rows ' + ledger);
  const x = await api(`/companies/${cid}/withdraw`, { method: 'POST', token: other.token, body: { amount: 10 } });
  check('IDOR: other HR admin cannot spend my company wallet', x.status === 403, 'status ' + x.status);
  const y = await api(`/companies/${ocid}/deposit`, { method: 'POST', token: hr.token, body: { amount: 10 } });
  check('IDOR: cannot deposit into another company', y.status === 403, 'status ' + y.status);
  const ind = await mk('ind2');
  const z = await api(`/companies/${cid}/withdraw`, { method: 'POST', token: ind.token, body: { amount: 10 } });
  check('RBAC: B2C cannot touch company wallet', z.status === 403, 'status ' + z.status);
}

// ---------- Payment validation ----------
console.log('\n## Payment validation');
{
  const A = await mk('p');
  const p = (amount) => api('/payments', { method: 'POST', token: A.token, body: { amount, method: 'VISA', paymentFor: 'DIRECT_BOOKING' } });
  check('negative payment rejected', (await p(-500)).status === 400);
  check('zero payment rejected', (await p(0)).status === 400);
  check('string payment rejected', (await p('abc')).status === 400);
  check('valid payment accepted', (await p(120)).status === 201);
  const u = await api('/users/' + A.userId, { token: A.token });
  check('own profile readable', u.status === 200);
  const B2 = await mk('q');
  check('another profile blocked', (await api('/users/' + B2.userId, { token: A.token })).status === 403);
}
summary(); await db.end();
