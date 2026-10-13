import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { startTestServer } from './helpers/testServer.js';

export async function runSuite(page, baseUrl) {
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('404') && (text.includes('.mp3') || text.includes('.glb') || text.includes('Failed to load resource'))) {
        return;
      }
      consoleErrors.push(text);
      console.error(`[Browser Console Error] ${text}`);
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
    console.error(`[Page Error] ${err.message}`);
  });

  console.log('--- Step 1: Bootstrap Application ---');
  await page.goto(`${baseUrl}/?test=true`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#canvas-container canvas', { state: 'visible', timeout: 8000 });
  await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });
  await page.click('#btn-menu-start');
  await page.waitForSelector('#view-main-menu', { state: 'hidden', timeout: 4000 });

  const rooms = [
    'room_04',
    'sleep_ward',
    'hydrotherapy',
    'audiology',
    'archive',
    'directors_office',
    'synthesis_blackout',
    'velvet_lounge'
  ];

  console.log('\n--- Step 2: Camera 360-Degree Orbit & Extreme Pitch Stress ---');
  for (const roomId of rooms) {
    console.log(`Testing 360 orbit in [${roomId}]...`);
    await page.evaluate(async (rId) => {
      const app = window.__VAULT_APP__;
      await app.scenarioRegistry.loadScenarioById(rId, app.sceneManager.scene);
      await new Promise((r) => setTimeout(r, 100));
    }, roomId);

    const orbitAudit = await page.evaluate(async () => {
      const app = window.__VAULT_APP__;
      const cameraDirector = app.cameraDirector;
      const controls = cameraDirector.controls;
      const camera = cameraDirector.camera;

      const angles = [
        { theta: 0, phi: Math.PI / 4 },
        { theta: Math.PI / 2, phi: Math.PI / 3 },
        { theta: Math.PI, phi: Math.PI / 4 },
        { theta: (3 * Math.PI) / 2, phi: Math.PI / 6 },
        { theta: 0, phi: 0.15 }, // Near top-down limit
        { theta: Math.PI, phi: Math.PI / 2.1 } // Near ground limit
      ];

      const results = [];
      const radius = 4.5;

      for (const a of angles) {
        const x = radius * Math.sin(a.phi) * Math.sin(a.theta);
        const y = radius * Math.cos(a.phi);
        const z = radius * Math.sin(a.phi) * Math.cos(a.theta);

        camera.position.set(x, y + 0.85, z);
        controls.target.set(0, 0.85, 0);
        controls.update();

        const p = camera.position;
        const isValid = !isNaN(p.x) && !isNaN(p.y) && !isNaN(p.z) && isFinite(p.x) && isFinite(p.y) && isFinite(p.z);
        results.push(isValid);
      }

      return { allValid: results.every(Boolean), count: results.length };
    });

    if (!orbitAudit.allValid) {
      throw new Error(`Orbit stress failed in ${roomId}: camera position became NaN or infinite.`);
    }
    console.log(`  Passed: ${orbitAudit.count} orbit viewpoints verified valid.`);
  }

  console.log('\n--- Step 3: Hotspot Camera Alignment & Raycast Validation ---');
  for (const roomId of rooms) {
    console.log(`\nAuditing hotspots & clickable targets in [${roomId}]...`);
    await page.evaluate(async (rId) => {
      const app = window.__VAULT_APP__;
      await app.scenarioRegistry.loadScenarioById(rId, app.sceneManager.scene);
      await new Promise((r) => setTimeout(r, 100));
    }, roomId);

    const roomReport = await page.evaluate(async () => {
      const app = window.__VAULT_APP__;
      const THREE = window.THREE;
      const scene = app.sceneManager.scene;
      const camera = app.cameraDirector.camera;
      const raycastMgr = app.raycastManager;
      const scenario = app.scenarioRegistry.getCurrentScenario();

      // Collect all interactive prop objects in this scenario
      const interactiveTargets = [];
      scene.traverse((obj) => {
        if (obj.name && (obj.name.startsWith('prop_') || obj.name.startsWith('door_') || obj.name.startsWith('crystal_') || obj.name === 'vault_crt_screen')) {
          if (!obj.userData.isSubPart) {
            interactiveTargets.push({
              name: obj.name,
              type: obj.type
            });
          }
        }
      });

      // Get world bounding boxes and test raycast line of sight
      const targetAudits = [];
      const hotspots = Object.keys(scenario?.hotspots || { overview: true });

      for (const target of interactiveTargets) {
        const obj = scene.getObjectByName(target.name);
        if (!obj) continue;

        const box = new THREE.Box3().setFromObject(obj);
        if (box.isEmpty()) continue;

        const center = new THREE.Vector3();
        box.getCenter(center);

        // Test raycast from overview hotspot
        app.cameraDirector.moveToHotspot('overview', 0);
        camera.updateMatrixWorld();

        // Project center to normalized screen coordinates
        const screenPos = center.clone().project(camera);
        const inFrustum = screenPos.x >= -1.2 && screenPos.x <= 1.2 && screenPos.y >= -1.2 && screenPos.y <= 1.2 && screenPos.z > 0 && screenPos.z < 1;

        // Perform raycast directly towards center
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(screenPos.x, screenPos.y), camera);
        const hits = raycaster.intersectObjects(scene.children, true);

        let resolvedTarget = null;
        let hitDistance = Infinity;
        let firstHitName = null;

        for (const hit of hits) {
          if (hit.object.name === 'Editor_Helpers_Group' || hit.object.userData.isHelper || hit.object.name === 'dev_visualizers_node') {
            continue;
          }
          if (!firstHitName) firstHitName = hit.object.name;

          const parent = raycastMgr.resolveInteractiveTarget(hit.object);
          if (parent) {
            resolvedTarget = parent.name;
            hitDistance = hit.distance;
            break;
          } else {
            // Check opacity blocking
            const mat = hit.object.material;
            if (mat) {
              const checkSolid = (m) => {
                if (m.transparent || m.opacity < 1) return false;
                if ('transmission' in m && m.transmission > 0) return false;
                return true;
              };
              const isOpaque = Array.isArray(mat) ? mat.some(checkSolid) : checkSolid(mat);
              if (isOpaque) break;
            }
          }
        }

        targetAudits.push({
          targetName: target.name,
          inFrustum,
          screenPos: { x: parseFloat(screenPos.x.toFixed(2)), y: parseFloat(screenPos.y.toFixed(2)) },
          firstHitName,
          resolvedTarget,
          hasResolution: resolvedTarget !== null
        });
      }

      return {
        hotspotsCount: hotspots.length,
        targetsCount: interactiveTargets.length,
        targetAudits
      };
    });

    console.log(`  Found ${roomReport.targetsCount} interactive targets across ${roomReport.hotspotsCount} hotspots.`);
    const resolvedCount = roomReport.targetAudits.filter((t) => t.hasResolution).length;
    console.log(`  Raycast resolutions from camera: ${resolvedCount} / ${roomReport.targetAudits.length} directly accessible.`);

    for (const audit of roomReport.targetAudits) {
      if (!audit.hasResolution) {
        console.log(`  [Notice] ${audit.targetName} not hit in line-of-sight from overview (may require specific camera hotspot or trigger, firstHit: ${audit.firstHitName})`);
      }
    }
  }

  console.log('\n--- Step 4: Rapid Click & Camera Lerp Race Condition Stress ---');
  await page.evaluate(async () => {
    const app = window.__VAULT_APP__;
    await app.scenarioRegistry.loadScenarioById('room_04', app.sceneManager.scene);
  });

  const raceAudit = await page.evaluate(async () => {
    const app = window.__VAULT_APP__;
    const bus = app.eventBus;
    const raycastMgr = app.raycastManager;

    let clickedDuringTransition = false;
    let clickCount = 0;

    bus.on('input:object_clicked', () => {
      clickCount++;
      if (app.cameraDirector.isTransitioning) {
        clickedDuringTransition = true;
      }
    });

    // Start a 400ms camera lerp
    bus.emit('camera:move_to_hotspot', { hotspotId: 'vault', durationMs: 400 });

    // Spam click attempts while camera is transitioning
    const domEl = app.sceneManager.renderer.domElement;
    for (let i = 0; i < 20; i++) {
      const upEvt = new PointerEvent('pointerup', { button: 0, clientX: 400, clientY: 300 });
      domEl.dispatchEvent(upEvt);
      await new Promise((r) => setTimeout(r, 10));
    }

    await new Promise((r) => setTimeout(r, 450));

    // Now after transition has finished, verify raycast manager is re-enabled
    const enabledAfterTransition = (raycastMgr).isEnabled;

    return {
      clickedDuringTransition,
      clickCount,
      enabledAfterTransition
    };
  });

  console.log('Race audit results:', raceAudit);
  if (raceAudit.clickedDuringTransition) {
    throw new Error('RaycastManager failed to block clicks during active camera transition!');
  }
  if (!raceAudit.enabledAfterTransition) {
    throw new Error('RaycastManager failed to re-enable after camera transition completed!');
  }
  console.log('PASSED: Clicks during camera transitions are strictly rejected; raycasting smoothly re-enables on arrival.');

  console.log('\n--- Step 5: Modal Dismissal & Raycast Re-Enabling Stress ---');
  const modalAudit = await page.evaluate(async () => {
    const app = window.__VAULT_APP__;
    const bus = app.eventBus;
    const raycastMgr = app.raycastManager;

    // Simulate modal opened
    bus.emit('ui:modal_opened', { modalId: 'test-modal' });
    const disabledDuringModal = !(raycastMgr).isEnabled;

    // Simulate modal closed
    bus.emit('ui:modal_closed', { modalId: 'test-modal' });
    const enabledAfterModal = (raycastMgr).isEnabled;

    return { disabledDuringModal, enabledAfterModal };
  });

  if (!modalAudit.disabledDuringModal || !modalAudit.enabledAfterModal) {
    throw new Error(`Modal raycast toggle failed: ${JSON.stringify(modalAudit)}`);
  }
  console.log('PASSED: Raycasting is safely disabled during modal overlays and restores on close.');

  console.log('\n--- Step 6: Console Error Verification ---');
  if (consoleErrors.length > 0) {
    throw new Error(`Encountered browser errors during raycasting and camera audit: ${consoleErrors.join(', ')}`);
  }
  console.log('PASSED: 0 console errors during camera and raycasting stress testing.');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  console.log(`[TEST SERVER] Running on ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--autoplay-policy=no-user-gesture-required']
  });
  const page = await browser.newPage();
  let exitCode = 0;
  try {
    await runSuite(page, baseUrl);
    console.log('\n====================================================');
    console.log('ALL CAMERA, RAYCASTING & RACE CONDITION TESTS PASSED');
    console.log('====================================================');
  } catch (err) {
    console.error('[TEST FAILURE]', err);
    exitCode = 1;
  } finally {
    await browser.close();
    close();
    process.exit(exitCode);
  }
}
