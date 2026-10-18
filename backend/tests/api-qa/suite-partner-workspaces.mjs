import { api, db, makeUser, check, summary } from './lib.mjs';
await db.connect();
const run = Date.now().toString(36);
const loginAs = async (email, pw) => {
  const l = await api('/auth/login', { method: 'POST', body: { email, password: pw } });
  const v = await api('/auth/verify-login', { method: 'POST', body: { userId: l.body.userId, code: '123456' } });
  return { token: v.body?.token, userId: l.body.userId };
};
const mk = (n, role, x = {}) => makeUser('QA ' + n, `qa.${n}.${run}@test.local`.toLowerCase(), role, x);
const denied = (r) => r.status === 401 || r.status === 403;
const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const admin = await loginAs('admin@coworkingpass.sa', 'password');
const pA = await mk('pwsA', 'PARTNER_ADMIN', { businessName: 'QA WS A ' + run, crNumber: '1010111111' });
const pB = await mk('pwsB', 'PARTNER_ADMIN', { businessName: 'QA WS B ' + run, crNumber: '1010222222' });
const cust = await mk('pwsC', 'B2C');
const partnerOf = async (email) => (await db.query(`select id from "Partner" where lower("contactEmail")=lower($1)`, [email])).rows[0]?.id;
const idA = await partnerOf(pA.email), idB = await partnerOf(pB.email);
for (const id of [idA, idB]) await api('/partners/' + id, { method: 'PUT', token: admin.token, body: { status: 'APPROVED' } });
Object.assign(pA, await loginAs(pA.email, pA.pw));
Object.assign(pB, await loginAs(pB.email, pB.pw));

console.log('\n## Partner creates a workspace');
const created = await api('/workspaces', { method: 'POST', token: pA.token, body: { partnerId: idA, name: 'QA Own ' + run, city: 'Riyadh', totalCapacity: 5 } });
check('partner can create a workspace with their own partnerId', created.status === 201 || created.status === 200, 'status ' + created.status);
const stale = await api('/workspaces', { method: 'POST', token: pA.token, body: { partnerId: idB, name: 'QA Stale ' + run, city: 'Riyadh', totalCapacity: 5 } });
check('a stale or foreign partnerId from the browser does not break creation', stale.status === 201 || stale.status === 200, 'status ' + stale.status);
const none = await api('/workspaces', { method: 'POST', token: pA.token, body: { name: 'QA NoId ' + run, city: 'Riyadh', totalCapacity: 5 } });
check('creation without a partnerId works', none.status === 201 || none.status === 200, 'status ' + none.status);
const staleOwner = (await db.query(`select "partnerId" from "Workspace" where id=$1`, [(stale.body?.workspace?.id ?? stale.body?.id)])).rows[0]?.partnerId;
check('the workspace is always attached to the signed-in partner, never to the id the browser sent', staleOwner === idA, String(staleOwner));
check('a customer still cannot create a workspace', denied(await api('/workspaces', { method: 'POST', token: cust.token, body: { name: 'x', city: 'Riyadh' } })));

console.log('\n## Partner deletes a workspace');
check('another partner cannot delete it', denied(await api('/workspaces/' + (created.body.workspace?.id ?? created.body.id), { method: 'DELETE', token: pB.token })));
const del = await api('/workspaces/' + (created.body.workspace?.id ?? created.body.id), { method: 'DELETE', token: pA.token });
check('the owner deletes it with a 200 and a JSON body', del.status === 200 && del.body && typeof del.body === 'object', JSON.stringify(del.body));
const again = await api('/workspaces/' + (created.body.workspace?.id ?? created.body.id), { method: 'DELETE', token: pA.token });
check('deleting it a second time is a 404 (not a permission error)', again.status === 404, 'status ' + again.status);
check('a customer still cannot delete a workspace', denied(await api('/workspaces/' + (stale.body?.workspace?.id ?? stale.body?.id), { method: 'DELETE', token: cust.token })));

console.log('\n## Capacity 0 means full, never unlimited');
const zero = await api('/workspaces', { method: 'POST', token: pA.token, body: { partnerId: idA, name: 'QA Zero ' + run, city: 'Riyadh', totalCapacity: 0 } });
const zid = (zero.body?.workspace?.id ?? zero.body?.id);
await db.query(`update "Workspace" set "totalCapacity"=0 where id=$1`, [zid]);
await db.query(`delete from "WorkspaceSection" where "workspaceId"=$1`, [zid]);
const av = await api(`/workspaces/${zid}/availability?plan=daily&date=${day(3)}&seats=1`);
check('availability says a workspace with no seats is not available', av.body?.available === false, JSON.stringify(av.body));
const sec = await db.query(`insert into "WorkspaceSection" (id,"workspaceId",type,name,capacity,"dailyRate") values (gen_random_uuid(),$1,'DESK','QA zero sec',0,50) returning id`, [zid]);
const bk = await api('/direct-bookings', { method: 'POST', token: cust.token, body: { workspaceId: zid, sectionId: sec.rows[0].id, durationType: 'DAILY', bookingDate: day(3), seats: 1 } });
check('a direct booking on a workspace with no seats is refused', bk.status === 409 || bk.status === 400, 'status ' + bk.status + ' ' + JSON.stringify(bk.body).slice(0, 80));
await db.query(`update "WorkspaceSection" set capacity=4 where id=$1`, [sec.rows[0].id]);
const list = (await api('/workspaces')).body.find((w) => w.id === zid);
check('a workspace saved with 0 but with 4 section seats shows 4 in the catalog', list?.totalCapacity === 4 && list?.availableCapacity === 4, JSON.stringify({ t: list?.totalCapacity, a: list?.availableCapacity }));

await db.query(`delete from "Workspace" where id = any($1)`, [[(stale.body?.workspace?.id ?? stale.body?.id), (none.body?.workspace?.id ?? none.body?.id), zid].filter(Boolean)]).catch(() => {});
await db.end();
summary();
process.exit(0);
