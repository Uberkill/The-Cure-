import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4244;
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
  console.log(`Phase 4 Edge-Cases Test server running on http://localhost:${PORT}`);
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
    console.log('--- Suite 1: App Bootstrap & Navigation ---');
    await page.goto(`http://localhost:${PORT}/?test=true`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#canvas-container canvas', { state: 'visible', timeout: 8000 });
    await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });

    await page.click('#btn-menu-start');
    await page.waitForSelector('#view-main-menu', { state: 'hidden', timeout: 5000 });

    // -------------------------------------------------------------
    // ACT VII: THE SYNTHESIS CHAMBER & GALVANOMETER GRID EDGE CASES
    // -------------------------------------------------------------
    console.log('--- Suite 2: Act VII Galvanometer Grid Edge Cases ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'synthesis_blackout' });
    });

    await page.waitForFunction(() => {
      const app = window.__VAULT_APP__;
      return app.scenarioRegistry.getCurrentScenario().id === 'synthesis_blackout';
    }, { timeout: 4000 });

    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_galvanometer_grid');
    });

    await page.waitForSelector('#screen-galvanometer-grid:not(.hidden)', { timeout: 3000 });

    console.log('--- Test 2.1: Overload Breaker Trip at 200 Ohms ---');
    // Push slider 0 to maximum 200 Ohms to trip breaker
    await page.$eval('#slider-shunt-0', (el) => {
      el.value = '200';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const breakerText = await page.textContent('#label-breaker-status');
    if (!breakerText.includes('BREAKER TRIPPED') || !breakerText.includes('RESISTANCE OVERLOAD')) {
      throw new Error(`Expected breaker tripped status text, received: ${breakerText}`);
    }

    const isResetBtnVisible = await page.$eval('#btn-reset-breaker', (el) => !el.classList.contains('hidden'));
    if (!isResetBtnVisible) {
      throw new Error('Expected reset master breaker button to be visible.');
    }

    // Verify sliders are locked while breaker is tripped
    const areSlidersLocked = await page.$eval('#slider-shunt-1', (el) => el.disabled);
    if (!areSlidersLocked) {
      throw new Error('Expected channel sliders to be disabled while breaker is tripped.');
    }

    const tripSubtitle = await page.textContent('#observation-subtitle');
    if (!tripSubtitle.includes('Master circuit breaker tripped') || !tripSubtitle.includes('overloaded (200 Ohms)')) {
      throw new Error(`Expected overload trip subtitle, received: ${tripSubtitle}`);
    }
    console.log('PASSED: Overload breaker tripped and bus locked cleanly.');

    console.log('--- Test 2.2: Master Breaker Reset & Auto-Solve Prevention ---');
    await page.click('#btn-reset-breaker');

    const resetBreakerText = await page.textContent('#label-breaker-status');
    if (!resetBreakerText.includes('CIRCUIT BUS ARMED') || !resetBreakerText.includes('100')) {
      throw new Error(`Expected bus rearmed text after breaker reset, got: ${resetBreakerText}`);
    }

    // Ensure shunts were restored to default unbalanced distribution [50, 150, 20, 180, 100], NOT 100
    const shuntValues = await page.evaluate(() => {
      const sc = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return sc.galvanometerScreen.getState().shuntResistances;
    });
    if (JSON.stringify(shuntValues) !== JSON.stringify([50, 150, 20, 180, 100])) {
      throw new Error(`Expected default unbalanced shunts [50, 150, 20, 180, 100], got: ${JSON.stringify(shuntValues)}`);
    }

    const isLeverStillDisabled = await page.$eval('#btn-bus-lever', (btn) => btn.disabled);
    if (!isLeverStillDisabled) {
      throw new Error('Expected bus lever to remain disabled after breaker reset.');
    }
    console.log('PASSED: Master breaker reset verified. Auto-solve bug successfully prevented.');

    console.log('--- Test 2.3: Near-Miss Resistance Rejection ---');
    // Balance channels 0, 1, 3 to 100, but leave channel 2 at 20 (and then 85)
    await page.$eval('#slider-shunt-0', (el) => {
      el.value = '100';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.$eval('#slider-shunt-1', (el) => {
      el.value = '100';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.$eval('#slider-shunt-3', (el) => {
      el.value = '100';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Check with channel 2 at 20
    const isLeverBlockedAt20 = await page.$eval('#btn-bus-lever', (btn) => btn.disabled);
    if (!isLeverBlockedAt20) {
      throw new Error('Expected lever to be blocked when channel 2 is at 20 Ohms.');
    }

    // Move channel 2 to 85 (outside tolerance [95, 105])
    await page.$eval('#slider-shunt-2', (el) => {
      el.value = '85';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const isLeverBlockedAt85 = await page.$eval('#btn-bus-lever', (btn) => btn.disabled);
    if (!isLeverBlockedAt85) {
      throw new Error('Expected lever to be blocked when channel 2 is at 85 Ohms.');
    }

    // Try pressing Enter to throw lever while unbalanced
    await page.keyboard.press('Enter');
    const isBalancedPremature = await page.evaluate(() => {
      const sc = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return sc.galvanometerScreen.getState().gridBalanced;
    });
    if (isBalancedPremature) {
      throw new Error('Lever should not throw via Enter key when grid is unbalanced.');
    }
    console.log('PASSED: Near-miss resistance interlocks verified.');

    console.log('--- Test 2.4: Solve & ESC Key Spam Teardown ---');
    // Move channel 2 to exactly 100 Ohms
    await page.$eval('#slider-shunt-2', (el) => {
      el.value = '100';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const isLeverReady = await page.$eval('#btn-bus-lever', (btn) => !btn.disabled && btn.classList.contains('ready'));
    if (!isLeverReady) {
      throw new Error('Expected lever to be enabled and marked ready at 100 Ohms equilibrium.');
    }

    // Click lever and immediately spam ESC key
    await page.click('#btn-bus-lever');
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Escape');
    }

    await page.waitForSelector('#screen-galvanometer-grid', { state: 'hidden', timeout: 3000 });

    const isGridBalancedAfterEsc = await page.evaluate(() => {
      const sc = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return sc.galvanometerScreen.getState().gridBalanced;
    });
    if (!isGridBalancedAfterEsc) {
      throw new Error('Expected gridBalanced to be true after lever throw.');
    }
    console.log('PASSED: Bus lever solve and ESC spam teardown resilient.');

    console.log('--- Test 2.5: Act VII Scene Re-Entry & State Persistence ---');
    // Teleport to sleep_ward and back to synthesis_blackout
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('scenario:switch_room', { targetRoomId: 'sleep_ward' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'sleep_ward';
    }, { timeout: 4000 });

    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('scenario:switch_room', { targetRoomId: 'synthesis_blackout' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'synthesis_blackout';
    }, { timeout: 4000 });

    // Verify clicking prop_galvanometer_grid does not re-open modal
    await page.evaluate(() => {
      window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().onObjectClick('prop_galvanometer_grid');
    });

    const isGridModalStillHidden = await page.evaluate(() => {
      const el = document.getElementById('screen-galvanometer-grid');
      return !el || el.classList.contains('hidden');
    });
    if (!isGridModalStillHidden) {
      throw new Error('Expected galvanometer grid modal to remain closed after solve.');
    }

    const reEntrySubtitle = await page.textContent('#observation-subtitle');
    if (!reEntrySubtitle.includes('The 5-channel circuit bus is balanced') || !reEntrySubtitle.includes('Hydraulic blast clamps released')) {
      throw new Error(`Expected completed grid subtitle on re-entry, got: ${reEntrySubtitle}`);
    }
    console.log('PASSED: Act VII re-entry and solve idempotency verified.');

    // -------------------------------------------------------------
    // ACT VIII: THE VELVET LOUNGE & SWITCHBOARD MIRROR EDGE CASES
    // -------------------------------------------------------------
    console.log('--- Suite 3: Act VIII Velvet Lounge Switchboard & Mirror Edge Cases ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('scenario:switch_room', { targetRoomId: 'velvet_lounge' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'velvet_lounge';
    }, { timeout: 4000 });

    await page.evaluate(() => {
      window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().onObjectClick('prop_switchboard');
    });
    await page.waitForSelector('#screen-switchboard-mirror:not(.hidden)', { timeout: 3000 });

    console.log('--- Test 3.1: Incomplete Pre-requisite Interlocks ---');
    // Step A: Decanter placed, but switchboard not patched -> climax button disabled
    await page.click('#btn-place-decanter');
    const isClimaxBlockedWithoutPatch = await page.$eval('#btn-answer-climax', (btn) => btn.disabled);
    if (!isClimaxBlockedWithoutPatch) {
      throw new Error('Expected climax button to be disabled without switchboard patch.');
    }

    // Step B: Decanter removed -> climax button disabled
    await page.click('#btn-place-decanter'); // toggles off
    const isClimaxBlockedWithoutDecanter = await page.$eval('#btn-answer-climax', (btn) => btn.disabled);
    if (!isClimaxBlockedWithoutDecanter) {
      throw new Error('Expected climax button to be disabled when decanter is removed.');
    }
    console.log('PASSED: Incomplete pre-requisite interlocks enforced.');

    console.log('--- Test 3.2: Patch Mismatch Matrix ---');
    // Test Trunk 101 -> Line 4
    await page.click('#jack-trunk-101');
    await page.click('#jack-line-4');
    const mismatch1 = await page.textContent('#observation-subtitle');
    if (!mismatch1.includes('Patch rejected') || !mismatch1.includes('Trunk 101 -> Line 4')) {
      throw new Error(`Expected patch rejection for Trunk 101 -> Line 4, got: ${mismatch1}`);
    }

    // Test Trunk 104 -> Line 2
    await page.click('#jack-trunk-104');
    await page.click('#jack-line-2');
    const mismatch2 = await page.textContent('#observation-subtitle');
    if (!mismatch2.includes('Patch rejected') || !mismatch2.includes('Trunk 104 -> Line 2')) {
      throw new Error(`Expected patch rejection for Trunk 104 -> Line 2, got: ${mismatch2}`);
    }
    console.log('PASSED: Patch mismatch matrix correctly rejected invalid circuits.');

    console.log('--- Test 3.3: Alignment & Patch Preservation Across ESC ---');
    // Place decanter ON
    await page.click('#btn-place-decanter');
    // Connect correct Trunk 104 -> Line 4
    await page.click('#jack-trunk-104');
    await page.click('#jack-line-4');

    const isClimaxReadyBeforeEsc = await page.$eval('#btn-answer-climax', (btn) => !btn.disabled && btn.classList.contains('ready'));
    if (!isClimaxReadyBeforeEsc) {
      throw new Error('Expected climax button to be ready before pressing Escape.');
    }

    // Close via Escape
    await page.keyboard.press('Escape');
    await page.waitForSelector('#screen-switchboard-mirror', { state: 'hidden', timeout: 3000 });

    // Reopen modal
    await page.evaluate(() => {
      window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().onObjectClick('prop_switchboard');
    });
    await page.waitForSelector('#screen-switchboard-mirror:not(.hidden)', { timeout: 3000 });

    // Assert decanter and switchboard patch states are preserved
    const isDecanterStillPlaced = await page.evaluate(() => {
      const sc = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return sc.switchboardScreen.getState().decanterPlaced;
    });
    const isSwitchboardStillPatched = await page.evaluate(() => {
      const sc = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return sc.switchboardScreen.getState().switchboardPatched;
    });
    const isClimaxStillReady = await page.$eval('#btn-answer-climax', (btn) => !btn.disabled && btn.classList.contains('ready'));

    if (!isDecanterStillPlaced || !isSwitchboardStillPatched || !isClimaxStillReady) {
      throw new Error('Expected decanter and switchboard patch to persist across Escape closing.');
    }
    console.log('PASSED: State preserved across ESC close/reopen.');

    console.log('--- Test 3.4: Terminal Climax & Double-Trigger Prevention ---');
    await page.click('#btn-answer-climax');

    // Immediately trigger payphone direct click to test guard against double firing
    await page.evaluate(() => {
      window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().onObjectClick('prop_lounge_payphone');
    });

    // Wait for terminal blackout screen
    await page.waitForSelector('#view-terminal-blackout:not(.hidden)', { timeout: 6000 });
    const blackoutText = await page.textContent('#view-terminal-blackout');
    if (!blackoutText.includes('SYNTHESIS PROTOCOL FINALIZED') || !blackoutText.includes('Subject 104 Deployed')) {
      throw new Error(`Expected terminal blackout finale text, got: ${blackoutText}`);
    }
    console.log('PASSED: Climax sequence triggered with double-fire guard intact.');

    if (consoleErrors.length > 0) {
      throw new Error(`Encountered unhandled browser console errors:\n${consoleErrors.join('\n')}`);
    }

    console.log('======================================================');
    console.log('ALL PHASE 4 (ACTS VII & VIII) EDGE-CASE TESTS PASSED!');
    console.log('======================================================');
    process.exit(0);

  } catch (err) {
    console.error('TEST RUN FAILURE:', err);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
  }
});
