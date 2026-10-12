import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { startTestServer } from './helpers/testServer.js';

export async function runSuite(page, baseUrl) {
  const consoleErrors = [];
  const errorHandler = (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('404') && (text.includes('.mp3') || text.includes('.glb') || text.includes('Failed to load resource'))) {
        return;
      }
      consoleErrors.push(text);
      console.error(`[Browser Error] ${text}`);
    }
  };
  page.on('console', errorHandler);

  try {
    console.log('--- Step 1: Bootstrap & Teleport to Act V (The Archive) ---');
    await page.goto(`${baseUrl}/?test=true`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#canvas-container canvas', { state: 'visible', timeout: 8000 });
    await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });

    await page.click('#btn-menu-start');
    await page.waitForSelector('#view-main-menu', { state: 'hidden', timeout: 5000 });

    // Teleport directly to Archive chamber
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'archive' });
    });

    await page.waitForFunction(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return current && current.id === 'archive';
    }, { timeout: 5000 });
    console.log('PASSED: Entered Archive chamber.');

    console.log('--- Step 2: Act V - Open Microfiche Viewer Screen ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_microfiche_reader');
    });

    await page.waitForSelector('#screen-microfiche-viewer:not(.hidden)', { timeout: 4000 });
    console.log('PASSED: Microfiche Viewer modal opened.');

    console.log('--- Step 3: Act V - Test Film Mount & Optical Focus ---');
    // Launch before mount should fail
    await page.click('#btn-pneumatic-launch');
    const launchBeforeMountSub = await page.textContent('#observation-subtitle');
    if (!launchBeforeMountSub.includes('Mount and inspect microfilm directory')) {
      throw new Error(`Expected missing film warning, got: ${launchBeforeMountSub}`);
    }

    // Mount film
    await page.click('#btn-mount-film');
    const filmMountedText = await page.textContent('#btn-mount-film');
    if (!filmMountedText.includes('MICROFILM REEL MOUNTED')) {
      throw new Error(`Expected film mounted button state, got: ${filmMountedText}`);
    }

    // Adjust focus slider to 88%
    await page.$eval('#slider-optic-focus', el => {
      el.value = '88';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const focusLabel = await page.textContent('#label-optic-focus');
    if (!focusLabel.includes('88% [RESOLVED]')) {
      throw new Error(`Expected resolved focus readout, got: ${focusLabel}`);
    }

    const docFilter = await page.$eval('#microfilm-document', el => el.style.filter);
    if (!docFilter.includes('blur(0px)')) {
      throw new Error(`Expected 0px blur at optimal 88% focus, got: ${docFilter}`);
    }
    console.log('PASSED: Optical focus resolved text sharply.');

    console.log('--- Step 4: Act V - Test Pneumatic Dispatch Rejection & Delivery ---');
    // Reject on ALPHA-01
    await page.click('#btn-pneumatic-launch');
    const rejectSub = await page.textContent('#observation-subtitle');
    if (!rejectSub.includes('rejected: Pneumatic routing error')) {
      throw new Error(`Expected dispatch rejection subtitle, got: ${rejectSub}`);
    }

    // Configure target: GAMMA-07
    await page.click('#btn-sec-gamma');
    await page.$eval('#input-dispatch-station', el => {
      el.value = '07';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const coordText = await page.textContent('#label-dispatch-coordinate');
    if (coordText !== 'GAMMA-07') {
      throw new Error(`Expected coordinate GAMMA-07, got: ${coordText}`);
    }

    // Launch dispatch
    await page.click('#btn-pneumatic-launch');

    const successDispatchSub = await page.textContent('#observation-subtitle');
    if (!successDispatchSub.includes('Pneumatic vacuum engaged') || !successDispatchSub.includes('Pitch-Black Obsidian crystal')) {
      throw new Error(`Expected success dispatch subtitle, got: ${successDispatchSub}`);
    }

    await page.waitForSelector('#screen-microfiche-viewer', { state: 'hidden', timeout: 4000 });

    const archiveHasCrystal = await page.evaluate(() => {
      return window.__VAULT_APP__.gameState.hasCrystal('crystal_04_obsidian');
    });
    if (!archiveHasCrystal) {
      throw new Error('Expected crystal_04_obsidian in GameState.');
    }

    const drawerSlidOpen = await page.evaluate(() => {
      const sc = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return sc.drawer104Mesh && sc.drawer104Mesh.position.z > 0.4;
    });
    if (!drawerSlidOpen) {
      throw new Error('Expected 3D drawer 104 mesh to slide outward.');
    }
    console.log('PASSED: Act V solved, Crystal 04 secured, drawer opened.');

    console.log('--- Step 5: Act V - Click Idempotency Guard ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_microfiche_reader');
    });

    const isReaderModalHidden = await page.$eval('#screen-microfiche-viewer', el => el.classList.contains('hidden'));
    if (!isReaderModalHidden) {
      throw new Error('Expected microfiche modal to remain hidden after solve.');
    }
    console.log('PASSED: Microfiche Reader click idempotency confirmed.');

    // -----------------------------------------------------------------
    // ACT VI: THE DIRECTOR'S OFFICE & WIRETAP TAPE DECK
    // -----------------------------------------------------------------
    console.log('--- Step 6: Teleport to Act VI (The Director\'s Office) ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'directors_office' });
    });

    await page.waitForFunction(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return current && current.id === 'directors_office';
    }, { timeout: 5000 });
    console.log('PASSED: Entered Director\'s Office.');

    console.log('--- Step 7: Act VI - Open Wiretap Tape Deck Screen ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_tape_deck');
    });

    await page.waitForSelector('#screen-wiretap-tapedeck:not(.hidden)', { timeout: 4000 });
    console.log('PASSED: Wiretap Tape Deck modal opened.');

    console.log('--- Step 8: Act VI - Playback Speed & Transcript Verification ---');
    await page.click('#btn-tape-play');

    const spoolSpinningNorm = await page.$eval('#spool-left', el => el.classList.contains('spinning-normal'));
    if (!spoolSpinningNorm) {
      throw new Error('Expected spools to have spinning-normal class.');
    }

    const normTranscript = await page.textContent('#tape-transcript');
    if (!normTranscript.includes('1.0x PLAYBACK') || !normTranscript.includes('switch to half-speed')) {
      throw new Error(`Expected normal speed chatter transcript, got: ${normTranscript}`);
    }

    // Toggle half-speed
    await page.click('#btn-speed-half');

    const spoolSpinningHalf = await page.$eval('#spool-left', el => el.classList.contains('spinning-half'));
    if (!spoolSpinningHalf) {
      throw new Error('Expected spools to have spinning-half class.');
    }

    const halfTranscript = await page.textContent('#tape-transcript');
    if (!halfTranscript.includes('0.5x DECODED') || !halfTranscript.includes('11:03')) {
      throw new Error(`Expected decoded 11:03 transcript, got: ${halfTranscript}`);
    }
    console.log('PASSED: Half-speed audio decoding verified with 11:03 timestamp.');

    console.log('--- Step 9: Act VI - Clock Escapement & Secret Drawer Unlatch ---');
    // Start clock at 12:00. Adjust hour -1 -> 11:00. Adjust min +3 -> 11:03.
    await page.click('#btn-hour-minus');
    await page.click('#btn-min-plus');
    await page.click('#btn-min-plus');
    await page.click('#btn-min-plus');

    const clockText = await page.textContent('#label-clock-time');
    if (clockText !== '11:03') {
      throw new Error(`Expected clock time 11:03, got: ${clockText}`);
    }

    const unlatchSubtitle = await page.textContent('#observation-subtitle');
    if (!unlatchSubtitle.includes('Executive escapement aligns at 11:03') || !unlatchSubtitle.includes('Glowing Celadon Core crystal')) {
      throw new Error(`Expected escapement solve subtitle, received: ${unlatchSubtitle}`);
    }

    await page.waitForSelector('#screen-wiretap-tapedeck', { state: 'hidden', timeout: 4000 });

    const directorHasCrystal = await page.evaluate(() => {
      return window.__VAULT_APP__.gameState.hasCrystal('crystal_05_celadon');
    });
    if (!directorHasCrystal) {
      throw new Error('Expected crystal_05_celadon in GameState.');
    }

    const secretDrawerOpen = await page.evaluate(() => {
      const sc = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return sc.secretDrawerMesh && sc.secretDrawerMesh.position.z > 0.4;
    });
    if (!secretDrawerOpen) {
      throw new Error('Expected secret mahogany drawer to be unlatched.');
    }
    console.log('PASSED: Act VI solved, Celadon Core secured, secret drawer opened.');

    console.log('--- Step 10: Act VI - Click Idempotency Guard ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_tape_deck');
    });

    const isWiretapModalHidden = await page.$eval('#screen-wiretap-tapedeck', el => el.classList.contains('hidden'));
    if (!isWiretapModalHidden) {
      throw new Error('Expected wiretap modal to remain hidden after solve.');
    }
    console.log('PASSED: Wiretap tape deck click idempotency confirmed.');

    if (consoleErrors.length > 0) {
      throw new Error(`Encountered unhandled browser console errors:\n${consoleErrors.join('\n')}`);
    }

    console.log('ALL PHASE 3 (ACTS V & VI) E2E VERIFICATIONS PASSED!');
  } finally {
    page.off('console', errorHandler);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  console.log(`Pair 3 E2E test server running on ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });
  const page = await browser.newPage();
  let exitCode = 0;
  try {
    await runSuite(page, baseUrl);
  } catch (err) {
    console.error('FAILED: Pair 3 E2E Test execution failed:', err);
    exitCode = 1;
  } finally {
    await browser.close();
    close();
    process.exit(exitCode);
  }
}
