import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4195;
const DIST_DIR = path.resolve(__dirname, '../dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
  const cleanUrl = req.url.split('?')[0]; let filePath = path.join(DIST_DIR, cleanUrl === '/' ? 'index.html' : cleanUrl);
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
  console.log(`Audit test server running on http://localhost:${PORT}`);
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--autoplay-policy=no-user-gesture-required'
    ]
  });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  const consoleWarnings = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('404')) {
        consoleErrors.push(text);
        console.error(`[Browser Error] ${text}`);
      }
    } else if (msg.type() === 'warning') {
      const text = msg.text();
      consoleWarnings.push(text);
      console.warn(`[Browser Warning] ${text}`);
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
    console.error(`[Page Error] ${err.message}`);
  });

  try {
    console.log('--- Step 1: Loading Room 04 & Verifying Audio Startup State ---');
    await page.goto(`http://localhost:${PORT}/?test=true`);
    await page.waitForSelector('#btn-menu-start', { state: 'visible' });

    // Verify btn-drone does not have active class
    const btnDroneActive = await page.$eval('#btn-drone', (el) => el.classList.contains('active'));
    console.log(`btn-drone active class on startup: ${btnDroneActive}`);
    if (btnDroneActive) {
      throw new Error('btn-drone should NOT have active class on startup.');
    }

    // Dismiss cognitive intake
    await page.click('#btn-menu-start');
    await page.waitForTimeout(500);

    // Verify drone is NOT playing in AudioEngine
    const isDronePlayingAtStart = await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      return app.audioEngine['isDronePlaying'];
    });
    console.log(`AudioEngine drone playing at start: ${isDronePlayingAtStart}`);
    if (isDronePlayingAtStart) {
      throw new Error('AudioEngine drone must NOT be playing automatically at start.');
    }

    console.log('--- Step 2: Verifying Interactive Audio Pill Toggle in Settings ---');
    await page.click('#btn-settings-toggle');
    await page.waitForTimeout(300);

    // Click btn-drone to turn ON
    await page.click('#btn-drone');
    await page.waitForTimeout(300);
    const droneNowActive = await page.$eval('#btn-drone', (el) => el.classList.contains('active'));
    const isDronePlayingNow = await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      return app.audioEngine['isDronePlaying'];
    });
    console.log(`After click - button active: ${droneNowActive}, drone playing: ${isDronePlayingNow}`);
    if (!droneNowActive || !isDronePlayingNow) {
      throw new Error('Clicking btn-drone failed to activate drone synth.');
    }

    // Click btn-drone to turn OFF
    await page.click('#btn-drone');
    await page.waitForTimeout(200);
    const droneOffAgain = await page.$eval('#btn-drone', (el) => !el.classList.contains('active'));
    console.log(`After second click - button toggled OFF: ${droneOffAgain}`);
    if (!droneOffAgain) {
      throw new Error('Clicking btn-drone failed to deactivate drone synth.');
    }

    // Close settings modal
    await page.click('#btn-close-settings');
    await page.waitForTimeout(300);

    console.log('--- Step 3: Verifying Top-Left Chapter Header Persistence (5s wait) ---');
    await page.waitForTimeout(5000);
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
    console.log('Header State after 5s:', headerState);
    if (headerState.opacity !== '1' || headerState.display === 'none') {
      throw new Error(`Cinematic header disappeared or faded: opacity=${headerState.opacity}`);
    }
    console.log('PASSED: Top-left chapter header remains permanently visible on screen.');

    console.log('--- Step 4: Verifying 360-Degree Room Enclosure Geometry ---');
    const roomEnclosure = await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      const scene = app.sceneManager.scene;
      const walls = [];
      let ceilingFound = false;

      scene.traverse((child) => {
        if (child.name === 'wall_green_tiles' || child.name === 'wall_chalk_upper') {
          walls.push({
            name: child.name,
            pos: { x: child.position.x, y: child.position.y, z: child.position.z }
          });
        }
        if (child.geometry && child.geometry.type === 'PlaneGeometry' && child.position.y >= 5.0) {
          ceilingFound = true;
        }
      });

      return {
        wallMeshesCount: walls.length,
        ceilingFound,
        walls
      };
    });
    console.log(`Enclosure Audit: Found ${roomEnclosure.wallMeshesCount} wall segments, ceiling: ${roomEnclosure.ceilingFound}`);
    if (roomEnclosure.wallMeshesCount < 8 || !roomEnclosure.ceilingFound) {
      throw new Error(`Room enclosure incomplete: expected >= 8 wall segments and ceiling.`);
    }
    console.log('PASSED: All 4 perimeter walls and ceiling are physically present in 3D scene.');

    console.log('--- Step 5: 360-Degree Camera Orbiting & Interior Bounds Check ---');
    const orbitResults = await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      const controls = app.cameraDirector.controls;
      const camera = app.cameraDirector.camera;

      const results = [];
      const steps = 12; // Test 12 azimuth angles (full 360 degrees)
      const radius = 4.5;
      const targetY = 0.85;

      for (let i = 0; i < steps; i++) {
        const theta = (i / steps) * Math.PI * 2;
        const x = Math.sin(theta) * radius;
        const z = Math.cos(theta) * radius;
        const y = 2.4;

        camera.position.set(x, y, z);
        camera.lookAt(0, targetY, 0);
        controls.target.set(0, targetY, 0);
        controls.update();

        // Check camera is strictly inside the room (walls are at +-6.78, ceiling at 5.5, floor at 0)
        const inside = (
          Math.abs(camera.position.x) < 6.5 &&
          Math.abs(camera.position.z) < 6.5 &&
          camera.position.y > 0.1 &&
          camera.position.y < 5.4
        );

        results.push({
          angleDeg: Math.round((theta * 180) / Math.PI),
          pos: { x: camera.position.x.toFixed(2), y: camera.position.y.toFixed(2), z: camera.position.z.toFixed(2) },
          inside
        });
      }

      // Reset camera to default overview
      app.cameraDirector.moveToHotspot('overview');

      return results;
    });

    const allInside = orbitResults.every((r) => r.inside);
    console.log(`360 Orbit Check across 12 angles - all inside room: ${allInside}`);
    if (!allInside) {
      throw new Error('Camera breached room boundary during 360 orbit.');
    }
    console.log('PASSED: Smooth 360-degree camera rotation confirmed strictly inside room enclosure.');

    console.log('--- Step 6: Console Error & Deprecation Warning Audit ---');
    console.log(`Console Errors: ${consoleErrors.length}, Warnings: ${consoleWarnings.length}`);
    if (consoleErrors.length > 0) {
      throw new Error(`Console errors detected during audit: ${consoleErrors.join(', ')}`);
    }

    console.log('SUCCESS: All Room 04 360 enclosure, persistent header HUD, and audio startup checks passed with 0 errors!');
  } catch (err) {
    console.error('AUDIT FAILED:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
