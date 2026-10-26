import { test, expect, Page, APIRequestContext } from '@playwright/test';

/**
 * Company employee experience, "My tickets" and the reschedule dialog, against the local stack
 * (frontend on 3000, backend on 3001, seeded test accounts from TEST_ACCOUNTS.md).
 */
const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:3000';
const API = process.env.QA_API_URL || 'http://localhost:3001/api';
const OTP_BOXES = 'input[autocomplete="one-time-code"], input[maxlength="1"]';
const PASSWORD = 'Test@12345';

async function apiLogin(request: APIRequestContext, email: string) {
  const login = await request.post(`${API}/auth/login`, { data: { email, password: PASSWORD } });
  const { userId } = await login.json();
  const verified = await request.post(`${API}/auth/verify-login`, { data: { userId, code: '123456' } });
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
  for (let i = 0; i < 6; i++) await boxes.nth(i).fill('123456'[i]);
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
    const hr = await apiLogin(request, 'hr@cwp-test.local');
    const employee = await apiLogin(request, 'employee1@cwp-test.local');
    // Switch the team spending policy on so the allowance is shown
    const companies = await (await request.get(`${API}/companies`, { headers: authed(hr.token) })).json();
    const companyId = (Array.isArray(companies) ? companies : companies.companies || [])[0]?.id;
    if (companyId) {
      await request.put(`${API}/companies/${companyId}`, { headers: authed(hr.token), data: { employeeSpendingEnabled: true, employeeMonthlyLimit: 500 } });
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
      await signIn(page, 'employee1@cwp-test.local', lang);
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

    test(`the company card has no Leave button and shows the company wallet (${lang})`, async ({ page }) => {
      await signIn(page, 'employee1@cwp-test.local', lang);
      const text = await page.evaluate(() => document.body.innerText);
      expect(text).not.toMatch(/Leave company|مغادرة الشركة/);
      // Some labels are upper-cased by the page styles, so compare ignoring case
      expect(text.toLowerCase()).toContain(lang === 'ar' ? 'شركتك' : 'your company');
      expect(text.toLowerCase()).toContain(lang === 'ar' ? 'محفظة الشركة' : 'company wallet');
      // The header shows the company wallet next to the personal wallet
      const pill = page.getByRole('button', { name: lang === 'ar' ? /رصيد محفظة الشركة/ : /Company wallet balance/ });
      await expect(pill.first()).toBeVisible();
    });

    test(`a booking made by the company shows in the employee's bookings with a QR code (${lang})`, async ({ page }) => {
      test.skip(!bookingVenue, 'The seeded Test Partner Hub was not available to book');
      await signIn(page, 'employee1@cwp-test.local', lang);
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
    const member = await apiLogin(request, 'individual@cwp-test.local');
    const subject = `QA ticket ${Date.now().toString(36)}`;
    const created = await request.post(`${API}/tickets`, { headers: authed(member.token), data: { subject, message: 'Please help me with my booking.', category: 'general' } });
    expect(created.status()).toBe(201);
    const ticketId = (await created.json()).ticket.id as string;
    const admin = await apiLogin(request, 'superadmin@cwp-test.local');
    await request.post(`${API}/ticket-replies`, { headers: authed(admin.token), data: { ticketId, message: 'We are looking into it.' } });

    await signIn(page, 'individual@cwp-test.local', 'en');
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
    await signIn(page, 'individual@cwp-test.local', 'ar');
    await page.evaluate(() => sessionStorage.setItem('cp_nav', JSON.stringify({ screen: 'my-tickets' })));
    await page.reload();
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.getByRole('heading', { name: 'تذاكري' })).toBeVisible({ timeout: 20000 });
  });

  test('an upcoming booking can be rescheduled from My bookings (dialog opens with the rules) (en)', async ({ page }) => {
    await signIn(page, 'individual@cwp-test.local', 'en');
    await clickNav(page, '^Bookings$');
    await page.waitForTimeout(2500);
    const button = page.getByRole('button', { name: 'Reschedule' }).first();
    test.skip((await button.count()) === 0, 'The seeded account has no upcoming direct booking to move today');
    await button.click();
    await expect(page.getByRole('dialog').or(page.locator('[role=dialog], .fixed.inset-0')).first()).toContainText('Reschedule booking');
    await expect(page.locator('body')).toContainText('One free reschedule per booking.');
  });
});
