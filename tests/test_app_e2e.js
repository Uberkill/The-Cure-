import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.json': 'application/json',
  '.mp3': 'audio/mpeg',
  '.glb': 'model/gltf-binary'
};

const server = http.createServer((req, res) => {
  const reqPath = req.url ? req.url.split('?')[0] : '/';
  const filePath = path.join(distDir, reqPath === '/' ? 'index.html' : reqPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

const PORT = 4173;
server.listen(PORT, async () => {
  console.log(`Test server listening on http://localhost:${PORT}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });

  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('404') && (text.includes('.mp3') || text.includes('.glb') || text.includes('Failed to load resource'))) {
        return;
      }
      consoleErrors.push(text);
      console.error('[Page Console Error]', text);
    }
  });

  try {
    console.log('--- Step 1: Intake & Bootstrap ---');
    await page.goto(`http://localhost:${PORT}/?test=true`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 6000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_app_intro.png') });

    await page.click('#btn-menu-start');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_app_overview.png') });

    console.log('--- Step 2: Camera Hotspot & Dossier Inspection ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'desk' });
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_envelope' });
    });
    await page.waitForSelector('#modal-dossier', { state: 'visible', timeout: 3000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_app_dossier.png') });

    await page.click('#btn-close-dossier');
    await page.waitForSelector('#modal-dossier', { state: 'hidden', timeout: 3000 });

    console.log('--- Step 3: Vault Inspection & CRT Screen ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'vault' });
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_vault' });
    });
    await page.waitForTimeout(500);

    // Collect brass shunt
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('inventory:add', { itemId: 'prop_brass_shunt' });
    });
    await page.waitForTimeout(200);

    const slot = await page.$('#slot-shunt');
    if (slot) await slot.click();
    await page.waitForTimeout(300);

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
        phase.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(300);

    const knifeSwitch = (await page.$('#btn-knife-switch')) || (await page.$('#btn-throw-switch'));
    if (knifeSwitch && !await knifeSwitch.isDisabled()) {
      await knifeSwitch.click();
      await page.waitForTimeout(600);
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_app_freq_lock.png') });

    console.log('--- Step 4: Key Inspection Mode ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_key' });
    });
    await page.waitForSelector('#modal-inspect', { state: 'visible', timeout: 3000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_app_inspect_key.png') });

    await page.click('#btn-close-inspect');
    await page.waitForSelector('#modal-inspect', { state: 'hidden', timeout: 3000 });

    console.log('--- Step 5: Unlocking Observation Corridor ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_corridor' });
    });
    await page.waitForTimeout(800);

    console.log(`Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.error('Test encountered errors:', consoleErrors);
      process.exitCode = 1;
    } else {
      console.log('SUCCESS: Modernized test_app_e2e passed with 0 console errors!');
    }
  } catch (err) {
    console.error('E2E Test failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
