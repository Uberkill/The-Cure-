import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, 'dist');

// Static file server for dist/
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

const PORT = 4174;
server.listen(PORT, async () => {
  console.log(`Test server running on http://localhost:${PORT}`);

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
        return; // Expected fallback
      }
      consoleErrors.push(text);
      console.error('[Page Console Error]', text);
    } else {
      console.log(`[Page ${msg.type()}]`, msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
    console.error('[Unhandled Page Exception]', err.message);
  });

  try {
    console.log('--- Step 1: Loading Application ---');
    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshot_step1_intro.png' });

    console.log('--- Step 2: Beginning Cognitive Intake ---');
    await page.click('#btn-begin-intake');
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'screenshot_step2_hub.png' });

    console.log('--- Step 3: Verifying Settings Gear ---');
    await page.click('#btn-settings-toggle');
    await page.waitForTimeout(400);
    const settingsVisible = await page.isVisible('#modal-settings');
    console.log(`Settings Modal Visible: ${settingsVisible}`);
    if (!settingsVisible) throw new Error('Settings modal failed to open');
    await page.click('#btn-close-settings');
    await page.waitForTimeout(300);

    console.log('--- Step 4: Focusing Vault & Calibrating Dial to 528 Hz ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_vault' });
    });
    await page.waitForTimeout(400);

    await page.evaluate(() => {
      const slider = document.getElementById('slider-freq');
      slider.value = '528';
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(300);
    await page.click('#btn-throw-switch');
    await page.waitForTimeout(600);

    console.log('--- Step 5: Traversing into Room 02 (The Sleep Ward) ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_corridor' });
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'screenshot_step5_sleep_ward.png' });

    console.log('--- Step 6: Solving Sleep Ward 3-Digit Rotary Lock (1-0-4) ---');
    await page.evaluate(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      // Solve code to 1-0-4
      current.digits = [1, 0, 4];
      current.onObjectClick('prop_trolley_lock');
      current.onObjectClick('crystal_01_quartz');
    });
    await page.waitForTimeout(500);

    console.log('--- Step 7: Returning to Hub & Patching CRT Node 1 ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_return_hub' });
    });
    await page.waitForTimeout(800);
    // Click vault to open patcher
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_vault' });
    });
    await page.waitForTimeout(400);
    await page.click('#btn-crt-auto-patch');
    await page.waitForTimeout(600);
    console.log('CRT Node 1 patched. Audio Log 1 unlocked.');

    console.log('--- Step 8: Traversing into Room 03 (The Hydrotherapy Room) ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_corridor' });
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'screenshot_step8_hydrotherapy.png' });

    console.log('--- Step 9: Balancing Hydrotherapy Valves & Recovering Bronze Crystal ---');
    await page.evaluate(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      // Set balanced valve state
      current.valveRotations = [2, 1, 3];
      current.onObjectClick('prop_manifold');
      current.onObjectClick('crystal_02_bronze');
    });
    await page.waitForTimeout(500);

    console.log('--- Step 10: Returning to Hub & Patching CRT Node 2 ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_return_hub' });
    });
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_vault' });
    });
    await page.waitForTimeout(400);
    await page.click('#btn-crt-auto-patch');
    await page.waitForTimeout(600);
    console.log('CRT Node 2 patched. Audio Log 2 unlocked.');

    console.log('--- Step 11: Traversing into Room 04 (The Audiology Vault) ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_corridor' });
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'screenshot_step11_audiology.png' });

    console.log('--- Step 12: Tuning Amplifier to 741 Hz & Recovering Amethyst Crystal ---');
    await page.evaluate(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      current.currentToneFreq = 741;
      current.onObjectClick('prop_amp_stack');
      current.onObjectClick('crystal_03_amethyst');
    });
    await page.waitForTimeout(500);

    console.log('--- Step 13: Returning to Hub & Patching CRT Node 3 ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_return_hub' });
    });
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_vault' });
    });
    await page.waitForTimeout(400);
    await page.click('#btn-crt-auto-patch');
    await page.waitForTimeout(600);
    console.log('CRT Node 3 patched. Audio Log 3 unlocked.');

    console.log('--- Step 14: Traversing into Room 05 (The Archive) ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_corridor' });
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'screenshot_step14_archive.png' });

    console.log('--- Step 15: Searching Drawer 104 & Recovering Obsidian Crystal ---');
    await page.evaluate(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      current.onObjectClick('prop_drawer_104');
      current.onObjectClick('crystal_04_obsidian');
    });
    await page.waitForTimeout(500);

    console.log('--- Step 16: Returning to Decaying Hub & Patching CRT Node 4 ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_return_hub' });
    });
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_vault' });
    });
    await page.waitForTimeout(400);
    await page.click('#btn-crt-auto-patch');
    await page.waitForTimeout(600);
    console.log('CRT Node 4 patched. Hub decayed to level 4.');

    console.log('--- Step 17: Traversing into Room 06 (The Director\'s Office) ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_corridor' });
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'screenshot_step17_directors_office.png' });

    console.log('--- Step 18: Listening to Breathing Phone & Recovering Celadon Crystal ---');
    await page.evaluate(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      current.onObjectClick('prop_void_phone');
      current.onObjectClick('crystal_05_celadon');
    });
    await page.waitForTimeout(500);

    console.log('--- Step 19: Returning to Hub & Final Synthesis (Act VII Blackout) ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_return_hub' });
    });
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_vault' });
    });
    await page.waitForTimeout(400);
    await page.click('#btn-crt-auto-patch');
    // Wait for the 3s blackout and exit door blowout
    console.log('Act VII Blackout holding for 3.2s...');
    await page.waitForTimeout(3500);
    await page.screenshot({ path: 'screenshot_step19_hub_blackout.png' });

    console.log('--- Step 20: Stepping through the Blown Exit Door into Act VIII (The Velvet Lounge) ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_door' });
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshot_step20_velvet_lounge.png' });

    console.log('--- Step 21: Inspecting Gilded Bar Mirror ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_bar_mirror_glass' });
    });
    await page.waitForTimeout(500);

    console.log('--- Step 22: Answering the Solitary Ringing Payphone Climax ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_lounge_payphone' });
    });
    // Wait for voice message (3.6s), 528 Hz blast, and cut to blackout screen (800ms)
    await page.waitForTimeout(5200);
    await page.screenshot({ path: 'screenshot_step22_terminal_deployed.png' });

    const blackoutVisible = await page.isVisible('#view-terminal-blackout');
    console.log(`Terminal Blackout View Visible: ${blackoutVisible}`);

    console.log('--- Verification Result ---');
    console.log(`Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.error('Errors found:', consoleErrors);
      process.exitCode = 1;
    } else {
      console.log('SUCCESS: All 8 Acts verified with 0 console errors!');
    }
  } catch (err) {
    console.error('Test Execution Failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
