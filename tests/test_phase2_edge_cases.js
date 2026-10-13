import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { startTestServer } from './helpers/testServer.js';

export async function runSuite(page, baseUrl) {
  const consoleErrors = [];
  const errorHandler = (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('404') && (text.includes('.mp3') || text.includes('.glb') || text.includes('Failed to load resource'))) {
        return;
      }
      consoleErrors.push(text);
      console.error(`[Browser Error] ${text}`);
    }
  };
  page.on('console', errorHandler);

  try {
    console.log('--- Suite 1: App Bootstrap & Navigation ---');
    await page.goto(`${baseUrl}/?test=true`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#canvas-container canvas', { state: 'visible', timeout: 8000 });
    await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });

    await page.click('#btn-menu-start');
    await page.waitForSelector('#view-main-menu', { state: 'hidden', timeout: 5000 });

    // -------------------------------------------------------------
    // ACT III: HYDROTHERAPY MANIFOLD EDGE CASES
    // -------------------------------------------------------------
    console.log('--- Suite 2: Act III Hydrotherapy Manifold Edge Cases ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'hydrotherapy' });
    });

    await page.waitForFunction(() => {
      const app = window.__VAULT_APP__;
      return app.scenarioRegistry.getCurrentScenario().id === 'hydrotherapy';
    }, { timeout: 4000 });

    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_manifold');
    });

    await page.waitForSelector('#screen-hydraulic-manifold:not(.hidden)', { timeout: 3000 });

    console.log('--- Test 2.1: Rejection on empty source / full target (Valve C) ---');
    // Default levels are [4, 2, 0]. Valve C transfers 3 -> 1. Basin 3 is empty (0), Basin 1 is full (4).
    await page.click('#valve-c');

    const rejectedLevels = await page.evaluate(() => {
      const screen = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().manifoldScreen;
      return screen.getState().tubWaterLevels;
    });

    if (rejectedLevels[0] !== 4 || rejectedLevels[1] !== 2 || rejectedLevels[2] !== 0) {
      throw new Error(`Expected levels to remain [4, 2, 0], got: ${JSON.stringify(rejectedLevels)}`);
    }

    const rejectionSubtitle = await page.textContent('#observation-subtitle');
    if (!rejectionSubtitle.includes('Valve resistance threshold reached')) {
      throw new Error(`Expected resistance threshold subtitle, received: ${rejectionSubtitle}`);
    }
    console.log('PASSED: Empty source / full target valve transfer cleanly rejected.');

    console.log('--- Test 2.2: Rapid Valve Clicks & Capacity Clamping ---');
    // Click Valve A (1 -> 2) 10 times rapidly.
    // Basin 2 capacity is 4. Starting at [4, 2, 0], it can only take 2 units before capping at 4.
    for (let i = 0; i < 10; i++) {
      await page.click('#valve-a');
    }

    const clampedLevels = await page.evaluate(() => {
      const screen = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().manifoldScreen;
      return screen.getState().tubWaterLevels;
    });

    if (clampedLevels[0] !== 2 || clampedLevels[1] !== 4 || clampedLevels[2] !== 0) {
      throw new Error(`Expected levels clamped to [2, 4, 0], got: ${JSON.stringify(clampedLevels)}`);
    }

    const clampedPressure = await page.textContent('#label-pressure-psi');
    if (!clampedPressure.includes('45.0 PSI')) {
      throw new Error(`Expected 45.0 PSI with levels [2, 4, 0], got: ${clampedPressure}`);
    }
    console.log('PASSED: Rapid clicks clamped safely within [0, 4] capacity limits.');

    console.log('--- Test 2.3: Emergency Sump Blowout Lever Reset ---');
    await page.click('#btn-emergency-dump');

    const resetLevels = await page.evaluate(() => {
      const screen = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().manifoldScreen;
      return screen.getState().tubWaterLevels;
    });

    if (resetLevels[0] !== 4 || resetLevels[1] !== 2 || resetLevels[2] !== 0) {
      throw new Error(`Expected reset levels [4, 2, 0], got: ${JSON.stringify(resetLevels)}`);
    }

    const resetSubtitle = await page.textContent('#observation-subtitle');
    if (!resetSubtitle.includes('Emergency sump blowout engaged')) {
      throw new Error(`Expected emergency dump subtitle, received: ${resetSubtitle}`);
    }
    console.log('PASSED: Emergency sump blowout restored default fluid charge [4, 2, 0].');

    console.log('--- Test 2.4: Equilibrium, Solve Interlock & ESC Spam Resilience ---');
    // Solve sequence: Valve B x 2, Valve A x 2 -> [2, 2, 2]
    await page.click('#valve-b');
    await page.click('#valve-b');
    await page.click('#valve-a');
    await page.click('#valve-a');

    const equilibriumPressure = await page.textContent('#label-pressure-psi');
    if (!equilibriumPressure.includes('0.0 PSI')) {
      throw new Error(`Expected 0.0 PSI on equilibrium, got: ${equilibriumPressure}`);
    }

    // Rapidly press Escape 5 times during the 1200ms auto-close delay
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Escape');
    }

    await page.waitForSelector('#screen-hydraulic-manifold', { state: 'hidden', timeout: 3000 });

    const hydroBeforePickup = await page.evaluate(() => {
      const sc = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return {
        hasCrystal: window.__VAULT_APP__.gameState.hasCrystal('crystal_02_bronze'),
        drainLidMoved: sc.drainLidMesh.position.x > 0.1,
        crystalVisible: sc.crystalMesh ? sc.crystalMesh.visible : false
      };
    });
    if (hydroBeforePickup.hasCrystal) {
      throw new Error('Expected crystal_02_bronze NOT in GameState before physical 3D pickup.');
    }
    if (!hydroBeforePickup.drainLidMoved) {
      throw new Error('Expected 3D drain lid mesh to be displaced open.');
    }
    if (!hydroBeforePickup.crystalVisible) {
      throw new Error('Expected 3D bronze crystal mesh to be visible after manifold solve.');
    }

    // Now physically collect the bronze crystal in 3D
    await page.evaluate(() => {
      window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().onObjectClick('crystal_02_bronze');
    });

    const hydroHasCrystal = await page.evaluate(() => {
      return window.__VAULT_APP__.gameState.hasCrystal('crystal_02_bronze');
    });
    if (!hydroHasCrystal) {
      throw new Error('Expected crystal_02_bronze in GameState after 3D pickup.');
    }
    console.log('PASSED: Manifold reached 0.0 PSI, ESC spam handled cleanly, drain lid unsealed, crystal retrieved.');

    console.log('--- Test 2.5: Hydrotherapy Scene Re-Entry & Re-Click Idempotency ---');
    // Switch away to sleep ward and return to hydrotherapy
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'sleep_ward' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'sleep_ward';
    });

    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'hydrotherapy' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'hydrotherapy';
    });

    // Verify 3D drain lid persists open and crystal is collected
    const reEntryState = await page.evaluate(() => {
      const sc = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return {
        drainOpen: sc.drainLidMesh.position.x > 0.1,
        crystalVisible: sc.crystalMesh ? sc.crystalMesh.visible : false,
        manifoldBalanced: sc.manifoldBalanced
      };
    });

    if (!reEntryState.drainOpen || reEntryState.crystalVisible || !reEntryState.manifoldBalanced) {
      throw new Error(`Hydrotherapy re-entry state invalid: ${JSON.stringify(reEntryState)}`);
    }

    // Click prop_manifold again; assert no duplicate screen opens
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_manifold');
    });

    const manifoldModal = await page.$('#screen-hydraulic-manifold');
    if (manifoldModal) {
      const isHidden = await page.$eval('#screen-hydraulic-manifold', el => el.classList.contains('hidden'));
      if (!isHidden) {
        throw new Error('Expected manifold screen to stay hidden on re-click after solve.');
      }
    }

    const lockedSubtitle = await page.textContent('#observation-subtitle');
    if (!lockedSubtitle.includes('Hydrostatic manifold locked at 0.0 PSI')) {
      throw new Error(`Expected locked manifold subtitle, got: ${lockedSubtitle}`);
    }
    console.log('PASSED: Hydrotherapy scene re-entry and click idempotency verified.');

    // -------------------------------------------------------------
    // ACT IV: AUDIOLOGY BINAURAL SYNTHESIZER EDGE CASES
    // -------------------------------------------------------------
    console.log('--- Suite 3: Act IV Audiology Synthesizer Edge Cases ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'audiology' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'audiology';
    });

    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_amplifier_monolith');
    });

    await page.waitForSelector('#screen-binaural-synthesizer:not(.hidden)', { timeout: 3000 });

    console.log('--- Test 3.1: Multi-Condition Interlock Rejection ---');
    // Subcase A: Horns at 45/135, Freq at 741, but Phase Inversion OFF
    await page.$eval('#slider-horn-left', el => {
      el.value = '45';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.$eval('#slider-horn-right', el => {
      el.value = '135';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.$eval('#slider-carrier-freq', el => {
      el.value = '741';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const subcaseANull = await page.evaluate(() => {
      const sc = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return sc.binauralScreen.getState().acousticNullAchieved;
    });
    if (subcaseANull) {
      throw new Error('Expected solve rejection when phase inversion is OFF.');
    }

    const subcaseABtnDisabled = await page.$eval('#btn-unseal-monolith', el => el.disabled);
    if (!subcaseABtnDisabled) {
      throw new Error('Expected unseal button to remain disabled in Subcase A.');
    }
    console.log('PASSED: Subcase A rejected (phase inversion OFF).');

    // Subcase B: Phase Inversion ON, Horns at 45/135, but Frequency wrong (600 Hz)
    await page.$eval('#slider-carrier-freq', el => {
      el.value = '600';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.click('#btn-toggle-phase');

    const subcaseBNull = await page.evaluate(() => {
      const sc = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return sc.binauralScreen.getState().acousticNullAchieved;
    });
    if (subcaseBNull) {
      throw new Error('Expected solve rejection when carrier frequency is 600 Hz.');
    }
    console.log('PASSED: Subcase B rejected (wrong carrier frequency).');

    // Subcase C: Frequency 741 Hz, Phase ON, Right 135, but Left Horn off target (90 deg)
    await page.$eval('#slider-horn-left', el => {
      el.value = '90';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.$eval('#slider-carrier-freq', el => {
      el.value = '741';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const subcaseCNull = await page.evaluate(() => {
      const sc = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return sc.binauralScreen.getState().acousticNullAchieved;
    });
    if (subcaseCNull) {
      throw new Error('Expected solve rejection when Left Horn is 90 deg.');
    }
    console.log('PASSED: Subcase C rejected (wrong azimuth alignment).');

    console.log('--- Test 3.2: Full Resonance Lock, Chladni Animation & ESC Spam ---');
    // Now align Left Horn to 45 deg to trigger acoustic null
    await page.$eval('#slider-horn-left', el => {
      el.value = '45';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const solveSubtitle = await page.textContent('#observation-subtitle');
    if (!solveSubtitle.includes('Destructive acoustic cancellation confirmed')) {
      throw new Error(`Expected solve subtitle, received: ${solveSubtitle}`);
    }

    // Spam Escape during the auto-close delay
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Escape');
    }

    await page.waitForSelector('#screen-binaural-synthesizer', { state: 'hidden', timeout: 3000 });

    // Assert animation loop and audio nodes safely teardown
    const teardownHealth = await page.evaluate(() => {
      const sc = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      const screen = sc.binauralScreen;
      
      // Support both the monolithic (legacy) and decoupled architectures for testing
      const animFrameId = screen.renderer ? screen.renderer.animFrameId : screen.animFrameId;
      const audioCtx = screen.binauralAudio ? screen.binauralAudio.audioCtx : screen.audioCtx;
      const oscNode = screen.binauralAudio ? screen.binauralAudio.oscNode : screen.oscNode;

      return {
        animFrameId: animFrameId,
        audioCtxClosedOrNull: !audioCtx || audioCtx.state === 'closed',
        oscNodeNull: oscNode === null,
        hasCrystal: window.__VAULT_APP__.gameState.hasCrystal('crystal_03_amethyst')
      };
    });

    if (teardownHealth.animFrameId !== null) {
      throw new Error('Expected animFrameId to be nullified upon screen teardown.');
    }
    if (!teardownHealth.audioCtxClosedOrNull) {
      throw new Error('Expected audioCtx to be closed or nullified.');
    }
    if (!teardownHealth.oscNodeNull) {
      throw new Error('Expected oscNode to be disconnected and nullified.');
    }
    if (teardownHealth.hasCrystal) {
      throw new Error('Expected crystal_03_amethyst NOT in GameState before physical 3D pickup.');
    }

    // Physically click 3D crystal to pick up
    await page.evaluate(() => {
      window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().onObjectClick('crystal_03_amethyst');
    });

    const hasAmethystAfter = await page.evaluate(() => {
      return window.__VAULT_APP__.gameState.hasCrystal('crystal_03_amethyst');
    });
    if (!hasAmethystAfter) {
      throw new Error('Expected crystal_03_amethyst in GameState after 3D pickup.');
    }
    console.log('PASSED: Chladni loop stopped, Web Audio cleaned up, Crystal 03 registered in 3D.');

    console.log('--- Test 3.3: Audiology Scene Re-Entry & Monolith Re-Click Idempotency ---');
    // Switch away to room_04 and return to audiology
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'room_04' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'room_04';
    });

    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'audiology' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'audiology';
    });

    // Verify 3D monolith persists tuned and crystal is collected
    const audiologyReEntry = await page.evaluate(() => {
      const sc = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return {
        ampTuned: sc.ampTuned,
        currentFreq: sc.currentToneFreq,
        crystalVisible: sc.crystalMesh ? sc.crystalMesh.visible : false
      };
    });

    if (!audiologyReEntry.ampTuned || audiologyReEntry.currentFreq !== 741 || audiologyReEntry.crystalVisible) {
      throw new Error(`Audiology re-entry state invalid: ${JSON.stringify(audiologyReEntry)}`);
    }

    // Click monolith again; verify modal does not reopen
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_amplifier_monolith');
    });

    const synthModal = await page.$('#screen-binaural-synthesizer');
    if (synthModal) {
      const isHidden = await page.$eval('#screen-binaural-synthesizer', el => el.classList.contains('hidden'));
      if (!isHidden) {
        throw new Error('Expected synthesizer screen to remain hidden on re-click after solve.');
      }
    }

    const audiologySubtitle = await page.textContent('#observation-subtitle');
    if (!audiologySubtitle.includes('The amplifier vibrates in steady 741 Hz Solfeggio resonance')) {
      throw new Error(`Expected tuned amplifier subtitle, got: ${audiologySubtitle}`);
    }
    console.log('PASSED: Audiology scene re-entry and click idempotency verified.');

    if (consoleErrors.length > 0) {
      throw new Error(`Encountered unhandled browser console errors:\n${consoleErrors.join('\n')}`);
    }

    console.log('ALL PHASE 2 EDGE CASES AND REGRESSION TESTS PASSED!');
  } finally {
    page.off('console', errorHandler);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  console.log(`Phase 2 Edge-Cases Test server running on ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });
  const page = await browser.newPage();
  let exitCode = 0;
  try {
    await runSuite(page, baseUrl);
  } catch (err) {
    console.error('TEST RUN FAILURE:', err);
    exitCode = 1;
  } finally {
    await browser.close();
    close();
    process.exit(exitCode);
  }
}
