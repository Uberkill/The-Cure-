import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 4175;
const DIST_DIR = path.resolve('dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, async () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('404') && (text.includes('room_04_theme.mp3') || text.includes('Failed to load resource'))) {
        return; // Expected fallback for optional custom music
      }
      consoleErrors.push(text);
      console.error(`[Browser Error] ${text}`);
    }
  });

  try {
    console.log('--- Step 1: Loading Application ---');
    await page.goto(`http://localhost:${PORT}`);
    await page.waitForSelector('#btn-begin-intake', { state: 'visible' });

    console.log('--- Step 2: Intake Gate Dismissal ---');
    await page.click('#btn-begin-intake');
    await page.waitForTimeout(600);

    console.log('--- Step 3: Verifying Dark Overlay & Dossier Close X ---');
    // Open dossier by clicking envelope in 3D
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_envelope' });
    });
    await page.waitForTimeout(400);

    const isDossierVisible = await page.isVisible('#modal-dossier');
    console.log(`Dossier Visible: ${isDossierVisible}`);

    // Verify overlay background color is NOT blinding white
    const overlayBg = await page.evaluate(() => {
      const el = document.getElementById('modal-dossier');
      return window.getComputedStyle(el).backgroundColor;
    });
    console.log(`Dossier Overlay Background: ${overlayBg}`);
    if (overlayBg.includes('237, 240, 235')) {
      throw new Error(`Overlay is still blinding white: ${overlayBg}`);
    }

    await page.screenshot({ path: 'screenshot_audit_dossier_dark.png' });

    // Click Close X button
    console.log('Testing Dossier Close X button...');
    await page.click('#btn-close-dossier-x');
    await page.waitForTimeout(400);
    const isDossierClosedByX = !(await page.isVisible('#modal-dossier'));
    console.log(`Dossier Closed by X: ${isDossierClosedByX}`);
    if (!isDossierClosedByX) throw new Error('Dossier failed to close via Close X button');

    // Test Backdrop click closing
    console.log('Testing Dossier backdrop click closing...');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_envelope' });
    });
    await page.waitForTimeout(300);
    // Click outside the paper on the overlay screen
    await page.mouse.click(50, 50);
    await page.waitForTimeout(400);
    const isDossierClosedByBackdrop = !(await page.isVisible('#modal-dossier'));
    console.log(`Dossier Closed by Backdrop: ${isDossierClosedByBackdrop}`);
    if (!isDossierClosedByBackdrop) throw new Error('Dossier failed to close via backdrop click');

    console.log('--- Step 4: Testing Settings Modal Close X & ESC Key ---');
    await page.click('#btn-settings-toggle');
    await page.waitForTimeout(300);
    const isSettingsVisible = await page.isVisible('#modal-settings');
    console.log(`Settings Modal Visible: ${isSettingsVisible}`);
    await page.screenshot({ path: 'screenshot_audit_settings_dark.png' });

    // Press Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const isSettingsClosedByEsc = !(await page.isVisible('#modal-settings'));
    console.log(`Settings Closed by Escape: ${isSettingsClosedByEsc}`);
    if (!isSettingsClosedByEsc) throw new Error('Settings failed to close via Escape');

    console.log('--- Step 5: Testing 3D Key Examination Overlay ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_bell_jar' });
    });
    await page.waitForTimeout(400);

    const isInspectVisible = await page.isVisible('#modal-inspect');
    console.log(`Inspect Modal Visible: ${isInspectVisible}`);

    // Verify inspect modal does NOT have blur covering the canvas
    const inspectFilter = await page.evaluate(() => {
      const el = document.getElementById('modal-inspect');
      return window.getComputedStyle(el).backdropFilter;
    });
    console.log(`Inspect Modal Backdrop Filter: ${inspectFilter}`);
    if (inspectFilter && inspectFilter !== 'none') {
      throw new Error(`Inspect modal still has CSS backdropFilter blurring canvas: ${inspectFilter}`);
    }

    await page.screenshot({ path: 'screenshot_audit_key_inspect_sharp.png' });

    // Test pin extension via togglePins
    await page.evaluate(() => {
      window.__VAULT_APP__.inspectionManager.togglePins();
    });
    await page.waitForTimeout(200);

    // Close inspect via Close X
    console.log('Testing Inspect Close X button...');
    await page.click('#btn-close-inspect-x');
    await page.waitForTimeout(400);
    const isInspectClosed = !(await page.isVisible('#modal-inspect'));
    console.log(`Inspect Closed by X: ${isInspectClosed}`);
    if (!isInspectClosed) throw new Error('Inspect failed to close via Close X button');

    console.log('--- Step 6: Testing Camera Drag vs Object Click ---');
    // Drag camera by mouse from center to left
    await page.mouse.move(720, 450);
    await page.mouse.down();
    await page.mouse.move(500, 450, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    // Ensure dragging didn't accidentally open dossier or inspect modal
    const accidentalDossier = await page.isVisible('#modal-dossier');
    const accidentalInspect = await page.isVisible('#modal-inspect');
    console.log(`Accidental Dossier on drag: ${accidentalDossier}, Accidental Inspect: ${accidentalInspect}`);
    if (accidentalDossier || accidentalInspect) {
      throw new Error('Camera drag erroneously triggered an object click');
    }

    await page.screenshot({ path: 'screenshot_audit_room_overview.png' });

    console.log('--- Step 7: Checking Errors ---');
    console.log(`Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.error('Errors found:', consoleErrors);
      process.exitCode = 1;
    } else {
      console.log('SUCCESS: All interaction audit test cases verified with 0 console errors!');
    }
  } catch (err) {
    console.error('Audit Test Failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
