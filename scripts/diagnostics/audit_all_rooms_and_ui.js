import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { startTestServer } from './helpers/testServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = path.resolve(__dirname, '..', 'screenshots', 'deep_audit');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

export async function runDeepAudit(page, baseUrl) {
  const browserErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter benign procedural asset fallbacks
      if (text.includes('404') && (text.includes('.mp3') || text.includes('.glb') || text.includes('Failed to load resource'))) {
        return;
      }
      browserErrors.push(text);
      console.error(`[Browser Error] ${text}`);
    }
  });
  page.on('pageerror', (err) => {
    browserErrors.push(err.message);
    console.error(`[Page Error] ${err.message}`);
  });

  console.log('====================================================');
  console.log('STARTING RIGOROUS DEEP AUDIT OF ALL ROOMS & UI');
  console.log('====================================================');

  await page.goto(`${baseUrl}/?test=true`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#canvas-container canvas', { state: 'visible', timeout: 8000 });
  await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });
  await page.click('#btn-menu-start');
  await page.waitForSelector('#view-main-menu', { state: 'hidden', timeout: 4000 });

  const roomsToAudit = [
    {
      id: 'room_04',
      name: 'Room 04 (Sterile Reception / Hub)',
      expectedModal: '#screen-tektronix-crt',
      modalOpenProp: 'prop_vault',
      modalCloseBtn: '#btn-close-crt',
      expectedCrystal: null
    },
    {
      id: 'sleep_ward',
      name: 'Room 02 (The Sleep Ward)',
      expectedModal: '#screen-dispensary-cart',
      modalOpenProp: 'prop_trolley',
      modalCloseBtn: '#btn-close-cart',
      expectedCrystal: 'crystal_01_quartz'
    },
    {
      id: 'hydrotherapy',
      name: 'Room 03 (The Hydrotherapy Room)',
      expectedModal: '#screen-hydraulic-manifold',
      modalOpenProp: 'prop_manifold',
      modalCloseBtn: '#btn-close-manifold',
      expectedCrystal: 'crystal_02_bronze'
    },
    {
      id: 'audiology',
      name: 'Room 04 (The Audiology Vault)',
      expectedModal: '#screen-binaural-synthesizer',
      modalOpenProp: 'prop_chladni_plate',
      modalCloseBtn: '#btn-close-binaural',
      expectedCrystal: 'crystal_03_amethyst'
    },
    {
      id: 'archive',
      name: 'Room 05 (The Archive)',
      expectedModal: '#screen-microfiche-viewer',
      modalOpenProp: 'prop_microfiche_reader',
      modalCloseBtn: '#btn-close-microfiche',
      expectedCrystal: 'crystal_04_obsidian'
    },
    {
      id: 'directors_office',
      name: 'Room 06 (The Director\'s Office)',
      expectedModal: '#screen-wiretap-tapedeck',
      modalOpenProp: 'prop_tape_deck',
      modalCloseBtn: '#btn-close-wiretap',
      expectedCrystal: 'crystal_05_celadon'
    },
    {
      id: 'synthesis_blackout',
      name: 'Room 07 (The Synthesis Chamber)',
      expectedModal: '#screen-galvanometer-grid',
      modalOpenProp: 'prop_galvanometer_grid',
      modalCloseBtn: '#btn-close-galvanometer',
      expectedCrystal: null
    },
    {
      id: 'velvet_lounge',
      name: 'Room 08 (The Velvet Lounge)',
      expectedModal: '#screen-switchboard-mirror',
      modalOpenProp: 'prop_switchboard',
      modalCloseBtn: '#btn-close-switchboard',
      expectedCrystal: null
    }
  ];

  for (const r of roomsToAudit) {
    console.log(`\n>>> AUDITING SCENARIO: ${r.name} (${r.id}) <<<`);

    // Await scenario transition to settle completely
    await page.evaluate(async (roomId) => {
      const reg = window.__VAULT_APP__.scenarioRegistry;
      if (reg.getCurrentScenario()?.id === roomId && !reg.isSwitching) return;
      window.__VAULT_APP__.eventBus.emit('scenario:switch_room', { targetRoomId: roomId, isDevJump: true });
      let retries = 0;
      while ((reg.isSwitching || reg.getCurrentScenario()?.id !== roomId) && retries < 100) {
        await new Promise((res) => setTimeout(res, 50));
        retries++;
      }
    }, r.id);

    await page.waitForFunction((roomId) => {
      const reg = window.__VAULT_APP__?.scenarioRegistry;
      return reg?.getCurrentScenario()?.id === roomId && !reg?.isSwitching;
    }, r.id, { timeout: 6000 });

    // Step A: 3D Scene Geometry & Model Audit
    const geomAudit = await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      const THREE = window.THREE;
      const scene = app.sceneManager.scene;
      let meshCount = 0;
      let totalVertices = 0;
      let invalidBounds = 0;
      let nanVertices = 0;
      let missingMaterials = 0;

      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          meshCount++;
          const g = child.geometry;
          if (!g) {
            invalidBounds++;
            return;
          }
          if (!g.boundingBox) g.computeBoundingBox();
          const b = g.boundingBox;
          if (!b || isNaN(b.min.x) || isNaN(b.min.y) || isNaN(b.min.z) ||
              isNaN(b.max.x) || isNaN(b.max.y) || isNaN(b.max.z)) {
            invalidBounds++;
          }
          const pos = g.getAttribute('position');
          if (pos) {
            totalVertices += pos.count;
            for (let i = 0; i < Math.min(pos.count, 50); i++) {
              if (isNaN(pos.getX(i)) || isNaN(pos.getY(i)) || isNaN(pos.getZ(i))) {
                nanVertices++;
                break;
              }
            }
          }
          if (!child.material) missingMaterials++;
        }
      });
      return { meshCount, totalVertices, invalidBounds, nanVertices, missingMaterials };
    });

    console.log(`  Geometry: Meshes=${geomAudit.meshCount}, Verts=${geomAudit.totalVertices}, InvalidBounds=${geomAudit.invalidBounds}, NaNVerts=${geomAudit.nanVertices}, MissingMats=${geomAudit.missingMaterials}`);
    if (geomAudit.invalidBounds > 0 || geomAudit.nanVertices > 0 || geomAudit.missingMaterials > 0) {
      throw new Error(`Geometry audit failed in ${r.id}: ${JSON.stringify(geomAudit)}`);
    }

    // Step B: Hotspots and Camera Bounds (Dynamically queried)
    const hotspots = await page.evaluate(() => {
      const scenario = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
      return Object.keys(scenario?.hotspots || {});
    });

    for (const h of hotspots) {
      const hotspotValid = await page.evaluate((hotspotId) => {
        const scenario = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
        const anchor = scenario.hotspots?.[hotspotId];
        if (!anchor) return { found: false };
        const camPos = anchor.cameraPreset?.position;
        const target = anchor.cameraPreset?.target;
        return {
          found: true,
          hasPreset: !!anchor.cameraPreset,
          camFinite: camPos && !isNaN(camPos.x) && !isNaN(camPos.y) && !isNaN(camPos.z),
          targetFinite: target && !isNaN(target.x) && !isNaN(target.y) && !isNaN(target.z)
        };
      }, h);

      if (!hotspotValid.found || !hotspotValid.hasPreset || !hotspotValid.camFinite || !hotspotValid.targetFinite) {
        throw new Error(`Invalid hotspot ${h} in ${r.id}: ${JSON.stringify(hotspotValid)}`);
      }

      await page.evaluate((hotspotId) => {
        window.__VAULT_APP__.eventBus.emit('camera:move_to_hotspot', { hotspotId, durationMs: 0 });
      }, h);
    }
    console.log(`  All ${hotspots.length} hotspots verified with finite camera coordinates.`);

    // Move camera to overview anchor for room overview capture
    await page.evaluate(() => {
      window.__VAULT_APP__.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'overview', durationMs: 0 });
    });

    // Screenshot overview of room
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `room_${r.id}_overview.png`) });

    // Step C: Interactive Scene Props (Dynamically queried)
    const interactiveProps = await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      const names = new Set();
      app.sceneManager.scene.traverse((obj) => {
        if (obj.name && (obj.name.startsWith('prop_') || obj.name.startsWith('door_') || obj.name.startsWith('crystal_'))) {
          names.add(obj.name);
        }
      });
      return Array.from(names);
    });

    console.log(`  Discovered ${interactiveProps.length} interactive scene entities.`);
    for (const p of interactiveProps) {
      if (p === r.modalOpenProp) continue; // Tested explicitly in Step E
      if (p.startsWith('door_') || p === 'prop_door' || p === 'exit_airlock_passage') continue; // Room navigation portals
      if (p === 'prop_facility_map' || p.startsWith('prop_clipboard')) continue; // Tested explicitly in Step F

      const clickResult = await page.evaluate((propId) => {
        const scenario = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
        try {
          const handled = scenario.onObjectClick(propId);
          return { handled, error: null };
        } catch (e) {
          return { handled: false, error: e.message };
        }
      }, p);

      if (clickResult.error) {
        throw new Error(`Click exception on ${p} in ${r.id}: ${clickResult.error}`);
      }

      // Dismiss any secondary overlay or view triggered by prop exploration
      await page.evaluate(() => {
        const app = window.__VAULT_APP__;
        const dossier = document.getElementById('modal-dossier');
        if (dossier && !dossier.classList.contains('hidden')) {
          app.screenManager.switchView('chamber');
        }
        const inspect = document.getElementById('modal-inspect');
        if (inspect && !inspect.classList.contains('hidden')) {
          const btn = document.getElementById('btn-close-inspect');
          if (btn) {
            btn.click();
          } else {
            inspect.classList.add('hidden');
            document.querySelector('.ui-layer')?.classList.remove('hidden');
            app.eventBus.emit('inspect:close', {});
          }
        }
        const map = document.getElementById('screen-facility-map');
        if (map && !map.classList.contains('hidden')) {
          app.facilityMapScreen.close();
        }
        const clipboard = document.getElementById('screen-clinical-clipboard');
        if (clipboard && !clipboard.classList.contains('hidden')) {
          const btn = document.getElementById('btn-close-clipboard');
          if (btn) btn.click();
        }
      });
    }

    // Step D: Gem Drop & Interlock Barrier Verification
    if (r.expectedCrystal) {
      const crystalLockCheck = await page.evaluate((crystalId) => {
        const scenario = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
        const gs = window.__VAULT_APP__.gameState;
        const initialHas = gs.hasCrystal(crystalId);
        scenario.onObjectClick(crystalId);
        const postHas = gs.hasCrystal(crystalId);
        return { initialHas, postHas, blockedCorrectly: !initialHas && !postHas };
      }, r.expectedCrystal);

      if (!crystalLockCheck.blockedCorrectly) {
        throw new Error(`Security breach: Crystal ${r.expectedCrystal} in ${r.id} was collectible prior to puzzle completion!`);
      }
      console.log(`  Verified Interlock: ${r.expectedCrystal} cannot be picked up before solving.`);
    }

    // Step E: UI Modal Verification & Pointer Isolation
    if (r.expectedModal && r.modalOpenProp) {
      console.log(`  Testing UI Modal: ${r.expectedModal}`);

      // Open modal via prop interaction
      await page.evaluate((propId) => {
        const scenario = window.__VAULT_APP__.scenarioRegistry.getCurrentScenario();
        scenario.onObjectClick(propId);
      }, r.modalOpenProp);

      await page.waitForSelector(`${r.expectedModal}:not(.hidden)`, { timeout: 5000 });

      // Verify RaycastManager pointer isolation while modal is active
      const raycastDisabled = await page.evaluate(() => {
        return window.__VAULT_APP__.raycastManager.isEnabled === false;
      });
      if (!raycastDisabled) {
        throw new Error(`Modal ${r.expectedModal} failed pointer isolation: RaycastManager.isEnabled is still true.`);
      }

      // Audit CSS layout & dimensions
      const modalMetrics = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return {
          width: rect.width,
          height: rect.height,
          display: style.display,
          visibility: style.visibility,
          opacity: parseFloat(style.opacity || '1'),
          zIndex: parseInt(style.zIndex || '0', 10)
        };
      }, r.expectedModal);

      if (!modalMetrics || modalMetrics.width < 200 || modalMetrics.height < 150) {
        throw new Error(`Modal ${r.expectedModal} failed size metrics: ${JSON.stringify(modalMetrics)}`);
      }
      if (modalMetrics.display === 'none' || modalMetrics.visibility === 'hidden' || modalMetrics.opacity < 0.1) {
        throw new Error(`Modal ${r.expectedModal} not visibly rendered: ${JSON.stringify(modalMetrics)}`);
      }

      console.log(`  Modal Metrics: width=${modalMetrics.width.toFixed(0)}px, height=${modalMetrics.height.toFixed(0)}px, zIndex=${modalMetrics.zIndex}`);

      // Screenshot modal
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `ui_modal_${r.id}.png`) });

      // Close modal
      if (r.modalCloseBtn) {
        await page.click(r.modalCloseBtn);
        await page.waitForSelector(r.expectedModal, { state: 'hidden', timeout: 4000 });
      }

      // Verify RaycastManager is re-enabled after modal close
      const raycastRestored = await page.evaluate(() => {
        return window.__VAULT_APP__.raycastManager.isEnabled === true;
      });
      if (!raycastRestored) {
        throw new Error(`Modal ${r.expectedModal} failed pointer restoration: RaycastManager.isEnabled is still false.`);
      }
      console.log(`  Modal ${r.expectedModal} closed cleanly and restored 3D raycasting.`);
    }
  }

  // Step F: Global Modals Audit (Facility Map, Patient Clipboard, Dossier, Settings)
  console.log('\n>>> AUDITING GLOBAL MODALS <<<');

  await page.evaluate(() => {
    document.querySelector('.ui-layer')?.classList.remove('hidden');
  });

  // 1. Facility Blueprint Modal
  await page.click('#btn-facility-map-toggle');
  await page.waitForSelector('#screen-facility-map:not(.hidden)', { timeout: 4000 });
  const mapCards = await page.$$eval('.facility-sector-card', (els) => els.length);
  if (mapCards !== 8) throw new Error(`Expected 8 facility sector cards, got ${mapCards}`);
  const mapRaycastDisabled = await page.evaluate(() => window.__VAULT_APP__.raycastManager.isEnabled === false);
  if (!mapRaycastDisabled) throw new Error('Facility Map did not pause RaycastManager');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'global_facility_map.png') });
  await page.keyboard.press('Escape');
  await page.waitForSelector('#screen-facility-map', { state: 'hidden', timeout: 3000 });
  console.log('  Facility Map (8 sectors) verified with Escape key dismissal.');

  // 2. Settings Modal
  await page.click('#btn-settings-toggle');
  await page.waitForSelector('#modal-settings:not(.hidden)', { timeout: 4000 });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'global_settings.png') });
  await page.click('#btn-close-settings');
  await page.waitForSelector('#modal-settings', { state: 'hidden', timeout: 3000 });
  console.log('  Settings modal verified.');

  // 3. Dossier 3D Viewer Modal
  await page.evaluate(() => {
    window.__VAULT_APP__.screenManager.switchView('dossier');
  });
  await page.waitForSelector('#modal-dossier:not(.hidden)', { timeout: 4000 });
  const dossierRaycastDisabled = await page.evaluate(() => window.__VAULT_APP__.raycastManager.isEnabled === false);
  if (!dossierRaycastDisabled) throw new Error('Dossier Modal did not pause RaycastManager');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'global_dossier.png') });
  await page.click('#btn-close-dossier');
  await page.waitForSelector('#modal-dossier', { state: 'hidden', timeout: 3000 });
  console.log('  Dossier reader modal verified.');

  // 4. Clinical Clipboard Modal (Act II Records)
  await page.evaluate(() => {
    window.__VAULT_APP__.eventBus.emit('scenario:switch_room', { targetRoomId: 'sleep_ward', isDevJump: true });
  });
  await page.waitForFunction(() => window.__VAULT_APP__?.scenarioRegistry?.getCurrentScenario()?.id === 'sleep_ward', { timeout: 4000 });
  await page.evaluate(() => {
    window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().onObjectClick('prop_clipboard_104');
  });
  await page.waitForSelector('#screen-clinical-clipboard:not(.hidden)', { timeout: 4000 });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'modal_clinical_clipboard.png') });
  await page.click('#btn-close-clipboard');
  await page.waitForSelector('#screen-clinical-clipboard', { state: 'hidden', timeout: 3000 });
  console.log('  Clinical Clipboard (Subjects 101-104) verified.');

  // 5. CRT Node Patcher Modal
  await page.evaluate(() => {
    window.__VAULT_APP__.eventBus.emit('puzzle:crt_patch_opened', {
      crystalId: 'crystal_01_quartz'
    });
  });
  await page.waitForSelector('#modal-crt-patcher:not(.hidden)', { timeout: 4000 });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'modal_crt_node_patcher.png') });
  await page.click('#btn-crt-auto-patch');
  await page.waitForSelector('#modal-crt-patcher', { state: 'hidden', timeout: 3000 });
  console.log('  CRT Node Patcher minigame modal verified.');

  if (browserErrors.length > 0) {
    throw new Error(`Browser errors encountered during deep audit:\n${browserErrors.join('\n')}`);
  }

  console.log('\n====================================================');
  console.log('DEEP AUDIT COMPLETED: ALL 8 ROOMS & UI VERIFIED CLEAN');
  console.log('====================================================');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  console.log(`Deep audit test server running on ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--no-sandbox']
  });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();
  let exitCode = 0;
  try {
    await runDeepAudit(page, baseUrl);
  } catch (err) {
    console.error('DEEP AUDIT FAILED:', err);
    exitCode = 1;
  } finally {
    await browser.close();
    close();
    process.exit(exitCode);
  }
}
