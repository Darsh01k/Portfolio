import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
await page.goto('https://darsh-dev.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(4000);
await page.screenshot({ path: 'siderays-test.png', fullPage: false });
console.log('screenshot taken');
await browser.close();
