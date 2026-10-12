import { chromium } from 'playwright';
import { startTestServer } from './helpers/testServer.js';

(async () => {
  const { baseUrl, close } = await startTestServer();
  console.log(`UI & Accessibility test server running on ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--autoplay-policy=no-user-gesture-required'
    ]
  });

  const page = await browser.newPage();
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

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
    console.error(`[Page Error] ${err.message}`);
  });

  try {
    console.log('--- Step 1: Application Bootstrap ---');
    await page.goto(`${baseUrl}/?test=true`);
    await page.waitForSelector('#btn-menu-start', { state: 'visible' });
    await page.click('#btn-menu-start');
    await page.waitForTimeout(600);

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
    // Open frequency console via object click
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('input:object_clicked', { objectId: 'prop_vault' });
    });
    await page.waitForTimeout(100);
    
    
    await page.waitForTimeout(100);

    const isFreqVisible = await page.$eval('#screen-tektronix-crt', (el) => !el.classList.contains('hidden'));
    if (!isFreqVisible) {
      throw new Error('Tektronix CRT was not made visible');
    }

    // Insert brass shunt to unlock the controls
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('inventory:add', { itemId: 'prop_brass_shunt' });
    });
    await page.waitForTimeout(100);
    await page.click('#slot-shunt');
    await page.waitForTimeout(100);

    // Test non-resonant frequency
    await page.evaluate(() => {
      const slider = document.getElementById('dial-frequency');
      slider.value = '440';
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(100);

    const isSwitchEnabledNonRes = await page.$eval('#btn-knife-switch', (btn) => !btn.disabled);
    if (isSwitchEnabledNonRes) {
      throw new Error('Knife switch should be DISABLED at 440 Hz');
    }

    // Test resonant frequency
    await page.evaluate(() => {
      const slider = document.getElementById('dial-frequency');
      slider.value = '528';
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      const phase = document.getElementById('dial-phase');
      phase.value = '180';
      phase.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(100);

    const isSwitchEnabledRes = await page.$eval('#btn-knife-switch', (btn) => !btn.disabled);
    if (!isSwitchEnabledRes) {
      throw new Error('Knife switch should be ENABLED at 528 Hz / 180 deg');
    }

    // Click switch
    await page.click('#btn-knife-switch');
    await page.waitForTimeout(800);

    const isUIHidden = await page.$eval('#screen-tektronix-crt', (el) => el.classList.contains('hidden'));
    if (!isUIHidden) {
      throw new Error('Throw switch click must hide console and disable button');
    }
    console.log('PASSED: Frequency console 528 Hz resonance activation and switch throw behavior verified.');

    console.log('--- Step 4: Settings Modal Bi-Directional Binding & Accessibility ---');
    // Open settings modal
    await page.click('#btn-settings-toggle');
    await page.waitForTimeout(100);

    const modalVisible = await page.$eval('#modal-settings', (el) => !el.classList.contains('hidden'));
    if (!modalVisible) {
      throw new Error('Settings modal did not open on button click');
    }

    // Test Volume Slider
    const receivedVolume = await page.evaluate(() => {
      return new Promise((resolve) => {
        const app = window.__VAULT_APP__;
        const unsub = app.eventBus.on('settings:updated', ({ masterVolume }) => {
          unsub();
          resolve(masterVolume);
        });
        const slider = document.getElementById('setting-volume');
        slider.value = '0.75';
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });

    if (receivedVolume !== 0.75) {
      throw new Error(`Settings volume event payload mismatch: expected 0.75, got ${receivedVolume}`);
    }

    // Test CRT Scanline Mesh Toggle
    const scanlineDisabled = await page.evaluate(() => {
      const scanCheckbox = document.getElementById('setting-scanlines');
      scanCheckbox.checked = false;
      scanCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
      const scanMesh = document.querySelector('.crt-scanline-mesh');
      return scanMesh ? scanMesh.style.display : null;
    });

    if (scanlineDisabled !== 'none') {
      throw new Error(`Scanline display was expected to be 'none', got '${scanlineDisabled}'`);
    }

    const scanlineRestored = await page.evaluate(() => {
      const scanCheckbox = document.getElementById('setting-scanlines');
      scanCheckbox.checked = true;
      scanCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
      const scanMesh = document.querySelector('.crt-scanline-mesh');
      return scanMesh ? scanMesh.style.display : null;
    });

    if (scanlineRestored !== 'block') {
      throw new Error(`Scanline display was expected to be 'block', got '${scanlineRestored}'`);
    }

    // Test ESC Key to Dismiss Modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    const modalClosedOnEsc = await page.$eval('#modal-settings', (el) => el.classList.contains('hidden'));
    if (!modalClosedOnEsc) {
      throw new Error('Settings modal did not dismiss upon pressing Escape key');
    }
    console.log('PASSED: Settings modal volume, scanlines, and Escape key dismissal verified.');

    console.log('--- Step 5: Terminal Blackout View & Cinematic Header ---');
    // Switch to terminal blackout view
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.screenManager.switchView('terminal_blackout');
    });
    await page.waitForTimeout(100);

    const blackoutState = await page.evaluate(() => {
      const blackoutEl = document.getElementById('view-terminal-blackout');
      const restartBtn = document.getElementById('btn-terminal-restart');
      return {
        isBlackoutVisible: blackoutEl && !blackoutEl.classList.contains('hidden'),
        hasRestartBtn: !!restartBtn
      };
    });

    if (!blackoutState.isBlackoutVisible || !blackoutState.hasRestartBtn) {
      throw new Error('Terminal blackout view or restart button is not visible');
    }

    // Cinematic Header check
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

    console.log('--- Step 6: Check Console Errors ---');
    if (consoleErrors.length > 0) {
      throw new Error(`Test failed with console errors: ${consoleErrors.join(' | ')}`);
    }
    console.log('PASSED: 0 console errors during UI and accessibility test suite.');

    console.log('SUCCESS: All UI and accessibility test assertions passed.');
  } catch (err) {
    console.error('TEST FAILED:', err);
    process.exitCode = 1;
    } finally {
    if (browser) await browser.close();
    close();
  }
})();
