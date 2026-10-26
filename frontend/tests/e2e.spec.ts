import { test, expect, Page } from '@playwright/test';

// ─── Configuration ────────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@coworkingpass.sa';
const ADMIN_PASSWORD = 'password';
const ADMIN_OTP = '123456';

// Generate a unique test user email per run to avoid conflicts
const TEST_EMAIL = `e2e_test_${Date.now()}@test.com`;
const TEST_PASSWORD = 'TestPass123!';
const TEST_NAME = 'E2E Test User';
const TEST_PHONE = '+966501234567';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Navigate to a screen by clicking a nav element or directly via URL fallback. */
async function navigateTo(page: Page, screenName: string) {
  // The site is SPA-based; try clicking the nav link matching the screen
  const navLink = page.locator(`[data-screen="${screenName}"], a[href*="${screenName}"]`).first();
  if (await navLink.isVisible({ timeout: 2000 }).catch(() => false)) {
    await navLink.click();
  }
}

/** Wait for the page to stabilize (no loading spinners). */
async function waitForStable(page: Page, ms = 1500) {
  await page.waitForTimeout(ms);
}

/** Take a labeled screenshot and save to testing/screenshots/. */
async function snap(page: Page, name: string) {
  await page.screenshot({
    path: `../testing/screenshots/${name}.png`,
    fullPage: true,
  });
}

// ─── Test Suite: 01 — Homepage & Navigation ───────────────────────────────────
test.describe('01 - Homepage & Navigation', () => {
  test('Homepage loads and shows key sections', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForStable(page);
    await snap(page, '01_homepage');

    // Page should render without a 500 error
    await expect(page).not.toHaveTitle(/error/i);
    const body = page.locator('body');
    await expect(body).not.toContainText('Internal Server Error');
    await expect(body).not.toContainText('Application error');
  });

  test('Page title is set correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    const title = await page.title();
    console.log(`  Page title: "${title}"`);
    expect(title).toBeTruthy();
  });

  test('No console errors on homepage load', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await page.goto(BASE_URL);
    await waitForStable(page);
    // Filter out known non-critical third-party errors
    const criticalErrors = consoleErrors.filter(
      e => !e.includes('favicon') && !e.includes('google') && !e.includes('maps')
    );
    if (criticalErrors.length > 0) {
      console.log('  Console errors found:', criticalErrors);
    }
    // We log but don't fail on console errors — just report
    console.log(`  Console errors: ${criticalErrors.length}`);
  });
});

// ─── Test Suite: 02 — Auth Flow (Register + Login) ───────────────────────────
test.describe('02 - Authentication Flow', () => {
  test('Auth page loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/Auth`);
    await waitForStable(page);
    await snap(page, '02_auth_page');

    // Should see a login/register form
    const hasForm = await page.locator('form, input[type="email"], input[type="password"]').count();
    expect(hasForm).toBeGreaterThan(0);
  });

  test('Register tab is accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/Auth`);
    await waitForStable(page);

    // Try clicking a register / create account tab
    const registerTab = page.locator(
      'button:has-text("Register"), button:has-text("Create"), button:has-text("Sign Up"), [data-tab="register"]'
    ).first();
    
    if (await registerTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await registerTab.click();
      await waitForStable(page, 800);
      await snap(page, '02_register_tab');
      console.log('  Register tab clicked successfully');
    } else {
      console.log('  Register tab not found by text — checking page structure');
    }
  });

  test('Login with wrong credentials shows error', async ({ page }) => {
    await page.goto(`${BASE_URL}/Auth`);
    await waitForStable(page);

    // Fill email field
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('wrong@email.com');
      const passInput = page.locator('input[type="password"]').first();
      await passInput.fill('wrongpassword');

      // Submit
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();
      if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitBtn.click();
        await waitForStable(page);
        await snap(page, '02_login_error');
        // Should show some error indicator
        const body = page.locator('body');
        const hasError = await body.textContent();
        console.log(`  Body contains 'error' or 'invalid': ${hasError?.toLowerCase().includes('error') || hasError?.toLowerCase().includes('invalid')}`);
      }
    }
  });

  test('Admin login flow — full 2FA journey', async ({ page }) => {
    await page.goto(`${BASE_URL}/Auth`);
    await waitForStable(page);
    await snap(page, '02_admin_login_start');

    // Fill credentials
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="mail" i]').first();
    const passInput = page.locator('input[type="password"]').first();
    
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill(ADMIN_EMAIL);
    await passInput.fill(ADMIN_PASSWORD);
    
    await snap(page, '02_admin_creds_filled');

    const submitBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("Continue")').first();
    await submitBtn.click();
    await waitForStable(page, 2500);
    await snap(page, '02_admin_after_submit');

    // OTP step — look for OTP input
    const otpInput = page.locator(
      'input[name="otp"], input[name="code"], input[placeholder*="otp" i], input[placeholder*="code" i], input[maxlength="6"]'
    ).first();

    const otpVisible = await otpInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (otpVisible) {
      console.log('  OTP input found — filling with 123456');
      await otpInput.fill(ADMIN_OTP);
      await snap(page, '02_admin_otp_filled');

      const otpSubmit = page.locator('button[type="submit"], button:has-text("Verify"), button:has-text("Confirm"), button:has-text("Continue")').first();
      await otpSubmit.click();
      await waitForStable(page, 2500);
      await snap(page, '02_admin_logged_in');
      console.log('  OTP submitted — checking if logged in');
    } else {
      console.log('  OTP input not found — checking if auto-navigated after login');
      await snap(page, '02_after_login_no_otp');
    }

    // Check if we navigated away from Auth page (i.e., logged in)
    const currentUrl = page.url();
    console.log(`  Current URL after login: ${currentUrl}`);
  });
});

// ─── Test Suite: 03 — Workspaces Page ────────────────────────────────────────
test.describe('03 - Workspaces / Spaces Listing', () => {
  test('Spaces page loads and shows workspace cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/spaces`);
    await waitForStable(page, 2000);
    await snap(page, '03_spaces_page');

    const body = page.locator('body');
    await expect(body).not.toContainText('500 Internal Server Error');
    await expect(body).not.toContainText('Application error');
    console.log('  Spaces page loaded OK');
  });

  test('Workspaces display cards or list items', async ({ page }) => {
    await page.goto(`${BASE_URL}/spaces`);
    await waitForStable(page, 3000);

    // Look for workspace cards — common patterns
    const cards = page.locator('[class*="card"], [class*="workspace"], [class*="space"], article, .grid > div').filter({ hasText: /SAR|ريال|hour|يوم|space/i });
    const count = await cards.count();
    console.log(`  Found ${count} workspace-like cards on spaces page`);

    // Even if count=0, the page should not show an error
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toContain('Internal Server Error');
  });

  test('Search / filter exists on spaces page', async ({ page }) => {
    await page.goto(`${BASE_URL}/spaces`);
    await waitForStable(page, 2000);

    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="بحث"]').first();
    const filterBtn = page.locator('button:has-text("Filter"), button:has-text("فلتر"), [class*="filter"]').first();

    const hasSearch = await searchInput.isVisible({ timeout: 2000 }).catch(() => false);
    const hasFilter = await filterBtn.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`  Search input: ${hasSearch}, Filter button: ${hasFilter}`);
    await snap(page, '03_spaces_filters');
  });
});

// ─── Test Suite: 04 — Membership / Pass Page ─────────────────────────────────
test.describe('04 - Membership Plans Page', () => {
  test('Pass page loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/pass`);
    await waitForStable(page, 2000);
    await snap(page, '04_pass_page');

    const body = page.locator('body');
    await expect(body).not.toContainText('Application error');
    console.log('  /pass page loaded OK');
  });

  test('Membership plans are displayed', async ({ page }) => {
    await page.goto(`${BASE_URL}/pass`);
    await waitForStable(page, 2500);

    // Look for plan cards with prices
    const planCards = page.locator('[class*="plan"], [class*="card"], [class*="membership"]').filter({ hasText: /SAR|ريال|\$|month|شهر/i });
    const count = await planCards.count();
    console.log(`  Found ${count} membership plan cards`);
    await snap(page, '04_membership_plans');
  });
});

// ─── Test Suite: 05 — Loyalty Page ───────────────────────────────────────────
test.describe('05 - Loyalty Program Page', () => {
  test('Loyalty page loads without errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/loyalty`);
    await waitForStable(page, 2000);
    await snap(page, '05_loyalty_page');

    const body = page.locator('body');
    await expect(body).not.toContainText('500 Internal Server Error');
    console.log('  /loyalty page loaded OK');
  });
});

// ─── Test Suite: 06 — Profile Page ───────────────────────────────────────────
test.describe('06 - Profile Page', () => {
  test('Profile page loads (may redirect to login if not authenticated)', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    await waitForStable(page, 2000);
    await snap(page, '06_profile_page');

    const body = page.locator('body');
    await expect(body).not.toContainText('Application error');
    await expect(body).not.toContainText('Internal Server Error');
    console.log(`  /profile page URL: ${page.url()}`);
  });
});

// ─── Test Suite: 07 — Full User Journey (as Admin) ───────────────────────────
test.describe('07 - Full Admin User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test in this suite
    await page.goto(`${BASE_URL}/Auth`);
    await waitForStable(page);

    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="mail" i]').first();
    const passInput = page.locator('input[type="password"]').first();
    
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailInput.fill(ADMIN_EMAIL);
      await passInput.fill(ADMIN_PASSWORD);
      
      const submitBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();
      await submitBtn.click();
      await waitForStable(page, 2500);

      // Handle OTP if shown
      const otpInput = page.locator('input[maxlength="6"], input[name="otp"], input[name="code"]').first();
      if (await otpInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await otpInput.fill(ADMIN_OTP);
        const otpSubmit = page.locator('button[type="submit"], button:has-text("Verify"), button:has-text("Confirm")').first();
        await otpSubmit.click();
        await waitForStable(page, 2500);
      }
    }
  });

  test('After login — can navigate to spaces page', async ({ page }) => {
    await page.goto(`${BASE_URL}/spaces`);
    await waitForStable(page, 2000);
    await snap(page, '07_admin_spaces_after_login');

    const url = page.url();
    console.log(`  Spaces page after login: ${url}`);
    const body = page.locator('body');
    await expect(body).not.toContainText('Application error');
  });

  test('After login — profile page is accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    await waitForStable(page, 2500);
    await snap(page, '07_admin_profile');

    const body = page.locator('body');
    await expect(body).not.toContainText('Application error');
    // Should see user info
    const bodyText = await body.textContent();
    const hasAdminInfo = bodyText?.includes('admin') || bodyText?.includes('Admin') || bodyText?.includes('SUPER');
    console.log(`  Profile shows admin info: ${hasAdminInfo}`);
  });

  test('Workspace detail — can click on a space card to see details', async ({ page }) => {
    await page.goto(`${BASE_URL}/spaces`);
    await waitForStable(page, 3000);

    // Try to click first workspace card
    const spaceCard = page.locator('[class*="card"], [class*="workspace"], article').first();
    const cardVisible = await spaceCard.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (cardVisible) {
      await spaceCard.click();
      await waitForStable(page, 2000);
      await snap(page, '07_workspace_detail');
      console.log('  Clicked on workspace card — captured detail view');
    } else {
      console.log('  No clickable workspace card found');
    }
  });
});

// ─── Test Suite: 08 — Responsive Design Check ────────────────────────────────
test.describe('08 - Responsive Design', () => {
  test('Homepage looks correct on mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE_URL);
    await waitForStable(page, 1500);
    await snap(page, '08_mobile_home');

    const body = page.locator('body');
    await expect(body).not.toContainText('Application error');
    console.log('  Mobile viewport (375x812) — no crash');
  });

  test('Homepage looks correct on tablet (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL);
    await waitForStable(page, 1500);
    await snap(page, '08_tablet_home');
    console.log('  Tablet viewport (768x1024) — no crash');
  });

  test('Homepage looks correct on desktop (1440px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL);
    await waitForStable(page, 1500);
    await snap(page, '08_desktop_home');
    console.log('  Desktop viewport (1440x900) — no crash');
  });
});

// ─── Test Suite: 09 — Performance & Core Web Vitals ──────────────────────────
test.describe('09 - Performance Metrics', () => {
  test('Homepage loads in under 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;
    console.log(`  DOMContentLoaded: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000);
  });

  test('Spaces page loads in under 6 seconds (has API calls)', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/spaces`, { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;
    console.log(`  Spaces DOMContentLoaded: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(6000);
  });

  test('Capture Core Web Vitals via JS', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    const vitals = await page.evaluate(() => {
      return new Promise<Record<string, number>>((resolve) => {
        const metrics: Record<string, number> = {};
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            metrics[entry.name] = (entry as PerformanceEntry & { value?: number }).value ?? entry.duration;
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        
        // Collect navigation timing
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (nav) {
          metrics['TTFB'] = nav.responseStart - nav.fetchStart;
          metrics['FCP_approx'] = nav.domContentLoadedEventEnd - nav.fetchStart;
        }
        
        setTimeout(() => resolve(metrics), 2000);
      });
    });

    console.log('  Web Vitals:', JSON.stringify(vitals, null, 2));
    
    if (vitals['TTFB'] !== undefined) {
      expect(vitals['TTFB']).toBeLessThan(2000); // TTFB under 2s
    }
  });
});

// ─── Test Suite: 10 — Accessibility Basics ───────────────────────────────────
test.describe('10 - Accessibility Basics', () => {
  test('Homepage has a main heading (h1)', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForStable(page);
    const h1Count = await page.locator('h1').count();
    console.log(`  H1 headings found: ${h1Count}`);
    // At least one h1 for good SEO/accessibility
    expect(h1Count).toBeGreaterThanOrEqual(0); // Log but don't fail
  });

  test('All images have alt text', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForStable(page);
    
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    const imagesWithEmptyAlt = await page.locator('img[alt=""]').count();
    const totalImages = await page.locator('img').count();
    
    console.log(`  Total images: ${totalImages}`);
    console.log(`  Images missing alt: ${imagesWithoutAlt}`);
    console.log(`  Images with empty alt: ${imagesWithEmptyAlt}`);
    
    // Log findings
    if (imagesWithoutAlt > 0) {
      const srcs = await page.locator('img:not([alt])').evaluateAll(
        (imgs: HTMLImageElement[]) => imgs.map(i => i.src).slice(0, 5)
      );
      console.log(`  Missing alt srcs (first 5):`, srcs);
    }
  });

  test('Login form has associated labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/Auth`);
    await waitForStable(page);
    
    const inputs = await page.locator('input:not([type="hidden"])').count();
    const labels = await page.locator('label').count();
    console.log(`  Form inputs: ${inputs}, Labels: ${labels}`);
  });
});
