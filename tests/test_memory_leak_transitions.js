import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { startTestServer } from './helpers/testServer.js';

export async function runSuite(page, baseUrl) {
  console.log('--- Step 1: Loading Application ---');
  await page.goto(`${baseUrl}/?test=true`);
  
  await page.waitForFunction(() => {
    const stage = window.__VAULT_APP__?.gameState?.getStage();
    return stage === 'ACT_1_HUB_AWAKEN';
  });

  console.log('--- Step 2: Grabbing Baseline Geometry Count ---');
  const baseGeometries = await page.evaluate(() => {
    return window.__VAULT_APP__.sceneManager.renderer.info.memory.geometries;
  });
  console.log('Baseline geometries in Room 04: ' + baseGeometries);

  console.log('--- Step 3: Transitioning back and forth 20 times ---');
  for (let i = 0; i < 20; i++) {
    await page.evaluate(() => { window.__VAULT_APP__.eventBus.emit('scenario:switch_room', { targetRoomId: 'sleep_ward' }); });
    await page.waitForFunction(() => { return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario()?.id === 'sleep_ward'; });
    
    await page.evaluate(() => { window.__VAULT_APP__.eventBus.emit('scenario:switch_room', { targetRoomId: 'room_04' }); });
    await page.waitForFunction(() => { return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario()?.id === 'room_04'; });
  }

  console.log('--- Step 4: Grabbing Final Geometry Count ---');
  const finalGeometries = await page.evaluate(() => {
    return window.__VAULT_APP__.sceneManager.renderer.info.memory.geometries;
  });
  console.log('Final geometries in Room 04: ' + finalGeometries);
  
  if (finalGeometries > baseGeometries + 10) {
    throw new Error('Memory leak detected! Geometries grew from ' + baseGeometries + ' to ' + finalGeometries);
  }
  console.log('SUCCESS: No memory leak detected during rapid chamber transitions!');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  console.log(`Memory test server running on ${baseUrl}`);
  let browser;
  let exitCode = 0;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    await runSuite(page, baseUrl);
  } catch (error) {
    console.error('Test Execution Failed:', error);
    exitCode = 1;
  } finally {
    if (browser) await browser.close();
    close();
    process.exit(exitCode);
  }
}
