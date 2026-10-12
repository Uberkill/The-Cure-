import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { startTestServer } from './helpers/testServer.js';

export async function runSuite(page, baseUrl) {
  console.log('--- Step 1: Bootstrap & Intake ---');
  await page.goto(`${baseUrl}/?test=true`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });
  await page.click('#btn-menu-start');
  await page.waitForSelector('#view-main-menu', { state: 'hidden', timeout: 5000 });

  console.log('--- Step 2: Open Facility Blueprint & Verify Hub Beacon ---');
  await page.click('#btn-facility-map-toggle');
  await page.waitForSelector('#screen-facility-map:not(.hidden)', { timeout: 3000 });

  const activeSectorId = await page.evaluate(() => {
    const card = document.querySelector('.facility-sector-card.current');
    return card?.getAttribute('data-sector-id');
  });
  console.log(`Active Beacon Sector: ${activeSectorId}`);
  if (activeSectorId !== 'room_04') {
    throw new Error(`Expected active beacon on room_04, got: ${activeSectorId}`);
  }

  // Dismiss blueprint
  await page.keyboard.press('Escape');
  await page.waitForSelector('#screen-facility-map', { state: 'hidden', timeout: 3000 });

  console.log('--- Step 3: Advance to Act II & Recover Quartz Crystal ---');
  await page.evaluate(() => {
    const app = window.__VAULT_APP__;
    app.gameState.addItem('prop_brass_shunt');
    app.gameState.transitionTo('ACT_1_HUB_CORRIDOR_OPEN');
  });

  // Transit to Sleep Ward
  await page.evaluate(() => {
    window.__VAULT_APP__.eventBus.emit('scenario:switch_room', { targetRoomId: 'sleep_ward' });
  });
  await page.waitForFunction(() => {
    return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'sleep_ward';
  });

  // Solve dispensary lock
  await page.evaluate(() => {
    const scenario = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
    scenario.digits = [1, 0, 4];
    scenario.onObjectClick('prop_trolley_lock');
    scenario.onObjectClick('crystal_01_quartz');
  });

  // Return to Hub and patch crystal
  await page.evaluate(() => {
    window.__VAULT_APP__.eventBus.emit('scenario:switch_room', { targetRoomId: 'room_04' });
  });
  await page.waitForFunction(() => {
    return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'room_04';
  });

  // Trigger patch completion on Hub CRT
  await page.evaluate(() => {
    const app = window.__VAULT_APP__;
    app.eventBus.emit('puzzle:crt_patch_completed', {
      crystalId: 'crystal_01_quartz',
      log: {
        id: 'log_01',
        actTitle: 'ACT II • THE SOMNAMBULIST SLEEP WARD',
        transcript: 'Subject 104 vital telemetry normalized.'
      }
    });
  });

  const currentStage = await page.evaluate(() => window.__VAULT_APP__.gameState.getStage());
  console.log(`Stage after patching: ${currentStage}`);
  if (currentStage !== 'ACT_2_PATCH_1_COMPLETE') {
    throw new Error(`Expected ACT_2_PATCH_1_COMPLETE, got: ${currentStage}`);
  }

  console.log('--- Step 4: Non-Linear Transit via Blueprint from Hub to Sleep Ward ---');
  await page.click('#btn-facility-map-toggle');
  await page.waitForSelector('#screen-facility-map:not(.hidden)', { timeout: 3000 });

  // Select Sleep Ward
  await page.click('.facility-sector-card[data-sector-id="sleep_ward"]');

  const btnTransitText = await page.textContent('#btn-facility-transit');
  console.log(`Transit button label: "${btnTransitText?.trim()}"`);
  if (!btnTransitText?.includes('TRANSIT TO SLEEP WARD')) {
    throw new Error(`Expected transit button for Sleep Ward, got: ${btnTransitText}`);
  }

  // Click initiate transit
  await page.click('#btn-facility-transit');
  await page.waitForSelector('#screen-facility-map', { state: 'hidden', timeout: 3000 });

  await page.waitForFunction(() => {
    return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'sleep_ward';
  });
  console.log('PASSED: Direct transit to Sleep Ward executed via Blueprint.');

  console.log('--- Step 5: Direct Cross-Spoke Transit (Sleep Ward -> Hydrotherapy Suite) ---');
  await page.click('#btn-facility-map-toggle');
  await page.waitForSelector('#screen-facility-map:not(.hidden)', { timeout: 3000 });

  const beaconInSleepWard = await page.evaluate(() => {
    const card = document.querySelector('.facility-sector-card.current');
    return card?.getAttribute('data-sector-id');
  });
  console.log(`Beacon while inside Sleep Ward: ${beaconInSleepWard}`);
  if (beaconInSleepWard !== 'sleep_ward') {
    throw new Error(`Expected active beacon on sleep_ward, got: ${beaconInSleepWard}`);
  }

  // Select Hydrotherapy Suite
  await page.click('.facility-sector-card[data-sector-id="hydrotherapy"]');

  const transitHydroText = await page.textContent('#btn-facility-transit');
  console.log(`Transit button label: "${transitHydroText?.trim()}"`);
  if (!transitHydroText?.includes('TRANSIT TO HYDROTHERAPY SUITE')) {
    throw new Error(`Expected transit button for Hydrotherapy, got: ${transitHydroText}`);
  }

  // Initiate cross-spoke transit
  await page.click('#btn-facility-transit');
  await page.waitForSelector('#screen-facility-map', { state: 'hidden', timeout: 3000 });

  await page.waitForFunction(() => {
    return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'hydrotherapy';
  });
  console.log('PASSED: Direct cross-spoke transit from Sleep Ward to Hydrotherapy executed cleanly.');

  console.log('--- Step 6: Verify Hydrotherapy 3D Scene Mounted Correctly ---');
  const hydroMounted = await page.evaluate(() => {
    const sc = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
    return sc && sc.id === 'hydrotherapy' && sc.valveMeshes && sc.valveMeshes.length === 3;
  });
  console.log(`Hydrotherapy 3D scene and valve meshes mounted: ${hydroMounted}`);
  if (!hydroMounted) {
    throw new Error('Hydrotherapy scenario failed to build 3D valve geometry after cross-spoke transit');
  }

  console.log('--- Step 7: Return to Hub via Blueprint ---');
  await page.click('#btn-facility-map-toggle');
  await page.waitForSelector('#screen-facility-map:not(.hidden)', { timeout: 3000 });

  await page.click('.facility-sector-card[data-sector-id="room_04"]');
  await page.click('#btn-facility-transit');
  await page.waitForSelector('#screen-facility-map', { state: 'hidden', timeout: 3000 });

  await page.waitForFunction(() => {
    return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'room_04';
  });
  console.log('PASSED: Return to Sterile Chamber hub executed cleanly.');
  console.log('SUCCESS: Non-linear blueprint sector transit verified with 0 errors!');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  console.log(`[TEST SERVER] Running on ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  let exitCode = 0;
  try {
    await runSuite(page, baseUrl);
  } catch (err) {
    console.error('Test Execution Failed:', err);
    exitCode = 1;
  } finally {
    await browser.close();
    close();
    process.exit(exitCode);
  }
}
