import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const PORT = 4178;
const DIST_DIR = path.resolve(__dirname, '../dist');

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
  const cleanUrl = req.url.split('?')[0]; let filePath = path.join(DIST_DIR, cleanUrl === '/' ? 'index.html' : cleanUrl);
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
  console.log(`Visual verification server running on http://localhost:${PORT}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => console.log(`[Browser] ${msg.text()}`));
  page.on('pageerror', (err) => console.error(`[Error] ${err.message}`));

  try {
    await page.goto(`http://localhost:${PORT}/?test=true`);
    await page.waitForSelector('#btn-menu-start', { state: 'visible' });

    // Begin intake
    await page.click('#btn-menu-start');
    await page.waitForTimeout(1000);

    // 1. Overview Screenshot
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_room04_overview.png') });
    console.log('Captured screenshot_room04_overview.png');

    // 2. Focus on Desk & Vault
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'vault' });
    });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_room04_apparatus_closeup.png') });
    console.log('Captured screenshot_room04_apparatus_closeup.png');

    // 3. Focus on Telephone
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'telephone' });
    });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_room04_telephone_focus.png') });
    console.log('Captured screenshot_room04_telephone_focus.png');

    // 4. Focus on Envelope
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'envelope' });
    });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_room04_envelope_focus.png') });
    console.log('Captured screenshot_room04_envelope_focus.png');

    console.log('ALL ROOM 04 VISUAL SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('Visual capture failed:', err);
  } finally {
    await browser.close();
    server.close();
    process.exit(0);
  }
});
