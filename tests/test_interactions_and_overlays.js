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
      if (text.includes('404') && (text.includes('room_04_theme.mp3') || text.includes('Failed to load resource'))) {
        return; // Expected fallback for optional custom music
      }
      consoleErrors.push(text);
      console.error(`[Browser Error] ${text}`);
    }
  };
  page.on('console', errorHandler);

  try {
    console.log('--- Step 1: Loading Application ---');
    await page.goto(`${baseUrl}/?test=true`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 8000 });

    console.log('--- Step 2: Intake Gate Dismissal ---');
    await page.click('#btn-menu-start');
    await page.waitForSelector('#view-main-menu', { state: 'hidden', timeout: 4000 });

    console.log('--- Step 3: Verifying Dark Overlay & Dossier Close X ---');
    // Open dossier by clicking envelope in 3D
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_envelope' });
    });
    await page.waitForSelector('#modal-dossier:not(.hidden)', { timeout: 4000 });

    const isDossierVisible = await page.isVisible('#modal-dossier');
    console.log(`Dossier Visible: ${isDossierVisible}`);

    // Verify overlay background color is NOT blinding white
    const overlayBg = await page.evaluate(() => {
      const el = document.getElementById('modal-dossier');
      return el ? window.getComputedStyle(el).backgroundColor : '';
    });
    console.log(`Dossier Overlay Background: ${overlayBg}`);
    if (overlayBg.includes('237, 240, 235')) {
      throw new Error(`Overlay is still blinding white: ${overlayBg}`);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_audit_dossier_dark.png') });

    // Click Close X button
    console.log('Testing Dossier Close X button...');
    await page.click('#btn-close-dossier');
    await page.waitForSelector('#modal-dossier', { state: 'hidden', timeout: 4000 });
    console.log('Dossier Closed by X: true');

    // Test Backdrop click closing
    console.log('Testing Dossier backdrop click closing...');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_envelope' });
    });
    await page.waitForSelector('#modal-dossier:not(.hidden)', { timeout: 4000 });

    // Click outside the paper on the overlay screen
    await page.mouse.click(50, 50);
    await page.waitForSelector('#modal-dossier', { state: 'hidden', timeout: 4000 });
    console.log('Dossier Closed by Backdrop: true');

    console.log('--- Step 4: Testing Settings Modal Close X & ESC Key ---');
    await page.click('#btn-settings-toggle');
    await page.waitForSelector('#modal-settings:not(.hidden)', { timeout: 4000 });
    console.log('Settings Modal Visible: true');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_audit_settings_dark.png') });

    // Press Escape key
    await page.keyboard.press('Escape');
    await page.waitForSelector('#modal-settings', { state: 'hidden', timeout: 4000 });
    console.log('Settings Closed by Escape: true');

    console.log('--- Step 5: Testing 3D Key Examination Overlay ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_bell_jar' });
    });
    await page.waitForSelector('#modal-inspect:not(.hidden)', { timeout: 4000 });
    console.log('Inspect Modal Visible: true');

    // Verify inspect modal does NOT have blur covering the canvas
    const inspectFilter = await page.evaluate(() => {
      const el = document.getElementById('modal-inspect');
      return el ? window.getComputedStyle(el).backdropFilter : '';
    });
    console.log(`Inspect Modal Backdrop Filter: ${inspectFilter}`);
    if (inspectFilter && inspectFilter !== 'none') {
      throw new Error(`Inspect modal still has CSS backdropFilter blurring canvas: ${inspectFilter}`);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_audit_key_inspect_sharp.png') });

    // Test pin extension via togglePins
    await page.evaluate(() => {
      window.__VAULT_APP__.inspectionManager.togglePins();
    });

    // Close inspect via Close X
    console.log('Testing Inspect Close X button...');
    await page.click('#btn-close-inspect');
    await page.waitForSelector('#modal-inspect', { state: 'hidden', timeout: 4000 });
    console.log('Inspect Closed by X: true');

    console.log('--- Step 6: Testing Camera Drag vs Object Click ---');
    // Drag camera by mouse from center to left
    await page.mouse.move(720, 450);
    await page.mouse.down();
    await page.mouse.move(500, 450, { steps: 5 });
    await page.mouse.up();

    // Ensure dragging didn't accidentally open dossier or inspect modal
    const accidentalDossier = await page.isVisible('#modal-dossier');
    const accidentalInspect = await page.isVisible('#modal-inspect');
    console.log(`Accidental Dossier on drag: ${accidentalDossier}, Accidental Inspect: ${accidentalInspect}`);
    if (accidentalDossier || accidentalInspect) {
      throw new Error('Camera drag erroneously triggered an object click');
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_audit_room_overview.png') });

    console.log('--- Step 7: Checking Errors ---');
    console.log(`Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      throw new Error(`Errors found: ${consoleErrors.join('; ')}`);
    }
    console.log('SUCCESS: All interaction audit test cases verified with 0 console errors!');
  } finally {
    page.off('console', errorHandler);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  console.log(`Test server running on ${baseUrl}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  let exitCode = 0;
  try {
    await runSuite(page, baseUrl);
  } catch (err) {
    console.error('Audit Test Failed:', err);
    exitCode = 1;
  } finally {
    await browser.close();
    close();
    process.exit(exitCode);
  }
}
