// Company employees ask to join a company (at sign-up or later) by the HR admin's email; only the HR admin approves.
// Nobody joins a company directly from the sign-up form.
import { api, db, makeUser, check, summary, verifyEmailWithPlantedOtp } from './lib.mjs';
await db.connect();
const run = Date.now().toString(36);
const mk = (n, role = 'B2C', extra = {}) => makeUser('QA ' + n, `qa.${n}.${run}@test.local`.toLowerCase(), role, extra);
const notes = async (userId, title) => (await db.query('select count(*)::int n from "Notification" where "userId"=$1 and title=$2', [userId, title])).rows[0].n;
const companyOf = async (id) => (await db.query('select "companyId" from "User" where id=$1', [id])).rows[0]?.companyId;

const hr = await mk('joinHr', 'HR_ADMIN', { companyName: 'QA Join Co ' + run });
const companyId = (await db.query('select id from "Company" where "hrAdminId"=$1', [hr.userId])).rows[0]?.id;
const otherHr = await mk('joinOtherHr', 'HR_ADMIN', { companyName: 'QA Other Co ' + run });
check('test companies exist', Boolean(companyId));

console.log('\n## Sign-up as a company employee');
const unknown = await api('/auth/register', { method: 'POST', body: { name: 'QA Emp', email: `qa.empx.${run}@test.local`, password: 'Tq#8040Zx', role: 'B2C', companyHrEmail: `nobody.${run}@test.local` } });
check('an unknown HR email is refused before the account is created', unknown.status === 404
  && (await db.query('select count(*)::int n from "User" where email=$1', [`qa.empx.${run}@test.local`])).rows[0].n === 0, 'status ' + unknown.status);
const ownEmail = await api('/auth/register', { method: 'POST', body: { name: 'QA Emp', email: hr.email, password: 'Tq#8040Zx', role: 'B2C', companyHrEmail: hr.email } });
check('an employee cannot name their own email as the HR email', ownEmail.status === 400);

const forged = await api('/auth/register', { method: 'POST', body: { name: 'QA Forged', email: `qa.forged.${run}@test.local`, password: 'Tq#8040Zx', role: 'B2C', companyId } });
check('a companyId sent to sign-up is ignored', forged.status === 201 && (await companyOf(forged.body?.userId)) === null, 'status ' + forged.status);

const empEmail = `qa.emp.${run}@test.local`;
const reg = await api('/auth/register', { method: 'POST', body: { name: 'QA Employee', email: empEmail, password: 'Tq#8040Zx', role: 'B2C', companyHrEmail: hr.email.toUpperCase() } });
const empId = reg.body?.userId;
check('sign-up with the HR email succeeds (case-insensitive)', reg.status === 201 && Boolean(empId), 'status ' + reg.status);
check('the account is not in the company yet', (await companyOf(empId)) === null);
check('the HR admin is not told before the email is verified', (await notes(hr.userId, 'New team join request')) === 0);
let list = await api('/company-join-requests', { token: hr.token });
check('unverified sign-ups are not listed for the HR admin', list.status === 200 && list.body.length === 0);

await verifyEmailWithPlantedOtp(empId);
check('verifying the email tells the HR admin', (await notes(hr.userId, 'New team join request')) === 1);
list = await api('/company-join-requests', { token: hr.token });
const pending = list.body?.[0];
check('the HR admin sees the pending request', list.body?.length === 1 && pending?.user?.email === empEmail);
check('another HR admin does not see it', (await api('/company-join-requests', { token: otherHr.token })).body?.length === 0);

console.log('\n## Answering');
check('another HR admin cannot approve it', (await api(`/company-join-requests/${pending.id}`, { method: 'PATCH', token: otherHr.token, body: { action: 'approve' } })).status === 403);
check('an unknown action is refused', (await api(`/company-join-requests/${pending.id}`, { method: 'PATCH', token: hr.token, body: { action: 'maybe' } })).status === 400);
const approved = await api(`/company-join-requests/${pending.id}`, { method: 'PATCH', token: hr.token, body: { action: 'approve' } });
check('the HR admin approves it and the account joins the company', approved.status === 200 && (await companyOf(empId)) === companyId);
check('the employee is told', (await notes(empId, 'Added to a company team')) === 1);
check('a request cannot be answered twice', (await api(`/company-join-requests/${pending.id}`, { method: 'PATCH', token: hr.token, body: { action: 'decline' } })).status === 409);

console.log('\n## Asking from an existing account');
const member = await mk('joinMember');
const mine = await api('/company-join-requests', { token: member.token });
check('a member without a request sees none', mine.status === 200 && mine.body?.request === null && mine.body?.company === null);
check('a bad email is refused', (await api('/company-join-requests', { method: 'POST', token: member.token, body: { hrEmail: 'not-an-email' } })).status === 400);
const asked = await api('/company-join-requests', { method: 'POST', token: member.token, body: { hrEmail: hr.email } });
check('a member asks to join by the HR email', asked.status === 201 && asked.body?.companyName === 'QA Join Co ' + run);
check('the HR admin is told right away (the member is verified)', (await notes(hr.userId, 'New team join request')) === 2);
check('asking the same company twice is a 409', (await api('/company-join-requests', { method: 'POST', token: member.token, body: { hrEmail: hr.email } })).status === 409);
const minePending = await api('/company-join-requests', { token: member.token });
check('the member sees the pending request with the company name', minePending.body?.request?.company?.companyName === 'QA Join Co ' + run);
check('HR admins cannot ask to join', (await api('/company-join-requests', { method: 'POST', token: otherHr.token, body: { hrEmail: hr.email } })).status === 403);
const stranger = await mk('joinStranger');
check('someone else cannot withdraw the request', (await api(`/company-join-requests/${asked.body.id}`, { method: 'DELETE', token: stranger.token })).status === 404);
check('the member withdraws it', (await api(`/company-join-requests/${asked.body.id}`, { method: 'DELETE', token: member.token })).status === 200
  && (await api('/company-join-requests', { token: member.token })).body?.request === null);

const again = await api('/company-join-requests', { method: 'POST', token: member.token, body: { hrEmail: hr.email } });
const declined = await api(`/company-join-requests/${again.body?.id}`, { method: 'PATCH', token: hr.token, body: { action: 'decline' } });
check('the HR admin declines a request', declined.status === 200 && (await companyOf(member.userId)) === null);
check('the member is told it was declined', (await notes(member.userId, 'Team join request declined')) === 1);

const direct = await api('/company-join-requests', { method: 'POST', token: member.token, body: { hrEmail: hr.email } });
await api(`/companies/${companyId}/employees`, { method: 'POST', token: hr.token, body: { email: member.email } });
check('adding someone from the team page answers their request', (await db.query('select status from "CompanyJoinRequest" where id=$1', [direct.body?.id])).rows[0]?.status === 'APPROVED');
check('a team member cannot ask to join another company', (await api('/company-join-requests', { method: 'POST', token: member.token, body: { hrEmail: otherHr.email } })).status === 409);
const sync = await api('/company-join-requests', { token: member.token });
check('the member sees their current company (so the app catches up)', sync.body?.company?.id === companyId);

await db.end();
summary();
