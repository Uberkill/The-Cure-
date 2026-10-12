import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { startTestServer } from './helpers/testServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots');

export async function runSuite(page, baseUrl) {
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const consoleErrors = [];
  const errorHandler = (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('404') && (text.includes('.mp3') || text.includes('.glb') || text.includes('Failed to load resource'))) {
        return;
      }
      consoleErrors.push(text);
      console.error('[Page Console Error]', text);
    }
  };
  page.on('console', errorHandler);

  try {
    console.log('--- Step 1: Intake & Bootstrap ---');
    await page.goto(`${baseUrl}/?test=true`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 6000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_app_intro.png') });

    await page.click('#btn-menu-start');
    await page.waitForSelector('#view-main-menu', { state: 'hidden', timeout: 4000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_app_overview.png') });

    console.log('--- Step 2: Camera Hotspot & Dossier Inspection ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'desk' });
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_envelope' });
    });
    await page.waitForSelector('#modal-dossier:not(.hidden)', { state: 'visible', timeout: 4000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_app_dossier.png') });

    await page.click('#btn-close-dossier');
    await page.waitForSelector('#modal-dossier', { state: 'hidden', timeout: 4000 });

    console.log('--- Step 3: Vault Inspection & CRT Screen ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'vault' });
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_vault' });
    });

    // Collect brass shunt
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('inventory:add', { itemId: 'prop_brass_shunt' });
    });

    const slot = await page.$('#slot-shunt');
    if (slot) await slot.click();

    // Calibrate frequency to 528 Hz
    await page.evaluate(() => {
      const dial = document.getElementById('dial-frequency') || document.getElementById('slider-freq');
      if (dial) {
        dial.value = '528';
        dial.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const phase = document.getElementById('dial-phase');
      if (phase) {
        phase.value = '180';
        dial && dial.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    const knifeSwitch = (await page.$('#btn-knife-switch')) || (await page.$('#btn-throw-switch'));
    if (knifeSwitch && !await knifeSwitch.isDisabled()) {
      await knifeSwitch.click();
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_app_freq_lock.png') });

    console.log('--- Step 4: Key Inspection Mode ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_key' });
    });
    await page.waitForSelector('#modal-inspect', { state: 'visible', timeout: 4000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_app_inspect_key.png') });

    await page.click('#btn-close-inspect');
    await page.waitForSelector('#modal-inspect', { state: 'hidden', timeout: 4000 });

    console.log('--- Step 5: Unlocking Observation Corridor ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_corridor' });
    });

    console.log(`Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      throw new Error(`Test encountered console errors: ${consoleErrors.join('; ')}`);
    }
    console.log('SUCCESS: Modernized test_app_e2e passed with 0 console errors!');
  } finally {
    page.off('console', errorHandler);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  console.log(`Test server listening on ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  let exitCode = 0;
  try {
    await runSuite(page, baseUrl);
  } catch (err) {
    console.error('E2E Test failed:', err);
    exitCode = 1;
  } finally {
    await browser.close();
    close();
    process.exit(exitCode);
  }
}
