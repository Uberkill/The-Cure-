import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, 'dist');

// Simple static file server for dist/
const server = http.createServer((req, res) => {
  let reqPath = req.url ? req.url.split('?')[0] : '/';
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(distDir, reqPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath);
    const contentTypeMap = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.png': 'image/png',
      '.json': 'application/json'
    };
    res.writeHead(200, { 'Content-Type': contentTypeMap[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(4173, async () => {
  console.log('Test server listening on http://localhost:4173');

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });

  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('404') && (text.includes('room_04_theme.mp3') || text.includes('Failed to load resource'))) {
        return;
      }
      consoleErrors.push(text);
      console.error('[Page Console Error]', text);
    } else {
      console.log(`[Page ${msg.type()}]`, msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
    console.error('[Page Error]', err.message);
  });

  try {
    await page.goto('http://localhost:4173');
    await page.waitForTimeout(1000);

    // 1. Intake screen
    await page.screenshot({ path: path.resolve(__dirname, 'screenshot_app_intro.png') });
    console.log('Captured screenshot_app_intro.png');

    // Click Begin Intake
    await page.click('#btn-begin-intake');
    await page.waitForTimeout(1200);

    // 2. Chamber Overview
    await page.screenshot({ path: path.resolve(__dirname, 'screenshot_app_overview.png') });
    console.log('Captured screenshot_app_overview.png');

    // 3. Navigate to Vault Hotspot
    await page.click('button[data-preset="vault"]');
    await page.waitForTimeout(1400);
    await page.screenshot({ path: path.resolve(__dirname, 'screenshot_app_vault.png') });
    console.log('Captured screenshot_app_vault.png');

    // 4. Navigate to Envelope & Inspect Dossier
    await page.click('button[data-preset="envelope"]');
    await page.waitForTimeout(1400);

    // Trigger dossier inspection click
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_envelope' });
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.resolve(__dirname, 'screenshot_app_dossier.png') });
    console.log('Captured screenshot_app_dossier.png');

    // Close dossier
    await page.click('#btn-close-dossier');
    await page.waitForTimeout(800);

    // 5. Test Bell Jar lift & Key Collection
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_bell_jar' });
    });
    await page.waitForTimeout(1000);

    // 6. Test 3D Examination Mode
    await page.click('#btn-inspect-3d');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.resolve(__dirname, 'screenshot_app_inspect_key.png') });
    console.log('Captured screenshot_app_inspect_key.png');

    // Extend pins in inspection mode
    await page.evaluate(() => {
      window.__VAULT_APP__.inspectionManager.togglePins();
    });
    await page.waitForTimeout(500);

    // Close inspection mode
    await page.click('#btn-close-inspect');
    await page.waitForTimeout(800);

    // 7. Insert Key into Vault
    await page.click('button[data-preset="vault"]');
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_vault' });
    });
    await page.waitForTimeout(1200);

    // 8. Tune Frequency Slider to 528 Hz
    await page.evaluate(() => {
      const slider = document.getElementById('slider-freq');
      if (slider) {
        slider.value = '528';
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.resolve(__dirname, 'screenshot_app_freq_lock.png') });
    console.log('Captured screenshot_app_freq_lock.png');

    // 9. Throw Relay Switch
    await page.click('#btn-throw-switch');
    await page.waitForTimeout(1500);

    // 10. Click Exit Door -> Debrief Modal
    await page.click('button[data-preset="door"]');
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_door' });
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.resolve(__dirname, 'screenshot_app_debrief.png') });
    console.log('Captured screenshot_app_debrief.png');

    console.log('E2E Test completed successfully!');
    console.log(`Console Errors: ${consoleErrors.length}`);

    if (consoleErrors.length > 0) {
      console.error('Test encountered errors:', consoleErrors);
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('E2E Test failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
