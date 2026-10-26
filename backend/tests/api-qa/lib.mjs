import pg from 'pg';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The team's accounts: the git-ignored real file when present, otherwise the example file (local databases only)
const scriptsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'scripts');
const accountsFile = [process.env.TEAM_ACCOUNTS_FILE, path.join(scriptsDir, 'team-accounts.json'), path.join(scriptsDir, 'team-accounts.example.json')]
  .filter(Boolean).find((f) => fs.existsSync(f));
const teamConfig = JSON.parse(fs.readFileSync(accountsFile, 'utf8'));
export const TEAM = teamConfig.accounts;
export const TEAM_PASSWORD = teamConfig.password;

const DB_URL = process.env.QA_DATABASE_URL || 'postgresql://postgres:localdev@localhost:5432/coworking';
export const B = process.env.QA_API_URL || 'http://localhost:3001/api';
export const db = new pg.Client({ connectionString: DB_URL });
export async function api(path, { method = 'GET', token, body } = {}) {
  const r = await fetch(B + path, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, body: j };
}

const hasSequentialRun = (text) => {
  const t = text.toLowerCase();
  for (let i = 0; i + 2 < t.length; i++) {
    const [a, b, c] = [t.charCodeAt(i), t.charCodeAt(i + 1), t.charCodeAt(i + 2)];
    const digits = a >= 48 && a <= 57 && b >= 48 && b <= 57 && c >= 48 && c <= 57;
    const letters = a >= 97 && a <= 122 && b >= 97 && b <= 122 && c >= 97 && c <= 122;
    if ((digits || letters) && ((b - a === 1 && c - b === 1) || (a - b === 1 && b - c === 1))) return true;
  }
  return false;
};
/** A random password that meets the password policy (no sequential characters). */
export function strongPassword() {
  for (;;) {
    const pw = 'Tp#' + Math.random().toString(36).slice(2, 10) + 'Q7';
    if (!hasSequentialRun(pw) && /[a-z]/.test(pw)) return pw;
  }
}

/** One-time codes are random and emailed, so tests plant a code they know: the stored hash is replaced. */
export async function plantOtp(userId, purpose, code = '482916') {
  await db.query('update "OtpCode" set "isUsed"=true where "userId"=$1 and purpose=$2::"OtpPurpose" and "isUsed"=false', [userId, purpose]);
  await db.query(
    `insert into "OtpCode" (id, "userId", "codeHash", purpose, "expiresAt", "isUsed", attempts, "createdAt")
     values (gen_random_uuid()::text, $1, $2, $3::"OtpPurpose", (now() at time zone 'utc') + interval '10 minutes', false, 0, now() at time zone 'utc')`,
    [userId, await bcrypt.hash(code, 4), purpose]
  );
  return code;
}

/** Password step, then a planted code for the second step. */
export async function signIn(email, password) {
  const l = await api('/auth/login', { method: 'POST', body: { email, password } });
  const userId = l.body?.userId;
  if (!userId) return { ok: false, login: l };
  const code = await plantOtp(userId, 'LOGIN');
  const v = await api('/auth/verify-login', { method: 'POST', body: { userId, code } });
  return { ok: !!v.body?.token, token: v.body?.token, userId, login: l, verify: v };
}

/** Confirms a freshly registered account with a planted code. */
export async function verifyEmailWithPlantedOtp(userId) {
  const code = await plantOtp(userId, 'EMAIL_VERIFICATION');
  return api('/auth/verify-email', { method: 'POST', body: { userId, code } });
}

export async function makeUser(name, email, role, extra = {}) {
  const pw = strongPassword();
  const reg = await api('/auth/register', { method: 'POST', body: { name, email, password: pw, role, ...extra } });
  await db.query('update "User" set "emailVerified"=true where email=$1', [email]);
  const login = await api('/auth/login', { method: 'POST', body: { email, password: pw } });
  const userId = login.body?.userId || reg.body?.userId || (await db.query('select id from "User" where email=$1', [email])).rows[0].id;
  const code = await plantOtp(userId, 'LOGIN');
  const v = await api('/auth/verify-login', { method: 'POST', body: { userId, code } });
  return { email, pw, userId, token: v.body?.token, reg, login, v };
}
// Removes workspaces a suite created, children first, so they never show up in the catalog of later runs
export async function removeWorkspaces(ids) {
  ids = ids.filter(Boolean);
  if (!ids.length) return;
  const sections = `select id from "WorkspaceSection" where "workspaceId" = any($1)`;
  await db.query(`delete from "QrCheckIn" where "workspaceId" = any($1) or "sectionId" in (${sections})`, [ids]);
  await db.query(`delete from "DirectBooking" where "workspaceId" = any($1) or "sectionId" in (${sections})`, [ids]);
  await db.query(`delete from "HourlyBooking" where "workspaceId" = any($1) or "sectionId" in (${sections}) or "packageId" in (select id from "HourlyPackage" where "sectionId" in (${sections}))`, [ids]);
  await db.query(`delete from "HourlyPackage" where "sectionId" in (${sections})`, [ids]);
  await db.query(`delete from "WorkspaceSection" where "workspaceId" = any($1)`, [ids]);
  await db.query(`delete from "WorkspaceAmenity" where "workspaceId" = any($1)`, [ids]);
  await db.query(`delete from "Workspace" where id = any($1)`, [ids]);
}
let pass = 0, fail = 0; export const results = [];
export function check(name, cond, detail = '') { if (cond) pass++; else fail++; results.push({ name, ok: !!cond, detail }); console.log((cond ? 'PASS ' : 'FAIL ') + name + (detail ? '  -> ' + detail : '')); }
export const summary = () => console.log(`\n${pass} passed, ${fail} failed`);
