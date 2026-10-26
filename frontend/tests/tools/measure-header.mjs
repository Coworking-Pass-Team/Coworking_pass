// Header audit for every role at many widths (needs the local backend + frontend running and a local database).
// Run:  node tests/tools/measure-header.mjs [shots]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('@playwright/test');
import { makeUser, db, plantOtp, TEAM, TEAM_PASSWORD } from '../../../backend/tests/api-qa/lib.mjs';
import fs from 'node:fs';

const BASE = 'http://localhost:3000';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await db.connect();
const run = Date.now().toString(36);
const mkRole = async (n, role, extra) => { const u = await makeUser('Header ' + n, `qa.hdr${n}.${run}@test.local`, role, extra); return { email: u.email, pw: u.pw }; };
const roles = {
  hr: await mkRole('hr', 'HR_ADMIN', { companyName: 'Header Corp ' + run }),
  b2c: await mkRole('b2c', 'B2C'),
  admin: { email: TEAM.superAdmin.email, pw: TEAM_PASSWORD },
};


async function login(page, lang, { email, pw }) {
  await page.goto(BASE);
  await page.evaluate((l) => { localStorage.clear(); document.cookie = `cp_lang=${l}; path=/`; localStorage.setItem('cp_lang', l); }, lang);
  await page.reload(); await page.waitForLoadState('networkidle').catch(() => {}); await sleep(1200);
  for (let i = 0; i < 3 && !(await page.locator('input[type=email]').count()); i++) {
    await page.evaluate(() => { Array.from(document.querySelectorAll('button')).filter((b) => /^(تسجيل الدخول|Sign in|Log in|Login)$/i.test((b.textContent || '').trim())).forEach((b) => b.click()); });
    await sleep(800);
    if (!(await page.locator('input[type=email]').count())) { await page.evaluate(() => { const t = Array.from(document.querySelectorAll('button')).find((b) => /تبديل قائمة|toggle/i.test(b.getAttribute('aria-label') || '')); t && t.click(); }); await sleep(500); }
  }
  await page.locator('input[type=email]').fill(email); await page.locator('input[type=password]').fill(pw); await page.locator('button[type=submit]').click();
  const boxes = page.locator('input[maxlength="1"]'); await boxes.first().waitFor({ timeout: 15000 });
  const uid = (await db.query('select id from "User" where lower(email)=lower($1)', [email])).rows[0].id;
  const code = await plantOtp(uid, 'LOGIN');
  for (let i = 0; i < 6; i++) await boxes.nth(i).fill(code[i]);
  await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /تحقق وتابع|verify/i.test(x.textContent || '')); b && b.click(); });
  await sleep(6000);
}

const measure = () => {
  const header = document.querySelector('header');
  const row = header.firstElementChild;
  const nav = header.querySelector('nav');
  const kids = Array.from(row.children).map((c) => ({ el: c, r: c.getBoundingClientRect() }));
  // every visible leaf-ish control in the bar
  const controls = Array.from(row.querySelectorAll('button, a, nav')).map((e) => ({ name: (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 24), r: e.getBoundingClientRect(), tag: e.tagName })).filter((x) => x.r.width > 0 && x.r.height > 0);
  const overlaps = [];
  for (let i = 0; i < controls.length; i++) for (let j = i + 1; j < controls.length; j++) {
    const a = controls[i], b = controls[j];
    if (a.tag === 'NAV' || b.tag === 'NAV') continue;
    const ix = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
    const iy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
    if (ix > 2 && iy > 2) overlaps.push(`${a.name} x ${b.name} (${Math.round(ix)}px)`);
  }
  const navLinks = nav ? Array.from(nav.querySelectorAll('button, a')).map((b) => ({ t: (b.textContent || '').trim(), r: b.getBoundingClientRect() })) : [];
  const navBox = nav ? nav.getBoundingClientRect() : null;
  const clipped = navLinks.filter((l) => navBox && (l.r.right > navBox.right + 1 || l.r.left < navBox.left - 1)).map((l) => l.t);
  const rowBox = row.getBoundingClientRect();
  const outside = controls.filter((c) => c.tag !== 'NAV' && (c.r.right > innerWidth + 1 || c.r.left < -1)).map((c) => c.name);
  return { navScrollOverflow: nav ? nav.scrollWidth - nav.clientWidth : 0, clipped, overlaps, outside, navLinks: navLinks.length, width: innerWidth };
};

const out = [];
const browser = await chromium.launch();
for (const lang of ['ar', 'en']) {
  for (const [role, creds] of Object.entries(roles)) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    try { await login(page, lang, creds); } catch (e) { console.log('login failed', role, lang, e.message.slice(0, 80)); await ctx.close(); continue; }
    for (const w of [1024, 1100, 1280, 1366, 1440, 1520, 1600, 1920]) {
      await page.setViewportSize({ width: w, height: 800 }); await sleep(500);
      const m = await page.evaluate(measure);
      const bad = m.navScrollOverflow > 1 || m.clipped.length || m.overlaps.length || m.outside.length;
      out.push({ lang, role, w, ...m, bad });
      console.log(`${bad ? 'BAD ' : 'ok  '} ${lang} ${role.padEnd(5)} ${String(w).padStart(4)}px nav-overflow=${m.navScrollOverflow} clipped=[${m.clipped.join(',')}] overlaps=[${m.overlaps.join('; ')}] outside=[${m.outside.join(',')}]`);
      if (process.argv[2] === 'shots') await page.screenshot({ path: `./hdr-${lang}-${role}-${w}.png`, clip: { x: 0, y: 0, width: w, height: 90 } });
    }
    await ctx.close();
  }
}
await browser.close();
fs.writeFileSync('./header-measure.json', JSON.stringify(out, null, 1));
console.log('\nbad cases:', out.filter((o) => o.bad).length, 'of', out.length);
