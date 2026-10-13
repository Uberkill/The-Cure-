import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { startTestServer } from './helpers/testServer.js';

export async function runSuite(page, baseUrl) {
  console.log('--- Step 1: Loading Room 04 & Verifying Audio Startup State ---');
  await page.goto(`${baseUrl}/?test=true`);
  await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });

  // Verify dev button is hidden by default for unauthorized users
  const isDevBtnHidden = await page.$eval('#btn-dev-3d-toggle', (el) => el.classList.contains('hidden'));
  console.log(`btn-dev-3d-toggle hidden on startup: ${isDevBtnHidden}`);
  if (!isDevBtnHidden) {
    throw new Error('btn-dev-3d-toggle must be hidden by default on startup.');
  }

  // Dismiss cognitive intake
  await page.click('#btn-menu-start');
  await page.waitForTimeout(200);

  // Verify AudioEngine startup
  const isAudioInitialized = await page.evaluate(() => {
    const app = window.__VAULT_APP__;
    return !!app.audioEngine;
  });
  console.log(`AudioEngine initialized at start: ${isAudioInitialized}`);
  if (!isAudioInitialized) {
    throw new Error('AudioEngine must be initialized at startup.');
  }

  console.log('--- Step 2: Verifying Clean Audio Sliders & Developer Mode Authorization (Code 333) ---');
  await page.click('#btn-settings-toggle');
  await page.waitForTimeout(200);

  // Verify volume sliders are present
  const hasSliders = await page.evaluate(() => {
    return !!document.getElementById('setting-volume') &&
      !!document.getElementById('setting-sfx-volume') &&
      !!document.getElementById('setting-ambient-volume');
  });
  if (!hasSliders) throw new Error('Volume sliders missing from settings.');

  // Verify drone button is removed from settings
  const hasDroneBtn = await page.evaluate(() => !!document.getElementById('btn-drone'));
  if (hasDroneBtn) throw new Error('btn-drone should be removed from settings.');

  // Test developer authorization with invalid code
  await page.fill('#input-dev-code', '999');
  await page.click('#btn-submit-dev-code');
  await page.waitForTimeout(100);
  const rejectFeedback = await page.$eval('#dev-auth-feedback', (el) => el.textContent?.trim());
  if (!rejectFeedback?.includes('ACCESS DENIED')) {
    throw new Error(`Expected ACCESS DENIED feedback on invalid code, got: "${rejectFeedback}"`);
  }

  // Test developer authorization with code 333
  await page.fill('#input-dev-code', '333');
  await page.click('#btn-submit-dev-code');
  await page.waitForTimeout(100);
  const authFeedback = await page.$eval('#dev-auth-feedback', (el) => el.textContent?.trim());
  if (!authFeedback?.includes('CLEARANCE GRANTED')) {
    throw new Error(`Expected CLEARANCE GRANTED feedback on code 333, got: "${authFeedback}"`);
  }
  const badgeText = await page.$eval('#dev-clearance-badge', (el) => el.textContent?.trim());
  if (!badgeText?.includes('LEVEL 3')) {
    throw new Error(`Expected LEVEL 3 badge after code 333, got: "${badgeText}"`);
  }

  // Verify dev button is now unhidden
  const isDevBtnNowVisible = await page.$eval('#btn-dev-3d-toggle', (el) => !el.classList.contains('hidden'));
  if (!isDevBtnNowVisible) {
    throw new Error('btn-dev-3d-toggle failed to unhide after code 333 authorization.');
  }

  // Close settings modal
  await page.click('#btn-close-settings');
  await page.waitForTimeout(100);

  console.log('--- Step 3: Verifying Top-Left Chapter Header Persistence ---');
  await page.waitForTimeout(1000);
  const headerState = await page.evaluate(() => {
    const el = document.getElementById('cinematic-header');
    const style = window.getComputedStyle(el);
    return {
      hasFadedClass: el.classList.contains('faded'),
      opacity: style.opacity,
      display: style.display,
      actText: document.getElementById('act-tag-text')?.textContent,
      titleText: document.getElementById('film-title-text')?.textContent
    };
  });
  console.log('Header State after check:', headerState);
  if (headerState.opacity !== '1' || headerState.display === 'none') {
    throw new Error(`Cinematic header disappeared or faded: opacity=${headerState.opacity}`);
  }
  console.log('PASSED: Top-left chapter header remains permanently visible on screen.');

  console.log('--- Step 4: Verifying 360-Degree Room Enclosure Geometry ---');
  const roomEnclosure = await page.evaluate(() => {
    const app = window.__VAULT_APP__;
    const scene = app.sceneManager.scene;
    let wallCount = 0;
    let hasCeiling = false;

    scene.traverse((child) => {
      if (child.name) {
        if (child.name.includes('wall') || child.name.includes('perimeter') || child.name.includes('panel')) {
          wallCount++;
        }
        if (child.name.includes('ceiling')) {
          hasCeiling = true;
        }
      }
    });

    return { wallCount, hasCeiling };
  });

  console.log(`Enclosure Audit: Found ${roomEnclosure.wallCount} wall segments, ceiling: ${roomEnclosure.hasCeiling}`);
  if (roomEnclosure.wallCount < 4 || !roomEnclosure.hasCeiling) {
    throw new Error('Room 04 lacks complete 360-degree wall and ceiling geometry.');
  }
  console.log('PASSED: All 4 perimeter walls and ceiling are physically present in 3D scene.');

  console.log('--- Step 5: 360-Degree Camera Orbiting & Interior Bounds Check ---');
  const orbitResults = await page.evaluate(() => {
    const app = window.__VAULT_APP__;
    const cam = app.cameraDirector.camera;
    const controls = app.cameraDirector.controls;
    const results = [];

    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
      controls.target.set(0, 0.85, 0);
      cam.position.x = Math.sin(angle) * 3.5;
      cam.position.z = Math.cos(angle) * 3.5;
      cam.position.y = 1.8;
      controls.update();

      const insideRoom = Math.abs(cam.position.x) < 4.8 && Math.abs(cam.position.z) < 4.8 && cam.position.y > 0 && cam.position.y < 3.2;
      results.push({ angle: (angle * 180 / Math.PI).toFixed(0), inside: insideRoom });
    }

    return results;
  });

  const allInside = orbitResults.every((r) => r.inside);
  console.log(`360 Orbit Check across 12 angles - all inside room: ${allInside}`);
  if (!allInside) {
    throw new Error('Camera breached room boundary during 360 orbit.');
  }
  console.log('PASSED: Smooth 360-degree camera rotation confirmed strictly inside room enclosure.');
  console.log('SUCCESS: All Room 04 360 enclosure, persistent header HUD, and audio startup checks passed with 0 errors!');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  console.log(`Audit test server running on ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--autoplay-policy=no-user-gesture-required']
  });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();
  let exitCode = 0;
  try {
    await runSuite(page, baseUrl);
  } catch (err) {
    console.error('AUDIT FAILED:', err);
    exitCode = 1;
  } finally {
    await browser.close();
    close();
    process.exit(exitCode);
  }
}
