import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { startTestServer } from './helpers/testServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

(async () => {
  const { baseUrl, close } = await startTestServer();
  console.log(`Capture server running on ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/?test=true`);
    await page.waitForSelector('#btn-menu-start', { state: 'visible' });
    await page.click('#btn-menu-start');
    await page.waitForTimeout(1000);

    // 1. Overview of Room 04 showing clean screen with NO floating audio pills and NO frequency slider
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_room04_clean_overview.png') });
    console.log('Saved screenshot_room04_clean_overview.png');

    // 2. Settings modal showing audio toggles neatly tucked inside
    await page.click('#btn-settings-toggle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_room04_settings_audio_pills.png') });
    console.log('Saved screenshot_room04_settings_audio_pills.png');
    await page.click('#btn-close-settings');
    await page.waitForTimeout(500);

    // 3. Vault focused view revealing the frequency calibration console
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_vault' });
    });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_room04_vault_focus_freq_console.png') });
    console.log('Saved screenshot_room04_vault_focus_freq_console.png');

    // 4. View facing back wall forward observation corridor door (0 Z-fighting)
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'corridor' });
    });
    await page.waitForTimeout(1400);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_room04_corridor_door_centered.png') });
    console.log('Saved screenshot_room04_corridor_door_centered.png');

    // 5. View facing left wall exit blastdoor
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'door' });
    });
    await page.waitForTimeout(1400);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_room04_left_blastdoor.png') });
    console.log('Saved screenshot_room04_left_blastdoor.png');

    console.log('All screenshots captured successfully.');
  } catch (err) {
    console.error('Screenshot capture failed:', err);
    process.exitCode = 1;
    } finally {
    if (browser) await browser.close();
    close();
  }
})();
