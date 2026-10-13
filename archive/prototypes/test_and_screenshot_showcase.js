const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });

  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  
  page.on('console', msg => console.log(`[log] ${msg.text()}`));
  page.on('pageerror', err => console.error(`[error] ${err.message}`));

  const filePath = 'file:///' + path.resolve(__dirname, '../style_showcase.html').replace(/\\/g, '/');
  console.log('Navigating to:', filePath);
  await page.goto(filePath);
  await page.waitForTimeout(1000);

  // Screenshot 1: Overview (Bright Lynchian Room)
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_lynch_overview.png') });
  console.log('Captured screenshot_lynch_overview.png');

  // Scenario 2: The Vault
  await page.click('button[data-preset="apparatus"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_lynch_vault.png') });
  console.log('Captured screenshot_lynch_vault.png');

  // Scenario 3: The Rotary Telephone
  await page.click('button[data-preset="telephone"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_lynch_telephone.png') });
  console.log('Captured screenshot_lynch_telephone.png');

  // Scenario 4: The Crimson Envelope
  await page.click('button[data-preset="envelope"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_lynch_envelope.png') });
  console.log('Captured screenshot_lynch_envelope.png');

  // Scenario 5: The Door
  await page.click('button[data-preset="door"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_lynch_door.png') });
  console.log('Captured screenshot_lynch_door.png');

  // 3D Examination Mode
  await page.click('#btn-inspect-3d');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_lynch_inspect_key.png') });
  console.log('Captured screenshot_lynch_inspect_key.png');

  await browser.close();
  console.log('All Lynchian aesthetic screenshots captured cleanly!');
})();
