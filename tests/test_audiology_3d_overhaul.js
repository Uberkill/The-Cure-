import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4252;
const DIST_DIR = path.resolve(__dirname, '../dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp3': 'audio/mpeg',
  '.glb': 'model/gltf-binary'
};

const server = http.createServer((req, res) => {
  const cleanUrl = req.url.split('?')[0];
  const filePath = path.join(DIST_DIR, cleanUrl === '/' ? 'index.html' : cleanUrl);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, async () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });
  const page = await browser.newPage();

  try {
    await page.goto(`http://localhost:${PORT}/?test=true`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#canvas-container canvas', { state: 'visible', timeout: 8000 });
    await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });

    await page.click('#btn-menu-start');
    await page.waitForTimeout(500);

    // Switch scenario to audiology via __VAULT_APP__.eventBus
    await page.evaluate(() => {
      const app = (window).__VAULT_APP__;
      app.eventBus.emit('scenario:switch_room', { targetRoomId: 'audiology' });
    });
    await page.waitForTimeout(800);

    // Verify Scene Graph presence of upgraded 3D meshes
    const meshPresence = await page.evaluate(() => {
      const app = (window).__VAULT_APP__;
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
      const app = (window).__VAULT_APP__;
      app.eventBus.emit('input:object_clicked', { objectId: 'prop_chladni_plate' });
    });
    await page.waitForTimeout(400);

    const isBinauralOpen = await page.evaluate(() => {
      const modal = document.querySelector('#screen-binaural-synthesizer');
      return modal && !modal.classList.contains('hidden');
    });

    console.log('Binaural Synthesizer modal opened on Chladni plate click:', isBinauralOpen);
    if (!isBinauralOpen) {
      throw new Error('Chladni plate click failed to open BinauralSynthesizer modal');
    }

    // Close modal
    await page.click('#btn-close-binaural');
    await page.waitForTimeout(300);

    // Verify Click on prop_acoustic_horn_left
    await page.evaluate(() => {
      const app = (window).__VAULT_APP__;
      app.eventBus.emit('input:object_clicked', { objectId: 'prop_acoustic_horn_left' });
    });
    await page.waitForTimeout(300);

    const isBinauralOpenHorn = await page.evaluate(() => {
      const modal = document.querySelector('#screen-binaural-synthesizer');
      return modal && !modal.classList.contains('hidden');
    });

    console.log('Binaural Synthesizer modal opened on Left Horn click:', isBinauralOpenHorn);
    if (!isBinauralOpenHorn) {
      throw new Error('Left horn click failed to open BinauralSynthesizer modal');
    }

    console.log('AUDIOLOGY 3D OVERHAUL VERIFIED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
