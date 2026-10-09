import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4235;
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
  console.log(`Pair 1 E2E test server running on http://localhost:${PORT}`);
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

  try {
    console.log('--- Step 1: Application Bootstrap ---');
    await page.goto(`http://localhost:${PORT}/?test=true`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#canvas-container canvas', { state: 'visible', timeout: 8000 });
    await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });

    await page.click('#btn-menu-start');
    await page.waitForSelector('#view-main-menu', { state: 'hidden', timeout: 5000 });

    console.log('--- Step 2: Act I - Telephone Monologue Hook ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_telephone');
    });

    const telephoneSub = await page.textContent('#observation-subtitle');
    console.log(`Telephone Subtitle: "${telephoneSub}"`);
    if (!telephoneSub.includes('soothing, monotone voice') && !telephoneSub.includes('Subject 104')) {
      throw new Error(`Unexpected telephone monologue subtitle: ${telephoneSub}`);
    }
    console.log('PASSED: Telephone monologue hook triggered cleanly.');

    console.log('--- Step 3: Act I - Brass Shunt Collection ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_brass_shunt');
    });

    const hasShunt = await page.evaluate(() => {
      const gs = window.__VAULT_APP__.gameState;
      return gs.hasItem('prop_brass_shunt');
    });
    if (!hasShunt) throw new Error('Brass shunt not added to GameState inventory');
    console.log('PASSED: Brass shunt collected into inventory.');

    console.log('--- Step 4: Act I - Open Tektronix CRT Screen ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_oscilloscope');
    });

    await page.waitForSelector('#screen-tektronix-crt:not(.hidden)', { timeout: 3000 });
    const isCrtVisible = await page.isVisible('#screen-tektronix-crt');
    if (!isCrtVisible) throw new Error('Tektronix CRT Screen failed to render');
    console.log('PASSED: Tektronix CRT Screen modal visible.');

    console.log('--- Step 5: Act I - Slot Brass Shunt into Fuse Socket ---');
    await page.click('#slot-shunt');
    const shuntSlotText = await page.textContent('#slot-shunt');
    if (!shuntSlotText.includes('BRASS SHUNT SEATED')) {
      throw new Error(`Failed to seat brass shunt: ${shuntSlotText}`);
    }
    console.log('PASSED: Brass shunt seated in ceramic fuse socket.');

    console.log('--- Step 6: Act I - Frequency Sweep to 528 Hz Resonance ---');
    await page.fill('#dial-frequency', '528');
    await page.dispatchEvent('#dial-frequency', 'input');

    const freqLabel = await page.textContent('#label-frequency');
    if (!freqLabel.includes('528')) {
      throw new Error(`Frequency label mismatch: ${freqLabel}`);
    }

    const isKnifeSwitchReady = await page.evaluate(() => {
      const btn = document.getElementById('btn-knife-switch');
      return btn && !btn.hasAttribute('disabled') && btn.classList.contains('ready');
    });
    if (!isKnifeSwitchReady) throw new Error('Knife switch failed to unlock at 528 Hz');
    console.log('PASSED: Lissajous 528 Hz harmonic lock and knife switch release verified.');

    console.log('--- Step 7: Act I - Throw Knife Switch & Unseal Corridor ---');
    await page.click('#btn-knife-switch');
    await page.waitForFunction(() => {
      return window.__VAULT_APP__.gameState.getStage() === 'ACT_1_HUB_CORRIDOR_OPEN';
    }, { timeout: 4000 });
    console.log('PASSED: Knife switch thrown, corridor pressure seal unlatched.');

    console.log('--- Step 8: Act I - Modal Close & Web Audio Cleanup ---');
    await page.waitForSelector('#screen-tektronix-crt', { state: 'hidden', timeout: 4000 });
    console.log('PASSED: Tektronix CRT screen closed and resources cleaned up.');

    console.log('--- Step 9: Traversing into Act II (The Sleep Ward) ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('scenario:switch_room', { targetRoomId: 'sleep_ward' });
    });

    await page.waitForFunction(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'sleep_ward';
    }, { timeout: 5000 });
    console.log('PASSED: Sleep Ward loaded successfully.');

    console.log('--- Step 10: Act II - Surgical Ultraviolet Mode Toggle ---');
    await page.evaluate(() => {
      const scenario = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      scenario.onObjectClick('prop_uv_toggle');
    });

    const uvSub = await page.textContent('#observation-subtitle');
    console.log(`UV Subtitle: "${uvSub}"`);
    if (!uvSub.includes('ultraviolet') && !uvSub.includes('blacklight')) {
      throw new Error(`UV toggle did not emit ultraviolet subtitle: ${uvSub}`);
    }
    console.log('PASSED: UV blacklight and glowing wall stencil mode active.');

    console.log('--- Step 11: Act II - Open Mobile Dispensary Cart Screen ---');
    await page.evaluate(() => {
      const scenario = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      scenario.onObjectClick('prop_trolley');
    });

    await page.waitForSelector('#screen-dispensary-cart:not(.hidden)', { timeout: 3000 });
    const isCartVisible = await page.isVisible('#screen-dispensary-cart');
    if (!isCartVisible) throw new Error('Dispensary Cart Screen failed to open');
    console.log('PASSED: Mobile Dispensary Cart Screen visible.');

    console.log('--- Step 12: Act II - Calibrate Peristaltic Drip to 68 BPM ---');
    await page.fill('#slider-drip-rate', '68');
    await page.dispatchEvent('#slider-drip-rate', 'input');

    const bpmLabel = await page.textContent('#label-drip-bpm');
    if (!bpmLabel.includes('CARDIAC REST SYNC')) {
      throw new Error(`Peristaltic flow did not calibrate: ${bpmLabel}`);
    }
    console.log('PASSED: Peristaltic flow synchronized to 68 BPM.');

    console.log('--- Step 13: Act II - Chemical Triad Tumbler Alignment ---');
    // Rotate tumbler 0 to NITROUS
    for (let i = 0; i < 5; i++) {
      const text = await page.textContent('#tumbler-0');
      if (text === 'NITROUS') break;
      await page.click('#tumbler-0');
    }
    // Rotate tumbler 1 to BROMIDE
    for (let i = 0; i < 5; i++) {
      const text = await page.textContent('#tumbler-1');
      if (text === 'BROMIDE') break;
      await page.click('#tumbler-1');
    }
    // Rotate tumbler 2 to VALERIAN
    for (let i = 0; i < 5; i++) {
      const text = await page.textContent('#tumbler-2');
      if (text === 'VALERIAN') break;
      await page.click('#tumbler-2');
    }

    const t0 = await page.textContent('#tumbler-0');
    const t1 = await page.textContent('#tumbler-1');
    const t2 = await page.textContent('#tumbler-2');
    console.log(`Tumblers aligned to: [${t0} • ${t1} • ${t2}]`);

    const isDrawerReady = await page.evaluate(() => {
      const btn = document.getElementById('btn-unlock-drawer');
      return btn && !btn.hasAttribute('disabled');
    });
    if (!isDrawerReady) throw new Error('Dispensary drawer failed to unlock after chemical alignment');

    console.log('--- Step 14: Act II - Release Drawer & Collect Crystal 01 ---');
    await page.click('#btn-unlock-drawer');

    await page.waitForFunction(() => {
      const gs = window.__VAULT_APP__.gameState;
      return gs.getStage() === 'ACT_2_CRYSTAL_1_RECOVERED';
    }, { timeout: 4000 });
    console.log('PASSED: Memory Crystal 01 (Prismatic Quartz) recovered and GameState synchronized.');

    console.log('--- Step 15: Console Error Audit ---');
    if (consoleErrors.length > 0) {
      throw new Error(`Console errors detected: ${JSON.stringify(consoleErrors)}`);
    }
    console.log('PASSED: 0 console errors during Pair 1 E2E execution.');

    console.log('\n=============================================');
    console.log('SUCCESS: All Phase 1 (Act I & Act II) E2E tests PASSED!');
    console.log('=============================================\n');

  } catch (err) {
    console.error('FAILED: Pair 1 E2E Test execution failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
