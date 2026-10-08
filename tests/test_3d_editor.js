import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4188;
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
  const cleanUrl = req.url.split('?')[0];
  let filePath = path.join(DIST_DIR, cleanUrl === '/' ? 'index.html' : cleanUrl);
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
  console.log(`3D Editor test server running on http://localhost:${PORT}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });
  const page = await browser.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('404') && (text.includes('room_04_theme.mp3') || text.includes('prop_telephone.glb') || text.includes('Failed to load resource'))) {
        return;
      }
      consoleErrors.push(text);
      console.error(`[Browser Error] ${text}`);
    }
  });

  try {
    console.log('--- Step 1: Loading application with ?editor=true ---');
    await page.goto(`http://localhost:${PORT}/?editor=true`);
    await page.waitForSelector('#dev-3d-editor-panel', { state: 'visible', timeout: 8000 });

    if (await page.isVisible('#btn-begin-intake')) {
      await page.click('#btn-begin-intake');
      await page.waitForTimeout(500);
    }

    const isVisible = await page.$eval('#dev-3d-editor-panel', (el) => el.style.display !== 'none');
    console.log(`Editor Panel visible: ${isVisible}`);
    if (!isVisible) throw new Error('Editor panel was not visible');

    console.log('--- Step 2: Verifying Asset Select Options ---');
    const assetOptions = await page.$$eval('#dev-asset-select option', (opts) => opts.map(o => o.value).filter(Boolean));
    console.log('Found assets in editor:', assetOptions);
    const requiredAssets = ['prop_desk', 'prop_chair', 'prop_vault', 'prop_telephone', 'prop_key', 'prop_painting'];
    for (const req of requiredAssets) {
      if (!assetOptions.includes(req)) {
        throw new Error(`Expected asset '${req}' in dropdown, but not found.`);
      }
    }
    console.log('PASSED: All required room assets are present in dropdown.');

    console.log('--- Step 3: Selecting prop_telephone and checking coordinate fields ---');
    await page.selectOption('#dev-asset-select', 'prop_telephone');
    await page.waitForTimeout(300);

    const coords = await page.evaluate(() => {
      const x = document.querySelector('#dev-pos-x').value;
      const y = document.querySelector('#dev-pos-y').value;
      const z = document.querySelector('#dev-pos-z').value;
      return { x, y, z };
    });
    console.log('Telephone initial coordinates in inputs:', coords);
    if (coords.x !== '0.750' || coords.y !== '0.850' || coords.z !== '0.220') {
      throw new Error(`Unexpected coordinates for prop_telephone: ${JSON.stringify(coords)}`);
    }
    console.log('PASSED: Coordinates correctly populated into inputs.');

    console.log('--- Step 4: Modifying input and verifying real-time 3D sync ---');
    await page.fill('#dev-pos-x', '0.950');
    await page.dispatchEvent('#dev-pos-x', 'input');
    await page.waitForTimeout(100);

    const updatedX = await page.evaluate(() => {
      const obj = window.__VAULT_APP__.sceneManager.scene.getObjectByName('prop_telephone');
      return obj ? obj.position.x : null;
    });
    console.log('Telephone updated X position in Three.js:', updatedX);
    if (Math.abs(updatedX - 0.950) > 0.001) {
      throw new Error(`Three.js position did not update from input! Value: ${updatedX}`);
    }
    console.log('PASSED: Real-time bi-directional input to Three.js coordinate sync verified.');

    console.log('--- Step 5: Verifying Live Telemetry Box & HUD Status ---');
    await page.waitForTimeout(200);
    const telemetryData = await page.evaluate(() => {
      const camPos = document.getElementById('dev-telem-cam-pos')?.textContent;
      const camTgt = document.getElementById('dev-telem-cam-tgt')?.textContent;
      const activeObj = document.getElementById('dev-telem-active')?.textContent;
      const hudStatus = document.getElementById('telemetry-status')?.textContent;
      return { camPos, camTgt, activeObj, hudStatus };
    });
    console.log('Telemetry Box values:', telemetryData);
    if (!telemetryData.camPos || !telemetryData.camTgt || telemetryData.activeObj !== 'prop_telephone') {
      throw new Error(`Telemetry values incorrect: ${JSON.stringify(telemetryData)}`);
    }
    if (!telemetryData.hudStatus || (!telemetryData.hudStatus.includes('[DevTransformGizmo]') && !telemetryData.hudStatus.includes('DEVELOPER MODE'))) {
      throw new Error(`HUD status did not reflect active Developer Mode: ${telemetryData.hudStatus}`);
    }
    console.log('PASSED: Live Telemetry Box and HUD status verified.');

    console.log('--- Step 6: Verifying Composite Assembly Group Selection ---');
    await page.selectOption('#dev-asset-select', 'group_wall_back');
    await page.waitForTimeout(200);
    const assemblyInitialY = await page.evaluate(() => {
      const group = window.__VAULT_APP__.sceneManager.scene.getObjectByName('group_wall_back');
      return group ? group.position.y : null;
    });
    console.log('group_wall_back initial Y position:', assemblyInitialY);
    await page.fill('#dev-pos-y', '0.500');
    await page.dispatchEvent('#dev-pos-y', 'input');
    await page.waitForTimeout(100);

    const assemblyUpdatedY = await page.evaluate(() => {
      const group = window.__VAULT_APP__.sceneManager.scene.getObjectByName('group_wall_back');
      return group ? group.position.y : null;
    });
    console.log('group_wall_back updated Y position:', assemblyUpdatedY);
    if (Math.abs(assemblyUpdatedY - 0.500) > 0.001) {
      throw new Error(`Assembly group Y position failed to update: ${assemblyUpdatedY}`);
    }
    console.log('PASSED: Composite group assembly moves all nested objects together.');

    console.log('--- Step 7: Verifying HUD [DEV 3D] Button Toggle ---');
    await page.click('#btn-dev-3d-toggle');
    await page.waitForTimeout(200);
    const panelClosed = await page.$eval('#dev-3d-editor-panel', (el) => el.style.display === 'none');
    const hudStatusClosed = await page.$eval('#telemetry-status', (el) => el.textContent);
    console.log(`Panel closed after clicking HUD button: ${panelClosed}, HUD status: ${hudStatusClosed}`);
    if (!panelClosed || !hudStatusClosed.includes('DISABLED')) {
      throw new Error(`HUD button toggle did not close editor or report disabled: panelClosed=${panelClosed}, hud=${hudStatusClosed}`);
    }

    // Toggle back on via HUD button
    await page.click('#btn-dev-3d-toggle');
    await page.waitForTimeout(200);
    const panelReopened = await page.$eval('#dev-3d-editor-panel', (el) => el.style.display !== 'none');
    console.log(`Panel reopened after clicking HUD button: ${panelReopened}`);
    if (!panelReopened) throw new Error('HUD button toggle did not reopen editor');
    console.log('PASSED: HUD [DEV 3D] button toggles editor smoothly.');

    console.log('--- Step 8: Checking Console Errors ---');
    console.log(`Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      throw new Error(`Test encountered console errors: ${consoleErrors.join(', ')}`);
    }

    console.log('SUCCESS: All 3D Editor, telemetry, and transform gizmo tests passed with 0 errors!');
    await browser.close();
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Test Failed:', err);
    await browser.close();
    server.close();
    process.exit(1);
  }
});
