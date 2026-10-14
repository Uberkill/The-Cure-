import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { startTestServer } from './helpers/testServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots');

export async function runSuite(page, baseUrl) {
  console.log('--- Step 1: Bootstrap App with Test Flag ---');
  await page.goto(`${baseUrl}/?test=true&fps=true`);
  await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });
  await page.click('#btn-menu-start');
  await page.waitForTimeout(300);

  console.log('--- Step 2: Switch to Sleep Ward ---');
  await page.evaluate(() => {
    window.__VAULT_APP__.eventBus.emit('scenario:switch_room', { targetRoomId: 'sleep_ward' });
  });

  await page.waitForFunction(() => {
    return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario()?.id === 'sleep_ward';
  }, { timeout: 5000 });

  await page.waitForTimeout(400);

  console.log('--- Step 3: Capture Overview ---');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'sleep_ward_overview.png') });

  console.log('--- Step 4: Move to Cots Hotspot & Capture Left Cots ---');
  await page.evaluate(() => {
    window.__VAULT_APP__.cameraDirector.moveToHotspot('cots', 0);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'sleep_ward_left_cots.png') });

  console.log('--- Step 5: Move to Cot 104 Hotspot & Capture Vacant Cot ---');
  await page.evaluate(() => {
    window.__VAULT_APP__.cameraDirector.moveToHotspot('cot104', 0);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'sleep_ward_cot_104.png') });

  console.log('--- Step 5.5: Point Camera towards Right Cots ---');
  await page.evaluate(() => {
    const camera = window.__VAULT_APP__.cameraDirector.camera;
    camera.position.set(0, 1.8, 0);
    camera.lookAt(4.45, 1.0, 1.2);
    camera.updateMatrixWorld();
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'sleep_ward_right_cots.png') });

  console.log('--- Step 5.6: Toggle UV Mode and Capture Cot 104 Headboard ---');
  await page.evaluate(() => {
    const scenario = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
    scenario.onObjectClick('prop_uv_toggle');
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'sleep_ward_cot_104_uv.png') });

  console.log('--- Step 6: Test Raycast Clicking on prop_cot_104 and prop_clipboard_104 ---');
  const clickResults = await page.evaluate(() => {
    const scenario = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
    const cotClicked = scenario.onObjectClick('prop_cot_104');
    const clipboardClicked = scenario.onObjectClick('prop_clipboard_104');
    const headboardClicked = scenario.onObjectClick('prop_headboard_104');
    return { cotClicked, clipboardClicked, headboardClicked };
  });

  console.log('Click Results:', clickResults);
  if (!clickResults.cotClicked || !clickResults.clipboardClicked || !clickResults.headboardClicked) {
    throw new Error(`Raycast click dispatch failed: ${JSON.stringify(clickResults)}`);
  }

  console.log('PASSED: Sleep Ward visual audit completed successfully.');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  let exitCode = 0;
  try {
    await runSuite(page, baseUrl);
  } catch (err) {
    console.error('FAILED:', err);
    exitCode = 1;
  } finally {
    await browser.close();
    close();
    process.exit(exitCode);
  }
}
