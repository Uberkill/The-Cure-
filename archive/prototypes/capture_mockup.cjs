const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  const filePath = 'file:///' + path.resolve('facility_map_mockup.html').replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Capture baseline (Sterile Reception)
  await page.screenshot({ path: 'screenshots/facility_map_mockup_hub.png' });

  // Click on sleep_ward (undiscovered)
  await page.click('.facility-sector-card[data-id="sleep_ward"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'screenshots/facility_map_mockup_redacted.png' });

  console.log('Screenshots captured cleanly.');
  await browser.close();
})();
