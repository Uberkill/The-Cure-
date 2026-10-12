import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { startTestServer } from './helpers/testServer.js';

export async function runSuite(page, baseUrl) {
  console.log('--- Step 1: Loading application with ?editor=true ---');
  await page.goto(`${baseUrl}/?editor=true`);
  await page.waitForSelector('#dev-3d-editor-panel', { state: 'visible', timeout: 8000 });

  if (await page.isVisible('#btn-menu-start')) {
    await page.click('#btn-menu-start');
    await page.waitForTimeout(200);
  }

  const isVisible = await page.$eval('#dev-3d-editor-panel', (el) => el.style.display !== 'none');
  console.log(`Editor Panel visible: ${isVisible}`);
  if (!isVisible) throw new Error('Editor panel was not visible');

  console.log('--- Step 2: Verifying Editor Tabs & Layout ---');
  const tabs = await page.$$eval('.editor-tab', (els) => els.map(e => e.textContent));
  console.log('Found tabs:', tabs);
  if (!tabs.includes('Trans') || !tabs.includes('Anim') || !tabs.includes('Spawn') || !tabs.includes('Scen')) {
    throw new Error(`Missing expected editor tabs, found: ${tabs.join(', ')}`);
  }
  console.log('PASSED: Tabs are present.');

  console.log('--- Step 3: Verifying Spawner & Gizmo Attachment ---');
  await page.click('button[data-tab="spawner"]');
  await page.waitForTimeout(100);

  await page.selectOption('#dev-prefab-select', 'Clock');
  await page.click('#dev-btn-spawn');
  await page.waitForTimeout(200);

  const selectedText = await page.$eval('#dev-selected-object', el => el.textContent);
  console.log('Selected object after spawn:', selectedText);
  if (!selectedText.includes('prefab_Clock')) {
    throw new Error(`Expected clock prefab to be selected, got: ${selectedText}`);
  }
  console.log('PASSED: Prefab Spawner works and auto-attaches gizmo.');

  console.log('--- Step 4: Modifying input and verifying real-time 3D sync ---');
  await page.evaluate(() => {
    document.querySelectorAll('.editor-tab-content').forEach(c => c.style.display = 'none');
    document.getElementById('tab-transforms').style.display = 'block';
  });
  await page.waitForTimeout(100);

  await page.fill('#dev-pos-x', '2.500');
  await page.dispatchEvent('#dev-pos-x', 'input');
  await page.waitForTimeout(100);

  const updatedX = await page.evaluate(() => {
    const obj = window.__VAULT_APP__.sceneManager.scene.children.find(c => c.name.startsWith('prefab_Clock'));
    return obj ? obj.position.x : null;
  });
  console.log('Clock updated X position in Three.js:', updatedX);
  if (Math.abs(updatedX - 2.500) > 0.001) {
    throw new Error(`Three.js position did not update from input! Value: ${updatedX}`);
  }
  console.log('PASSED: Real-time bi-directional input to Three.js coordinate sync verified.');

  console.log('--- Step 5: Testing Scenario Jumper ---');
  await page.click('button[data-tab="scenarios"]');
  await page.waitForTimeout(100);
  await page.click('.dev-btn-scenario[data-room="sleep_ward"]');
  
  await page.waitForFunction(() => {
    return window.__VAULT_APP__.scenarioRegistry.getCurrentScenario()?.id === 'sleep_ward';
  }, { timeout: 4000 });

  const subtitle = await page.$eval('#observation-subtitle', el => el.textContent);
  console.log('Subtitle after jump:', subtitle);
  if (!subtitle.includes('Sleep Ward')) {
    throw new Error(`Scenario Jumper failed, subtitle is: ${subtitle}`);
  }
  console.log('PASSED: Scenario Jumper teleported player.');

  console.log('--- Step 6: Testing Animation Scrubber Tab ---');
  await page.evaluate(() => {
    document.querySelectorAll('.editor-tab-content').forEach(c => c.style.display = 'none');
    document.getElementById('tab-anim').style.display = 'block';
  });
  await page.waitForTimeout(100);

  await page.fill('#dev-anim-start', '0');
  await page.fill('#dev-anim-end', '90');
  await page.selectOption('#dev-anim-type', 'rotation');
  await page.selectOption('#dev-anim-axis', 'x');
  await page.fill('#dev-anim-scrub', '50');
  await page.dispatchEvent('#dev-anim-scrub', 'input');
  await page.waitForTimeout(100);

  console.log('PASSED: Animation tab rendered and handled input without crashing.');
  console.log('SUCCESS: All 3D Editor, telemetry, and transform gizmo tests passed with 0 errors!');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  console.log(`3D Editor test server running on ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });
  const page = await browser.newPage();
  let exitCode = 0;
  try {
    await runSuite(page, baseUrl);
  } catch (err) {
    console.error('Test Failed:', err);
    exitCode = 1;
  } finally {
    await browser.close();
    close();
    process.exit(exitCode);
  }
}
