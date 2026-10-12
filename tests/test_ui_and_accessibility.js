import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { startTestServer } from './helpers/testServer.js';

export async function runSuite(page, baseUrl) {
  console.log('--- Step 1: Application Bootstrap ---');
  await page.goto(`${baseUrl}/?test=true`);
  await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });
  await page.click('#btn-menu-start');
  await page.waitForTimeout(200);

  console.log('--- Step 2: Reticle Hover Prompts Matrix ---');
  const hoverTests = [
    { label: '[CLICK TO INSPECT VAULT & CRT]', expected: '[CLICK TO INSPECT VAULT & CRT]' },
    { label: '[CLICK TO LISTEN TO RECEIVER]', expected: '[CLICK TO LISTEN TO RECEIVER]' },
    { label: '[CLICK TO EXAMINE KEY]', expected: '[CLICK TO EXAMINE KEY]' },
    { label: '[ENTER: OBSERVATION CORRIDOR]', expected: '[ENTER: OBSERVATION CORRIDOR]' },
    { label: '[CLICK TO INSPECT EXIT BLASTDOOR]', expected: '[CLICK TO INSPECT EXIT BLASTDOOR]' }
  ];

  for (const test of hoverTests) {
    await page.evaluate((lbl) => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('input:object_hovered', { objectId: 'test_obj', label: lbl });
    }, test.label);

    const promptData = await page.$eval('#reticle-prompt', (el) => ({
      text: el.textContent,
      opacity: el.style.opacity
    }));

    if (promptData.text !== test.expected) {
      throw new Error(`Reticle text mismatch: got "${promptData.text}", expected "${test.expected}"`);
    }
    if (promptData.opacity !== '1') {
      throw new Error(`Reticle prompt opacity is not 1 when hovered: ${promptData.opacity}`);
    }
  }

  // Unhover test
  await page.evaluate(() => {
    const app = window.__VAULT_APP__;
    app.eventBus.emit('input:object_hovered', { objectId: null, label: '' });
  });
  const unhoverOpacity = await page.$eval('#reticle-prompt', (el) => el.style.opacity);
  if (unhoverOpacity !== '0') {
    throw new Error(`Reticle prompt opacity is not 0 when unhovered: ${unhoverOpacity}`);
  }
  console.log('PASSED: Reticle hover prompt matrix and opacity dynamics verified.');

  console.log('--- Step 3: Frequency Oscilloscope & Resonance Switch UI ---');
  await page.evaluate(() => {
    const app = window.__VAULT_APP__;
    app.gameState.addItem('prop_brass_shunt');
    app.eventBus.emit('input:object_clicked', { objectId: 'prop_vault' });
  });
  await page.waitForSelector('#screen-tektronix-crt:not(.hidden)', { timeout: 3000 });

  await page.click('#slot-shunt');

  await page.evaluate(() => {
    const slider = document.getElementById('dial-frequency');
    if (slider) {
      slider.value = '528';
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  const freqReadout = await page.$eval('#label-frequency', (el) => el.textContent?.trim());
  if (!freqReadout || !freqReadout.includes('528')) {
    throw new Error(`Frequency display mismatch: expected "528", got "${freqReadout}"`);
  }

  const switchDisabled = await page.$eval('#btn-knife-switch', (el) => el.hasAttribute('disabled'));
  if (switchDisabled) {
    throw new Error('Resonance switch is disabled at 528 Hz target frequency!');
  }

  await page.click('#btn-knife-switch');
  await page.waitForSelector('#screen-tektronix-crt', { state: 'hidden', timeout: 3000 });

  const exitBlastdoorState = await page.evaluate(() => {
    const app = window.__VAULT_APP__;
    return app.gameState.getStage();
  });
  console.log(`State after switch throw: ${exitBlastdoorState}`);
  if (exitBlastdoorState !== 'ACT_1_HUB_CORRIDOR_OPEN') {
    throw new Error(`Expected ACT_1_HUB_CORRIDOR_OPEN, got ${exitBlastdoorState}`);
  }
  console.log('PASSED: Frequency console 528 Hz resonance activation and switch throw behavior verified.');

  console.log('--- Step 4: Settings Modal Bi-Directional Binding & Accessibility ---');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);

  await page.click('#btn-settings-toggle');
  await page.waitForSelector('#modal-settings:not(.hidden)', { timeout: 3000 });

  await page.evaluate(() => {
    const vol = document.getElementById('setting-volume');
    vol.value = '0.75';
    vol.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const volVal = await page.$eval('#volume-val', (el) => el.textContent?.trim());
  if (volVal !== '75%') {
    throw new Error(`Volume readout mismatch: expected 75%, got "${volVal}"`);
  }

  await page.evaluate(() => {
    const scan = document.getElementById('setting-scanlines');
    scan.checked = false;
    scan.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const scanlinesDisplay = await page.$eval('.crt-scanline-mesh', (el) => el.style.display);
  if (scanlinesDisplay !== 'none') {
    throw new Error('Scanlines overlay should be display: none when unchecked.');
  }

  await page.keyboard.press('Escape');
  await page.waitForSelector('#modal-settings', { state: 'hidden', timeout: 3000 });
  console.log('PASSED: Settings modal volume, scanlines, and Escape key dismissal verified.');

  console.log('--- Step 5: Terminal Blackout View & Cinematic Header ---');
  await page.evaluate(() => {
    const app = window.__VAULT_APP__;
    app.screenManager.switchView('terminal_blackout');
  });

  const blackoutVisible = await page.$eval('#view-terminal-blackout', (el) => !el.classList.contains('hidden'));
  if (!blackoutVisible) {
    throw new Error('Terminal blackout view did not reveal on switchView.');
  }

  const headerState = await page.evaluate(() => {
    const header = document.getElementById('cinematic-header');
    const act = document.getElementById('act-tag-text');
    const title = document.getElementById('film-title-text');
    return {
      hasHeader: !!header,
      opacity: header ? header.style.opacity : null,
      hasActText: !!act && act.textContent.length > 0,
      hasTitleText: !!title && title.textContent.length > 0
    };
  });

  if (!headerState.hasHeader || !headerState.hasActText || !headerState.hasTitleText) {
    throw new Error(`Cinematic header state invalid: ${JSON.stringify(headerState)}`);
  }
  console.log('PASSED: Terminal blackout view and cinematic header verified.');
  console.log('SUCCESS: All UI and accessibility test assertions passed.');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  console.log(`UI & Accessibility test server running on ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--autoplay-policy=no-user-gesture-required']
  });
  const page = await browser.newPage();
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
