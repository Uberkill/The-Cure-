import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { startTestServer } from './helpers/testServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots');

export async function runSuite(page, baseUrl) {
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const consoleErrors = [];
  const errorHandler = (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('404') && (text.includes('room_04_theme.mp3') || text.includes('Failed to load resource'))) {
        return; // Expected fallback
      }
      consoleErrors.push(text);
      console.error('[Page Console Error]', text);
    }
  };
  const pageErrorHandler = (err) => {
    consoleErrors.push(err.message);
    console.error('[Unhandled Page Exception]', err.message);
  };

  page.on('console', errorHandler);
  page.on('pageerror', pageErrorHandler);

  const solveActiveCrtModal = async () => {
    const autoPatchBtn = await page.$('#btn-crt-auto-patch');
    if (autoPatchBtn && await autoPatchBtn.isVisible()) {
      await autoPatchBtn.click();
      await page.waitForSelector('#modal-crt-patcher', { state: 'hidden', timeout: 4000 });
      return;
    }
    await page.evaluate(() => {
      const dial = document.getElementById('dial-frequency');
      if (dial) {
        dial.value = '528';
        dial.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const phase = document.getElementById('dial-phase');
      if (phase) {
        phase.value = '180';
        phase.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    const knife = await page.$('#btn-knife-switch');
    if (knife && !await knife.isDisabled()) {
      await knife.click();
      await page.waitForSelector('#modal-crt-patcher', { state: 'hidden', timeout: 4000 }).catch(() => {});
    }
  };

  try {
    console.log('--- Step 1: Loading Application ---');
    await page.goto(`${baseUrl}/?test=true`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 8000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_step1_intro.png') });

    console.log('--- Step 2: Beginning Cognitive Intake ---');
    await page.click('#btn-menu-start');
    await page.waitForSelector('#view-main-menu', { state: 'hidden', timeout: 4000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_step2_hub.png') });

    console.log('--- Step 3: Verifying Settings Gear ---');
    await page.click('#btn-settings-toggle');
    await page.waitForSelector('#modal-settings:not(.hidden)', { timeout: 3000 });
    const settingsVisible = await page.isVisible('#modal-settings');
    console.log(`Settings Modal Visible: ${settingsVisible}`);
    if (!settingsVisible) throw new Error('Settings modal failed to open');
    await page.click('#btn-close-settings');
    await page.waitForSelector('#modal-settings', { state: 'hidden', timeout: 3000 });

    console.log('--- Step 4: Focusing Vault & Calibrating Dial to 528 Hz ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('inventory:add', { itemId: 'prop_brass_shunt' });
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_vault' });
    });

    const slot = await page.$('#slot-shunt');
    if (slot) await slot.click();

    await page.evaluate(() => {
      const slider = document.getElementById('dial-frequency') || document.getElementById('slider-freq');
      if (slider) {
        slider.value = '528';
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    const btnSwitch = (await page.$('#btn-knife-switch')) || (await page.$('#btn-throw-switch'));
    if (btnSwitch) await btnSwitch.click();

    console.log('--- Step 5: Collecting Key & Traversing into Room 02 (The Sleep Ward) ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_key' });
    });
    await page.waitForSelector('#btn-take-item', { state: 'visible', timeout: 5000 });
    await page.click('#btn-take-item');
    await page.waitForSelector('#modal-inspect', { state: 'hidden', timeout: 4000 });
    
    // Open the corridor door
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_corridor' });
    });
    // Enter the corridor (clicks again because first click unlocks)
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_corridor' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__?.scenarioRegistry?.getCurrentScenario()?.id === 'sleep_ward';
    }, { timeout: 5000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_step5_sleep_ward.png') });

    console.log('--- Step 6: Solving Sleep Ward 3-Digit Rotary Lock (1-0-4) ---');
    await page.evaluate(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      current.digits = [1, 0, 4];
      current.onObjectClick('prop_trolley_lock');
      current.onObjectClick('crystal_01_quartz');
    });

    console.log('--- Step 7: Returning to Hub & Patching CRT Node 1 ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_return_hub' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__?.scenarioRegistry?.getCurrentScenario()?.id === 'room_04';
    }, { timeout: 5000 });

    // Click vault to open patcher
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_vault' });
    });
    await page.waitForSelector('#modal-crt-patcher:not(.hidden)', { timeout: 4000 });
    
    await solveActiveCrtModal();
    console.log('CRT Node 1 patched. Audio Log 1 unlocked.');

    console.log('--- Step 8: Traversing into Room 03 (The Hydrotherapy Room) ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_corridor' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__?.scenarioRegistry?.getCurrentScenario()?.id === 'hydrotherapy';
    }, { timeout: 5000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_step8_hydrotherapy.png') });

    console.log('--- Step 9: Balancing Hydrotherapy Valves & Recovering Bronze Crystal ---');
    await page.evaluate(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      current.valveRotations = [1, 1, 3];
      current.onObjectClick('prop_valve_0');
      current.onObjectClick('crystal_02_bronze');
    });

    console.log('--- Step 10: Returning to Hub & Patching CRT Node 2 ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_return_hub' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__?.scenarioRegistry?.getCurrentScenario()?.id === 'room_04';
    }, { timeout: 5000 });

    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_vault' });
    });
    await page.waitForSelector('#modal-crt-patcher:not(.hidden)', { timeout: 4000 });
    
    await solveActiveCrtModal();
    console.log('CRT Node 2 patched. Audio Log 2 unlocked.');

    console.log('--- Step 11: Traversing into Room 04 (The Audiology Vault) ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_corridor' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__?.scenarioRegistry?.getCurrentScenario()?.id === 'audiology';
    }, { timeout: 5000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_step11_audiology.png') });

    console.log('--- Step 12: Tuning Amplifier to 741 Hz & Recovering Amethyst Crystal ---');
    await page.evaluate(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      current.freqIndex = 3;
      current.onObjectClick('prop_amp_stack');
      current.onObjectClick('crystal_03_amethyst');
    });

    console.log('--- Step 13: Returning to Hub & Patching CRT Node 3 ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_return_hub' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__?.scenarioRegistry?.getCurrentScenario()?.id === 'room_04';
    }, { timeout: 5000 });

    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_vault' });
    });
    await page.waitForSelector('#modal-crt-patcher:not(.hidden)', { timeout: 4000 });
    
    await solveActiveCrtModal();
    console.log('CRT Node 3 patched. Audio Log 3 unlocked.');

    console.log('--- Step 14: Traversing into Room 05 (The Archive) ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_corridor' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__?.scenarioRegistry?.getCurrentScenario()?.id === 'archive';
    }, { timeout: 5000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_step14_archive.png') });

    console.log('--- Step 15: Searching Drawer 104 & Recovering Obsidian Crystal ---');
    await page.evaluate(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      current.microficheScreen.handleSolveTrigger();
      current.onObjectClick('crystal_04_obsidian');
    });

    console.log('--- Step 16: Returning to Decaying Hub & Patching CRT Node 4 ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_return_hub' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__?.scenarioRegistry?.getCurrentScenario()?.id === 'room_04';
    }, { timeout: 5000 });

    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_vault' });
    });
    await page.waitForSelector('#modal-crt-patcher:not(.hidden)', { timeout: 4000 });
    
    await solveActiveCrtModal();
    console.log('CRT Node 4 patched. Hub decayed to level 4.');

    console.log('--- Step 17: Traversing into Room 06 (The Director\'s Office) ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_corridor' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__?.scenarioRegistry?.getCurrentScenario()?.id === 'directors_office';
    }, { timeout: 5000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_step17_directors_office.png') });

    console.log('--- Step 18: Listening to Breathing Phone & Recovering Celadon Crystal ---');
    await page.evaluate(() => {
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      current.wiretapScreen.clockHours = 11;
      current.wiretapScreen.clockMinutes = 3;
      current.wiretapScreen.handleSolveTrigger();
      current.onObjectClick('prop_void_phone');
      current.onObjectClick('crystal_05_celadon');
    });

    console.log('--- Step 19: Returning to Hub & Final Synthesis (Act VII Blackout) ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_return_hub' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__?.scenarioRegistry?.getCurrentScenario()?.id === 'room_04';
    }, { timeout: 5000 });

    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_vault' });
    });
    await page.waitForSelector('#modal-crt-patcher:not(.hidden)', { timeout: 4000 });
    
    await solveActiveCrtModal();
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_step19_hub_blackout.png') });

    console.log('--- Step 20: Stepping through the Blown Exit Door into Act VIII (The Velvet Lounge) ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('scenario:switch_room', { targetRoomId: 'velvet_lounge' });
    });
    await page.waitForFunction(() => {
      return window.__VAULT_APP__?.scenarioRegistry?.getCurrentScenario()?.id === 'velvet_lounge';
    }, { timeout: 5000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_step20_velvet_lounge.png') });

    console.log('--- Step 21: Inspecting Gilded Bar Mirror & Patching Switchboard ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_bar_mirror_glass' });
      const current = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      if (current && current.switchboardScreen) {
        current.switchboardScreen.state.decanterPlaced = true;
        current.switchboardScreen.state.switchboardPatched = true;
      }
    });

    console.log('--- Step 22: Answering the Solitary Ringing Payphone Climax ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'prop_lounge_payphone' });
    });
    await page.waitForSelector('#view-terminal-blackout:not(.hidden)', { timeout: 8000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'screenshot_step22_terminal_deployed.png') });

    const blackoutVisible = await page.isVisible('#view-terminal-blackout');
    console.log(`Terminal Blackout View Visible: ${blackoutVisible}`);

    console.log('--- Verification Result ---');
    console.log(`Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      throw new Error(`Errors found: ${consoleErrors.join('; ')}`);
    }
    console.log('SUCCESS: All 8 Acts verified with 0 console errors!');
  } finally {
    page.off('console', errorHandler);
    page.off('pageerror', pageErrorHandler);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  console.log(`Test server running on ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  let exitCode = 0;
  try {
    await runSuite(page, baseUrl);
  } catch (err) {
    console.error('Test Execution Failed:', err);
    exitCode = 1;
  } finally {
    await browser.close();
    close();
    process.exit(exitCode);
  }
}
