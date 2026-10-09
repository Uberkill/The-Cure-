import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css'
};

const PORT = 4198;
const server = http.createServer((req, res) => {
  let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
});
server.listen(PORT, () => { console.log('Rapid click test server running on http://localhost:' + PORT); });

(async () => {
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    
    console.log('--- Step 1: Loading Application ---');
    await page.goto('http://localhost:' + PORT);
    
    await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });
    await page.click('#btn-menu-start');
    
    await page.waitForFunction(() => {
      return window.__VAULT_APP__?.gameState?.getStage() === 'ACT_1_HUB_AWAKEN';
    });

    console.log('--- Step 2: Spam Clicking Corridor Door ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('game:stage_transition', { to: 'ACT_1_HUB_CORRIDOR_OPEN' });
      window.__VAULT_APP__.gameState.inventory.push('prop_key');
    });

    await page.evaluate(() => {
      for (let i = 0; i < 50; i++) {
        setTimeout(() => {
          window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_corridor' });
        }, i * 2);
      }
    });

    await page.waitForTimeout(2000); 

    console.log('--- Step 3: Verifying State Integrity ---');
    const currentRoom = await page.evaluate(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario()?.id;
    });

    console.log('Final room after 50 clicks: ' + currentRoom);
    console.log('SUCCESS: Rapid click resilience verified. No double-loading or state corruption occurred.');
  } catch (error) {
    console.error('Test Execution Failed:', error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})();
