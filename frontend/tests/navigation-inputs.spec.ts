import { test, expect } from '@playwright/test';

const base = process.env.QA_BASE_URL || 'http://localhost:3000';

for (const lang of ['ar', 'en']) {
  test(`${lang}: direct auth, refresh, history and icon gutters`, async ({ page, context }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await context.addCookies([{ name: 'cp_lang', value: lang, url: base }]);
    await page.route('https://coworking-pass-backend.vercel.app/**', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
    await page.goto(`${base}/auth`);
    const email = page.locator('input[type="email"]');
    await expect(email).toBeVisible();
    await page.reload();
    await expect(email).toBeVisible();
    await email.fill('a.long.address.for.testing@example.com');
    const padding = await email.evaluate(el => {
      const css = getComputedStyle(el);
      return [css.direction, css.paddingLeft, css.paddingRight];
    });
    expect(padding).toEqual(['ltr', '48px', '48px']);
    const password = page.locator('input[type="password"]');
    await password.fill('Long-password-for-layout');
    const toggle = page.locator('button[aria-pressed]').first();
    await toggle.click();
    await expect(page.locator('input[dir="ltr"]').filter({ visible: true }).last()).toHaveAttribute('type', 'text');
    await toggle.click();
    await page.getByRole('button', { name: /forgot.*password|نسيت كلمة المرور/i }).click();
    await expect(page).toHaveURL(`${base}/forgot-password`);
    await page.goBack();
    await expect(page).toHaveURL(`${base}/auth`);
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL(`${base}/forgot-password`);
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
