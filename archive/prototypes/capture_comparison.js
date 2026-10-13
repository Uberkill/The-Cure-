import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4189;
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');
const SCREENSHOTS_DIR = path.resolve(ROOT_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp3': 'audio/mpeg',
  '.glb': 'model/gltf-binary'
};

const server = http.createServer((req, res) => {
  const cleanUrl = req.url.split('?')[0];

  // Route style_showcase or libs or root files from ROOT_DIR, otherwise from DIST_DIR
  let filePath;
  if (cleanUrl.startsWith('/libs/') || cleanUrl === '/style_showcase.html') {
    filePath = path.join(ROOT_DIR, cleanUrl);
  } else {
    filePath = path.join(DIST_DIR, cleanUrl === '/' ? 'index.html' : cleanUrl);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(ROOT_DIR, cleanUrl);
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found: ' + cleanUrl);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, async () => {
  console.log(`Comparison server running on http://localhost:${PORT}`);
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--autoplay-policy=no-user-gesture-required'
    ]
  });

  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

  try {
    console.log('--- 1. Capturing style_showcase.html (Reference Version) ---');
    await page.goto(`http://localhost:${PORT}/style_showcase.html`);
    await page.waitForTimeout(2000);

    const showcaseOverview = path.join(SCREENSHOTS_DIR, 'showcase_room_overview.png');
    await page.screenshot({ path: showcaseOverview });
    console.log('Saved:', showcaseOverview);

    if (await page.$('button[data-preset="apparatus"]')) {
      await page.click('button[data-preset="apparatus"]');
      await page.waitForTimeout(1500);
      const showcaseVault = path.join(SCREENSHOTS_DIR, 'showcase_room_vault.png');
      await page.screenshot({ path: showcaseVault });
      console.log('Saved:', showcaseVault);
    }

    console.log('--- 2. Capturing Current Main Application Room 04 ---');
    await page.goto(`http://localhost:${PORT}/index.html`);
    await page.waitForSelector('#btn-begin-intake', { state: 'visible', timeout: 5000 });
    await page.click('#btn-begin-intake');
    await page.waitForTimeout(2000);

    const currentOverview = path.join(SCREENSHOTS_DIR, 'current_app_overview.png');
    await page.screenshot({ path: currentOverview });
    console.log('Saved:', currentOverview);

    // Switch to vault hotspot in current app
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'vault' });
    });
    await page.waitForTimeout(1500);

    const currentVault = path.join(SCREENSHOTS_DIR, 'current_app_vault.png');
    await page.screenshot({ path: currentVault });
    console.log('Saved:', currentVault);

    console.log('Comparison screenshots captured successfully.');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
    server.close();
  }
});
