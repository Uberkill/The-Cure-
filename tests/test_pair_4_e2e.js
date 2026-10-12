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
    console.log('--- Step 1: Bootstrap & Teleport to Act VII (The Synthesis Chamber) ---');
    await page.goto(`${baseUrl}/?test=true`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#canvas-container canvas', { state: 'visible', timeout: 8000 });
    await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });

    await page.click('#btn-menu-start');
    await page.waitForSelector('#view-main-menu', { state: 'hidden', timeout: 5000 });

    // Teleport directly to Synthesis Chamber
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'synthesis_blackout' });
    });

    await page.waitForFunction(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return current && current.id === 'synthesis_blackout';
    }, { timeout: 5000 });
    console.log('PASSED: Entered Synthesis Chamber.');

    // -----------------------------------------------------------------
    // ACT VII: THE SYNTHESIS CHAMBER & GALVANOMETER GRID
    // -----------------------------------------------------------------
    console.log('--- Step 2: Act VII - Open Galvanometer Grid Screen ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_galvanometer_grid');
    });

    await page.waitForSelector('#screen-galvanometer-grid:not(.hidden)', { timeout: 4000 });
    console.log('PASSED: Galvanometer Grid modal opened.');

    console.log('--- Step 3: Act VII - Check Initial State & Bus Lever Interlock ---');
    const breakerStatusText = await page.textContent('#label-breaker-status');
    if (!breakerStatusText.includes('CIRCUIT BUS ARMED') || !breakerStatusText.includes('100')) {
      throw new Error(`Expected armed breaker status text, got: ${breakerStatusText}`);
    }

    const isLeverDisabledInitially = await page.$eval('#btn-bus-lever', (btn) => btn.disabled);
    if (!isLeverDisabledInitially) {
      throw new Error('Expected bus lever to be disabled before channels are balanced.');
    }
    console.log('PASSED: Bus lever interlocked while resistances are unbalanced.');

    console.log('--- Step 4: Act VII - Balance All 5 Shunt Channels to 100 Ohms ---');
    // Adjust Channel 0 (50 -> 100)
    await page.$eval('#slider-shunt-0', (el) => {
      el.value = '100';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    // Adjust Channel 1 (150 -> 100)
    await page.$eval('#slider-shunt-1', (el) => {
      el.value = '100';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    // Adjust Channel 2 (20 -> 100)
    await page.$eval('#slider-shunt-2', (el) => {
      el.value = '100';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    // Adjust Channel 3 (180 -> 100)
    await page.$eval('#slider-shunt-3', (el) => {
      el.value = '100';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const isLeverReady = await page.$eval('#btn-bus-lever', (btn) => !btn.disabled && btn.classList.contains('ready'));
    if (!isLeverReady) {
      throw new Error('Expected bus lever to be enabled and marked ready at 100 Ohms equilibrium.');
    }
    console.log('PASSED: All 5 channels balanced at 100 Ohms. Main bus lever armed.');

    console.log('--- Step 5: Act VII - Throw Hydraulic Bus Lever ---');
    await page.click('#btn-bus-lever');

    const leverSubtitle = await page.textContent('#observation-subtitle');
    if (!leverSubtitle.includes('Main hydraulic bus lever thrown') || !leverSubtitle.includes('Velvet Lounge')) {
      throw new Error(`Expected bus lever unseal subtitle, received: ${leverSubtitle}`);
    }

    await page.waitForSelector('#screen-galvanometer-grid', { state: 'hidden', timeout: 4000 });

    const gridBalancedInScenario = await page.evaluate(() => {
      const sc = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return sc.galvanometerScreen.getState().gridBalanced;
    });
    if (!gridBalancedInScenario) {
      throw new Error('Expected gridBalanced to be true in Galvanometer screen state.');
    }
    console.log('PASSED: Act VII solved, hydraulic blast seals disengaged.');

    console.log('--- Step 6: Act VII - Click Idempotency Guard ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_galvanometer_grid');
    });

    const isGridModalHidden = await page.$eval('#screen-galvanometer-grid', (el) => el.classList.contains('hidden'));
    if (!isGridModalHidden) {
      throw new Error('Expected galvanometer grid modal to remain hidden after solve.');
    }
    console.log('PASSED: Galvanometer grid click idempotency confirmed.');

    // -----------------------------------------------------------------
    // ACT VIII: THE VELVET LOUNGE & SWITCHBOARD MIRROR
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
    console.log('PASSED: Entered Velvet Lounge.');

    console.log('--- Step 8: Act VIII - Open Switchboard & Mirror Screen ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_switchboard');
    });

    await page.waitForSelector('#screen-switchboard-mirror:not(.hidden)', { timeout: 4000 });
    console.log('PASSED: Switchboard & Mirror modal opened.');

    console.log('--- Step 9: Act VIII - Decanter Paradox Alignment ---');
    const isClimaxDisabledInitially = await page.$eval('#btn-answer-climax', (btn) => btn.disabled);
    if (!isClimaxDisabledInitially) {
      throw new Error('Expected answer payphone button to be disabled initially.');
    }

    await page.click('#btn-place-decanter');
    const isDecanterActive = await page.$eval('#btn-place-decanter', (btn) => btn.classList.contains('active'));
    const isMirrorAligned = await page.$eval('#mirror-reflection', (el) => el.classList.contains('aligned'));
    if (!isDecanterActive || !isMirrorAligned) {
      throw new Error('Expected decanter button to be active and mirror reflection to be aligned.');
    }
    console.log('PASSED: Decanter placed and mirror reflection paradox aligned.');

    console.log('--- Step 10: Act VIII - Switchboard Patch Rejection & Success ---');
    // Test mismatched pair: Trunk 102 -> Line 1
    await page.click('#jack-trunk-102');
    await page.click('#jack-line-1');

    const mismatchSubtitle = await page.textContent('#observation-subtitle');
    if (!mismatchSubtitle.includes('Patch rejected') || !mismatchSubtitle.includes('Trunk 102 -> Line 1')) {
      throw new Error(`Expected patch rejection subtitle, got: ${mismatchSubtitle}`);
    }

    const isClimaxStillDisabled = await page.$eval('#btn-answer-climax', (btn) => btn.disabled);
    if (!isClimaxStillDisabled) {
      throw new Error('Expected climax button to remain disabled after mismatched patch.');
    }

    // Connect correct pair: Trunk 104 -> Line 4
    await page.click('#jack-trunk-104');
    await page.click('#jack-line-4');

    const patchLabel = await page.textContent('#label-patch-status');
    if (!patchLabel.includes('CIRCUIT PATCHED') || !patchLabel.includes('TRUNK 104') || !patchLabel.includes('LINE 4')) {
      throw new Error(`Expected circuit patched label, got: ${patchLabel}`);
    }

    const isClimaxNowReady = await page.$eval('#btn-answer-climax', (btn) => !btn.disabled && btn.classList.contains('ready'));
    if (!isClimaxNowReady) {
      throw new Error('Expected answer climax button to be enabled and marked ready.');
    }
    console.log('PASSED: Trunk 104 patched to Line 4. Payphone circuit live.');

    console.log('--- Step 11: Act VIII - Lift Solitary Payphone & Terminal Climax ---');
    await page.click('#btn-answer-climax');

    const climaxSubtitle = await page.textContent('#observation-subtitle');
    if (!climaxSubtitle.includes('You lift the receiver') || !climaxSubtitle.includes('acoustic vacuum')) {
      throw new Error(`Expected acoustic vacuum climax subtitle, got: ${climaxSubtitle}`);
    }

    // Wait for terminal blackout screen transition
    await page.waitForSelector('#view-terminal-blackout:not(.hidden)', { timeout: 6000 });
    const blackoutText = await page.textContent('#view-terminal-blackout');
    if (!blackoutText.includes('SYNTHESIS PROTOCOL FINALIZED') || !blackoutText.includes('Subject 104 Deployed')) {
      throw new Error(`Expected terminal blackout finale text, got: ${blackoutText}`);
    }
    console.log('PASSED: Terminal climax completed. Subject 104 Deployed to Baltic sector.');

    if (consoleErrors.length > 0) {
      throw new Error(`Encountered unhandled browser console errors:\n${consoleErrors.join('\n')}`);
    }

    console.log('ALL PHASE 4 (ACTS VII & VIII) E2E VERIFICATIONS PASSED!');
  } finally {
    page.off('console', errorHandler);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  console.log(`Pair 4 E2E Test server running on ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });
  const page = await browser.newPage();
  let exitCode = 0;
  try {
    await runSuite(page, baseUrl);
  } catch (err) {
    console.error('FAILED: Pair 4 E2E Test execution failed:', err);
    exitCode = 1;
  } finally {
    await browser.close();
    close();
    process.exit(exitCode);
  }
}
