import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const PORT = 4205;
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
  console.log(`Save System & Audio Settings test server running on http://localhost:${PORT}`);
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--autoplay-policy=no-user-gesture-required'
    ]
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
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
    console.log('--- Step 1: Initial Launch & Splash Screen Dismissal ---');
    await page.goto(`http://localhost:${PORT}/`);
    await page.waitForSelector('#btn-menu-start', { state: 'visible' });
    await page.click('#btn-menu-start');
    await page.waitForTimeout(600);

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
    await page.waitForTimeout(200);

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
    await page.waitForTimeout(100);
    const modalClosed = await page.$eval('#modal-settings', (el) => el.classList.contains('hidden'));
    if (!modalClosed) throw new Error('Settings modal did not close on Escape key');

    console.log('--- Step 8: Auto-Save Trigger & State Persistence Across Reload ---');
    // Emulate player discovering item & advancing state
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.gameState.addItem('prop_envelope');
      app.gameState.addItem('prop_brass_shunt');
      app.eventBus.emit('puzzle:crystal_collected', { crystalId: 'crystal_01_quartz' });
    });
    await page.waitForTimeout(700);

    // Verify localStorage updated automatically via auto-save
    const autoSavedRaw = await page.evaluate(() => localStorage.getItem('the_vault_save_record'));
    const autoSaved = JSON.parse(autoSavedRaw);
    if (!autoSaved.inventory.includes('prop_envelope') || !autoSaved.collectedCrystals.includes('crystal_01_quartz')) {
      throw new Error(`Auto-save did not persist updated inventory/crystals: ${autoSavedRaw}`);
    }
    console.log('PASSED: Auto-save correctly captured inventory and crystal progression.');

    // Reload page
    console.log('--- Reloading page to test GameState hydration ---');
    await page.reload();
    await page.waitForSelector('#btn-menu-start', { state: 'visible' });
    await page.click('#btn-menu-start');
    await page.waitForTimeout(600);

    // Verify state was rehydrated from localStorage
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
    // Open settings modal again
    await page.click('#btn-settings-toggle');
    await page.waitForTimeout(200);

    // Verify intake card displays updated values
    const rehydratedStageLabel = await page.$eval('#save-stage-name', (el) => el.textContent?.trim());
    const rehydratedCrystalsLabel = await page.$eval('#save-crystals-count', (el) => el.textContent?.trim());
    if (!rehydratedStageLabel.includes('ACT 2') || !rehydratedCrystalsLabel.includes('1 / 5')) {
      throw new Error(`Save card did not reflect rehydrated state: stage="${rehydratedStageLabel}", crystals="${rehydratedCrystalsLabel}"`);
    }

    // Set dialog handler to accept confirm dialog
    page.once('dialog', async (dialog) => {
      console.log(`Handled confirm dialog: "${dialog.message()}"`);
      await dialog.accept();
    });

    // Click Purge / Reset
    await page.click('#btn-reset-save');
    await page.waitForTimeout(300);

    // Verify localStorage was cleared
    const purgedStorage = await page.evaluate(() => localStorage.getItem('the_vault_save_record'));
    if (purgedStorage !== null) {
      throw new Error(`Purge record failed: localStorage still contains record: ${purgedStorage}`);
    }

    // Verify GameState returned to baseline
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

    if (consoleErrors.length > 0) {
      throw new Error(`Test failed with console errors: ${consoleErrors.join(' | ')}`);
    }
    console.log('SUCCESS: All Save System & Audio Settings test assertions passed.');
  } catch (err) {
    console.error('TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
