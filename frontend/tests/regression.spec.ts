import { test, expect, Page } from '@playwright/test';

/**
 * Regression checks for the QA audit. Unlike the smoke tests in e2e.spec.ts these assert concrete
 * outcomes. They run against the local frontend (port 3000) with the backend on port 3001.
 */
const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:3000';

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

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

const VIEWPORTS = [
  { name: 'mobile 375', width: 375, height: 812 },
  { name: 'mobile 414', width: 414, height: 896 },
  { name: 'tablet 768', width: 768, height: 1024 },
  { name: 'tablet 1024', width: 1024, height: 768 },
  { name: 'laptop 1280', width: 1280, height: 800 },
  { name: 'desktop 1920', width: 1920, height: 1080 },
];

test.describe('Responsive layout: no horizontal scrollbar', () => {
  for (const vp of VIEWPORTS) {
    for (const lang of ['ar', 'en'] as const) {
      test(`home and spaces at ${vp.name} (${lang})`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await open(page);
        await setLanguage(page, lang);
        expect(await horizontalOverflow(page), 'home overflow (px)').toBeLessThanOrEqual(1);
        await page.evaluate(() => {
          const b = Array.from(document.querySelectorAll('button, a')).find((e) => /browse|تصفّح/i.test(e.textContent || '') && (e as HTMLElement).offsetWidth > 0);
          (b as HTMLElement | undefined)?.click();
        });
        await page.waitForTimeout(1500);
        await expect(page.locator('body')).toContainText(lang === 'en' ? /Spaces Available|Showing/ : /مساحات متاحة|المعروض/);
        expect(await horizontalOverflow(page), 'spaces overflow (px)').toBeLessThanOrEqual(1);
      });
    }
  }
});

test.describe('Header layout', () => {
  /** Overlaps between header controls, menu items cut off by their neighbours, and controls pushed off screen. */
  const measureHeader = () => {
    const row = document.querySelector('header')!.firstElementChild as HTMLElement;
    const nav = document.querySelector('header nav');
    const controls = Array.from(row.querySelectorAll('button, a'))
      .map((e) => ({ name: (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24), r: e.getBoundingClientRect() }))
      .filter((c) => c.r.width > 0 && c.r.height > 0);
    const overlaps: string[] = [];
    for (let i = 0; i < controls.length; i++) {
      for (let j = i + 1; j < controls.length; j++) {
        const a = controls[i], b = controls[j];
        const ix = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
        const iy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
        if (ix > 2 && iy > 2) overlaps.push(`${a.name} x ${b.name}`);
      }
    }
    const navBox = nav ? nav.getBoundingClientRect() : null;
    const clipped = nav && navBox
      ? Array.from(nav.querySelectorAll('button, a')).filter((l) => { const r = l.getBoundingClientRect(); return r.right > navBox.right + 1 || r.left < navBox.left - 1; }).map((l) => (l.textContent || '').trim())
      : [];
    const outside = controls.filter((c) => c.r.right > innerWidth + 1 || c.r.left < -1).map((c) => c.name);
    return { overlaps, clipped, outside };
  };

  for (const width of [1024, 1280, 1600, 1920]) {
    for (const lang of ['ar', 'en'] as const) {
      test(`guest header has no overlap or clipping at ${width}px (${lang})`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await open(page);
        await setLanguage(page, lang);
        const m = await page.evaluate(measureHeader);
        expect(m).toEqual({ overlaps: [], clipped: [], outside: [] });
      });
    }
  }
});

test.describe('Internationalization', () => {
  test('switching language flips direction and html lang', async ({ page }) => {
    await open(page);
    await setLanguage(page, 'en');
    expect(await page.evaluate(() => [document.documentElement.dir, document.documentElement.lang])).toEqual(['ltr', 'en']);
    await setLanguage(page, 'ar');
    expect(await page.evaluate(() => [document.documentElement.dir, document.documentElement.lang])).toEqual(['rtl', 'ar']);
  });

  for (const lang of ['ar', 'en'] as const) {
    test(`no raw translation keys on the landing page (${lang})`, async ({ page }) => {
      await open(page);
      await setLanguage(page, lang);
      const text = await page.evaluate(() => document.body.innerText);
      const rawKeys = text.match(/\b(?:common|nav|landing|bf|tb|space|spaceDetails|dash|myBookings|mySpaces|admin)\.[A-Za-z0-9_.]+\b/g) || [];
      expect(rawKeys).toEqual([]);
      expect(text).not.toMatch(/translation\.missing|missing_key/i);
    });
  }
});

test.describe('Sign-in screens in Arabic', () => {
  const ENGLISH_UI = /All rights reserved|Verified Saudi Workspace Network|Two-Factor|Back to Sign|Choose Account Type|Don't have an account|Already have an account|Remembered your password|Digit Security Code|Resend code in/;

  async function openLogin(page: Page) {
    await open(page);
    await setLanguage(page, 'ar');
    await page.evaluate(() => {
      const t = Array.from(document.querySelectorAll('button')).find((b) => /تبديل قائمة|toggle/i.test(b.getAttribute('aria-label') || ''));
      t && (t as HTMLElement).click();
    });
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('button')).filter((b) => /^تسجيل الدخول$/.test((b.textContent || '').trim())).forEach((b) => (b as HTMLElement).click());
    });
    await expect(page.locator('input[type=email]')).toBeVisible({ timeout: 10000 });
  }

  test('login and registration text is Arabic', async ({ page }) => {
    await openLogin(page);
    expect(await page.evaluate(() => document.body.innerText)).not.toMatch(ENGLISH_UI);
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('button')).filter((b) => /^إنشاء حساب$/.test((b.textContent || '').trim())).forEach((b) => (b as HTMLElement).click());
    });
    await page.waitForTimeout(1200);
    const signup = await page.evaluate(() => document.body.innerText);
    expect(signup).toMatch(/اختر نوع الحساب/);
    expect(signup).not.toMatch(ENGLISH_UI);
  });

  test('verification-code screen is Arabic', async ({ page }) => {
    await openLogin(page);
    await page.locator('input[type=email]').fill('admin@coworkingpass.sa');
    await page.locator('input[type=password]').fill('password');
    await page.locator('button[type=submit]').click();
    await expect(page.locator('input[maxlength="1"]').first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(800);
    const text = await page.evaluate(() => document.body.innerText);
    expect(text).toMatch(/التحقق الأمني بخطوتين/);
    expect(text).not.toMatch(ENGLISH_UI);
  });
});

test.describe('QR scan page', () => {
  test('is translated: Arabic by default for the saved language, English when switched', async ({ page }) => {
    await open(page);
    await setLanguage(page, 'ar');
    await page.goto(BASE_URL + '/pass?spaceId=space-1&spaceName=Test');
    await page.waitForTimeout(2500);
    const ar = await page.evaluate(() => document.body.innerText);
    expect(ar).toMatch(/العودة إلى كوورك باس/);
    expect(ar).not.toMatch(/Access Granted|Return to Coworking Pass|Encrypted/);
    await setLanguage(page, 'en');
    await page.goto(BASE_URL + '/pass?spaceId=space-1&spaceName=Test');
    await page.waitForTimeout(2500);
    expect(await page.evaluate(() => document.body.innerText)).toMatch(/Return to Coworking Pass/);
  });
});

test.describe('Catalog', () => {
  test('categories add up to the total and halls are priced per hour', async ({ page }) => {
    await open(page);
    await setLanguage(page, 'en');
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button, a')).find((e) => /browse/i.test(e.textContent || '') && (e as HTMLElement).offsetWidth > 0);
      (b as HTMLElement | undefined)?.click();
    });
    await expect(page.getByRole('button', { name: /^All Spaces/ })).toBeVisible({ timeout: 20000 });
    await expect.poll(() => page.locator('h3').count(), { timeout: 20000 }).toBeGreaterThan(0);
    await page.waitForLoadState('networkidle').catch(() => undefined);
    const counts = await page.evaluate(() => {
      const read = (label: string) => {
        const btn = Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').trim().startsWith(label));
        return btn ? parseInt((btn.textContent || '').replace(/\D+/g, ''), 10) : NaN;
      };
      return { all: read('All Spaces'), offices: read('Offices'), halls: read('Halls'), theaters: read('Theaters') };
    });
    expect(counts.all).toBeGreaterThan(0);
    expect(counts.offices + counts.halls + counts.theaters).toBe(counts.all);

    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => (x.textContent || '').trim().startsWith('Halls'));
      (b as HTMLElement | undefined)?.click();
    });
    await expect.poll(() => page.locator('h3').first().innerText(), { timeout: 15000 }).toMatch(/Hall|Theater|Auditorium|Summit|Meeting|Workshop|Lecture|Event|Training|Conference/i);
    const prices = await page.evaluate(() => Array.from(document.querySelectorAll('h3')).slice(0, 5).map((h) => (h.closest('div[class*=rounded]') as HTMLElement | null)?.innerText || ''));
    expect(prices.length).toBeGreaterThan(0);
    for (const card of prices) expect(card).toMatch(/\/ ?hour/i);
  });

  test('location denial shows the fallback notice and keeps spaces visible', async ({ page, context }) => {
    await context.clearPermissions();
    await open(page);
    await setLanguage(page, 'en');
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button, a')).find((e) => /browse/i.test(e.textContent || '') && (e as HTMLElement).offsetWidth > 0);
      (b as HTMLElement | undefined)?.click();
    });
    await expect(page.locator('body')).toContainText(/Location Permission Denied|Enable Location|nearest/i, { timeout: 20000 });
    await expect.poll(() => page.locator('h3').count(), { timeout: 20000 }).toBeGreaterThan(3);
  });
});

test.describe('Pricing page', () => {
  test('no "Custom Enterprise" card for individuals or teams', async ({ page }) => {
    await open(page);
    await setLanguage(page, 'en');
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((e) => /pricing/i.test(e.textContent || '') && (e as HTMLElement).offsetWidth > 0);
      (b as HTMLElement | undefined)?.click();
    });
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toContainText(/Day Pass/);
    expect(await page.evaluate(() => document.body.innerText)).not.toMatch(/custom enterprise/i);
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((e) => /teams & organizations/i.test(e.textContent || ''));
      (b as HTMLElement | undefined)?.click();
    });
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toContainText(/Team Pass/);
    expect(await page.evaluate(() => document.body.innerText)).not.toMatch(/custom enterprise/i);
  });
});

test.describe('Console hygiene', () => {
  test('a guest never calls protected API endpoints (no 401/403 noise)', async ({ page }) => {
    const denied: string[] = [];
    page.on('response', (r) => {
      if (r.url().includes('/api/') && (r.status() === 401 || r.status() === 403)) denied.push(r.status() + ' ' + r.url());
    });
    await open(page);
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button, a')).find((e) => /browse|تصفّح/i.test(e.textContent || '') && (e as HTMLElement).offsetWidth > 0);
      (b as HTMLElement | undefined)?.click();
    });
    await page.waitForTimeout(2500);
    await expect(page.locator('h3').first()).toBeVisible();
    expect(denied).toEqual([]);
  });

  test('no React warnings or uncaught exceptions on landing and spaces', async ({ page }) => {
    const problems: string[] = [];
    page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const t = m.text();
      // network status lines are checked separately (the guest shell calls protected endpoints)
      if (/Failed to load resource/.test(t)) return;
      problems.push(t);
    });
    await open(page);
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button, a')).find((e) => /browse|تصفّح/i.test(e.textContent || '') && (e as HTMLElement).offsetWidth > 0);
      (b as HTMLElement | undefined)?.click();
    });
    await page.waitForTimeout(2500);
    await expect(page.locator('h3').first()).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('no hydration mismatch warning', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (m) => { if (/hydrat/i.test(m.text())) warnings.push(m.text()); });
    await open(page);
    await page.reload();
    await page.waitForTimeout(1500);
    expect(warnings).toEqual([]);
  });
});

test.describe('Admin portal (local development account)', () => {
  test('admin signs in with 2FA and sees the platform metrics', async ({ page }) => {
    await open(page);
    await setLanguage(page, 'en');
    await page.evaluate(() => {
      const open = Array.from(document.querySelectorAll('button')).find((e) => /^sign in$|^log in$|login/i.test((e.textContent || '').trim()));
      (open as HTMLElement | undefined)?.click();
    });
    // The header collapses into a menu on narrow viewports: open it if the form is not there yet
    if (!(await page.locator('input[type=email]').count())) {
      await page.getByRole('button', { name: /toggle|menu/i }).first().click().catch(() => undefined);
      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).filter((e) => /sign in|log in|login/i.test(e.textContent || ''));
        b.forEach((x) => (x as HTMLElement).click());
      });
    }
    await page.locator('input[type=email]').fill('admin@coworkingpass.sa');
    await page.locator('input[type=password]').fill('password');
    await page.locator('button[type=submit]').click();
    const boxes = page.locator('input[maxlength="1"]');
    await expect(boxes).toHaveCount(6, { timeout: 15000 });
    for (let i = 0; i < 6; i++) await boxes.nth(i).fill('123456'[i]);
    await page.getByRole('button', { name: /verify|continue/i }).first().click();
    await expect(page.locator('body')).toContainText(/Total Users|Platform Overview|System Overview/i, { timeout: 20000 });
  });
});
