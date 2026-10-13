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
    console.log('--- Step 1: Bootstrap & Teleport to Act III (Hydrotherapy) ---');
    await page.goto(`${baseUrl}/?test=true`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#canvas-container canvas', { state: 'visible', timeout: 8000 });
    await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });

    await page.click('#btn-menu-start');
    await page.waitForSelector('#view-main-menu', { state: 'hidden', timeout: 5000 });

    // Teleport directly to hydrotherapy chamber
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'hydrotherapy' });
    });

    await page.waitForFunction(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return current && current.id === 'hydrotherapy';
    }, { timeout: 5000 });
    console.log('PASSED: Entered Hydrotherapy room.');

    console.log('--- Step 2: Act III - Open Hydraulic Manifold Screen ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_manifold');
    });

    await page.waitForSelector('#screen-hydraulic-manifold:not(.hidden)', { timeout: 3000 });
    const isManifoldVisible = await page.isVisible('#screen-hydraulic-manifold');
    if (!isManifoldVisible) throw new Error('Hydraulic Manifold Screen failed to open');

    const initialPsi = await page.textContent('#label-pressure-psi');
    if (!initialPsi.includes('45.0 PSI')) {
      throw new Error(`Unexpected initial pressure: ${initialPsi}`);
    }
    console.log('PASSED: Hydraulic Manifold Screen visible with 45.0 PSI initial differential.');

    console.log('--- Step 3: Act III - Test Emergency Sump Blowout Reset ---');
    // Rotate Valve A once
    await page.click('#valve-a');
    const readAfterA = await page.textContent('#readout-col-0');
    if (!readAfterA.includes('3 / 4')) {
      throw new Error(`Expected tub 1 level 3/4 after Valve A, found: ${readAfterA}`);
    }

    // Hit emergency dump
    await page.click('#btn-emergency-dump');
    const readAfterDump = await page.textContent('#readout-col-0');
    if (!readAfterDump.includes('4 / 4')) {
      throw new Error(`Expected tub 1 level reset to 4/4 after dump, found: ${readAfterDump}`);
    }
    console.log('PASSED: Emergency sump blowout successfully flushed and reset charge.');

    console.log('--- Step 4: Act III - Siphon Balance to [2, 2, 2] & 0.0 PSI ---');
    // From [4, 2, 0]:
    // Click Valve B twice -> [4, 1, 1] -> [4, 0, 2]
    await page.click('#valve-b');
    await page.click('#valve-b');
    // Click Valve A twice -> [3, 1, 2] -> [2, 2, 2]
    await page.click('#valve-a');
    await page.click('#valve-a');

    // Wait for auto-close after 0.0 PSI resolution
    await page.waitForSelector('#screen-hydraulic-manifold', { state: 'hidden', timeout: 4000 });

    const hydroBeforePickup = await page.evaluate(() => {
      const gs = window.__VAULT_APP__.gameState;
      const scenario = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return {
        hasCrystal: gs.hasCrystal('crystal_02_bronze'),
        manifoldBalanced: scenario.manifoldBalanced,
        crystalMeshVisible: scenario.crystalMesh ? scenario.crystalMesh.visible : false
      };
    });
    if (hydroBeforePickup.hasCrystal) {
      throw new Error('GameState should not have crystal_02_bronze before 3D pickup');
    }
    if (!hydroBeforePickup.manifoldBalanced) {
      throw new Error('3D Hydrotherapy scenario was not marked balanced');
    }
    if (!hydroBeforePickup.crystalMeshVisible) {
      throw new Error('3D bronze crystal mesh was not visible after manifold solve');
    }

    // Physically click 3D crystal to pick it up
    await page.evaluate(() => {
      window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().onObjectClick('crystal_02_bronze');
    });

    const hasBronzeCrystal = await page.evaluate(() => {
      const gs = window.__VAULT_APP__.gameState;
      return gs.hasCrystal('crystal_02_bronze');
    });
    if (!hasBronzeCrystal) {
      throw new Error('GameState does not have crystal_02_bronze after 3D crystal pickup');
    }

    const hydroState = await page.evaluate(() => {
      const scenario = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return {
        manifoldBalanced: scenario.manifoldBalanced,
        crystalCollected: scenario.crystalCollected,
        crystalMeshVisible: scenario.crystalMesh ? scenario.crystalMesh.visible : null
      };
    });
    if (hydroState.crystalMeshVisible !== false) {
      throw new Error('3D bronze crystal mesh was not hidden after collection');
    }
    console.log('PASSED: Hydrostatic manifold balanced to 0.0 PSI and Crystal 02 secured.');

    console.log('--- Step 5: Act III - 3D Manifold Re-click Guard ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_manifold');
    });

    const solvedSub = await page.textContent('#observation-subtitle');
    if (!solvedSub.includes('locked at 0.0 PSI') && !solvedSub.includes('Memory Crystal 02 secured')) {
      throw new Error(`Unexpected subtitle on clicking solved manifold: ${solvedSub}`);
    }
    console.log('PASSED: Solved manifold refuses duplicate interaction.');

    console.log('--- Step 6: Teleport to Act IV (The Audiology Vault) ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'audiology' });
    });

    await page.waitForFunction(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return current && current.id === 'audiology';
    }, { timeout: 5000 });
    console.log('PASSED: Entered Audiology Vault.');

    console.log('--- Step 7: Act IV - Open Binaural Phase Synthesizer Screen ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_amplifier_monolith');
    });

    await page.waitForSelector('#screen-binaural-synthesizer:not(.hidden)', { timeout: 3000 });
    const isBinauralVisible = await page.isVisible('#screen-binaural-synthesizer');
    if (!isBinauralVisible) throw new Error('Binaural Synthesizer Screen failed to open');

    const isCanvasPresent = await page.isVisible('#chladni-canvas');
    if (!isCanvasPresent) throw new Error('Chladni sand resonance canvas failed to mount');
    console.log('PASSED: Binaural Synthesizer Screen and Chladni canvas visible.');

    console.log('--- Step 8: Act IV - Acoustic Null Alignment (45 deg, 135 deg, Phase Inverted, 741 Hz) ---');
    // Set Left Horn to 45 deg
    await page.fill('#slider-horn-left', '45');
    await page.dispatchEvent('#slider-horn-left', 'input');

    // Set Right Horn to 135 deg
    await page.fill('#slider-horn-right', '135');
    await page.dispatchEvent('#slider-horn-right', 'input');

    // Set Frequency to 741 Hz
    await page.fill('#slider-carrier-freq', '741');
    await page.dispatchEvent('#slider-carrier-freq', 'input');

    // Toggle Phase Inversion
    await page.click('#btn-toggle-phase');

    const phaseBtnText = await page.textContent('#btn-toggle-phase');
    if (!phaseBtnText.includes('180°')) {
      throw new Error(`Phase button not inverted: ${phaseBtnText}`);
    }

    // Wait for auto-close upon acoustic null lock
    await page.waitForSelector('#screen-binaural-synthesizer', { state: 'hidden', timeout: 4000 });

    const audiologyBeforePickup = await page.evaluate(() => {
      const gs = window.__VAULT_APP__.gameState;
      const scenario = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return {
        hasCrystal: gs.hasCrystal('crystal_03_amethyst'),
        ampTuned: scenario.ampTuned,
        crystalMeshVisible: scenario.crystalMesh ? scenario.crystalMesh.visible : false
      };
    });
    if (audiologyBeforePickup.hasCrystal) {
      throw new Error('GameState should not have crystal_03_amethyst before 3D pickup');
    }
    if (!audiologyBeforePickup.ampTuned) {
      throw new Error('3D Audiology scenario ampTuned flag not set');
    }
    if (!audiologyBeforePickup.crystalMeshVisible) {
      throw new Error('3D amethyst crystal mesh was not visible after binaural solve');
    }

    // Physically click 3D crystal to pick it up
    await page.evaluate(() => {
      window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().onObjectClick('crystal_03_amethyst');
    });

    const hasAmethystCrystal = await page.evaluate(() => {
      const gs = window.__VAULT_APP__.gameState;
      return gs.hasCrystal('crystal_03_amethyst');
    });
    if (!hasAmethystCrystal) {
      throw new Error('GameState does not have crystal_03_amethyst after 3D crystal pickup');
    }

    const audiologyState = await page.evaluate(() => {
      const scenario = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return {
        ampTuned: scenario.ampTuned,
        crystalCollected: scenario.crystalCollected,
        crystalMeshVisible: scenario.crystalMesh ? scenario.crystalMesh.visible : null
      };
    });
    if (audiologyState.crystalMeshVisible !== false) {
      throw new Error('3D amethyst crystal mesh was not hidden after collection');
    }
    console.log('PASSED: Acoustic null achieved, Chladni mandala locked, and Crystal 03 secured.');

    console.log('--- Step 9: Act IV - 3D Monolith Re-click Guard ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_amplifier_monolith');
    });

    const audiologySolvedSub = await page.textContent('#observation-subtitle');
    if (!audiologySolvedSub.includes('741 Hz') && !audiologySolvedSub.includes('Memory Crystal 03 secured')) {
      throw new Error(`Unexpected subtitle on clicking solved monolith: ${audiologySolvedSub}`);
    }
    console.log('PASSED: Solved amplifier monolith refuses duplicate interaction.');

    if (consoleErrors.length > 0) {
      throw new Error(`Encountered ${consoleErrors.length} browser console errors:\n${consoleErrors.join('\n')}`);
    }

    console.log('ALL PAIR 2 (ACTS III & IV) E2E TESTS PASSED WITH 0 ERRORS.');
  } finally {
    page.off('console', errorHandler);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  console.log(`Pair 2 E2E test server running on ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });
  const page = await browser.newPage();
  let exitCode = 0;
  try {
    await runSuite(page, baseUrl);
  } catch (err) {
    console.error('FAILED: Pair 2 E2E Test execution failed:', err);
    exitCode = 1;
  } finally {
    await browser.close();
    close();
    process.exit(exitCode);
  }
}
