import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { startTestServer } from './helpers/testServer.js';

export async function runSuite(page, baseUrl) {
  await page.goto(`${baseUrl}/?test=true`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#canvas-container canvas', { state: 'visible', timeout: 8000 });
  await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });

  await page.click('#btn-menu-start');
  await page.waitForSelector('#view-main-menu', { state: 'hidden', timeout: 4000 });

  // Switch scenario to audiology via __VAULT_APP__.eventBus
  await page.evaluate(() => {
    const app = window.__VAULT_APP__;
    app.eventBus.emit('scenario:switch_room', { targetRoomId: 'audiology' });
  });

  await page.waitForFunction(() => {
    return window.__VAULT_APP__?.scenarioRegistry?.getCurrentScenario()?.id === 'audiology';
  }, { timeout: 5000 });

  // Verify Scene Graph presence of upgraded 3D meshes
  const meshPresence = await page.evaluate(() => {
    const app = window.__VAULT_APP__;
    const scene = app.sceneManager.scene;
    let foundLeftHorn = false;
    let foundRightHorn = false;
    let foundChladni = false;
    let foundCables = false;
    let foundBaffles = false;
  
    if (scene) {
      scene.traverse((obj) => {
        if (obj.name === 'prop_acoustic_horn_left') foundLeftHorn = true;
        if (obj.name === 'prop_acoustic_horn_right') foundRightHorn = true;
        if (obj.name === 'prop_chladni_plate') foundChladni = true;
        if (obj.name === 'mesh_audio_cables') foundCables = true;
        if (obj.name === 'mesh_anechoic_baffles') foundBaffles = true;
      });
    }
    return { foundLeftHorn, foundRightHorn, foundChladni, foundCables, foundBaffles };
  });

  console.log('3D Meshes Present in Audiology Vault:', meshPresence);
  if (!meshPresence.foundLeftHorn || !meshPresence.foundRightHorn || !meshPresence.foundChladni || !meshPresence.foundCables || !meshPresence.foundBaffles) {
    throw new Error(`Missing expected 3D procedural meshes: ${JSON.stringify(meshPresence)}`);
  }

  // Verify Click on prop_chladni_plate
  await page.evaluate(() => {
    const app = window.__VAULT_APP__;
    app.eventBus.emit('input:object_clicked', { objectId: 'prop_chladni_plate' });
  });

  await page.waitForSelector('#screen-binaural-synthesizer:not(.hidden)', { timeout: 4000 });
  console.log('Binaural Synthesizer modal opened on Chladni plate click: true');

  // Close modal
  await page.click('#btn-close-binaural');
  await page.waitForSelector('#screen-binaural-synthesizer', { state: 'hidden', timeout: 4000 });

  // Verify Click on prop_acoustic_horn_left
  await page.evaluate(() => {
    const app = window.__VAULT_APP__;
    app.eventBus.emit('input:object_clicked', { objectId: 'prop_acoustic_horn_left' });
  });

  await page.waitForSelector('#screen-binaural-synthesizer:not(.hidden)', { timeout: 4000 });
  console.log('Binaural Synthesizer modal opened on Left Horn click: true');

  // Close modal again
  await page.click('#btn-close-binaural');
  await page.waitForSelector('#screen-binaural-synthesizer', { state: 'hidden', timeout: 4000 });

  console.log('AUDIOLOGY 3D OVERHAUL VERIFIED SUCCESSFULLY!');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  console.log(`Test server running on ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });
  const page = await browser.newPage();
  let exitCode = 0;
  try {
    await runSuite(page, baseUrl);
  } catch (err) {
    console.error('Test failed:', err);
    exitCode = 1;
  } finally {
    await browser.close();
    close();
    process.exit(exitCode);
  }
}
