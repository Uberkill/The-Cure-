import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { startTestServer } from './helpers/testServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACTS_DIR = process.env.ARTIFACTS_DIR || path.join(__dirname, '..', 'screenshots');

async function testGameOrientationFlow() {
  const { baseUrl, close } = await startTestServer();
  console.log(`Orientation Flow Test Server running on ${baseUrl}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--autoplay-policy=no-user-gesture-required']
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('Failed to load resource') && !text.includes('404')) {
        consoleErrors.push(text);
      }
    }
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  let exitCode = 0;
  try {
    console.log('--- Step 1: Launch Game Main Menu ---');
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    const mainMenuVisible = await page.isVisible('#view-main-menu');
    if (!mainMenuVisible) throw new Error('Main menu should be visible at launch');
    console.log('Main menu visible: true');

    // Screenshot initial main menu
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'game_orientation_00_menu.png') });

    console.log('--- Step 2: Click Begin Assessment -> Open Orientation Form 104-O ---');
    await page.click('#btn-menu-start');
    await page.waitForSelector('#view-orientation:not(.hidden)', { state: 'visible', timeout: 5000 });
    console.log('Orientation modal visible: true');

    const slide1Active = await page.isVisible('#slide-step-1');
    if (!slide1Active) throw new Error('Slide 1 should be active initially');
    console.log('Slide 1 (Subject Intake) active: true');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'game_orientation_01_intake.png') });

    console.log('--- Step 3: Test Escape Key Return to Main Menu ---');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const backOnMainMenu = await page.isVisible('#view-main-menu');
    if (!backOnMainMenu) throw new Error('Pressing Escape should return to Main Menu');
    const btnStartDisabled = await page.isDisabled('#btn-menu-start');
    if (btnStartDisabled) throw new Error('Start button should not be disabled after returning to menu');
    console.log('Main menu cleanly restored without lockout: true');

    console.log('--- Step 4: Re-open Orientation and Advance Through All 3 Steps ---');
    await page.click('#btn-menu-start');
    await page.waitForSelector('#view-orientation:not(.hidden)', { state: 'visible', timeout: 5000 });

    // Step 1 -> Step 2
    await page.click('#btn-orientation-next');
    await page.waitForTimeout(300);
    const slide2Active = await page.isVisible('#slide-step-2');
    if (!slide2Active) throw new Error('Slide 2 should be active after next');
    const controlCardsCount = await page.locator('.control-card').count();
    console.log('Control cards rendered on Slide 2:', controlCardsCount);
    if (controlCardsCount !== 6) throw new Error(`Expected 6 control cards, found ${controlCardsCount}`);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'game_orientation_02_controls.png') });

    // Step 2 -> Step 3
    await page.click('#btn-orientation-next');
    await page.waitForTimeout(300);
    const slide3Active = await page.isVisible('#slide-step-3');
    if (!slide3Active) throw new Error('Slide 3 should be active after next');
    console.log('Slide 3 (Egress Protocol) active: true');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'game_orientation_03_egress.png') });

    const nextBtnText = await page.textContent('#btn-orientation-next');
    console.log('Final step button text:', nextBtnText?.trim());
    if (!nextBtnText?.includes('Acknowledge')) {
      throw new Error('Button on Step 3 should read Acknowledge & Awaken');
    }

    console.log('--- Step 5: Acknowledge & Awaken -> Enter 3D Chamber ---');
    await page.click('#btn-orientation-next');
    await page.waitForTimeout(1500);

    const orientationClosed = await page.evaluate(() => {
      return document.getElementById('view-orientation')?.classList.contains('hidden');
    });
    if (!orientationClosed) throw new Error('Orientation modal should be hidden after awaken');

    const canvasBlurred = await page.evaluate(() => {
      return document.querySelector('canvas')?.classList.contains('canvas-blur');
    });
    console.log('Canvas unblurred on entering chamber:', !canvasBlurred);
    if (canvasBlurred) throw new Error('Canvas should be unblurred upon entering chamber');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'game_orientation_04_chamber.png') });

    console.log('--- Step 6: Test Re-access from Settings Modal ---');
    await page.click('#btn-settings-toggle');
    await page.waitForTimeout(300);

    const settingsVisible = await page.isVisible('#modal-settings');
    if (!settingsVisible) throw new Error('Settings modal should be visible');

    await page.click('#btn-review-orientation');
    await page.waitForTimeout(300);

    const orientationReopened = await page.isVisible('#view-orientation');
    if (!orientationReopened) throw new Error('Orientation should re-open from settings');
    console.log('Orientation re-opened from Settings: true');

    // Dismiss orientation review via Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const orientationClosedAgain = await page.evaluate(() => {
      return document.getElementById('view-orientation')?.classList.contains('hidden');
    });
    if (!orientationClosedAgain) throw new Error('Orientation should be closed after Escape');
    console.log('Orientation review closed cleanly: true');

    // Close settings modal
    if (await page.isVisible('#modal-settings')) {
      await page.click('#btn-close-settings');
      await page.waitForTimeout(200);
    }

    console.log('--- Step 7: Test M and I Hotkeys ---');
    await page.keyboard.press('m');
    await page.waitForTimeout(300);
    const facilityMapOpen = await page.isVisible('#screen-facility-map');
    console.log('Facility Map opened via [M] hotkey:', facilityMapOpen);
    if (!facilityMapOpen) throw new Error('Facility Map should open via [M]');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const facilityMapClosed = await page.evaluate(() => {
      return document.getElementById('screen-facility-map')?.classList.contains('hidden');
    });
    console.log('Facility Map closed via [ESC]:', facilityMapClosed);
    if (!facilityMapClosed) throw new Error('Facility Map should close via [ESC]');

    console.log('--- Step 8: Console Error Audit ---');
    if (consoleErrors.length > 0) {
      throw new Error('Console errors encountered: ' + JSON.stringify(consoleErrors));
    }
    console.log('PASSED: Zero console errors.');

    console.log('SUCCESS: All Game Orientation Flow assertions passed cleanly!');
  } catch (err) {
    console.error('TEST FAILED:', err);
    exitCode = 1;
  } finally {
    await browser.close();
    close();
    if (exitCode !== 0) {
      process.exit(exitCode);
    }
  }
}

testGameOrientationFlow();
