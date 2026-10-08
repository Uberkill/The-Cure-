import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 4199;
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
  console.log(`Capture server running on http://localhost:${PORT}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(`http://localhost:${PORT}`);
    await page.waitForSelector('#btn-begin-intake', { state: 'visible' });
    await page.click('#btn-begin-intake');
    await page.waitForTimeout(1000);

    // 1. Overview of Room 04 showing clean screen with NO floating audio pills and NO frequency slider
    await page.screenshot({ path: 'screenshot_room04_clean_overview.png' });
    console.log('Saved screenshot_room04_clean_overview.png');

    // 2. Settings modal showing audio toggles neatly tucked inside
    await page.click('#btn-settings-toggle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshot_room04_settings_audio_pills.png' });
    console.log('Saved screenshot_room04_settings_audio_pills.png');
    await page.click('#btn-close-settings');
    await page.waitForTimeout(500);

    // 3. Vault focused view revealing the frequency calibration console
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_vault' });
    });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: 'screenshot_room04_vault_focus_freq_console.png' });
    console.log('Saved screenshot_room04_vault_focus_freq_console.png');

    // 4. View facing back wall forward observation corridor door (0 Z-fighting)
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'corridor' });
    });
    await page.waitForTimeout(1400);
    await page.screenshot({ path: 'screenshot_room04_corridor_door_centered.png' });
    console.log('Saved screenshot_room04_corridor_door_centered.png');

    // 5. View facing left wall exit blastdoor
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'door' });
    });
    await page.waitForTimeout(1400);
    await page.screenshot({ path: 'screenshot_room04_left_blastdoor.png' });
    console.log('Saved screenshot_room04_left_blastdoor.png');

    console.log('All screenshots captured successfully.');
  } catch (err) {
    console.error('Screenshot capture failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
