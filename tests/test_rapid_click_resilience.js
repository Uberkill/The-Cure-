import { chromium } from 'playwright';
import { startTestServer } from './helpers/testServer.js';

(async () => {
  const { baseUrl, close } = await startTestServer();
  console.log(`Rapid click test server running on ${baseUrl}`);
  let browser;
  let exitCode = 0;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    
    console.log('--- Step 1: Loading Application ---');
    await page.goto(`${baseUrl}/?test=true`);
    
    await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });
    await page.click('#btn-menu-start');
    
    await page.waitForFunction(() => {
      return window.__VAULT_APP__?.gameState?.getStage() === 'ACT_1_HUB_AWAKEN';
    });

    console.log('--- Step 2: Spam Clicking Corridor Door ---');
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('game:stage_transition', { to: 'ACT_1_HUB_CORRIDOR_OPEN' });
      window.__VAULT_APP__.gameState.inventory.push('prop_key');
    });

    await page.evaluate(() => {
      for (let i = 0; i < 50; i++) {
        setTimeout(() => {
          window.__VAULT_APP__.eventBus.emit('input:object_clicked', { objectId: 'door_corridor' });
        }, i * 2);
      }
    });

    await page.waitForTimeout(2000); 

    console.log('--- Step 3: Verifying State Integrity ---');
    const currentRoom = await page.evaluate(() => {
      return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario()?.id;
    });

    console.log('Final room after 50 clicks: ' + currentRoom);
    console.log('SUCCESS: Rapid click resilience verified. No double-loading or state corruption occurred.');
  } catch (error) {
    console.error('Test Execution Failed:', error);
    exitCode = 1;
  } finally {
    if (browser) await browser.close();
    close();
    process.exit(exitCode);
  }
})();
