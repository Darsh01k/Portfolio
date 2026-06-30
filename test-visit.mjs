import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
page.on('pageerror', err => console.log('PAGE_ERROR:', err.message));
await page.goto('https://darsh-dev.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);
const siderays = await page.$('#siderays-bg');
console.log('siderays-bg exists:', !!siderays);
if (siderays) {
  const canvas = await siderays.$('canvas');
  console.log('canvas inside:', !!canvas);
}
await browser.close();
