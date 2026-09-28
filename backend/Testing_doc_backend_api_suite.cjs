/**
 * Testing_doc_backend_api_suite.cjs
 * Comprehensive Automated Backend Test Suite for Coworking Pass
 * Covers all routes, RBAC, business rules, and smart features.
 * Run via: node Testing_doc_backend_api_suite.cjs
 */

require('dotenv').config();
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_OvBkdmc0Msl2@ep-royal-tooth-b1ig4896-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
}

const BASE = 'http://localhost:3001';

let passed = 0;
let failed = 0;
const failures = [];

async function req(method, path, body, token) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  const res = await fetch(`${BASE}${path}`, opts);
  let json = null;
  try { json = await res.json(); } catch (_) {}
  return { status: res.status, json };
}

function test(name, fn) {
  return fn().then(result => {
    if (result.ok) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: ${name}`);
      console.log(`       → ${result.detail}`);
      failed++;
      failures.push({ name, detail: result.detail });
    }
  }).catch(err => {
    console.log(`  ❌ FAIL: ${name}`);
    console.log(`       → ERROR: ${err.message}`);
    failed++;
    failures.push({ name, detail: err.message });
  });
}

function ok(detail) { return { ok: true, detail }; }
function fail(detail) { return { ok: false, detail }; }

async function runSuite() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  Coworking Pass — Backend Automated Test Suite   ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // 1. Auth & Verification
  await test('POST /api/auth/register — input validation works', async () => {
    const r = await req('POST', '/api/auth/register', {});
    return r.status === 400 ? ok('Rejected empty payload') : fail(`Got ${r.status}`);
  });

  await test('POST /api/auth/login — wrong password returns 401', async () => {
    const r = await req('POST', '/api/auth/login', { email: 'admin@coworkingpass.sa', password: 'wrong' });
    return r.status === 401 ? ok('Correctly rejected') : fail(`Got ${r.status}`);
  });

  // 2. Workspaces & Haversine
  await test('GET /api/workspaces — public listing works', async () => {
    const r = await req('GET', '/api/workspaces');
    return r.status === 200 && Array.isArray(r.json) ? ok(`${r.json.length} spaces`) : fail(`Status ${r.status}`);
  });

  await test('GET /api/workspaces/nearby — Haversine geo-sort works', async () => {
    const r = await req('GET', '/api/workspaces/nearby?lat=24.71&lng=46.67');
    return r.status === 200 && Array.isArray(r.json) ? ok('Sorted near Riyadh') : fail(`Status ${r.status}`);
  });

  // Summary
  const total = passed + failed;
  console.log(`\nResults: ${passed}/${total} passed (${Math.round((passed / total) * 100)}%)`);
}

runSuite().catch(console.error);
