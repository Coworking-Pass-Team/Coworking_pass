// HR admin allocates company money into team members' own wallets (atomic, audited, idempotent, hidden from
// employees), and the one-time-code / password-reset flows (random codes, expiry, attempt limit, single use).
// The server under test is started with ALLOW_MASTER_OTP=true (see .claude/launch.json); the codes that are
// checked below are written into the database with a known hash, so the master code is never needed for them.
import bcrypt from 'bcryptjs';
import { api, db, makeUser, check, summary } from './lib.mjs';
await db.connect();
const run = Date.now().toString(36);
const mk = (n, role = 'B2C', extra = {}) => makeUser('QA ' + n, `qa.${n}.${run}@test.local`.toLowerCase(), role, extra);
const num = async (sql, params) => Number((await db.query(sql, params)).rows[0]?.v ?? 0);
const walletOf = (userId) => num('select balance v from "Wallet" where "userId"=$1', [userId]);

// ---------- Allocation ----------
const hr = await mk('alHr', 'HR_ADMIN', { companyName: 'QA Alloc Co ' + run });
let companyId = (await db.query('select id from "Company" where "hrAdminId"=$1', [hr.userId])).rows[0]?.id;
if (!companyId) {
  companyId = (await db.query(`insert into "Company" (id,"companyName","hrAdminId") values (gen_random_uuid(),$1,$2) returning id`, ['QA Alloc Co ' + run, hr.userId])).rows[0].id;
  await db.query('update "User" set "companyId"=$1 where id=$2', [companyId, hr.userId]);
}
const hr2 = await mk('alHr2', 'HR_ADMIN', { companyName: 'QA Other Co ' + run });
const [e1, e2, e3] = [await mk('alE1'), await mk('alE2'), await mk('alE3')];
const outsider = await mk('alOut');
const banned = await mk('alBanned');
for (const m of [e1, e2, e3, banned]) await api(`/companies/${companyId}/employees`, { method: 'POST', token: hr.token, body: { email: m.email } });
await db.query('update "User" set "isBanned"=true where id=$1', [banned.userId]);
await api(`/companies/${companyId}/deposit`, { method: 'POST', token: hr.token, body: { amount: 1000 } });
const balance = () => num('select balance v from "Company" where id=$1', [companyId]);
const allocate = (u, body, id = companyId) => api(`/companies/${id}/allocate`, { method: 'POST', token: u?.token, body });
const rid = () => `req-${run}-${Math.random().toString(36).slice(2, 10)}`;
const ledgerRows = (ref) => db.query(`select amount, "balanceAfter" b from "CompanyWalletTransaction" where "companyId"=$1 and type='ALLOCATION' and "referenceId" like $2 order by "createdAt", id`, [companyId, ref + ':%']);

console.log('\n## Employees never see the company money');
check('the company holds the deposit', (await balance()) === 1000);
const asEmployee = await api(`/companies/${companyId}`, { token: e1.token });
check('an employee can read the company they belong to', asEmployee.status === 200 && asEmployee.body?.companyName === 'QA Alloc Co ' + run);
check('but not its balance', !('balance' in (asEmployee.body || {})), JSON.stringify(Object.keys(asEmployee.body || {})));
check('nor the pass allocation', !('totalPassesAllocated' in (asEmployee.body || {})));
check('nor their colleagues\' names or emails', (asEmployee.body?.employees || []).every((x) => !x.email && !x.name));
check('the HR admin still sees the balance', (await api(`/companies/${companyId}`, { token: hr.token })).body?.balance === 1000);
check('an employee cannot read the allocation history', (await api(`/companies/${companyId}/allocate`, { token: e1.token })).status === 403);

console.log('\n## Who may allocate');
const body300 = { mode: 'EQUAL', amount: 300 };
check('an employee cannot allocate', (await allocate(e1, { ...body300, requestId: rid() })).status === 403);
check('an outsider cannot allocate', (await allocate(outsider, { ...body300, requestId: rid() })).status === 403);
check('another company\'s HR admin cannot allocate from this company', (await allocate(hr2, { ...body300, requestId: rid() })).status === 403);
check('an anonymous request is a 401', (await allocate(null, { ...body300, requestId: rid() })).status === 401);
check('nothing moved', (await balance()) === 1000 && (await walletOf(e1.userId)) === 0);

console.log('\n## Validation');
const bad = async (body) => (await allocate(hr, { requestId: rid(), ...body })).status;
check('a missing requestId is refused', (await allocate(hr, body300)).status === 400);
check('an unknown mode is refused', (await bad({ mode: 'SOMETHING', amount: 10 })) === 400);
check('zero, negative and non-numeric totals are refused', (await bad({ mode: 'EQUAL', amount: 0 })) === 400 && (await bad({ mode: 'EQUAL', amount: -5 })) === 400 && (await bad({ mode: 'EQUAL', amount: '50' })) === 400);
check('an amount too small to share is refused', (await bad({ mode: 'EQUAL', amount: 0.02 })) === 400);
check('an empty selection is refused', (await bad({ mode: 'SPECIFIC', allocations: [] })) === 400);
check('someone outside the team is refused', (await bad({ mode: 'SPECIFIC', allocations: [{ userId: outsider.userId, amount: 10 }] })) === 400);
check('the HR admin cannot pay themselves', (await bad({ mode: 'SPECIFIC', allocations: [{ userId: hr.userId, amount: 10 }] })) === 400);
check('a suspended member is refused', (await bad({ mode: 'SPECIFIC', allocations: [{ userId: banned.userId, amount: 10 }] })) === 400);
check('the same member twice is refused', (await bad({ mode: 'SPECIFIC', allocations: [{ userId: e1.userId, amount: 10 }, { userId: e1.userId, amount: 5 }] })) === 400);
check('a zero amount for one member is refused', (await bad({ mode: 'SPECIFIC', allocations: [{ userId: e1.userId, amount: 10 }, { userId: e2.userId, amount: 0 }] })) === 400);
check('nothing moved after all those refusals', (await balance()) === 1000 && (await walletOf(e1.userId)) === 0);

console.log('\n## Equal split');
const reqEqual = rid();
const equal = await allocate(hr, { requestId: reqEqual, mode: 'EQUAL', amount: 300 });
check('300 is shared between the three active members', equal.status === 201 && equal.body?.recipients === 3 && equal.body?.total === 300 && equal.body?.balance === 700, equal.status + ' ' + JSON.stringify(equal.body));
check('each personal wallet got 100', (await walletOf(e1.userId)) === 100 && (await walletOf(e2.userId)) === 100 && (await walletOf(e3.userId)) === 100);
check('the suspended member got nothing', (await walletOf(banned.userId)) === 0);
check('the company wallet went down by 300', (await balance()) === 700);
const rows = (await ledgerRows(`alloc:${reqEqual}`)).rows;
check('three company ledger rows with the running balance', rows.length === 3 && rows.map((r) => r.amount).every((a) => a === 100) && rows.map((r) => r.b).join() === '900,800,700', JSON.stringify(rows));
const walletRow = (await db.query(`select type, amount, description, "balanceAfter" b from "WalletTransaction" where "userId"=$1 and "referenceId"=$2`, [e1.userId, `alloc:${reqEqual}:${e1.userId}`])).rows[0];
check('and one wallet ledger entry per employee', walletRow?.type === 'DEPOSIT' && walletRow.amount === 100 && walletRow.b === 100 && /^Allocated by QA Alloc Co/.test(walletRow.description), JSON.stringify(walletRow));
check('each employee is told', (await num(`select count(*)::int v from "Notification" where "userId"=$1 and title='Funds added to your wallet'`, [e1.userId])) === 1);
const again = await allocate(hr, { requestId: reqEqual, mode: 'EQUAL', amount: 300 });
check('repeating the same request changes nothing', again.status === 200 && again.body?.duplicate === true && (await balance()) === 700 && (await walletOf(e1.userId)) === 100);
check('and does not notify twice', (await num(`select count(*)::int v from "Notification" where "userId"=$1 and title='Funds added to your wallet'`, [e1.userId])) === 1);

console.log('\n## Cents that do not divide stay in the company wallet');
const odd = await allocate(hr, { requestId: rid(), mode: 'EQUAL', amount: 100 });
check('100 shared three ways pays 33.33 each (99.99 in total)', odd.status === 201 && odd.body?.total === 99.99 && odd.body?.allocations?.every((a) => a.amount === 33.33), odd.status + ' ' + JSON.stringify(odd.body));
check('the company wallet went down by exactly what was paid', Math.round((await balance()) * 100) === 70000 - 9999);

console.log('\n## Chosen employees');
const before = await balance();
const specific = await allocate(hr, { requestId: rid(), mode: 'SPECIFIC', allocations: [{ userId: e1.userId, amount: 50 }, { userId: e2.userId, amount: 25.5 }] });
check('different amounts for chosen members', specific.status === 201 && specific.body?.total === 75.5, specific.status + ' ' + JSON.stringify(specific.body));
check('only those two wallets moved', Math.round((await walletOf(e1.userId)) * 100) === 18333 && Math.round((await walletOf(e2.userId)) * 100) === 15883 && Math.round((await walletOf(e3.userId)) * 100) === 13333);
check('the company wallet went down by 75.50', Math.round((before - (await balance())) * 100) === 7550);
const history = await api(`/companies/${companyId}/allocate`, { token: hr.token });
check('the HR admin sees the allocations with names', history.status === 200 && history.body.length >= 8 && history.body.some((h) => h.employeeName === 'QA alE1' && h.amount === 50), JSON.stringify(history.body?.slice(0, 2)));

console.log('\n## Not enough money, and nothing half done');
const left = await balance();
const tooMuch = await allocate(hr, { requestId: rid(), mode: 'SPECIFIC', allocations: [{ userId: e1.userId, amount: left }, { userId: e2.userId, amount: 1 }] });
check('an allocation above the balance is refused as a whole', tooMuch.status === 400 && tooMuch.body?.code === 'INSUFFICIENT_BALANCE', tooMuch.status + ' ' + JSON.stringify(tooMuch.body));
check('no wallet moved and no ledger row was written', (await balance()) === left && Math.round((await walletOf(e1.userId)) * 100) === 18333);
await db.query('update "Company" set balance=100 where id=$1', [companyId]);
const race = await Promise.all([1, 2].map(() => allocate(hr, { requestId: rid(), mode: 'SPECIFIC', allocations: [{ userId: e3.userId, amount: 80 }] })));
check('two simultaneous requests cannot spend the same money twice', race.filter((r) => r.status === 201).length === 1 && race.filter((r) => r.status === 400).length === 1, race.map((r) => r.status).join());
check('the balance is 20, never negative', (await balance()) === 20);

// ---------- One-time codes ----------
const KNOWN = '654321';
const plant = async (userId, purpose, { hash, minutes = 10 } = {}) => {
  await db.query(`update "OtpCode" set "isUsed"=true where "userId"=$1 and purpose=$2::"OtpPurpose"`, [userId, purpose]);
  await db.query(`insert into "OtpCode" (id,"userId","codeHash",purpose,"expiresAt","isUsed",attempts) values (gen_random_uuid(),$1,$2,$3::"OtpPurpose",$4::timestamp,false,0)`,
    [userId, hash ?? (await bcrypt.hash(KNOWN, 4)), purpose, new Date(Date.now() + minutes * 60_000).toISOString()]);
};
const latest = async (userId, purpose) => (await db.query(`select * from "OtpCode" where "userId"=$1 and purpose=$2::"OtpPurpose" order by "createdAt" desc limit 1`, [userId, purpose])).rows[0];

console.log('\n## Sign-in codes');
const u = await mk('otpUser');
const l1 = await api('/auth/login', { method: 'POST', body: { email: u.email, password: u.pw } });
check('signing in sends a code', l1.status === 200 && !!l1.body?.userId);
const c1 = await latest(u.userId, 'LOGIN');
check('it is stored hashed, valid ten minutes, no wrong guesses yet', c1 && c1.codeHash.startsWith('$2') && c1.attempts === 0 && c1.isUsed === false && Math.abs((new Date(c1.expiresAt) - new Date(c1.createdAt)) - 600_000) < 5_000, JSON.stringify(c1 && { exp: c1.expiresAt, created: c1.createdAt }));
const l2 = await api('/auth/login', { method: 'POST', body: { email: u.email, password: u.pw } });
const c2 = await latest(u.userId, 'LOGIN');
check('a new sign-in cancels the earlier code and issues a different one', c2.id !== c1.id && c2.codeHash !== c1.codeHash && (await db.query('select "isUsed" from "OtpCode" where id=$1', [c1.id])).rows[0].isUsed === true);
check('the response never carries the code', !JSON.stringify(l2.body).match(/\b\d{6}\b/));

await plant(u.userId, 'LOGIN');
const verify = (code) => api('/auth/verify-login', { method: 'POST', body: { userId: u.userId, code } });
const wrong = await verify('111111');
check('a wrong code is refused and counted', wrong.status === 400 && (await latest(u.userId, 'LOGIN')).attempts === 1, wrong.status + ' ' + JSON.stringify(wrong.body));
const right = await verify(KNOWN);
check('the right code signs in', right.status === 200 && !!right.body?.token, right.status + ' ' + JSON.stringify(right.body));
check('and works only once', (await verify(KNOWN)).status === 400);

await plant(u.userId, 'LOGIN');
for (let i = 0; i < 5; i++) await verify('000000');
check('five wrong guesses cancel the code', (await latest(u.userId, 'LOGIN')).isUsed === true);
const afterLock = await verify(KNOWN);
check('even the right code no longer works', afterLock.status === 400, afterLock.status + ' ' + JSON.stringify(afterLock.body));

await plant(u.userId, 'LOGIN', { minutes: -1 });
check('an expired code is refused', (await verify(KNOWN)).status === 400);
await plant(u.userId, 'LOGIN');
check('a code with letters or the wrong length is refused', (await verify('12ab56')).status === 400 && (await verify('12345')).status === 400);

console.log('\n## Sign-up codes');
const su = `qa.otpsignup.${run}@test.local`;
const reg = await api('/auth/register', { method: 'POST', body: { name: 'QA otp signup', email: su, password: 'Test#Signup1A', role: 'B2C' } });
check('signing up sends a code and leaves the account unverified', reg.status === 201 && (await num('select count(*)::int v from "User" where email=$1 and "emailVerified"=false', [su])) === 1, reg.status + ' ' + JSON.stringify(reg.body));
const suId = reg.body?.userId;
const suCode = await latest(suId, 'EMAIL_VERIFICATION');
check('the verification code is random, hashed and valid ten minutes', suCode && suCode.codeHash.startsWith('$2') && Math.abs((new Date(suCode.expiresAt) - new Date(suCode.createdAt)) - 600_000) < 5_000);
await plant(suId, 'EMAIL_VERIFICATION');
check('a wrong code does not verify the email', (await api('/auth/verify-email', { method: 'POST', body: { userId: suId, code: '222222' } })).status === 400 && (await num('select count(*)::int v from "User" where id=$1 and "emailVerified"=true', [suId])) === 0);
check('the right code verifies it', (await api('/auth/verify-email', { method: 'POST', body: { userId: suId, code: KNOWN } })).status === 200 && (await num('select count(*)::int v from "User" where id=$1 and "emailVerified"=true', [suId])) === 1);

console.log('\n## Password reset');
const r = await mk('resetUser');
const old = r.token;
const known = await api('/auth/forgot-password', { method: 'POST', body: { email: r.email } });
const unknown = await api('/auth/forgot-password', { method: 'POST', body: { email: `nobody.${run}@test.local` } });
check('known and unknown addresses get the same answer', known.status === 200 && unknown.status === 200 && JSON.stringify(known.body) === JSON.stringify(unknown.body), JSON.stringify([known.body, unknown.body]));
check('a code was prepared only for the real account', (await num(`select count(*)::int v from "OtpCode" where "userId"=$1 and purpose='PASSWORD_RESET'`, [r.userId])) === 1);
await api('/auth/forgot-password', { method: 'POST', body: { email: r.email } });
check('asking again within seconds does not send another code', (await num(`select count(*)::int v from "OtpCode" where "userId"=$1 and purpose='PASSWORD_RESET'`, [r.userId])) === 1);
check('an invalid email is a 400', (await api('/auth/forgot-password', { method: 'POST', body: { email: 'nope' } })).status === 400);
const bannedReset = await api('/auth/forgot-password', { method: 'POST', body: { email: banned.email } });
check('a suspended account gets the same answer but no code', bannedReset.status === 200 && (await num(`select count(*)::int v from "OtpCode" where "userId"=$1 and purpose='PASSWORD_RESET'`, [banned.userId])) === 0);

await plant(r.userId, 'PASSWORD_RESET');
const reset = (code, newPassword, email = r.email) => api('/auth/reset-password', { method: 'POST', body: { email, code, newPassword } });
check('checking a wrong code is refused and counted', (await api('/auth/verify-reset-code', { method: 'POST', body: { email: r.email, code: '333333' } })).status === 400 && (await latest(r.userId, 'PASSWORD_RESET')).attempts === 1);
const peek = await api('/auth/verify-reset-code', { method: 'POST', body: { email: r.email, code: KNOWN } });
check('checking the right code accepts it without using it up', peek.status === 200 && (await latest(r.userId, 'PASSWORD_RESET')).isUsed === false);
check('a short password is refused and the code survives', (await reset(KNOWN, 'short1')).status === 400 && (await latest(r.userId, 'PASSWORD_RESET')).isUsed === false);
check('a wrong code cannot reset the password', (await reset('444444', 'Brand#New123')).status === 400);
check('an unknown account cannot reset anything', (await reset(KNOWN, 'Brand#New123', `nobody.${run}@test.local`)).status === 400);
const done = await reset(KNOWN, 'Brand#New123');
check('the right code sets the new password', done.status === 200, done.status + ' ' + JSON.stringify(done.body));
check('the code cannot be used twice', (await reset(KNOWN, 'Another#Pass456')).status === 400);
check('the old password no longer signs in', (await api('/auth/login', { method: 'POST', body: { email: r.email, password: r.pw } })).status === 401);
const fresh = await api('/auth/login', { method: 'POST', body: { email: r.email, password: 'Brand#New123' } });
check('the new password does', fresh.status === 200 && !!fresh.body?.userId);
check('sessions from before the reset were ended', (await api('/wallet', { token: old })).status === 401, String((await api('/wallet', { token: old })).status));
check('every other unused code was cancelled', (await num(`select count(*)::int v from "OtpCode" where "userId"=$1 and "isUsed"=false and purpose='PASSWORD_RESET'`, [r.userId])) === 0);

await db.end();
summary();
process.exit(0);
