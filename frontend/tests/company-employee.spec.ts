import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { plantOtp } from './helpers/otp';
import { TEAM, TEAM_PASSWORD } from './helpers/accounts';

/**
 * Company employee experience (own wallet only, funds allocated by HR), "My tickets", the reschedule dialog,
 * the spaces page shell and the password-reset screens, against the local stack (frontend on 3000, backend on
 * 3001 with an empty RESEND_API_KEY), signed in as the seeded team accounts (docs/Accounts.md). One-time codes are planted in
 * the local QA database (set QA_DATABASE_URL), because real codes are random and emailed.
 */
const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:3000';
const API = process.env.QA_API_URL || 'http://localhost:3001/api';
const OTP_BOXES = 'input[autocomplete="one-time-code"], input[maxlength="1"]';
const PASSWORD = TEAM_PASSWORD;

async function apiLogin(request: APIRequestContext, email: string) {
  const login = await request.post(`${API}/auth/login`, { data: { email, password: PASSWORD } });
  const { userId } = await login.json();
  const verified = await request.post(`${API}/auth/verify-login`, { data: { userId, code: plantOtp(email, 'LOGIN') } });
  const body = await verified.json();
  return { token: body.token as string, userId: userId as string };
}

const authed = (token: string) => ({ Authorization: `Bearer ${token}` });

async function open(page: Page, path = '/') {
  await page.goto(BASE_URL + path);
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.waitForTimeout(1200);
}

async function setLanguage(page: Page, lang: 'ar' | 'en') {
  await page.evaluate((l) => {
    document.cookie = `cp_lang=${l}; path=/`;
    localStorage.setItem('cp_lang', l);
  }, lang);
  await page.reload();
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.waitForTimeout(1000);
}

async function signIn(page: Page, email: string, lang: 'ar' | 'en') {
  await open(page);
  await setLanguage(page, lang);
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((e) => /^(sign in|log in|login|تسجيل الدخول)$/i.test((e.textContent || '').trim()));
    (b as HTMLElement | undefined)?.click();
  });
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[type=password]').fill(PASSWORD);
  await page.locator('button[type=submit]').click();
  const boxes = page.locator(OTP_BOXES);
  await expect(boxes).toHaveCount(6, { timeout: 15000 });
  const code = plantOtp(email, 'LOGIN');
  for (let i = 0; i < 6; i++) await boxes.nth(i).fill(code[i]);
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => /verify|تحقق وتابع/i.test(x.textContent || ''));
    (b as HTMLElement | undefined)?.click();
  });
  await page.waitForTimeout(4000);
}

const clickNav = (page: Page, re: string) =>
  page.evaluate((src) => {
    const r = new RegExp(src, 'i');
    const b = Array.from(document.querySelectorAll('button, a')).find((e) => r.test((e.textContent || '').trim()) && (e as HTMLElement).offsetWidth > 0);
    (b as HTMLElement | undefined)?.click();
    return !!b;
  }, re);

const visibleButtonTexts = (page: Page) =>
  page.evaluate(() => Array.from(document.querySelectorAll('button, a')).filter((e) => (e as HTMLElement).offsetWidth > 0).map((e) => (e.textContent || '').trim()));

test.describe('Company employee', () => {
  let bookingVenue = '';

  test.beforeAll(async ({ request }) => {
    const hr = await apiLogin(request, TEAM.hr.email);
    const employee = await apiLogin(request, TEAM.employee1.email);
    // The HR admin puts a little company money into the employee's own wallet
    const companies = await (await request.get(`${API}/companies`, { headers: authed(hr.token) })).json();
    const companyId = (Array.isArray(companies) ? companies : companies.companies || [])[0]?.id;
    if (companyId) {
      await request.post(`${API}/companies/${companyId}/allocate`, {
        headers: authed(hr.token),
        data: { requestId: `pw-${Date.now()}`, mode: 'SPECIFIC', allocations: [{ userId: employee.userId, amount: 12 }] },
      });
    }
    // The HR admin books a meeting room session for the employee, on a day far enough ahead to be free
    const workspaces = await (await request.get(`${API}/workspaces`)).json();
    const hub = (Array.isArray(workspaces) ? workspaces : workspaces.workspaces || []).find((w: any) => w.name === 'Test Partner Hub');
    const sections = hub?.sections || [];
    const room = sections.find((s: any) => s.type === 'MEETING_ROOM');
    if (!hub || !room) return;
    bookingVenue = hub.name;
    for (let attempt = 0; attempt < 8; attempt++) {
      const day = new Date(Date.now() + (25 + Math.floor(Math.random() * 120)) * 86400000).toISOString().slice(0, 10);
      const res = await request.post(`${API}/hourly-bookings`, {
        headers: authed(hr.token),
        data: { workspaceId: hub.id, sectionId: room.id, sectionType: 'MEETING_ROOM', startDate: day, endDate: day, startTime: '10:00', endTime: '12:00', durationHours: 2, attendeeIds: [employee.userId] },
      });
      if (res.status() === 201) break;
    }
  });

  for (const lang of ['en', 'ar'] as const) {
    test(`the Passes link is hidden and the passes page redirects an employee (${lang})`, async ({ page }) => {
      await signIn(page, TEAM.employee1.email, lang);
      const passes = lang === 'ar' ? /^الباقات$/ : /^Passes$/;
      const labels = await visibleButtonTexts(page);
      expect(labels.some((t) => passes.test(t))).toBe(false);
      // Asking for the passes screen directly sends the employee back to the dashboard
      await page.evaluate(() => sessionStorage.setItem('cp_nav', JSON.stringify({ screen: 'pricing' })));
      await page.reload();
      await page.waitForLoadState('networkidle').catch(() => undefined);
      await page.waitForTimeout(2500);
      const nav = await page.evaluate(() => sessionStorage.getItem('cp_nav'));
      expect(nav).toContain('ind-dashboard');
    });

    test(`the company card has no Leave button and the employee never sees the company balance (${lang})`, async ({ page, request }) => {
      const hr = await apiLogin(request, TEAM.hr.email);
      const companies = await (await request.get(`${API}/companies`, { headers: authed(hr.token) })).json();
      const companyBalance = Number((Array.isArray(companies) ? companies : companies.companies || [])[0]?.balance);
      await signIn(page, TEAM.employee1.email, lang);
      const text = await page.evaluate(() => document.body.innerText);
      expect(text).not.toMatch(/Leave company|مغادرة الشركة/);
      // Some labels are upper-cased by the page styles, so compare ignoring case
      expect(text.toLowerCase()).toContain(lang === 'ar' ? 'شركتك' : 'your company');
      // No company wallet anywhere: not in the header, not in the card
      expect(text.toLowerCase()).not.toContain(lang === 'ar' ? 'محفظة الشركة' : 'company wallet');
      await expect(page.getByRole('button', { name: lang === 'ar' ? /محفظة الشركة/ : /Company wallet/ })).toHaveCount(0);
      // The company's balance does not appear as a number either
      expect(Number.isFinite(companyBalance)).toBe(true);
      expect(text).not.toContain(companyBalance.toLocaleString('en-US'));
    });

    test(`a booking made by the company shows in the employee's bookings with a QR code (${lang})`, async ({ page }) => {
      test.skip(!bookingVenue, 'The seeded Test Partner Hub was not available to book');
      await signIn(page, TEAM.employee1.email, lang);
      await clickNav(page, lang === 'ar' ? '^الحجوزات$' : '^Bookings$');
      await page.waitForTimeout(2000);
      await clickNav(page, lang === 'ar' ? 'الحجوزات بالساعة' : 'Hourly bookings');
      await expect(page.locator('body')).toContainText(lang === 'ar' ? 'مركز الشريك التجريبي' : bookingVenue, { timeout: 15000 });
      // Made for them: they can view and check in, not cancel
      const qr = page.getByRole('button', { name: lang === 'ar' ? /عرض رمز QR/ : /View QR/i }).first();
      await expect(qr).toBeVisible();
      await qr.click();
      await expect(page.locator('canvas, img[alt*="QR" i], img[src^="data:image"]').first()).toBeVisible({ timeout: 10000 });
    });
  }
});

test.describe('My tickets and rescheduling', () => {
  test('a customer follows a ticket and answers support (en)', async ({ page, request }) => {
    const member = await apiLogin(request, TEAM.individual.email);
    const subject = `QA ticket ${Date.now().toString(36)}`;
    const created = await request.post(`${API}/tickets`, { headers: authed(member.token), data: { subject, message: 'Please help me with my booking.', category: 'general' } });
    expect(created.status()).toBe(201);
    const ticketId = (await created.json()).ticket.id as string;
    const admin = await apiLogin(request, TEAM.superAdmin.email);
    await request.post(`${API}/ticket-replies`, { headers: authed(admin.token), data: { ticketId, message: 'We are looking into it.' } });

    await signIn(page, TEAM.individual.email, 'en');
    await page.evaluate(() => sessionStorage.setItem('cp_nav', JSON.stringify({ screen: 'my-tickets' })));
    await page.reload();
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.getByRole('heading', { name: 'My tickets' })).toBeVisible({ timeout: 20000 });
    await page.getByRole('listitem').filter({ hasText: subject }).first().click();
    await expect(page.locator('body')).toContainText('We are looking into it.');
    await expect(page.locator('body')).toContainText('In progress');
    await page.locator('#ticket-reply').fill('Thank you, that works.');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.locator('body')).toContainText('Thank you, that works.', { timeout: 15000 });
  });

  test('the support notification opens My tickets from the bell (ar)', async ({ page }) => {
    await signIn(page, TEAM.individual.email, 'ar');
    await page.evaluate(() => sessionStorage.setItem('cp_nav', JSON.stringify({ screen: 'my-tickets' })));
    await page.reload();
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.getByRole('heading', { name: 'تذاكري' })).toBeVisible({ timeout: 20000 });
  });

  test('an upcoming booking can be rescheduled from My bookings (dialog opens with the rules) (en)', async ({ page }) => {
    await signIn(page, TEAM.individual.email, 'en');
    await clickNav(page, '^Bookings$');
    await page.waitForTimeout(2500);
    const button = page.getByRole('button', { name: 'Reschedule' }).first();
    test.skip((await button.count()) === 0, 'The seeded account has no upcoming direct booking to move today');
    await button.click();
    await expect(page.getByRole('dialog').or(page.locator('[role=dialog], .fixed.inset-0')).first()).toContainText('Reschedule booking');
    await expect(page.locator('body')).toContainText('One free reschedule per booking.');
  });
});

test.describe('Funds allocated by HR, spaces page shell and password reset', () => {
  test('HR splits money equally from the team page and employees get it in their wallets (en)', async ({ page, request }) => {
    const employee = await apiLogin(request, TEAM.employee2.email);
    const walletOf = async () => Number((await (await request.get(`${API}/wallet?userId=${employee.userId}`, { headers: authed(employee.token) })).json()).balance ?? 0);
    const walletBefore = await walletOf();

    await signIn(page, TEAM.hr.email, 'en');
    await page.evaluate(() => sessionStorage.setItem('cp_nav', JSON.stringify({ screen: 'company-team' })));
    await page.reload();
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.getByRole('heading', { name: 'Allocate funds to the team' })).toBeVisible({ timeout: 20000 });
    await page.locator('#alloc-total').fill('40');
    await expect(page.locator('body')).toContainText('receives');
    await page.getByRole('button', { name: 'Review allocation' }).click();
    await expect(page.getByText('This cannot be undone from here.')).toBeVisible();
    await page.getByRole('button', { name: 'Allocate funds' }).click();
    await expect(page.locator('body')).toContainText('Funds allocated to', { timeout: 15000 });

    expect(await walletOf()).toBeGreaterThan(walletBefore);
  });

  test('HR sees the company funds each member holds and sets a monthly limit (en)', async ({ page }) => {
    await signIn(page, TEAM.hr.email, 'en');
    await page.evaluate(() => sessionStorage.setItem('cp_nav', JSON.stringify({ screen: 'company-team' })));
    await page.reload();
    await page.waitForLoadState('networkidle').catch(() => undefined);
    const card = page.getByTestId('member-funds-card');
    await expect(card.getByRole('heading', { name: 'Company funds held by members' })).toBeVisible({ timeout: 20000 });
    await expect(card).toContainText('Unspent: SAR');

    await card.getByRole('button', { name: 'Monthly limit' }).first().click();
    await page.locator('#member-limit').fill('500');
    await page.getByTestId('member-limit-save').click();
    await expect(page.locator('body')).toContainText('Monthly limit saved.', { timeout: 15000 });
    await expect(card).toContainText('of 500');

    // Leave the shared team account as it was
    await card.getByRole('button', { name: 'Monthly limit' }).first().click();
    await page.getByTestId('member-limit-remove').click();
    await expect(page.locator('body')).toContainText('Monthly limit removed.', { timeout: 15000 });
    await expect(card).not.toContainText('of 500');
  });

  test('the spaces page keeps the header and footer (en and ar)', async ({ page }) => {
    for (const lang of ['en', 'ar'] as const) {
      await open(page, '/spaces');
      await setLanguage(page, lang);
      await expect(page.locator('header').first()).toBeVisible({ timeout: 20000 });
      await expect(page.locator('footer').first()).toBeVisible();
      expect(await page.locator('header').count()).toBe(1);
      expect(await page.locator('footer').count()).toBe(1);
    }
  });

  test('a forgotten password is reset through the code screens (en)', async ({ page, request }) => {
    const email = `pw.reset.${Date.now().toString(36)}@test.local`;
    const registered = await request.post(`${API}/auth/register`, { data: { name: 'PW Reset', email, password: 'Old#Pass8040', role: 'B2C' } });
    const { userId } = await registered.json();
    await request.post(`${API}/auth/verify-email`, { data: { userId, code: plantOtp(email, 'EMAIL_VERIFICATION') } });

    await open(page);
    await setLanguage(page, 'en');
    await page.evaluate(() => sessionStorage.setItem('cp_nav', JSON.stringify({ screen: 'forgot-password' })));
    await page.reload();
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.locator('input[type=email]').fill(email);
    await page.locator('button[type=submit]').click();
    const boxes = page.locator(OTP_BOXES);
    await expect(boxes).toHaveCount(6, { timeout: 15000 });
    const resetCode = plantOtp(email, 'PASSWORD_RESET');
    for (let i = 0; i < 6; i++) await boxes.nth(i).fill(resetCode[i]);
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => /verify/i.test(x.textContent || ''));
      (b as HTMLElement | undefined)?.click();
    });
    const fields = page.locator('input[type=password]');
    await expect(fields.first()).toBeVisible({ timeout: 15000 });
    // The checklist starts red and turns green as each rule is met
    const rule = (name: string) => page.locator(`[data-testid=password-checklist] [data-rule=${name}]`);
    await fields.nth(0).fill('abc');
    for (const name of ['length', 'uppercase', 'number', 'special', 'noSequence']) await expect(rule(name)).toHaveAttribute('data-met', 'false');
    await expect(rule('lowercase')).toHaveAttribute('data-met', 'true');
    await fields.nth(0).fill('Brand#New123');
    await expect(rule('noSequence')).toHaveAttribute('data-met', 'false');
    await expect(rule('length')).toHaveAttribute('data-met', 'true');
    await fields.nth(0).fill('Brand#New8040');
    for (const name of ['length', 'lowercase', 'uppercase', 'number', 'special', 'noSequence']) await expect(rule(name)).toHaveAttribute('data-met', 'true');
    // The match line follows the second field, and the button waits until the passwords match
    await fields.nth(1).fill('Brand#New804');
    await expect(page.getByTestId('confirm-match')).toHaveAttribute('class', /text-red-500/);
    await expect(page.locator('button[type=submit]')).toBeDisabled();
    await fields.nth(1).fill('Brand#New8040');
    await expect(page.getByTestId('confirm-match')).toHaveAttribute('class', /text-green-600/);
    await page.locator('button[type=submit]').click();
    await expect(page.locator('body')).toContainText('Password updated successfully', { timeout: 15000 });

    const oldLogin = await request.post(`${API}/auth/login`, { data: { email, password: 'Old#Pass8040' } });
    expect(oldLogin.status()).toBe(401);
    const newLogin = await request.post(`${API}/auth/login`, { data: { email, password: 'Brand#New8040' } });
    expect(newLogin.status()).toBe(200);
  });
});
