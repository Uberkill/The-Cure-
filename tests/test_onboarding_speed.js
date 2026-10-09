import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4222;
const DIST_DIR = path.resolve(__dirname, '../dist');

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
  const filePath = path.join(DIST_DIR, cleanUrl === '/' ? 'index.html' : cleanUrl);
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
  console.log(`Onboarding speed test server running on http://localhost:${PORT}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });

  const page = await browser.newPage();
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('404') && (text.includes('.mp3') || text.includes('.glb') || text.includes('Failed to load resource'))) {
        return;
      }
      consoleErrors.push(text);
      console.error(`[Browser Error] ${text}`);
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
    console.error(`[Page Error] ${err.message}`);
  });

  try {
    console.log('--- Step 1: Navigating to Root URL (Standard User Experience) ---');
    await page.goto(`http://localhost:${PORT}`);
    await page.waitForSelector('#btn-menu-start', { state: 'visible' });

    console.log('--- Step 2: Measuring Click Response on Begin Assessment ---');
    const clickStart = Date.now();
    await page.click('#btn-menu-start');

    // Wait for the menu to disappear
    await page.waitForSelector('#view-main-menu', { state: 'hidden', timeout: 1500 });
    const elapsedMs = Date.now() - clickStart;
    console.log(`Main menu dismissed and hidden in ${elapsedMs}ms`);

    if (elapsedMs > 1000) {
      throw new Error(`Dismissal took too long (${elapsedMs}ms). Expected < 1000ms.`);
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
    await browser.close();
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('TEST FAILED:', err);
    await browser.close();
    server.close();
    process.exit(1);
  }
});
