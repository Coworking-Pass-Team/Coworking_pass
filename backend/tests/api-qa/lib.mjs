import pg from 'pg';
const DB_URL = process.env.QA_DATABASE_URL || 'postgresql://postgres:localdev@localhost:5432/coworking';
export const B = process.env.QA_API_URL || 'http://localhost:3001/api';
export const db = new pg.Client({ connectionString: DB_URL });
export async function api(path, { method = 'GET', token, body } = {}) {
  const r = await fetch(B + path, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, body: j };
}
export async function makeUser(name, email, role, extra = {}) {
  const pw = 'Test#' + Math.random().toString(36).slice(2, 10) + 'A1';
  const reg = await api('/auth/register', { method: 'POST', body: { name, email, password: pw, role, ...extra } });
  await db.query('update "User" set "emailVerified"=true where email=$1', [email]);
  const login = await api('/auth/login', { method: 'POST', body: { email, password: pw } });
  const userId = login.body?.userId || reg.body?.userId || (await db.query('select id from "User" where email=$1', [email])).rows[0].id;
  const v = await api('/auth/verify-login', { method: 'POST', body: { userId, code: '123456' } });
  return { email, pw, userId, token: v.body?.token, reg, login, v };
}
let pass = 0, fail = 0; export const results = [];
export function check(name, cond, detail = '') { if (cond) pass++; else fail++; results.push({ name, ok: !!cond, detail }); console.log((cond ? 'PASS ' : 'FAIL ') + name + (detail ? '  -> ' + detail : '')); }
export const summary = () => console.log(`\n${pass} passed, ${fail} failed`);
