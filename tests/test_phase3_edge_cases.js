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
    console.log('--- Suite 1: App Bootstrap & Navigation ---');
    await page.goto(`${baseUrl}/?test=true`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#canvas-container canvas', { state: 'visible', timeout: 8000 });
    await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });

    await page.click('#btn-menu-start');
    await page.waitForSelector('#view-main-menu', { state: 'hidden', timeout: 5000 });

    // -------------------------------------------------------------
    // ACT V: THE ARCHIVE & MICROFICHE VIEWER EDGE CASES
    // -------------------------------------------------------------
    console.log('--- Suite 2: Act V Microfiche Viewer Edge Cases ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'archive' });
    });

    await page.waitForFunction(() => {
      const app = window.__VAULT_APP__;
      return app.scenarioRegistry.getCurrentScenario().id === 'archive';
    }, { timeout: 4000 });

    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_microfiche_reader');
    });

    await page.waitForSelector('#screen-microfiche-viewer:not(.hidden)', { timeout: 3000 });

    console.log('--- Test 2.1: Unmounted Film Interlock ---');
    await page.click('#btn-pneumatic-launch');
    const unmountedWarning = await page.textContent('#observation-subtitle');
    if (!unmountedWarning.includes('Mount and inspect microfilm directory')) {
      throw new Error(`Expected unmounted film warning, received: ${unmountedWarning}`);
    }
    console.log('PASSED: Unmounted film launch cleanly rejected.');

    console.log('--- Test 2.2: Focal Band Boundary Precision ---');
    await page.click('#btn-mount-film');

    // Test just below lower boundary (0.84 < 0.85)
    await page.$eval('#slider-optic-focus', el => {
      el.value = '84';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const label84 = await page.textContent('#label-optic-focus');
    const filter84 = await page.$eval('#microfilm-document', el => el.style.filter);
    if (!label84.includes('DEFOCUSED') || filter84.includes('blur(0px)')) {
      throw new Error(`Expected 84% focus to be defocused, got label: ${label84}, filter: ${filter84}`);
    }

    // Test just above upper boundary (0.91 > 0.90)
    await page.$eval('#slider-optic-focus', el => {
      el.value = '91';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const label91 = await page.textContent('#label-optic-focus');
    const filter91 = await page.$eval('#microfilm-document', el => el.style.filter);
    if (!label91.includes('DEFOCUSED') || filter91.includes('blur(0px)')) {
      throw new Error(`Expected 91% focus to be defocused, got label: ${label91}, filter: ${filter91}`);
    }

    // Test inside optimal focal band (0.87 in [0.85, 0.90])
    await page.$eval('#slider-optic-focus', el => {
      el.value = '87';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const label87 = await page.textContent('#label-optic-focus');
    const filter87 = await page.$eval('#microfilm-document', el => el.style.filter);
    if (!label87.includes('RESOLVED') || !filter87.includes('blur(0px)')) {
      throw new Error(`Expected 87% focus to be resolved with 0px blur, got label: ${label87}, filter: ${filter87}`);
    }
    console.log('PASSED: Optical focal band boundaries accurately enforced.');

    console.log('--- Test 2.3: Sector Mismatch & Station Formatting ---');
    // Test sector BETA with station 07 -> should reject
    await page.click('#btn-sec-beta');
    await page.$eval('#input-dispatch-station', el => {
      el.value = '7';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.click('#btn-pneumatic-launch');

    const betaRejectSub = await page.textContent('#observation-subtitle');
    if (!betaRejectSub.includes('rejected: Pneumatic routing error')) {
      throw new Error(`Expected pneumatic routing error for BETA-07, received: ${betaRejectSub}`);
    }

    const hopperError = await page.textContent('#hopper-status');
    if (!hopperError.includes('DISPATCH FAILED')) {
      throw new Error(`Expected hopper status failure, got: ${hopperError}`);
    }
    console.log('PASSED: Sector mismatch rejected with clear routing error.');

    console.log('--- Test 2.4: Solve & ESC Spam Resilience ---');
    // Align to target GAMMA-07
    await page.click('#btn-sec-gamma');
    await page.$eval('#input-dispatch-station', el => {
      el.value = '07';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.click('#btn-pneumatic-launch');

    // Rapidly spam Escape 5 times during auto-close delay
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Escape');
    }

    await page.waitForSelector('#screen-microfiche-viewer', { state: 'hidden', timeout: 3000 });

    const archiveBeforePickup = await page.evaluate(() => {
      const sc = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return {
        hasCrystal: window.__VAULT_APP__.gameState.hasCrystal('crystal_04_obsidian'),
        drawerSlidOpen: sc.drawer104Mesh && sc.drawer104Mesh.position.z > 0.4,
        crystalVisible: sc.crystalMesh ? sc.crystalMesh.visible : false
      };
    });
    if (archiveBeforePickup.hasCrystal) {
      throw new Error('Expected crystal_04_obsidian NOT in GameState before physical 3D pickup.');
    }
    if (!archiveBeforePickup.drawerSlidOpen) {
      throw new Error('Expected 3D drawer 104 to slide open.');
    }
    if (!archiveBeforePickup.crystalVisible) {
      throw new Error('Expected 3D obsidian crystal to be visible inside drawer.');
    }

    // Physically click 3D crystal to pick it up
    await page.evaluate(() => {
      window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().onObjectClick('crystal_04_obsidian');
    });

    const archiveHasCrystal = await page.evaluate(() => {
      return window.__VAULT_APP__.gameState.hasCrystal('crystal_04_obsidian');
    });
    if (!archiveHasCrystal) {
      throw new Error('Expected crystal_04_obsidian in GameState after 3D pickup.');
    }
    console.log('PASSED: Solve confirmed, ESC spam handled cleanly, 3D drawer extended, crystal retrieved.');

    console.log('--- Test 2.5: Archive Scene Re-Entry & Re-Click Idempotency ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'sleep_ward' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'sleep_ward';
    });

    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'archive' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'archive';
    });

    const archiveReEntry = await page.evaluate(() => {
      const sc = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return {
        drawerOpen: sc.drawer104Mesh && sc.drawer104Mesh.position.z > 0.4,
        crystalVisible: sc.crystalMesh ? sc.crystalMesh.visible : false
      };
    });

    if (!archiveReEntry.drawerOpen || archiveReEntry.crystalVisible) {
      throw new Error(`Archive re-entry state invalid: ${JSON.stringify(archiveReEntry)}`);
    }

    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_microfiche_reader');
    });

    const microficheModal = await page.$('#screen-microfiche-viewer');
    if (microficheModal) {
      const isHidden = await page.$eval('#screen-microfiche-viewer', el => el.classList.contains('hidden'));
      if (!isHidden) {
        throw new Error('Expected microfiche modal to remain hidden after solve.');
      }
    }
    console.log('PASSED: Archive scene re-entry and click idempotency verified.');

    // -------------------------------------------------------------
    // ACT VI: THE DIRECTOR'S OFFICE & WIRETAP TAPE DECK EDGE CASES
    // -------------------------------------------------------------
    console.log('--- Suite 3: Act VI Wiretap Tape Deck Edge Cases ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'directors_office' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'directors_office';
    });

    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_tape_deck');
    });

    await page.waitForSelector('#screen-wiretap-tapedeck:not(.hidden)', { timeout: 3000 });

    console.log('--- Test 3.1: Reel Transport Controls (Stop / Rewind) ---');
    await page.click('#btn-tape-play');
    const isPlaying = await page.$eval('#spool-left', el => el.classList.contains('spinning-normal'));
    if (!isPlaying) {
      throw new Error('Expected spools to spin on PLAY.');
    }

    await page.click('#btn-tape-stop');
    const isStopped = await page.$eval('#spool-left', el => !el.classList.contains('spinning-normal') && !el.classList.contains('spinning-half') && !el.classList.contains('spinning-rewind'));
    if (!isStopped) {
      throw new Error('Expected spools to halt on STOP.');
    }

    await page.click('#btn-tape-rewind');
    const isRewinding = await page.$eval('#spool-left', el => el.classList.contains('spinning-rewind'));
    if (!isRewinding) {
      throw new Error('Expected spools to have spinning-rewind class on REWIND.');
    }
    console.log('PASSED: Tape transport play, stop, and rewind states verified.');

    console.log('--- Test 3.2: Near-Miss Clock Interlock Rejection ---');
    // Start at 12:00. Set minute to 03 -> 12:03 (Hour wrong, Minute right).
    await page.click('#btn-min-plus');
    await page.click('#btn-min-plus');
    await page.click('#btn-min-plus');

    const clock1203 = await page.textContent('#label-clock-time');
    if (clock1203 !== '12:03') {
      throw new Error(`Expected clock time 12:03, got: ${clock1203}`);
    }

    const is1203Locked = await page.$eval('#btn-unlatch-safe', el => el.disabled);
    if (!is1203Locked) {
      throw new Error('Expected safe button to remain disabled at 12:03.');
    }

    // Now test Hour 11, Minute 02 (Hour right, Minute wrong).
    await page.click('#btn-min-minus'); // Minute back to 02
    await page.click('#btn-hour-minus'); // Hour to 11 -> 11:02

    const clock1102 = await page.textContent('#label-clock-time');
    if (clock1102 !== '11:02') {
      throw new Error(`Expected clock time 11:02, got: ${clock1102}`);
    }

    const is1102Locked = await page.$eval('#btn-unlatch-safe', el => el.disabled);
    if (!is1102Locked) {
      throw new Error('Expected safe button to remain disabled at 11:02.');
    }
    console.log('PASSED: Near-miss times 12:03 and 11:02 cleanly rejected.');

    console.log('--- Test 3.3: Rotary Phone Buffer & Reset ---');
    // Dial digits 5, 6, 7
    await page.click('#btn-dial-5');
    await page.click('#btn-dial-6');
    await page.click('#btn-dial-7');

    const dialed567 = await page.textContent('#label-dialed-number');
    if (!dialed567.includes('567')) {
      throw new Error(`Expected dialed buffer to contain 567, got: ${dialed567}`);
    }

    await page.click('#btn-dial-clear');
    const dialedCleared = await page.textContent('#label-dialed-number');
    if (dialedCleared !== '----') {
      throw new Error(`Expected cleared buffer '----', got: ${dialedCleared}`);
    }
    console.log('PASSED: Rotary phone dialing buffer and reset verified.');

    console.log('--- Test 3.4: Rotary Override Solve & ESC Spam ---');
    // Dial 1, 1, 0, 3 on rotary phone
    await page.click('#btn-dial-1');
    await page.click('#btn-dial-1');
    await page.click('#btn-dial-0');
    await page.click('#btn-dial-3');

    const unlatchSubtitle = await page.textContent('#observation-subtitle');
    if (!unlatchSubtitle.includes('Executive escapement aligns at 11:03')) {
      throw new Error(`Expected solve subtitle from rotary override, received: ${unlatchSubtitle}`);
    }

    // Rapidly spam Escape 5 times during auto-close delay
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Escape');
    }

    await page.waitForSelector('#screen-wiretap-tapedeck', { state: 'hidden', timeout: 3000 });

    const directorBeforePickup = await page.evaluate(() => {
      const sc = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return {
        hasCrystal: window.__VAULT_APP__.gameState.hasCrystal('crystal_05_celadon'),
        secretDrawerOpen: sc.secretDrawerMesh && sc.secretDrawerMesh.position.z > 0.4,
        crystalVisible: sc.crystalMesh ? sc.crystalMesh.visible : false
      };
    });
    if (directorBeforePickup.hasCrystal) {
      throw new Error('Expected crystal_05_celadon NOT in GameState before physical 3D pickup.');
    }
    if (!directorBeforePickup.secretDrawerOpen) {
      throw new Error('Expected secret mahogany drawer to be unlatched.');
    }
    if (!directorBeforePickup.crystalVisible) {
      throw new Error('Expected 3D celadon crystal to be visible inside secret drawer.');
    }

    // Physically click 3D crystal to pick it up
    await page.evaluate(() => {
      window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().onObjectClick('crystal_05_celadon');
    });

    const directorHasCrystal = await page.evaluate(() => {
      return window.__VAULT_APP__.gameState.hasCrystal('crystal_05_celadon');
    });
    if (!directorHasCrystal) {
      throw new Error('Expected crystal_05_celadon in GameState after 3D pickup.');
    }
    console.log('PASSED: Rotary override solve confirmed, ESC spam handled cleanly, secret drawer opened, crystal retrieved.');

    console.log('--- Test 3.5: Director\'s Office Re-Entry & Re-Click Idempotency ---');
    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'room_04' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'room_04';
    });

    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'directors_office' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'directors_office';
    });

    const directorReEntry = await page.evaluate(() => {
      const sc = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return {
        drawerUnlocked: sc.drawerUnlocked,
        drawerExtended: sc.secretDrawerMesh && sc.secretDrawerMesh.position.z > 0.4,
        crystalVisible: sc.crystalMesh ? sc.crystalMesh.visible : false
      };
    });

    if (!directorReEntry.drawerUnlocked || !directorReEntry.drawerExtended || directorReEntry.crystalVisible) {
      throw new Error(`Director's Office re-entry state invalid: ${JSON.stringify(directorReEntry)}`);
    }

    await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      app.scenarioRegistry.getCurrentScenario().onObjectClick('prop_tape_deck');
    });

    const tapeDeckModal = await page.$('#screen-wiretap-tapedeck');
    if (tapeDeckModal) {
      const isHidden = await page.$eval('#screen-wiretap-tapedeck', el => el.classList.contains('hidden'));
      if (!isHidden) {
        throw new Error('Expected tape deck modal to remain hidden after solve.');
      }
    }
    console.log('PASSED: Director\'s Office scene re-entry and click idempotency verified.');

    if (consoleErrors.length > 0) {
      throw new Error(`Encountered unhandled browser console errors:\n${consoleErrors.join('\n')}`);
    }

    console.log('ALL PHASE 3 EDGE CASES AND REGRESSION TESTS PASSED!');
  } finally {
    page.off('console', errorHandler);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  console.log(`Phase 3 Edge-Cases Test server running on ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });
  const page = await browser.newPage();
  let exitCode = 0;
  try {
    await runSuite(page, baseUrl);
  } catch (err) {
    console.error('TEST RUN FAILURE:', err);
    exitCode = 1;
  } finally {
    await browser.close();
    close();
    process.exit(exitCode);
  }
}
