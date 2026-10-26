// Company team membership is stored on the server: the HR admin adds existing member accounts by email
// and removes them; members cannot remove themselves; nobody else can change the team.
import { api, db, makeUser, check, summary } from './lib.mjs';
await db.connect();
const run = Date.now().toString(36);
const mk = (n, role = 'B2C', extra = {}) => makeUser('QA ' + n, `qa.${n}.${run}@test.local`.toLowerCase(), role, extra);

const hr = await mk('teamHr', 'HR_ADMIN', { companyName: 'QA Team Co ' + run });
let companyId = (await db.query('select id from "Company" where "hrAdminId"=$1', [hr.userId])).rows[0]?.id;
if (!companyId) {
  companyId = (await db.query(`insert into "Company" (id,"companyName","hrAdminId") values (gen_random_uuid(),$1,$2) returning id`, ['QA Team Co ' + run, hr.userId])).rows[0].id;
  await db.query('update "User" set "companyId"=$1 where id=$2', [companyId, hr.userId]);
}
const member = await mk('teamMember');
const outsider = await mk('teamOutsider');
const add = (u, email) => api(`/companies/${companyId}/employees`, { method: 'POST', token: u.token, body: { email } });
const remove = (u, userId) => api(`/companies/${companyId}/employees/${userId}`, { method: 'DELETE', token: u.token });
const companyOf = async (id) => (await db.query('select "companyId" from "User" where id=$1', [id])).rows[0]?.companyId;

console.log('\n## Adding');
check('a customer cannot add people to a company', (await add(outsider, member.email)).status === 403);
check('an unknown email is a 404 with a clear message', (await add(hr, `nobody.${run}@test.local`)).status === 404);
const added = await add(hr, member.email.toUpperCase());
check('the HR admin adds an existing member (email is case-insensitive)', added.status === 201 && added.body?.id === member.userId, 'status ' + added.status);
check('the membership is saved on the server', (await companyOf(member.userId)) === companyId);
check('adding the same person again is a 409', (await add(hr, member.email)).status === 409);
check('the member is told they were added', (await db.query(`select count(*)::int n from "Notification" where "userId"=$1 and title='Added to a company team'`, [member.userId])).rows[0].n === 1);

console.log('\n## Removing');
check('another member cannot remove a colleague', (await remove(outsider, member.userId)).status === 403);
check('the HR admin cannot be removed', (await remove(hr, hr.userId)).status === 400);
check('the HR admin removes the member', (await remove(hr, member.userId)).status === 200 && (await companyOf(member.userId)) === null);
check('removing someone not in the team is a 404', (await remove(hr, member.userId)).status === 404);
check('a member cannot remove themselves from the company', (await add(hr, member.email)).status === 201 && (await remove(member, member.userId)).status === 403 && (await companyOf(member.userId)) === companyId);
check('nobody is told a member left (leaving is not possible)', (await db.query(`select count(*)::int n from "Notification" where "userId"=$1 and title='A member left your team'`, [hr.userId])).rows[0].n === 0);

await db.end();
summary();
