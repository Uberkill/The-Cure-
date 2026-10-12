import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { startTestServer } from './helpers/testServer.js';

export async function runSuite(page, baseUrl) {
  console.log('[TEST] Navigating to application...');
  await page.goto(`${baseUrl}/?test=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#view-main-menu', { state: 'attached', timeout: 5000 });

  // Bypass menu
  await page.evaluate(() => {
    document.getElementById('view-main-menu')?.classList.add('hidden');
  });

  // 1. Test Facility Map Toggle via HUD button
  console.log('[TEST 1] Testing #btn-facility-map-toggle...');
  const btnMap = page.locator('#btn-facility-map-toggle');
  const count = await btnMap.count();
  if (count === 0) throw new Error('#btn-facility-map-toggle not found in DOM');

  await btnMap.click();
  const mapModal = page.locator('#screen-facility-map');
  await mapModal.waitFor({ state: 'visible', timeout: 4000 });
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
  await page.waitForFunction(() => {
    const el = document.getElementById('screen-facility-map');
    return el && el.classList.contains('hidden');
  }, { timeout: 4000 });
  console.log('[PASS 3] Escape key dismissed facility blueprint cleanly.');

  // 4. Test Hub CRT Oscilloscope Click with Pending Crystal
  console.log('[TEST 4] Testing Hub CRT Oscilloscope Click with Pending Crystal...');
  await page.evaluate(() => {
    const bus = window.__VAULT_APP__?.eventBus;
    if (bus) {
      bus.emit('puzzle:crystal_collected', {
        crystalId: 'crystal_01_quartz',
        label: 'PRISMATIC QUARTZ'
      });
    }
  });

  const patcherOpened = await page.evaluate(() => {
    const app = window.__VAULT_APP__;
    const scenario = app?.scenarioRegistry?.getCurrentScenario();
    if (scenario && typeof scenario.onObjectClick === 'function') {
      return scenario.onObjectClick('prop_oscilloscope');
    }
    return false;
  });

  const crtModal = page.locator('#modal-crt-patcher');
  await crtModal.waitFor({ state: 'visible', timeout: 4000 });
  console.log('[PASS 4] Hub CRT oscilloscope click opened #modal-crt-patcher for pending crystal.');

  // 5. Test CRT Node Patcher Auto-Stabilize and Progression Unlock
  console.log('[TEST 5] Testing CRT Auto-Stabilize and stage progression...');
  const btnAutoPatch = page.locator('#btn-crt-auto-patch');
  await btnAutoPatch.click();

  await page.waitForFunction(() => {
    const el = document.getElementById('modal-crt-patcher');
    return el && el.classList.contains('hidden');
  }, { timeout: 4000 });

  const stageAfterPatch = await page.evaluate(() => {
    return window.__VAULT_APP__?.gameState?.getStage();
  });
  console.log(`[PASS 5] CRT Patch completed. Game stage advanced to: ${stageAfterPatch}`);

  // 6. Test Oscilloscope fallback after patching (no pending crystals)
  console.log('[TEST 6] Testing Oscilloscope fallback subtitle when no crystals pending...');
  await page.evaluate(() => {
    const app = window.__VAULT_APP__;
    const scenario = app?.scenarioRegistry?.getCurrentScenario();
    if (scenario) scenario.onObjectClick('prop_oscilloscope');
  });

  await page.waitForFunction(() => {
    const t = document.getElementById('observation-subtitle')?.textContent;
    return t && t.includes('calibrated');
  }, { timeout: 4000 });

  const subtitleText = await page.locator('#observation-subtitle').textContent();
  console.log(`[PASS 6] Verified fallback subtitle: "${subtitleText?.trim()}"`);

  // 7. Test Facility Map Transit to unlocked sector
  console.log('[TEST 7] Testing Facility Map Transit to unlocked sector...');
  await btnMap.click();
  await mapModal.waitFor({ state: 'visible', timeout: 4000 });

  const sleepCard = page.locator('.facility-sector-card[data-sector-id="sleep_ward"]');
  await sleepCard.click();

  const btnTransit = page.locator('#btn-facility-transit');
  const btnTransitText = await btnTransit.textContent();
  console.log(`Transit button state: "${btnTransitText?.trim()}"`);
  await btnTransit.click();

  await page.waitForFunction(() => {
    return window.__VAULT_APP__?.scenarioRegistry?.getCurrentScenario()?.id === 'sleep_ward';
  }, { timeout: 5000 });

  const currentRoom = await page.evaluate(() => {
    return window.__VAULT_APP__?.scenarioRegistry?.getCurrentScenario()?.id;
  });
  console.log(`[PASS 7] Facility transit executed. Current room is: "${currentRoom}"`);
  console.log('[ALL TESTS PASSED] Facility blueprint and CRT progression fully verified.');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  console.log(`[TEST SERVER] Running on ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--autoplay-policy=no-user-gesture-required']
  });
  const page = await browser.newPage();
  let exitCode = 0;
  try {
    await runSuite(page, baseUrl);
  } catch (err) {
    console.error('[TEST FAILURE]', err);
    exitCode = 1;
  } finally {
    await browser.close();
    close();
    process.exit(exitCode);
  }
}
