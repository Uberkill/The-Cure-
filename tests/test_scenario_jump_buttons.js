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
  const pageErrorHandler = (err) => {
    consoleErrors.push(err.message);
    console.error(`[Page Error] ${err.message}`);
  };

  page.on('console', errorHandler);
  page.on('pageerror', pageErrorHandler);

  try {
    await page.goto(`${baseUrl}/?editor=true`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#dev-3d-editor-panel', { state: 'visible', timeout: 8000 });

    if (await page.isVisible('#btn-menu-start')) {
      await page.click('#btn-menu-start');
      await page.waitForSelector('#view-main-menu', { state: 'hidden', timeout: 4000 });
    }

    // Switch to Scenarios tab
    await page.click('button[data-tab="scenarios"]');
    await page.waitForSelector('.dev-btn-scenario', { state: 'visible', timeout: 3000 });

    const roomsToTest = [
      { id: 'room_04', expectedStage: 'ACT_1_HUB_AWAKEN', expectedTitle: 'The Sterile Chamber' },
      { id: 'sleep_ward', expectedStage: 'ACT_2_SLEEP_WARD', expectedTitle: 'The Sleep Ward' },
      { id: 'hydrotherapy', expectedStage: 'ACT_3_HYDROTHERAPY', expectedTitle: 'The Hydrotherapy Room' },
      { id: 'audiology', expectedStage: 'ACT_4_AUDIOLOGY', expectedTitle: 'The Audiology Vault' },
      { id: 'archive', expectedStage: 'ACT_5_ARCHIVE', expectedTitle: 'The Archive' },
      { id: 'directors_office', expectedStage: 'ACT_6_DIRECTORS_OFFICE', expectedTitle: "The Director's Office" },
      { id: 'synthesis_blackout', expectedStage: 'ACT_7_SYNTHESIS_BLACKOUT', expectedTitle: 'The Synthesis Chamber' },
      { id: 'velvet_lounge', expectedStage: 'ACT_8_VELVET_LOUNGE', expectedTitle: 'The Velvet Lounge' }
    ];

    for (const room of roomsToTest) {
      console.log(`Testing Jump to [${room.id}] -> ${room.expectedTitle}`);
      await page.click(`.dev-btn-scenario[data-room="${room.id}"]`);

      await page.waitForFunction((roomId) => {
        return window.__VAULT_APP__?.scenarioRegistry?.getCurrentScenario()?.id === roomId;
      }, room.id, { timeout: 4000 });

      const state = await page.evaluate(() => {
        const app = window.__VAULT_APP__;
        return {
          currentScenarioId: app.scenarioRegistry.getCurrentScenario()?.id,
          stage: app.gameState.getStage(),
          sceneChildCount: app.sceneManager.scene.children.length
        };
      });

      if (state.currentScenarioId !== room.id) {
        throw new Error(`Expected scenario ${room.id}, got ${state.currentScenarioId}`);
      }
      if (state.stage !== room.expectedStage) {
        throw new Error(`Expected stage ${room.expectedStage}, got ${state.stage}`);
      }
      if (state.sceneChildCount === 0) {
        throw new Error(`Scene is empty after jump to ${room.id}`);
      }
      console.log(`PASSED: Jump to ${room.id} synchronized to stage ${state.stage}`);
    }

    // Jump back to Room 01 to prove bidirectional reset
    console.log('Testing bidirectional jump back to Act I (Room 01)');
    await page.click('.dev-btn-scenario[data-room="room_04"]');

    await page.waitForFunction(() => {
      return window.__VAULT_APP__?.scenarioRegistry?.getCurrentScenario()?.id === 'room_04';
    }, { timeout: 4000 });

    const hubState = await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      return {
        stage: app.gameState.getStage(),
        patchedCount: ['crystal_01_quartz', 'crystal_02_bronze', 'crystal_03_amethyst', 'crystal_04_obsidian', 'crystal_05_celadon']
          .filter(c => app.gameState.isCrystalPatched(c)).length
      };
    });

    if (hubState.stage !== 'ACT_1_HUB_AWAKEN') {
      throw new Error(`Expected stage ACT_1_HUB_AWAKEN on return, got ${hubState.stage}`);
    }
    if (hubState.patchedCount !== 0) {
      throw new Error(`Expected 0 patched crystals on reset to Act I, got ${hubState.patchedCount}`);
    }
    console.log('PASSED: Bidirectional stage reset to Act I confirmed with zero state pollution.');

    if (consoleErrors.length > 0) {
      throw new Error(`Found ${consoleErrors.length} console errors during test: ${consoleErrors.join('; ')}`);
    }

    console.log('SUCCESS: All 8 Act scenario jump buttons and bidirectional state synchronization verified cleanly!');
  } finally {
    page.off('console', errorHandler);
    page.off('pageerror', pageErrorHandler);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  console.log(`Scenario Jump Buttons test server running on ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });
  const page = await browser.newPage();
  let exitCode = 0;
  try {
    await runSuite(page, baseUrl);
  } catch (err) {
    console.error('TEST FAILED:', err);
    exitCode = 1;
  } finally {
    await browser.close();
    close();
    process.exit(exitCode);
  }
}
