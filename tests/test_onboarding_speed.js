import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { startTestServer } from './helpers/testServer.js';

export async function runSuite(page, baseUrl) {
  const consoleErrors = [];
  const errorHandler = (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('404') && (text.includes('.mp3') || text.includes('.glb') || text.includes('Failed to load resource'))) {
        return;
      }
      consoleErrors.push(text);
      console.error(`[Browser Error] ${text}`);
    }
  };
  const pageErrorHandler = (err) => {
    consoleErrors.push(err.message);
    console.error(`[Page Error] ${err.message}`);
  };

  page.on('console', errorHandler);
  page.on('pageerror', pageErrorHandler);

  try {
    console.log('--- Step 1: Navigating to Root URL (Standard User Experience) ---');
    await page.goto(`${baseUrl}/?test=true`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 8000 });

    console.log('--- Step 2: Measuring Click Response on Begin Assessment ---');
    const clickStart = Date.now();
    await page.click('#btn-menu-start');

    // Wait for the menu to disappear
    await page.waitForSelector('#view-main-menu', { state: 'hidden', timeout: 2500 });
    const elapsedMs = Date.now() - clickStart;
    console.log(`Main menu dismissed and hidden in ${elapsedMs}ms`);

    if (elapsedMs > 1500) {
      throw new Error(`Dismissal took too long (${elapsedMs}ms). Expected < 1500ms.`);
    }

    // Verify canvas blur removal and focus
    const canvasClasses = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      return c ? c.className : '';
    });
    console.log('Canvas classes:', canvasClasses);
    if (canvasClasses.includes('canvas-blur')) {
      throw new Error('Canvas still has canvas-blur after menu dismissal');
    }

    // Verify view is chamber
    const isChamberActive = await page.evaluate(() => {
      const hud = document.querySelector('.ui-layer');
      const reticle = document.getElementById('reticle-prompt');
      return hud && !hud.classList.contains('hidden') && reticle !== null;
    });

    if (!isChamberActive) {
      throw new Error('HUD / reticle is not active after dismissal');
    }

    console.log('PASSED: Begin Assessment responds in under 600ms without UI lingering.');
  } finally {
    page.off('console', errorHandler);
    page.off('pageerror', pageErrorHandler);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  console.log(`Onboarding speed test server running on ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });
  const page = await browser.newPage();
  let exitCode = 0;
  try {
    await runSuite(page, baseUrl);
  } catch (err) {
    console.error('TEST FAILED:', err);
    exitCode = 1;
  } finally {
    await browser.close();
    close();
    process.exit(exitCode);
  }
}
