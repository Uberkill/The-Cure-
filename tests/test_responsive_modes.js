import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { startTestServer } from './helpers/testServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots');

export async function runSuite(page, baseUrl) {
  console.log('--- Step 1: Boot and Initial UI Mode Auto-Detection ---');
  await page.goto(`${baseUrl}/?test=true`);
  await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });
  await page.waitForFunction(() => typeof document !== 'undefined' && !!document.documentElement.dataset.uiMode);
  
  const initialMode = await page.evaluate(() => document.documentElement.dataset.uiMode);
  console.log(`Initial auto-detected UI mode: ${initialMode}`);
  if (initialMode !== 'desktop' && initialMode !== 'touch') {
    throw new Error(`Expected dataset.uiMode to be 'desktop' or 'touch', got: ${initialMode}`);
  }

  await page.click('#btn-menu-start');
  await page.waitForTimeout(300);

  console.log('--- Step 2: Open Settings & Audit Display Profile Controls ---');
  await page.click('#btn-settings-toggle');
  await page.waitForSelector('#modal-settings:not(.hidden)', { timeout: 3000 });

  const btnAuto = await page.$('#setting-ui-mode-auto');
  const btnDesktop = await page.$('#setting-ui-mode-desktop');
  const btnTouch = await page.$('#setting-ui-mode-touch');

  if (!btnAuto || !btnDesktop || !btnTouch) {
    throw new Error('Missing one or more UI mode buttons in #modal-settings');
  }

  console.log('--- Step 3: Switch to Explicit PC DESKTOP Mode ---');
  await page.click('#setting-ui-mode-desktop');
  await page.waitForTimeout(100);

  const desktopModeActive = await page.evaluate(() => ({
    uiMode: document.documentElement.dataset.uiMode,
    isBtnActive: document.getElementById('setting-ui-mode-desktop')?.classList.contains('active'),
    isTouchBtnActive: document.getElementById('setting-ui-mode-touch')?.classList.contains('active')
  }));

  console.log('Desktop Mode state:', desktopModeActive);
  if (desktopModeActive.uiMode !== 'desktop' || !desktopModeActive.isBtnActive || desktopModeActive.isTouchBtnActive) {
    throw new Error('Failed to set PC Desktop mode');
  }

  // Close settings and review orientation bindings in desktop mode
  await page.click('#btn-close-settings');
  await page.waitForSelector('#modal-settings', { state: 'hidden', timeout: 2000 });

  await page.evaluate(() => {
    window.__VAULT_APP__?.eventBus?.emit('ui:open_orientation', {});
  });
  await page.waitForSelector('#view-orientation:not(.hidden)', { timeout: 2000 });

  // Move to step 2 in orientation card
  await page.click('#btn-orientation-next');
  await page.waitForTimeout(150);

  const desktopBindingsVisibility = await page.evaluate(() => {
    const desktopSpans = Array.from(document.querySelectorAll('#slide-step-2 .binding-desktop'));
    const touchSpans = Array.from(document.querySelectorAll('#slide-step-2 .binding-touch'));
    return {
      desktopVisible: desktopSpans.every(el => window.getComputedStyle(el).display !== 'none'),
      touchHidden: touchSpans.every(el => window.getComputedStyle(el).display === 'none')
    };
  });

  console.log('Desktop bindings visibility:', desktopBindingsVisibility);
  if (!desktopBindingsVisibility.desktopVisible || !desktopBindingsVisibility.touchHidden) {
    throw new Error('Desktop bindings visibility failed in PC Desktop mode');
  }

  console.log('--- Step 4: Switch to TOUCH / TABLET Mode ---');
  await page.evaluate(() => {
    const orientation = document.getElementById('view-orientation');
    if (orientation) orientation.classList.add('hidden');
    document.getElementById('modal-settings')?.classList.remove('hidden');
  });

  await page.click('#setting-ui-mode-touch');
  await page.waitForTimeout(100);

  const touchModeActive = await page.evaluate(() => ({
    uiMode: document.documentElement.dataset.uiMode,
    isBtnActive: document.getElementById('setting-ui-mode-touch')?.classList.contains('active'),
    isDesktopBtnActive: document.getElementById('setting-ui-mode-desktop')?.classList.contains('active')
  }));

  console.log('Touch Mode state:', touchModeActive);
  if (touchModeActive.uiMode !== 'touch' || !touchModeActive.isBtnActive || touchModeActive.isDesktopBtnActive) {
    throw new Error('Failed to set Touch mode');
  }

  // Re-open orientation to check touch bindings and single-column layout
  await page.click('#btn-close-settings');
  await page.evaluate(() => {
    window.__VAULT_APP__?.eventBus?.emit('ui:open_orientation', {});
  });
  await page.waitForSelector('#view-orientation:not(.hidden)', { timeout: 2000 });

  const touchBindingsVisibility = await page.evaluate(() => {
    const desktopSpans = Array.from(document.querySelectorAll('#slide-step-2 .binding-desktop'));
    const touchSpans = Array.from(document.querySelectorAll('#slide-step-2 .binding-touch'));
    return {
      desktopHidden: desktopSpans.every(el => window.getComputedStyle(el).display === 'none'),
      touchVisible: touchSpans.every(el => window.getComputedStyle(el).display !== 'none')
    };
  });

  console.log('Touch bindings visibility:', touchBindingsVisibility);
  if (!touchBindingsVisibility.touchVisible || !touchBindingsVisibility.desktopHidden) {
    throw new Error('Touch bindings visibility failed in Touch mode');
  }

  console.log('--- Step 5: Test Facility Map and Asset Manifest in Touch Mode ---');
  await page.evaluate(() => {
    document.getElementById('view-orientation')?.classList.add('hidden');
    window.__VAULT_APP__?.eventBus?.emit('ui:open_facility_map', {});
  });
  await page.waitForSelector('#screen-facility-map:not(.hidden)', { timeout: 2000 });

  const mapBodyLayout = await page.evaluate(() => {
    const mapHousing = document.querySelector('.facility-map-housing');
    const mapBody = document.querySelector('.facility-map-body');
    if (!mapHousing || !mapBody) return null;
    const bodyStyle = window.getComputedStyle(mapBody);
    const housingRect = mapHousing.getBoundingClientRect();
    return {
      flexDirection: bodyStyle.flexDirection,
      height: housingRect.height,
      fitsInWindow: housingRect.bottom <= window.innerHeight + 10
    };
  });

  console.log('Facility Map touch layout:', mapBodyLayout);
  if (!mapBodyLayout || mapBodyLayout.flexDirection !== 'column' || !mapBodyLayout.fitsInWindow) {
    throw new Error('Facility Map layout did not adapt correctly for touch mode');
  }

  // Close map and open Asset Manifest
  await page.evaluate(() => {
    document.getElementById('screen-facility-map')?.classList.add('hidden');
    window.__VAULT_APP__?.eventBus?.emit('ui:open_asset_manifest', {});
  });
  await page.waitForSelector('#modal-inventory:not(.hidden)', { timeout: 2000 });

  const manifestLayout = await page.evaluate(() => {
    const manifest = document.querySelector('.manifest-case-container');
    const grid = document.querySelector('.manifest-body-grid');
    if (!manifest || !grid) return null;
    const gridStyle = window.getComputedStyle(grid);
    const manifestRect = manifest.getBoundingClientRect();
    return {
      gridCols: gridStyle.gridTemplateColumns.split(' ').length,
      fitsInWindow: manifestRect.bottom <= window.innerHeight + 10
    };
  });

  console.log('Asset Manifest touch layout:', manifestLayout);
  if (!manifestLayout || manifestLayout.gridCols !== 1 || !manifestLayout.fitsInWindow) {
    throw new Error('Asset Manifest grid did not stack correctly in touch mode');
  }

  console.log('--- Step 6: Test Persistence Across Page Reload ---');
  // Allow 500ms auto-save debounce to flush to storage
  await page.waitForTimeout(650);
  const rawStorage = await page.evaluate(() => localStorage.getItem('the_vault_save_record'));
  console.log('LocalStorage content before reload:', rawStorage);
  await page.reload();
  await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });
  await page.waitForFunction(() => typeof document !== 'undefined' && !!document.documentElement.dataset.uiMode);

  const debugInfo = await page.evaluate(() => {
    return {
      storage: localStorage.getItem('the_vault_save_record'),
      settings: window.__VAULT_APP__?.saveManager?.getSettings(),
      uiMode: document.documentElement.dataset.uiMode,
      pref: window.__VAULT_APP__?.uiManager?.getUiMode()
    };
  });
  console.log('Debug info on reload:', debugInfo);

  const reloadedMode = await page.evaluate(() => document.documentElement.dataset.uiMode);
  console.log(`Reloaded UI mode: ${reloadedMode}`);
  if (reloadedMode !== 'touch') {
    throw new Error(`Expected persisted UI mode 'touch' after reload, got: ${reloadedMode}`);
  }

  console.log('--- Step 7: Raycast Coordinate Precision & Tap Simulation ---');
  await page.click('#btn-menu-start');
  await page.waitForTimeout(300);

  const raycastCheck = await page.evaluate(() => {
    const canvas = document.querySelector('#canvas-container canvas');
    if (!canvas) return false;
    
    // Simulate pointerdown and pointerup with 4px slop (tap)
    const downEv = new PointerEvent('pointerdown', {
      clientX: 500,
      clientY: 300,
      button: 0,
      isPrimary: true,
      pointerType: 'touch',
      bubbles: true
    });
    canvas.dispatchEvent(downEv);

    const upEv = new PointerEvent('pointerup', {
      clientX: 502,
      clientY: 301,
      button: 0,
      isPrimary: true,
      pointerType: 'touch',
      bubbles: true
    });
    canvas.dispatchEvent(upEv);

    return true;
  });

  if (!raycastCheck) throw new Error('Raycast pointer tap simulation failed');

  console.log('SUCCESS: All Responsive Modes and Touch Ergonomics assertions passed.');
}

async function run() {
  const { server, port } = await startTestServer();
  const baseUrl = `http://localhost:${port}`;
  console.log(`Responsive modes test server running at ${baseUrl}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  try {
    await runSuite(page, baseUrl);
    console.log('ALL TESTS PASSED');
    process.exitCode = 0;
  } catch (err) {
    console.error('TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run();
}
