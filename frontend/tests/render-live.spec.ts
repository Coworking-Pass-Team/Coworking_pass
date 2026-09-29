import { test, expect, Page } from '@playwright/test';

const LIVE_URL = 'https://coworking-pass-client.onrender.com';
const ADMIN_EMAIL = 'admin@coworkingpass.sa';
const ADMIN_PASSWORD = 'password';
const ADMIN_OTP = '123456';

// Helper to save screenshots into testing/screenshots/render_live/
async function snap(page: Page, name: string) {
  await page.screenshot({
    path: `../testing/screenshots/render_live/${name}.png`,
    fullPage: true,
  });
}

async function wait(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

test.describe('Live Render Client Platform Audit', () => {

  test('01 - Homepage Health & Rendering', async ({ page }) => {
    const consoleLogs: string[] = [];
    const failedRequests: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') consoleLogs.push(msg.text());
    });

    page.on('requestfailed', req => {
      failedRequests.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
    });

    console.log('\n--- Checking Homepage ---');
    const response = await page.goto(LIVE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    expect(response?.status()).toBe(200);

    await page.waitForTimeout(3000);
    await snap(page, '01_render_homepage');

    const title = await page.title();
    console.log(`Title: "${title}"`);
    console.log(`Console errors on homepage: ${consoleLogs.length}`);
    if (consoleLogs.length > 0) console.log('Errors:', consoleLogs.slice(0, 5));
    if (failedRequests.length > 0) console.log('Failed network requests:', failedRequests);

    // Verify main content loaded
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Application error');
    expect(bodyText).not.toContain('500 Internal Server Error');
  });

  test('02 - Spaces Page & Backend Connectivity', async ({ page }) => {
    console.log('\n--- Checking Spaces Page ---');
    const apiCalls: { url: string; status: number }[] = [];

    page.on('response', res => {
      if (res.url().includes('/api/')) {
        apiCalls.push({ url: res.url(), status: res.status() });
      }
    });

    await page.goto(`${LIVE_URL}/spaces`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000); // Give backend time to respond
    await snap(page, '02_render_spaces');

    console.log('API calls intercepted:');
    apiCalls.forEach(c => console.log(`  [${c.status}] ${c.url}`));

    // Check for workspace cards
    const cards = page.locator('text=SAR');
    const cardCount = await cards.count();
    console.log(`Found ${cardCount} workspace price indicators on /spaces`);

    // Verify search / filter works
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="بحث"]').first();
    if (await searchInput.isVisible().catch(() => false)) {
      console.log('Search input found — typing "Riyadh"...');
      await searchInput.fill('Riyadh');
      await page.waitForTimeout(2000);
      await snap(page, '02_render_spaces_filtered');
    }
  });

  test('03 - Workspace Detail View', async ({ page }) => {
    console.log('\n--- Checking Workspace Detail View ---');
    await page.goto(`${LIVE_URL}/spaces`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);

    // Click on the first workspace card or title
    const firstCard = page.locator('text=Diriyah Heritage').first();
    if (await firstCard.isVisible().catch(() => false)) {
      console.log('Clicking on Diriyah Heritage workspace card...');
      await firstCard.click();
      await page.waitForTimeout(3000);
      await snap(page, '03_render_workspace_detail');
      console.log('Current URL after click:', page.url());
    } else {
      console.log('First space title not directly visible, trying first card...');
      const anyCard = page.locator('[class*="card"]').first();
      if (await anyCard.isVisible().catch(() => false)) {
        await anyCard.click();
        await page.waitForTimeout(3000);
        await snap(page, '03_render_workspace_detail_any');
      }
    }
  });

  test('04 - Pass / Membership Plans Page', async ({ page }) => {
    console.log('\n--- Checking Pass / Membership Page ---');
    await page.goto(`${LIVE_URL}/pass`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await snap(page, '04_render_pass_plans');

    const bodyText = await page.locator('body').innerText();
    console.log('Pass page text length:', bodyText.length);
    const hasPlans = bodyText.includes('SAR') || bodyText.includes('Pass') || bodyText.includes('اشتراك');
    console.log('Membership plans detected:', hasPlans);
  });

  test('05 - Loyalty Page', async ({ page }) => {
    console.log('\n--- Checking Loyalty Page ---');
    await page.goto(`${LIVE_URL}/loyalty`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await snap(page, '05_render_loyalty');

    const body = page.locator('body');
    await expect(body).not.toContainText('Application error');
    console.log('Loyalty page loaded cleanly.');
  });

  test('06 - Authentication & Login Flow on Live Site', async ({ page }) => {
    console.log('\n--- Testing Login Flow on Live Site ---');
    const apiResponses: { url: string; status: number; body?: string }[] = [];

    page.on('response', async res => {
      if (res.url().includes('/api/auth/')) {
        let text = '';
        try { text = await res.text(); } catch (_) {}
        apiResponses.push({ url: res.url(), status: res.status(), body: text.slice(0, 150) });
      }
    });

    await page.goto(`${LIVE_URL}/Auth`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await snap(page, '06_render_auth_page');

    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="mail" i]').first();
    const passInput = page.locator('input[type="password"]').first();

    if (await emailInput.isVisible().catch(() => false)) {
      console.log('Filling Super Admin credentials...');
      await emailInput.fill(ADMIN_EMAIL);
      await passInput.fill(ADMIN_PASSWORD);
      await snap(page, '06_render_creds_filled');

      const submitBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();
      await submitBtn.click();
      console.log('Submitted login credentials. Waiting for OTP step or response...');
      await page.waitForTimeout(4000);
      await snap(page, '06_render_after_login_submit');

      console.log('Auth API Responses:');
      apiResponses.forEach(r => console.log(`  [${r.status}] ${r.url} -> ${r.body}`));

      // Look for the 6 digit input boxes
      const digitInputs = page.locator('input[maxlength="1"]');
      if (await digitInputs.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('6-Digit OTP inputs visible! Entering 123456...');
        const codeDigits = ['1', '2', '3', '4', '5', '6'];
        for (let i = 0; i < 6; i++) {
          await digitInputs.nth(i).fill(codeDigits[i]);
        }
        await page.waitForTimeout(1000);
        await snap(page, '06_render_otp_entered');

        const verifyBtn = page.locator('button[type="submit"]:has-text("Verify")').first();
        await verifyBtn.click();
        console.log('Clicked Verify button. Waiting for dashboard navigation...');
        await page.waitForTimeout(6000);
        await snap(page, '06_render_logged_in_dashboard');

        console.log('Final URL after OTP verification:', page.url());
        const bodyAfterLogin = await page.locator('body').innerText();
        const isAdmin = bodyAfterLogin.includes('Admin') || bodyAfterLogin.includes('Dashboard') || bodyAfterLogin.includes('Super Admin');
        console.log('Admin Dashboard elements detected in body:', isAdmin);
      } else {
        console.log('OTP inputs were not detected on screen. Check screenshot 06_render_after_login_submit.png');
      }
    } else {
      console.log('Email input not found on /Auth');
    }
  });

});
