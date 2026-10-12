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
    console.log('--- Suite 1: Bootstrap & Act I Sequence-Breaking Guardrails ---');
    await page.goto(`${baseUrl}/?test=true`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#canvas-container canvas', { state: 'visible', timeout: 8000 });
    await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });

    await page.click('#btn-menu-start');
    await page.waitForSelector('#view-main-menu', { state: 'hidden', timeout: 5000 });

    console.log('--- Test 1.1: Un-shunted Socket Click Rejection ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('vault_crt_screen');
    });

    await page.waitForSelector('#screen-tektronix-crt:not(.hidden)', { timeout: 3000 });
    await page.click('#slot-shunt');

    const shuntTextAfterClick = await page.textContent('#slot-shunt');
    if (!shuntTextAfterClick.includes('EMPTY [CLICK TO INSERT]')) {
      throw new Error(`Expected shunt slot to remain empty, found: ${shuntTextAfterClick}`);
    }

    const unShuntedSub = await page.textContent('#observation-subtitle');
    if (!unShuntedSub.includes('fuse block is empty') && !unShuntedSub.includes('brass shunt is required')) {
      throw new Error(`Expected missing shunt subtitle warning, received: ${unShuntedSub}`);
    }
    console.log('PASSED: Un-shunted socket click properly rejected with contextual feedback.');

    console.log('--- Test 1.2: Knife Switch Off-Frequency Interlock ---');
    await page.evaluate(() => {
      const gs = window.__VAULT_APP__.gameState;
      gs.addItem('prop_brass_shunt');
    });

    await page.click('#slot-shunt');
    const seatedShuntText = await page.textContent('#slot-shunt');
    if (!seatedShuntText.includes('BRASS SHUNT SEATED')) {
      throw new Error(`Failed to seat brass shunt after adding to inventory: ${seatedShuntText}`);
    }

    // Set frequency to 620 Hz (off-resonance)
    await page.fill('#dial-frequency', '620');
    await page.dispatchEvent('#dial-frequency', 'input');

    const isSwitchDisabled = await page.$eval('#btn-knife-switch', (el) => el.disabled);
    if (!isSwitchDisabled) {
      throw new Error('Knife switch should be strictly disabled when off-resonance.');
    }

    await page.click('#btn-knife-switch', { force: true });
    const stageOffFreq = await page.evaluate(() => window.__VAULT_APP__.gameState.getStage());
    if (stageOffFreq !== 'ACT_1_HUB_AWAKEN') {
      throw new Error(`Stage broken prematurely by off-frequency knife switch: ${stageOffFreq}`);
    }
    console.log('PASSED: Knife switch strictly interlocked and disabled off-resonance.');

    console.log('--- Test 1.3: Corridor Door Pre-requisite Enforcement ---');
    await page.click('#btn-close-crt');
    await page.waitForSelector('#screen-tektronix-crt', { state: 'hidden', timeout: 2000 });

    // Attempt corridor without 528 Hz tuning
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('door_corridor');
    });

    const corridorBlockedSub = await page.textContent('#observation-subtitle');
    if (!corridorBlockedSub.includes('observation corridor is sealed')) {
      throw new Error(`Expected corridor sealed subtitle, received: ${corridorBlockedSub}`);
    }

    // Now tune to 528 Hz and throw knife switch
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_oscilloscope');
    });
    await page.waitForSelector('#screen-tektronix-crt:not(.hidden)', { timeout: 3000 });
    await page.fill('#dial-frequency', '528');
    await page.dispatchEvent('#dial-frequency', 'input');

    const isSwitchReady = await page.$eval('#btn-knife-switch', (el) => !el.disabled);
    if (!isSwitchReady) {
      throw new Error('Knife switch failed to become enabled at 528 Hz.');
    }

    await page.click('#btn-knife-switch');
    await page.waitForSelector('#screen-tektronix-crt', { state: 'hidden', timeout: 3000 });

    const stageTuned = await page.evaluate(() => window.__VAULT_APP__.gameState.getStage());
    if (stageTuned !== 'ACT_1_HUB_CORRIDOR_OPEN') {
      throw new Error(`Expected ACT_1_HUB_CORRIDOR_OPEN, found: ${stageTuned}`);
    }

    // Corridor click without cipher key must be rejected
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('door_corridor');
    });

    const keyRequiredSub = await page.textContent('#observation-subtitle');
    if (!keyRequiredSub.includes('mechanical cipher lock requires a heavy brass key')) {
      throw new Error(`Expected cipher key required subtitle, received: ${keyRequiredSub}`);
    }
    console.log('PASSED: Observation corridor requires both 528 Hz relay release and cipher key.');

    console.log('--- Test 1.4: Transit to Act II Sleep Ward ---');
    await page.evaluate(() => {
      const gs = window.__VAULT_APP__.gameState;
      gs.addItem('prop_key');
      const app = window.__VAULT_APP__;
      // First click: unseals and swings door open
      app.scenarioRegistry.getCurrentScenario().onObjectClick('door_corridor');
    });

    const unsealSub = await page.textContent('#observation-subtitle');
    if (!unsealSub.includes('The observation corridor unseals')) {
      throw new Error(`Expected door unseal subtitle, received: ${unsealSub}`);
    }

    // Second click: traverses into the open passage
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('door_corridor');
    });

    await page.waitForFunction(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return current && current.id === 'sleep_ward';
    }, { timeout: 5000 });
    console.log('PASSED: Successfully transitioned to Sleep Ward after meeting all prerequisites.');

    console.log('--- Suite 2: Act II Dispensary Cart Solve & ESC Spam Resilience ---');
    // Open dispensary cart modal
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_trolley');
    });
    await page.waitForSelector('#screen-dispensary-cart:not(.hidden)', { timeout: 3000 });

    // Verify button is disabled when shutter is locked
    const isCartUnlockDisabled = await page.$eval('#btn-unlock-drawer', (el) => el.hasAttribute('disabled'));
    if (!isCartUnlockDisabled) {
      throw new Error('Dispensary cart drawer unlock should be disabled at initial non-synchronized BPM');
    }

    // Unlock Stage 1 shutter: dial 1-0-4
    await page.click('#shutter-dial-0');
    for (let i = 0; i < 4; i++) {
      await page.click('#shutter-dial-2');
    }

    // Set slider to 68 BPM
    await page.fill('#slider-drip-rate', '68');
    await page.dispatchEvent('#slider-drip-rate', 'input');

    // Cycle tumblers to target glyphs: NITROUS - BROMIDE - VALERIAN
    const cycleTumblerTo = async (index, targetGlyph) => {
      for (let i = 0; i < 6; i++) {
        const text = await page.textContent(`#tumbler-${index}`);
        if (text.includes(targetGlyph)) break;
        await page.click(`#tumbler-${index}`);
      }
    };

    await cycleTumblerTo(0, 'NITROUS');
    await cycleTumblerTo(1, 'BROMIDE');
    await cycleTumblerTo(2, 'VALERIAN');

    const isCartUnlockReady = await page.$eval('#btn-unlock-drawer', (el) => !el.hasAttribute('disabled'));
    if (!isCartUnlockReady) {
      throw new Error('Dispensary cart drawer button failed to enable after chemical alignment and 68 BPM');
    }

    console.log('--- Test 2.1: Click Unlock Drawer & Spam ESC Key ---');
    await page.click('#btn-unlock-drawer');

    // Immediately spam Escape key 5 times to test ghost timer and input locking resilience
    for (let k = 0; k < 5; k++) {
      await page.keyboard.press('Escape');
    }

    await page.waitForSelector('#screen-dispensary-cart', { state: 'hidden', timeout: 3000 });
    console.log('PASSED: Screen closed cleanly under ESC spam without phantom timer errors.');

    console.log('--- Test 2.2: 3D Scene Reflection & Duplicate Prevention ---');
    const sleepWardState = await page.evaluate(() => {
      const scenario = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      const gs = window.__VAULT_APP__.gameState;
      return {
        trolleyUnlocked: scenario.trolleyUnlocked,
        crystalCollected: scenario.crystalCollected,
        crystalMeshVisible: scenario.crystalMesh ? scenario.crystalMesh.visible : null,
        digits: scenario.digits,
        hasCrystal: gs.hasCrystal('crystal_01_quartz'),
        stage: gs.getStage()
      };
    });

    if (!sleepWardState.hasCrystal) {
      throw new Error('GameState does not have crystal_01_quartz');
    }
    if (!sleepWardState.trolleyUnlocked) {
      throw new Error('Sleep Ward 3D trolley was not marked unlocked');
    }
    if (sleepWardState.crystalMeshVisible !== false) {
      throw new Error('Sleep Ward 3D crystal mesh was not hidden after collection');
    }
    if (sleepWardState.digits[0] !== 1 || sleepWardState.digits[1] !== 0 || sleepWardState.digits[2] !== 4) {
      throw new Error(`Sleep Ward 3D digits do not reflect [1, 0, 4]: ${JSON.stringify(sleepWardState.digits)}`);
    }

    // Click 3D trolley again to verify duplicate rejection
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_trolley');
    });

    const duplicateTrolleySub = await page.textContent('#observation-subtitle');
    if (!duplicateTrolleySub.includes('Dispensary Cart is unlocked [ 1 - 0 - 4 ]') || !duplicateTrolleySub.includes('Memory Crystal 01 has been secured')) {
      throw new Error(`Unexpected subtitle on re-clicking unlocked trolley: ${duplicateTrolleySub}`);
    }
    console.log('PASSED: 3D scene state correctly reflects unlocked status and prevents duplicate crystal award.');

    console.log('--- Test 2.3: Cross-Room Transit & Scene Re-entry State Persistence ---');
    // Return to Central Hub
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('door_return_hub');
    });

    await page.waitForFunction(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return current && current.id === 'room_04';
    }, { timeout: 5000 });

    // Re-enter Sleep Ward to trigger buildScene from scratch and verify state persistence
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'sleep_ward' });
    });

    await page.waitForFunction(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return current && current.id === 'sleep_ward';
    }, { timeout: 5000 });

    const reenteredSleepWardState = await page.evaluate(() => {
      const scenario = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return {
        trolleyUnlocked: scenario.trolleyUnlocked,
        crystalCollected: scenario.crystalCollected,
        crystalMeshVisible: scenario.crystalMesh ? scenario.crystalMesh.visible : null,
        digits: scenario.digits
      };
    });

    if (!reenteredSleepWardState.trolleyUnlocked) {
      throw new Error('Re-entered Sleep Ward failed to initialize trolley in unlocked state');
    }
    if (reenteredSleepWardState.crystalMeshVisible !== false) {
      throw new Error('Re-entered Sleep Ward erroneously respawned the crystal mesh');
    }
    if (reenteredSleepWardState.digits[0] !== 1 || reenteredSleepWardState.digits[1] !== 0 || reenteredSleepWardState.digits[2] !== 4) {
      throw new Error(`Re-entered Sleep Ward did not maintain [1, 0, 4] digits: ${JSON.stringify(reenteredSleepWardState.digits)}`);
    }

    console.log('PASSED: Sleep Ward seamlessly persisted solved state on scene teardown and re-entry.');

    if (consoleErrors.length > 0) {
      throw new Error(`Encountered ${consoleErrors.length} browser console errors:\n${consoleErrors.join('\n')}`);
    }

  } finally {
    page.off('console', errorHandler);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  console.log(`Phase 1 Edge-Cases Test server running on ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });
  const page = await browser.newPage();
  let exitCode = 0;
  try {
    await runSuite(page, baseUrl);
  } catch (err) {
    console.error('TEST RUNNER FAILED:', err);
    exitCode = 1;
  } finally {
    await browser.close();
    close();
    process.exit(exitCode);
  }
}
