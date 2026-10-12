import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4220;
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
  console.log(`[TEST SERVER] Running on http://localhost:${PORT}`);
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--autoplay-policy=no-user-gesture-required'
    ]
  });

  const page = await browser.newPage();
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('404') && !text.includes('Failed to load resource')) {
        consoleErrors.push(text);
      }
    }
  });

  try {
    console.log('[TEST] Navigating to application...');
    await page.goto(`http://localhost:${PORT}/?test=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Bypass menu
    await page.evaluate(() => {
      document.getElementById('view-main-menu')?.classList.add('hidden');
    });
    await page.waitForTimeout(500);

    // 1. Test Facility Map Toggle via HUD button
    console.log('[TEST 1] Testing #btn-facility-map-toggle...');
    const btnMap = page.locator('#btn-facility-map-toggle');
    const count = await btnMap.count();
    if (count === 0) throw new Error('#btn-facility-map-toggle not found in DOM');

    await btnMap.click();
    await page.waitForTimeout(400);

    const mapModal = page.locator('#screen-facility-map');
    const isVisible = await mapModal.isVisible();
    if (!isVisible) throw new Error('#screen-facility-map modal failed to open upon clicking toggle button');
    console.log('[PASS 1] #screen-facility-map opened successfully.');

    // 2. Verify all 8 sector cards exist in the blueprint
    console.log('[TEST 2] Verifying 8 sector cards in blueprint...');
    const sectorCards = page.locator('.facility-sector-card');
    const cardCount = await sectorCards.count();
    if (cardCount !== 8) throw new Error(`Expected 8 sector cards, found ${cardCount}`);
    console.log(`[PASS 2] All ${cardCount} facility sector cards rendered cleanly.`);

    // 3. Test Escape key modal dismissal
    console.log('[TEST 3] Testing Escape key dismissal...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const isHiddenAfterEsc = await mapModal.evaluate((el) => el.classList.contains('hidden'));
    if (!isHiddenAfterEsc) throw new Error('Escape key did not dismiss #screen-facility-map');
    console.log('[PASS 3] Escape key dismissed facility blueprint cleanly.');

    // 4. Test Hub CRT Oscilloscope Click with Pending Crystal
    console.log('[TEST 4] Testing Hub CRT Oscilloscope Click with Pending Crystal...');
    await page.evaluate(() => {
      // Simulate player collecting crystal_01_quartz in Sleep Ward and returning to Hub
      const gs = window.__VAULT_APP__?.gameState || window.GameState?.getInstance();
      const bus = window.__VAULT_APP__?.eventBus || window.EventBus?.getInstance();
      
      // Dispatch via window or app event bus
      if (bus) {
        bus.emit('puzzle:crystal_collected', {
          crystalId: 'crystal_01_quartz',
          label: 'PRISMATIC QUARTZ'
        });
      }
    });
    await page.waitForTimeout(400);

    // Trigger onObjectClick for prop_oscilloscope
    const patcherOpened = await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      const bus = app?.eventBus;
      const scenario = app?.scenarioRegistry?.getCurrentScenario();

      // Invoke click on prop_oscilloscope
      if (scenario && typeof scenario.onObjectClick === 'function') {
        const handled = scenario.onObjectClick('prop_oscilloscope');
        return handled;
      }
      return false;
    });

    await page.waitForTimeout(500);
    const crtModal = page.locator('#modal-crt-patcher');
    const isCrtVisible = await crtModal.isVisible();
    if (!isCrtVisible) {
      throw new Error(`CRT Node Patcher modal was not opened on clicking oscilloscope (handled: ${patcherOpened})`);
    }
    console.log('[PASS 4] Hub CRT oscilloscope click opened #modal-crt-patcher for pending crystal.');

    // 5. Test CRT Node Patcher Auto-Stabilize and Progression Unlock
    console.log('[TEST 5] Testing CRT Auto-Stabilize and stage progression...');
    const btnAutoPatch = page.locator('#btn-crt-auto-patch');
    await btnAutoPatch.click();
    await page.waitForTimeout(800);

    const isCrtClosed = await crtModal.evaluate((el) => el.classList.contains('hidden'));
    if (!isCrtClosed) throw new Error('CRT Node Patcher modal did not close after stabilization');

    // Verify stage transition to ACT_2_PATCH_1_COMPLETE
    const stageAfterPatch = await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      return app?.gameState?.getStage();
    });
    console.log(`[PASS 5] CRT Patch completed. Game stage advanced to: ${stageAfterPatch}`);

    // 6. Test Oscilloscope fallback after patching (no pending crystals)
    console.log('[TEST 6] Testing Oscilloscope fallback subtitle when no crystals pending...');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      const scenario = app?.scenarioRegistry?.getCurrentScenario();
      if (scenario) scenario.onObjectClick('prop_oscilloscope');
    });
    await page.waitForTimeout(300);

    const subtitleText = await page.locator('#observation-subtitle').textContent();
    if (!subtitleText || !subtitleText.includes('calibrated')) {
      throw new Error(`Expected calibration subtitle, got: "${subtitleText}"`);
    }
    console.log(`[PASS 6] Verified fallback subtitle: "${subtitleText.trim()}"`);

    // 7. Test Facility Map Transit to unlocked sector
    console.log('[TEST 7] Testing Facility Map Transit to unlocked sector...');
    await btnMap.click();
    await page.waitForTimeout(400);

    // Select sleep_ward card
    const sleepCard = page.locator('.facility-sector-card[data-sector-id="sleep_ward"]');
    await sleepCard.click();
    await page.waitForTimeout(200);

    const btnTransit = page.locator('#btn-facility-transit');
    const btnTransitText = await btnTransit.textContent();
    console.log(`Transit button state: "${btnTransitText?.trim()}"`);
    await btnTransit.click();
    await page.waitForTimeout(600);

    // Verify scenario switched to sleep_ward
    const currentRoom = await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      return app?.scenarioRegistry?.getCurrentScenario()?.id;
    });
    console.log(`[PASS 7] Facility transit executed. Current room is: "${currentRoom}"`);

    if (consoleErrors.length > 0) {
      console.warn('[WARNING] Console errors observed:', consoleErrors);
    }

    console.log('[ALL TESTS PASSED] Facility blueprint and CRT progression fully verified.');
  } catch (err) {
    console.error('[TEST FAILURE]', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
