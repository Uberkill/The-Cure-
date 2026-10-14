import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { startTestServer } from './helpers/testServer.js';

async function testTelemetryUnslop() {
  const { baseUrl, close } = await startTestServer();
  console.log(`Test server running at ${baseUrl}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    console.log('--- Step 1: Navigating to ?editor=true ---');
    await page.goto(`${baseUrl}/?editor=true`);
    await page.waitForSelector('#dev-3d-editor-panel', { state: 'visible', timeout: 8000 });

    if (await page.isVisible('#btn-menu-start')) {
      await page.click('#btn-menu-start');
      await page.waitForTimeout(400);
    }

    console.log('--- Step 2: Clicking Telemetry Tab ---');
    await page.click('button[data-tab="telemetry"]');
    await page.waitForTimeout(300);

    const isTelemVisible = await page.$eval('#tab-telemetry', el => el.style.display !== 'none');
    console.log(`Telemetry tab visible: ${isTelemVisible}`);
    if (!isTelemVisible) throw new Error('Telemetry tab was not visible');

    console.log('--- Step 3: Verifying Dual-Phosphor Cathode Cluster Metrics ---');
    // Wait for telemetry loop to populate values (runs every 200ms)
    await page.waitForTimeout(600);

    const metrics = await page.evaluate(() => {
      const fps = document.getElementById('dev-telem-fps')?.textContent;
      const delta = document.getElementById('dev-telem-delta')?.textContent;
      const draws = document.getElementById('dev-telem-draws')?.textContent;
      const tris = document.getElementById('dev-telem-tris')?.textContent;
      const geom = document.getElementById('dev-telem-geom')?.textContent;
      const tex = document.getElementById('dev-telem-tex')?.textContent;
      const prog = document.getElementById('dev-telem-prog')?.textContent;
      const logs = document.getElementById('dev-telem-logs')?.innerHTML;

      // Check colors of telemetry elements
      const fpsColor = document.getElementById('dev-telem-fps')?.style.color || window.getComputedStyle(document.getElementById('dev-telem-fps')).color;
      const drawsColor = document.getElementById('dev-telem-draws')?.style.color || window.getComputedStyle(document.getElementById('dev-telem-draws')).color;

      return { fps, delta, draws, tris, geom, tex, prog, logLength: logs?.length, fpsColor, drawsColor };
    });

    console.log('Telemetry metrics snapshot:', metrics);
    if (!metrics.fps || !metrics.delta) {
      throw new Error('Telemetry metrics failed to populate!');
    }

    console.log('--- Step 4: Verifying Zero Forbidden Slop Tropes in Telemetry Markup ---');
    const telemHtml = await page.$eval('#tab-telemetry', el => el.innerHTML);
    const forbiddenTells = ['#00ff88', '#f472b6', '#38bdf8', '#a78bfa', '#60a5fa'];
    for (const tell of forbiddenTells) {
      if (telemHtml.includes(tell)) {
        throw new Error(`Telemetry markup contains forbidden AI slop color: ${tell}`);
      }
    }
    console.log('PASSED: Zero rainbow AI colors found in telemetry markup.');

    console.log('--- Step 5: Capturing Screenshot of Laboratory Rack Instrument ---');
    const screenshotPath = path.resolve('tests/telemetry_rack_unslop.png');
    await page.locator('#dev-3d-editor-panel').screenshot({ path: screenshotPath });
    console.log(`Saved screenshot to ${screenshotPath}`);

    console.log('SUCCESS: All Telemetry Unslop & Dual-Phosphor Rack checks PASSED.');
  } finally {
    await browser.close();
    close();
  }
}

testTelemetryUnslop().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
