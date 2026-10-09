import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4210;
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
  console.log(`Scenario Jump Buttons test server running on http://localhost:${PORT}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
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
    await page.goto(`http://localhost:${PORT}/?editor=true`);
    await page.waitForSelector('#dev-3d-editor-panel', { state: 'visible', timeout: 8000 });

    if (await page.isVisible('#btn-menu-start')) {
      await page.click('#btn-menu-start');
      await page.waitForTimeout(500);
    }

    // Switch to Scenarios tab
    await page.click('button[data-tab="scenarios"]');
    await page.waitForTimeout(200);

    const roomsToTest = [
      { id: 'room_04', expectedStage: 'ACT_1_HUB_AWAKEN', expectedTitle: 'The Sterile Chamber' },
      { id: 'sleep_ward', expectedStage: 'ACT_2_SLEEP_WARD', expectedTitle: 'The Sleep Ward' },
      { id: 'hydrotherapy', expectedStage: 'ACT_3_HYDROTHERAPY', expectedTitle: 'The Hydrotherapy Room' },
      { id: 'audiology', expectedStage: 'ACT_4_AUDIOLOGY', expectedTitle: 'The Audiology Vault' },
      { id: 'archive', expectedStage: 'ACT_5_ARCHIVE', expectedTitle: 'The Archive' },
      { id: 'directors_office', expectedStage: 'ACT_6_DIRECTORS_OFFICE', expectedTitle: "The Director's Office" },
      { id: 'synthesis_blackout', expectedStage: 'ACT_7_SYNTHESIS_BLACKOUT', expectedTitle: 'The Synthesis Chamber' },
      { id: 'velvet_lounge', expectedStage: 'ACT_8_VELVET_LOUNGE', expectedTitle: 'The Velvet Lounge' }
    ];

    for (const room of roomsToTest) {
      console.log(`Testing Jump to [${room.id}] -> ${room.expectedTitle}`);
      await page.click(`.dev-btn-scenario[data-room="${room.id}"]`);
      await page.waitForTimeout(400);

      const state = await page.evaluate(() => {
        const app = window.__VAULT_APP__;
        return {
          currentScenarioId: app.scenarioRegistry.getCurrentScenario()?.id,
          stage: app.gameState.getStage(),
          sceneChildCount: app.sceneManager.scene.children.length
        };
      });

      if (state.currentScenarioId !== room.id) {
        throw new Error(`Expected scenario ${room.id}, got ${state.currentScenarioId}`);
      }
      if (state.stage !== room.expectedStage) {
        throw new Error(`Expected stage ${room.expectedStage}, got ${state.stage}`);
      }
      if (state.sceneChildCount === 0) {
        throw new Error(`Scene is empty after jump to ${room.id}`);
      }
      console.log(`PASSED: Jump to ${room.id} synchronized to stage ${state.stage}`);
    }

    // Jump back to Room 01 to prove bidirectional reset
    console.log('Testing bidirectional jump back to Act I (Room 01)');
    await page.click('.dev-btn-scenario[data-room="room_04"]');
    await page.waitForTimeout(400);

    const hubState = await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      return {
        stage: app.gameState.getStage(),
        patchedCount: ['crystal_01_quartz', 'crystal_02_bronze', 'crystal_03_amethyst', 'crystal_04_obsidian', 'crystal_05_celadon']
          .filter(c => app.gameState.isCrystalPatched(c)).length
      };
    });

    if (hubState.stage !== 'ACT_1_HUB_AWAKEN') {
      throw new Error(`Expected stage ACT_1_HUB_AWAKEN on return, got ${hubState.stage}`);
    }
    if (hubState.patchedCount !== 0) {
      throw new Error(`Expected 0 patched crystals on reset to Act I, got ${hubState.patchedCount}`);
    }
    console.log('PASSED: Bidirectional stage reset to Act I confirmed with zero state pollution.');

    if (consoleErrors.length > 0) {
      throw new Error(`Found ${consoleErrors.length} console errors during test: ${consoleErrors.join('; ')}`);
    }

    console.log('SUCCESS: All 8 Act scenario jump buttons and bidirectional state synchronization verified cleanly!');
    await browser.close();
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('TEST FAILED:', err);
    await browser.close();
    server.close();
    process.exit(1);
  }
});
