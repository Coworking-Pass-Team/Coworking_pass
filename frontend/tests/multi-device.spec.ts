import { test, expect, Page } from '@playwright/test';

const LIVE_URL = 'https://coworking-pass-client.onrender.com';

// Define the devices and viewports to test
const DEVICES = [
  {
    name: 'iPhone_14',
    folder: 'iphone',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  },
  {
    name: 'iPad_Air',
    folder: 'ipad',
    viewport: { width: 820, height: 1180 },
    isMobile: true,
    hasTouch: true,
  },
  {
    name: 'Laptop_13in',
    folder: 'laptop',
    viewport: { width: 1280, height: 800 },
    isMobile: false,
    hasTouch: false,
  },
  {
    name: 'Desktop_1080p',
    folder: 'desktop',
    viewport: { width: 1920, height: 1080 },
    isMobile: false,
    hasTouch: false,
  },
];

const PAGES = [
  { name: '01_Home', path: '/' },
  { name: '02_Spaces', path: '/spaces' },
  { name: '03_Pass_Plans', path: '/pass' },
  { name: '04_Loyalty', path: '/loyalty' },
  { name: '05_Auth', path: '/Auth' },
];

test.describe('Multi-Device Visual & Responsive Audit', () => {

  for (const device of DEVICES) {
    test.describe(`Device: ${device.name} (${device.viewport.width}x${device.viewport.height})`, () => {

      for (const p of PAGES) {
        test(`${p.name} on ${device.name}`, async ({ browser }) => {
          const context = await browser.newContext({
            viewport: device.viewport,
            isMobile: device.isMobile,
            hasTouch: device.hasTouch,
          });
          const page = await context.newPage();

          console.log(`\nTesting ${p.name} on ${device.name} [${device.viewport.width}x${device.viewport.height}]...`);
          const res = await page.goto(`${LIVE_URL}${p.path}`, {
            waitUntil: 'domcontentloaded',
            timeout: 35000,
          });
          expect(res?.status()).toBe(200);

          // Allow images & styles to settle
          await page.waitForTimeout(3500);

          // 1. Check for horizontal overflow (content leaking outside viewport)
          const overflow = await page.evaluate(() => {
            const scrollW = document.documentElement.scrollWidth;
            const clientW = document.documentElement.clientWidth;
            return {
              scrollWidth: scrollW,
              clientWidth: clientW,
              hasOverflow: scrollW > clientW + 2, // 2px threshold for rounding
            };
          });

          console.log(`  Horizontal overflow: ${overflow.hasOverflow ? '⚠️ YES (Leaking)' : '✅ NONE (Clean fit)'} [${overflow.scrollWidth}px vs ${overflow.clientWidth}px]`);

          // 2. Check for unexpected crashes
          const bodyText = await page.locator('body').innerText();
          expect(bodyText).not.toContain('Application error');
          expect(bodyText).not.toContain('500 Internal Server Error');

          // 3. Capture high-res full page screenshot
          const screenshotPath = `../testing/screenshots/devices/${device.folder}/${p.name}.png`;
          await page.screenshot({
            path: screenshotPath,
            fullPage: true,
          });
          console.log(`  Captured: ${screenshotPath}`);

          // 4. On mobile/tablet, test the navigation menu if available
          if (device.isMobile && p.name === '01_Home') {
            const menuBtn = page.locator('button[aria-label*="menu" i], button:has(svg.lucide-menu), [data-menu-toggle]').first();
            if (await menuBtn.isVisible().catch(() => false)) {
              console.log('  Testing mobile hamburger menu...');
              await menuBtn.click();
              await page.waitForTimeout(1000);
              await page.screenshot({
                path: `../testing/screenshots/devices/${device.folder}/01_Mobile_Menu_Opened.png`,
              });
              console.log(`  Captured opened mobile menu`);
            }
          }

          await context.close();
        });
      }

    });
  }

});
