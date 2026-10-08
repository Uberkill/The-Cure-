import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4199;
const DIST_DIR = path.resolve(__dirname, '../dist');
const OUTPUT_DIR = path.resolve(__dirname, '../exported_models');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
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
  console.log(`GLB Exporter server running on http://localhost:${PORT}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });
  const page = await browser.newPage();

  await page.goto(`http://localhost:${PORT}`);
  await page.waitForFunction(() => !!window.__VAULT_APP__ && !!window.exportObjectToGLB);
  await page.waitForTimeout(1000);

  console.log('Extracting and exporting Room 04 geometry...');

  const exportedAssets = await page.evaluate(async () => {
    const app = window.__VAULT_APP__;
    const scene = app.sceneManager.scene;
    const results = [];

    // Helper to serialize ArrayBuffer to Base64
    const bufferToBase64 = (buffer) => {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    // 1. Export Entire Room 04 Scene
    const root = scene.getObjectByName('Room04_Root') || scene;
    const fullBuffer = await window.exportObjectToGLB(root);
    results.push({ name: 'room_04_full.glb', base64: bufferToBase64(fullBuffer) });

    // 2. Export individual modular props for Blender editing
    const propsToExport = ['prop_vault', 'prop_desk', 'prop_chair', 'prop_telephone', 'prop_key', 'prop_bell_jar', 'prop_envelope'];
    for (const propName of propsToExport) {
      const propObj = scene.getObjectByName(propName);
      if (propObj) {
        const propBuffer = await window.exportObjectToGLB(propObj);
        results.push({ name: `${propName}.glb`, base64: bufferToBase64(propBuffer) });
      }
    }

    return results;
  });

  for (const asset of exportedAssets) {
    const filePath = path.join(OUTPUT_DIR, asset.name);
    const buffer = Buffer.from(asset.base64, 'base64');
    fs.writeFileSync(filePath, buffer);
    console.log(`Saved: ${filePath} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  await browser.close();
  server.close();
  console.log('GLB Export completed successfully!');
  process.exit(0);
});
