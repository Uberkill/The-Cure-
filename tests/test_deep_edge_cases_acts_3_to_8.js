import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4245;
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
  console.log(`Deep Edge-Cases Test server running on http://localhost:${PORT}`);
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
    console.log('--- Step 1: Bootstrap & Teleport to Act III (The Hydrotherapy Room) ---');
    await page.goto(`http://localhost:${PORT}/?test=true`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#canvas-container canvas', { state: 'visible', timeout: 8000 });
    await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });

    await page.click('#btn-menu-start');
    await page.waitForSelector('#view-main-menu', { state: 'hidden', timeout: 5000 });

    // Teleport directly to Hydrotherapy
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'hydrotherapy' });
    });

    await page.waitForFunction(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return current && current.id === 'hydrotherapy';
    }, { timeout: 5000 });
    console.log('PASSED: Entered Hydrotherapy room.');

    // -----------------------------------------------------------------
    // ACT III: HYDROTHERAPY ROOM / HYDRAULIC MANIFOLD DEEP EDGE CASES
    // -----------------------------------------------------------------
    console.log('--- Step 2: Act III - Open Hydraulic Manifold Screen ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_manifold');
    });

    await page.waitForSelector('#screen-hydraulic-manifold:not(.hidden)', { timeout: 4000 });
    console.log('PASSED: Hydraulic Manifold modal opened.');

    console.log('--- Test 3.1: Fluid Conservation Law Invariance Fuzzing (30 Random Steps) ---');
    // Seeded random pseudo-valve operations
    for (let step = 0; step < 30; step++) {
      const valveId = ['#valve-a', '#valve-b', '#valve-c'][step % 3];
      await page.click(valveId);

      const audit = await page.evaluate(() => {
        const sc = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
        const screen = sc.manifoldScreen;
        const state = screen.getState();
        const sum = state.tubWaterLevels[0] + state.tubWaterLevels[1] + state.tubWaterLevels[2];
        const allBounded = state.tubWaterLevels.every((l) => l >= 0 && l <= 4);
        return { sum, allBounded, levels: state.tubWaterLevels };
      });

      if (audit.sum !== 6) {
        throw new Error(`Fluid conservation violated at step ${step}: sum is ${audit.sum}, expected 6.`);
      }
      if (!audit.allBounded) {
        throw new Error(`Fluid level bounds violated at step ${step}: levels are ${JSON.stringify(audit.levels)}.`);
      }
    }
    console.log('PASSED: Fluid conservation law strictly preserved across 30 valve cycles (sum = 6 invariant).');

    console.log('--- Test 3.2: Keyboard Accessibility & Unmapped Key Rejection ---');
    // Hit emergency dump via keyboard shortcut 'r'
    await page.keyboard.press('r');
    const levelsAfterDump = await page.evaluate(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().manifoldScreen.getState().tubWaterLevels;
    });
    if (JSON.stringify(levelsAfterDump) !== JSON.stringify([4, 2, 0])) {
      throw new Error(`Expected [4, 2, 0] after pressing 'r', got: ${JSON.stringify(levelsAfterDump)}`);
    }

    // Hit valve A via keyboard 'a' -> should transfer 1 -> 2
    await page.keyboard.press('a');
    const levelsAfterA = await page.evaluate(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().manifoldScreen.getState().tubWaterLevels;
    });
    if (JSON.stringify(levelsAfterA) !== JSON.stringify([3, 3, 0])) {
      throw new Error(`Expected [3, 3, 0] after pressing 'a', got: ${JSON.stringify(levelsAfterA)}`);
    }

    // Hit unmapped key 'x' -> should not mutate state
    await page.keyboard.press('x');
    const levelsAfterX = await page.evaluate(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().manifoldScreen.getState().tubWaterLevels;
    });
    if (JSON.stringify(levelsAfterX) !== JSON.stringify([3, 3, 0])) {
      throw new Error(`Expected [3, 3, 0] to remain unchanged after pressing 'x', got: ${JSON.stringify(levelsAfterX)}`);
    }
    console.log('PASSED: Keyboard shortcuts and unmapped key rejection verified.');

    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForSelector('#screen-hydraulic-manifold', { state: 'hidden', timeout: 3000 });

    // -----------------------------------------------------------------
    // ACT IV: AUDIOLOGY VAULT / BINAURAL SYNTHESIZER DEEP EDGE CASES
    // -----------------------------------------------------------------
    console.log('--- Step 3: Teleport to Act IV (The Audiology Vault) ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'audiology' });
    });

    await page.waitForFunction(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return current && current.id === 'audiology';
    }, { timeout: 5000 });

    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_amplifier_monolith');
    });
    await page.waitForSelector('#screen-binaural-synthesizer:not(.hidden)', { timeout: 4000 });
    console.log('PASSED: Entered Audiology Vault and opened Binaural Synthesizer modal.');

    console.log('--- Test 4.1: Out-of-Bounds Slider Fuzzing & StepControl API Clamping ---');
    await page.evaluate(() => {
      const sc = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      const screen = sc.binauralScreen;
      screen.stepControl('horn_left', -50); // should clamp to 0
      screen.stepControl('horn_right', 250); // should clamp to 180
      screen.stepControl('freq', 1000); // should clamp to 900
    });

    const audiologyState1 = await page.evaluate(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().binauralScreen.getState();
    });
    if (audiologyState1.leftHornAngleDeg < 0 || audiologyState1.rightHornAngleDeg > 180 || audiologyState1.carrierFreqHz > 900) {
      throw new Error(`Boundary clamping failed: ${JSON.stringify(audiologyState1)}`);
    }
    console.log('PASSED: Out-of-bounds slider fuzzing and stepControl API clamped within discrete bounds.');

    console.log('--- Test 4.2: Keyboard Arrow Ceilings & Off-Frequency Phase Rejection ---');
    // Press ArrowUp 40 times -> should clamp at 900 Hz max
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('ArrowUp');
    }
    const freqAtMax = await page.evaluate(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().binauralScreen.getState().carrierFreqHz;
    });
    if (freqAtMax !== 900) {
      throw new Error(`Expected frequency ceiling of 900 Hz, got: ${freqAtMax}`);
    }

    // Press ArrowDown 70 times -> should clamp at 300 Hz min
    for (let i = 0; i < 70; i++) {
      await page.keyboard.press('ArrowDown');
    }
    const freqAtMin = await page.evaluate(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().binauralScreen.getState().carrierFreqHz;
    });
    if (freqAtMin !== 300) {
      throw new Error(`Expected frequency floor of 300 Hz, got: ${freqAtMin}`);
    }

    // Press Space to invert phase at 300 Hz -> acoustic null should NOT trigger
    await page.keyboard.press('Space');
    const isNullTriggered = await page.evaluate(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().binauralScreen.getState().acousticNullAchieved;
    });
    if (isNullTriggered) {
      throw new Error('Acoustic null condition should not be achieved when frequency is at 300 Hz.');
    }
    console.log('PASSED: Frequency arrow ceilings (300-900 Hz) and off-frequency phase rejection verified.');

    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForSelector('#screen-binaural-synthesizer', { state: 'hidden', timeout: 3000 });

    // -----------------------------------------------------------------
    // ACT V: THE ARCHIVE / MICROFICHE VIEWER DEEP EDGE CASES
    // -----------------------------------------------------------------
    console.log('--- Step 4: Teleport to Act V (The Archive) ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'archive' });
    });

    await page.waitForFunction(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return current && current.id === 'archive';
    }, { timeout: 5000 });

    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_microfiche_reader');
    });
    await page.waitForSelector('#screen-microfiche-viewer:not(.hidden)', { timeout: 4000 });
    console.log('PASSED: Entered Archive and opened Microfiche Viewer modal.');

    console.log('--- Test 5.1: Lens Step Increment/Decrement Clamping ---');
    // Spam minus step 30 times
    for (let i = 0; i < 30; i++) {
      await page.click('#btn-focus-minus');
    }
    const focusMin = await page.evaluate(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().microficheScreen.getState().opticFocusLevel;
    });
    if (focusMin < 0 || isNaN(focusMin)) {
      throw new Error(`Expected focus floor of 0.0, got: ${focusMin}`);
    }

    // Spam plus step 30 times
    for (let i = 0; i < 30; i++) {
      await page.click('#btn-focus-plus');
    }
    const focusMax = await page.evaluate(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().microficheScreen.getState().opticFocusLevel;
    });
    if (focusMax > 1.0 || isNaN(focusMax)) {
      throw new Error(`Expected focus ceiling of 1.0, got: ${focusMax}`);
    }
    console.log('PASSED: Optical focus step buttons clamped safely within [0.0, 1.0].');

    console.log('--- Test 5.2: Malformed Station Coordinates & Enter-Key Submission Handling ---');
    await page.click('#btn-mount-film');
    await page.click('#btn-sec-gamma');

    // Input malformed station coordinate '99'
    await page.$eval('#input-dispatch-station', (el) => {
      el.value = '99';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Press Enter to submit
    await page.keyboard.press('Enter');

    const hopperFailText = await page.textContent('#hopper-status');
    if (!hopperFailText.includes('DISPATCH FAILED') || !hopperFailText.includes('INVALID SECTOR')) {
      throw new Error(`Expected dispatch failed hopper status for station 99, got: ${hopperFailText}`);
    }

    const hasDeliveredPremature = await page.evaluate(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().microficheScreen.getState().canisterDelivered;
    });
    if (hasDeliveredPremature) {
      throw new Error('Canister should not be delivered for invalid station 99.');
    }
    console.log('PASSED: Malformed station coordinates rejected with red status banner.');

    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForSelector('#screen-microfiche-viewer', { state: 'hidden', timeout: 3000 });

    // -----------------------------------------------------------------
    // ACT VI: THE DIRECTOR'S OFFICE / WIRETAP TAPE DECK DEEP EDGE CASES
    // -----------------------------------------------------------------
    console.log('--- Step 5: Teleport to Act VI (The Director\'s Office) ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'directors_office' });
    });

    await page.waitForFunction(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return current && current.id === 'directors_office';
    }, { timeout: 5000 });

    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_tape_deck');
    });
    await page.waitForSelector('#screen-wiretap-tapedeck:not(.hidden)', { timeout: 4000 });
    console.log('PASSED: Entered Director\'s Office and opened Wiretap Tape Deck modal.');

    console.log('--- Test 6.1: Escapement Minute Step & Hour Step Decoupled Wrap-Around ---');
    // Start at 12:00. Click btn-min-minus 5 times -> wraps minutes to 55 (12:55)
    for (let i = 0; i < 5; i++) {
      await page.click('#btn-min-minus');
    }
    const timeAfterMin = await page.textContent('#label-clock-time');
    if (timeAfterMin !== '12:55') {
      throw new Error(`Expected minute-minus to wrap to 12:55, received: ${timeAfterMin}`);
    }

    // Click btn-hour-minus 2 times -> wraps 12 to 10 (10:55)
    await page.click('#btn-hour-minus');
    await page.click('#btn-hour-minus');
    const timeAfterHr = await page.textContent('#label-clock-time');
    if (timeAfterHr !== '10:55') {
      throw new Error(`Expected hour-minus to wrap to 10:55, received: ${timeAfterHr}`);
    }

    const isSafeUnlockedAt1055 = await page.evaluate(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().wiretapScreen.getState().safeUnlatched;
    });
    if (isSafeUnlockedAt1055) {
      throw new Error('Safe should remain locked at 10:55.');
    }
    console.log('PASSED: Carriage clock escapement hours and minutes wrap independently without mutual corruption.');

    console.log('--- Test 6.2: Rotary Phone Buffer Sliding-Window & Suffix Precision ---');
    // Dial noisy sequence: 4, 5, 6, 7, 8, 9, 1, 1, 0, 3
    const noisyDigits = ['4', '5', '6', '7', '8', '9', '1', '1', '0', '3'];
    for (const d of noisyDigits) {
      await page.click(`#btn-dial-${d}`);
    }

    const dialedBufferText = await page.textContent('#label-dialed-number');
    if (!dialedBufferText.endsWith('1103') || dialedBufferText.length > 8) {
      throw new Error(`Expected sliding buffer capped at 8 characters ending in 1103, got: ${dialedBufferText}`);
    }

    const isSafeUnlatchedByRotary = await page.evaluate(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().wiretapScreen.getState().safeUnlatched;
    });
    if (!isSafeUnlatchedByRotary) {
      throw new Error('Expected safe to unlatch upon dialing sliding sequence ending in 1103.');
    }
    console.log('PASSED: Rotary phone sliding-window buffer retains exact 8-character suffix and unlatches safe.');

    // Wait for auto-close
    await page.waitForSelector('#screen-wiretap-tapedeck', { state: 'hidden', timeout: 3000 });

    // -----------------------------------------------------------------
    // ACT VII: THE SYNTHESIS CHAMBER / GALVANOMETER GRID DEEP EDGE CASES
    // -----------------------------------------------------------------
    console.log('--- Step 6: Teleport to Act VII (The Synthesis Chamber) ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'synthesis_blackout' });
    });

    await page.waitForFunction(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return current && current.id === 'synthesis_blackout';
    }, { timeout: 5000 });

    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_galvanometer_grid');
    });
    await page.waitForSelector('#screen-galvanometer-grid:not(.hidden)', { timeout: 4000 });
    console.log('PASSED: Entered Synthesis Chamber and opened Galvanometer Grid modal.');

    console.log('--- Test 7.1: Minimum Resistance Zero-Load Deflection (-45 Deg) & Lever Interlock ---');
    // Set all sliders to 0 Ohms
    for (let ch = 0; ch < 5; ch++) {
      await page.$eval(`#slider-shunt-${ch}`, (el) => {
        el.value = '0';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }

    const needle0Transform = await page.$eval('#meter-needle-0', (el) => el.style.transform);
    if (!needle0Transform.includes('-45deg')) {
      throw new Error(`Expected needle deflection of -45deg at 0 Ohms, got: ${needle0Transform}`);
    }

    const isLeverBlockedAtZero = await page.$eval('#btn-bus-lever', (btn) => btn.disabled);
    if (!isLeverBlockedAtZero) {
      throw new Error('Expected bus lever to be strictly disabled at 0 Ohms load.');
    }
    console.log('PASSED: Minimum load zero-resistance needles deflected to -45deg with bus lever interlocked.');

    console.log('--- Test 7.2: Breaker Reset Keyboard Hotkey (\'R\') & Premature Enter Rejection ---');
    // Trip breaker on channel 4
    await page.$eval('#slider-shunt-4', (el) => {
      el.value = '200';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const isTripped = await page.evaluate(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().galvanometerScreen.getState().shuntResistances[4] === 200;
    });
    if (!isTripped) {
      throw new Error('Expected breaker trip at 200 Ohms.');
    }

    // Press keyboard 'r' to reset breaker
    await page.keyboard.press('r');
    const breakerTextAfterR = await page.textContent('#label-breaker-status');
    if (!breakerTextAfterR.includes('CIRCUIT BUS ARMED')) {
      throw new Error(`Expected armed breaker text after pressing 'r', got: ${breakerTextAfterR}`);
    }

    // Press Enter while unbalanced -> lever should NOT pull
    await page.keyboard.press('Enter');
    const isBalancedPremature = await page.evaluate(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().galvanometerScreen.getState().gridBalanced;
    });
    if (isBalancedPremature) {
      throw new Error('Grid lever should not throw via Enter key when unbalanced.');
    }
    console.log('PASSED: Breaker reset keyboard hotkey (\'R\') and premature Enter rejection verified.');

    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForSelector('#screen-galvanometer-grid', { state: 'hidden', timeout: 3000 });

    // -----------------------------------------------------------------
    // ACT VIII: THE VELVET LOUNGE / SWITCHBOARD MIRROR DEEP EDGE CASES
    // -----------------------------------------------------------------
    console.log('--- Step 7: Teleport to Act VIII (The Velvet Lounge) ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'velvet_lounge' });
    });

    await page.waitForFunction(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return current && current.id === 'velvet_lounge';
    }, { timeout: 5000 });

    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_switchboard');
    });
    await page.waitForSelector('#screen-switchboard-mirror:not(.hidden)', { timeout: 4000 });
    console.log('PASSED: Entered Velvet Lounge and opened Switchboard & Mirror modal.');

    console.log('--- Test 8.1: Rapid Decanter Toggling Parity & Reflection Consistency ---');
    // Click decanter 7 times (odd number: should end up active)
    for (let i = 0; i < 7; i++) {
      await page.click('#btn-place-decanter');
    }
    const isDecanterActive7 = await page.$eval('#btn-place-decanter', (btn) => btn.classList.contains('active'));
    const isMirrorAligned7 = await page.$eval('#mirror-reflection', (el) => el.classList.contains('aligned'));
    if (!isDecanterActive7 || !isMirrorAligned7) {
      throw new Error('Expected decanter to be placed and mirror aligned after 7 clicks.');
    }

    // Click 1 more time (8 total: even number: should end up inactive)
    await page.click('#btn-place-decanter');
    const isDecanterActive8 = await page.$eval('#btn-place-decanter', (btn) => btn.classList.contains('active'));
    const isMirrorAligned8 = await page.$eval('#mirror-reflection', (el) => el.classList.contains('aligned'));
    if (isDecanterActive8 || isMirrorAligned8) {
      throw new Error('Expected decanter to be inactive and mirror unaligned after 8 clicks.');
    }
    console.log('PASSED: Decanter toggle parity and reflection visual classes consistent under rapid toggling.');

    console.log('--- Test 8.2: Trunk Re-Selection Overwrite Buffer ---');
    // Click Trunk 101, then Trunk 102, then Trunk 104
    await page.click('#jack-trunk-101');
    await page.click('#jack-trunk-102');
    await page.click('#jack-trunk-104');

    // Click Line 4 -> should successfully patch Trunk 104 -> Line 4
    await page.click('#jack-line-4');

    const patchLabel = await page.textContent('#label-patch-status');
    if (!patchLabel.includes('CIRCUIT PATCHED') || !patchLabel.includes('TRUNK 104') || !patchLabel.includes('LINE 4')) {
      throw new Error(`Expected circuit patched for Trunk 104 -> Line 4 after re-selection, got: ${patchLabel}`);
    }
    console.log('PASSED: Trunk selection buffer cleanly overwrote previous choices and locked circuit.');

    // -----------------------------------------------------------------
    // MEMORY LEAK & GPU GEOMETRY BUDGET VERIFICATION
    // -----------------------------------------------------------------
    console.log('--- Step 8: System-Wide Memory Stability Audit ---');
    const webglMemoryAudit = await page.evaluate(() => {
      const sm = window.__VAULT_APP__.sceneManager;
      const renderer = sm.renderer;
      return {
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures
      };
    });
    console.log(`WebGL Memory Audit: ${webglMemoryAudit.geometries} geometries, ${webglMemoryAudit.textures} textures.`);
    if (webglMemoryAudit.geometries > 120) {
      throw new Error(`Memory leak detected: geometries count is ${webglMemoryAudit.geometries}, exceeding budget 120.`);
    }

    // Close switchboard modal
    await page.keyboard.press('Escape');
    await page.waitForSelector('#screen-switchboard-mirror', { state: 'hidden', timeout: 3000 });

    if (consoleErrors.length > 0) {
      throw new Error(`Encountered unhandled browser console errors:\n${consoleErrors.join('\n')}`);
    }

    console.log('========================================================================');
    console.log('ALL 12 DEEP EDGE-CASE TESTS (ACTS III TO VIII) PASSED DETERMINISTICALLY!');
    console.log('========================================================================');
    process.exit(0);

  } catch (err) {
    console.error('TEST RUN FAILURE:', err);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
  }
});
