import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { startTestServer } from './helpers/testServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots');

export async function runSuite(page, baseUrl) {
  console.log('--- Step 1: Initial Launch & Splash Screen Dismissal ---');
  await page.goto(`${baseUrl}/`);
  await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });
  await page.click('#btn-menu-start');
  await page.waitForTimeout(300);

  console.log('--- Step 2: Settings Button Geometry & Placement Audit ---');
  const btnGear = await page.waitForSelector('#btn-settings-toggle', { state: 'visible' });
  const btnBox = await btnGear.boundingBox();
  if (!btnBox) throw new Error('#btn-settings-toggle bounding box is null');

  console.log(`Settings Button Box: width=${btnBox.width}px, height=${btnBox.height}px, x=${btnBox.x}, y=${btnBox.y}`);
  if (btnBox.width < 44 || btnBox.height < 44) {
    throw new Error(`Settings gear button must be at least 44x44px for accessibility. Got ${btnBox.width}x${btnBox.height}`);
  }
  if (btnBox.y < 800 || btnBox.x < 1300) {
    throw new Error(`Settings gear button should be docked in the bottom-right corner. Got x=${btnBox.x}, y=${btnBox.y}`);
  }
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'settings_button_hud_verified.png') });

  console.log('--- Step 3: Open Settings Modal ---');
  await page.click('#btn-settings-toggle');
  await page.waitForSelector('#modal-settings:not(.hidden)', { timeout: 3000 });

  const isModalVisible = await page.$eval('#modal-settings', (el) => !el.classList.contains('hidden'));
  if (!isModalVisible) throw new Error('#modal-settings did not open upon clicking #btn-settings-toggle');

  console.log('--- Step 4: Multi-Bus Audio Controls & Dynamic Badges ---');
  // Master Volume
  await page.evaluate(() => {
    const slider = document.getElementById('setting-volume');
    slider.value = '0.65';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const masterBadge = await page.$eval('#volume-val', (el) => el.textContent?.trim());
  if (masterBadge !== '65%') throw new Error(`Master volume badge mismatch: expected 65%, got ${masterBadge}`);

  // SFX Volume
  await page.evaluate(() => {
    const slider = document.getElementById('setting-sfx-volume');
    slider.value = '0.40';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const sfxBadge = await page.$eval('#sfx-val', (el) => el.textContent?.trim());
  if (sfxBadge !== '40%') throw new Error(`SFX volume badge mismatch: expected 40%, got ${sfxBadge}`);

  // Ambient Volume
  await page.evaluate(() => {
    const slider = document.getElementById('setting-ambient-volume');
    slider.value = '0.50';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const ambientBadge = await page.$eval('#ambient-val', (el) => el.textContent?.trim());
  if (ambientBadge !== '50%') throw new Error(`Ambient volume badge mismatch: expected 50%, got ${ambientBadge}`);

  // Drone Toggle
  const droneBtn = await page.waitForSelector('#btn-drone');
  const wasDroneActive = await droneBtn.evaluate((el) => el.classList.contains('active'));
  await droneBtn.click();
  await page.waitForTimeout(100);
  const isDroneActiveNow = await droneBtn.evaluate((el) => el.classList.contains('active'));
  if (wasDroneActive === isDroneActiveNow) throw new Error('Continuous drone button did not toggle active state');

  console.log('--- Step 5: Visuals & Optics Controls ---');
  // Subtitles toggle
  await page.evaluate(() => {
    const subToggle = document.getElementById('setting-subtitles');
    subToggle.checked = false;
    subToggle.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const subtitleOpacity = await page.$eval('#observation-subtitle', (el) => el.style.opacity);
  if (subtitleOpacity !== '0') throw new Error(`Subtitle element should have opacity 0 when subtitles disabled. Got: ${subtitleOpacity}`);

  // Scanlines toggle
  await page.evaluate(() => {
    const scan = document.getElementById('setting-scanlines');
    scan.checked = false;
    scan.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const scanlineDisplayOff = await page.$eval('.crt-scanline-mesh', (el) => el.style.display);
  if (scanlineDisplayOff !== 'none') throw new Error(`Scanline display off mismatch: got ${scanlineDisplayOff}`);

  await page.evaluate(() => {
    const scan = document.getElementById('setting-scanlines');
    scan.checked = true;
    scan.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const scanlineDisplayOn = await page.$eval('.crt-scanline-mesh', (el) => el.style.display);
  if (scanlineDisplayOn !== 'block') throw new Error(`Scanline display on mismatch: got ${scanlineDisplayOn}`);

  console.log('--- Step 6: Patient Intake Record Card & Manual Save ---');
  const roomName = await page.$eval('#save-room-name', (el) => el.textContent?.trim());
  const stageName = await page.$eval('#save-stage-name', (el) => el.textContent?.trim());
  const crystalsCount = await page.$eval('#save-crystals-count', (el) => el.textContent?.trim());
  console.log(`Intake Card: Sector="${roomName}", Stage="${stageName}", Crystals="${crystalsCount}"`);
  if (!roomName || !stageName || !crystalsCount) throw new Error('Save metadata card fields are missing or empty');

  // Click Manual Save
  await page.click('#btn-save-game');
  await page.waitForTimeout(100);

  const savedRaw = await page.evaluate(() => localStorage.getItem('the_vault_save_record'));
  if (!savedRaw) throw new Error('localStorage is missing "the_vault_save_record" after manual save');

  const parsedSave = JSON.parse(savedRaw);
  if (parsedSave.version !== 1 || !parsedSave.timestamp || !parsedSave.currentStage) {
    throw new Error(`Persisted save record failed schema v1 validation: ${savedRaw}`);
  }
  console.log('PASSED: Manual save successfully serialized to localStorage.');

  console.log('--- Step 7: Screenshot Capture of Settings Modal ---');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'settings_modal_verified.png') });

  // Close settings modal via escape
  await page.keyboard.press('Escape');
  await page.waitForSelector('#modal-settings', { state: 'hidden', timeout: 3000 });

  console.log('--- Step 8: Auto-Save Trigger & State Persistence Across Reload ---');
  await page.evaluate(() => {
    const app = window.__VAULT_APP__;
    app.gameState.addItem('prop_envelope');
    app.gameState.addItem('prop_brass_shunt');
    app.eventBus.emit('puzzle:crystal_collected', { crystalId: 'crystal_01_quartz' });
  });
  await page.waitForTimeout(600);

  const autoSavedRaw = await page.evaluate(() => localStorage.getItem('the_vault_save_record'));
  const autoSaved = JSON.parse(autoSavedRaw);
  if (!autoSaved.inventory.includes('prop_envelope') || !autoSaved.collectedCrystals.includes('crystal_01_quartz')) {
    throw new Error(`Auto-save did not persist updated inventory/crystals: ${autoSavedRaw}`);
  }
  console.log('PASSED: Auto-save correctly captured inventory and crystal progression.');

  // Reload page
  console.log('--- Reloading page to test GameState hydration ---');
  await page.reload();
  await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });
  await page.click('#btn-menu-start');
  await page.waitForTimeout(300);

  const rehydratedState = await page.evaluate(() => {
    const app = window.__VAULT_APP__;
    return {
      hasEnvelope: app.gameState.hasItem('prop_envelope'),
      hasShunt: app.gameState.hasItem('prop_brass_shunt'),
      crystals: app.gameState.getCollectedCrystals(),
      stage: app.gameState.getStage()
    };
  });

  console.log('Rehydrated State from Storage:', rehydratedState);
  if (!rehydratedState.hasEnvelope || !rehydratedState.hasShunt) {
    throw new Error(`Hydration failed: inventory items missing after reload: ${JSON.stringify(rehydratedState)}`);
  }
  if (!rehydratedState.crystals.includes('crystal_01_quartz')) {
    throw new Error(`Hydration failed: crystal_01_quartz missing after reload: ${JSON.stringify(rehydratedState)}`);
  }
  if (rehydratedState.stage !== 'ACT_2_CRYSTAL_1_RECOVERED') {
    throw new Error(`Hydration failed: stage expected ACT_2_CRYSTAL_1_RECOVERED, got ${rehydratedState.stage}`);
  }
  console.log('PASSED: Persistence across reload confirmed.');

  console.log('--- Step 9: Purge Record / Baseline Reset ---');
  await page.click('#btn-settings-toggle');
  await page.waitForSelector('#modal-settings:not(.hidden)', { timeout: 3000 });

  const rehydratedStageLabel = await page.$eval('#save-stage-name', (el) => el.textContent?.trim());
  const rehydratedCrystalsLabel = await page.$eval('#save-crystals-count', (el) => el.textContent?.trim());
  if (!rehydratedStageLabel.includes('ACT 2') || !rehydratedCrystalsLabel.includes('1 / 5')) {
    throw new Error(`Save card did not reflect rehydrated state: stage="${rehydratedStageLabel}", crystals="${rehydratedCrystalsLabel}"`);
  }

  page.once('dialog', async (dialog) => {
    console.log(`Handled confirm dialog: "${dialog.message()}"`);
    await dialog.accept();
  });

  await page.click('#btn-reset-save');
  await page.waitForTimeout(200);

  const purgedStorage = await page.evaluate(() => localStorage.getItem('the_vault_save_record'));
  if (purgedStorage !== null) {
    throw new Error(`Purge record failed: localStorage still contains record: ${purgedStorage}`);
  }

  const purgedState = await page.evaluate(() => {
    const app = window.__VAULT_APP__;
    return {
      stage: app.gameState.getStage(),
      inventory: app.gameState.getInventory(),
      crystals: app.gameState.getCollectedCrystals()
    };
  });

  console.log('Purged State:', purgedState);
  if (purgedState.stage !== 'ACT_1_HUB_AWAKEN' || purgedState.inventory.length > 0 || purgedState.crystals.length > 0) {
    throw new Error(`State was not reset to baseline: ${JSON.stringify(purgedState)}`);
  }
  console.log('PASSED: Purge / reset atomicity verified.');
  console.log('SUCCESS: All Save System & Audio Settings test assertions passed.');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  console.log(`Save System & Audio Settings test server running on ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--autoplay-policy=no-user-gesture-required']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
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
