import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { startTestServer } from './helpers/testServer.js';

export async function runSuite(page, baseUrl) {
  const consoleErrors = [];
  const errorHandler = (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('404') && (text.includes('.mp3') || text.includes('.glb') || text.includes('Failed to load resource'))) {
        return;
      }
      consoleErrors.push(text);
      console.error(`[Browser Error] ${text}`);
    }
  };
  const pageErrorHandler = (err) => {
    consoleErrors.push(err.message);
    console.error(`[Page Error] ${err.message}`);
  };

  page.on('console', errorHandler);
  page.on('pageerror', pageErrorHandler);

  try {
    console.log('--- Step 1: Application Bootstrap ---');
    await page.goto(`${baseUrl}/?test=true`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 8000 });
    await page.click('#btn-menu-start');
    await page.waitForSelector('#view-main-menu', { state: 'hidden', timeout: 4000 });

    console.log('--- Step 2: Audit All 7 Scenario Room Geometries in Registry ---');
    const scenarioAudit = await page.evaluate(async () => {
      const app = window.__VAULT_APP__;
      const THREE = window.THREE;
      const scenarioIds = [
        'room_04',
        'sleep_ward',
        'hydrotherapy',
        'audiology',
        'archive',
        'directors_office',
        'synthesis_blackout',
        'velvet_lounge'
      ];

      const results = {};

      for (const id of scenarioIds) {
        await app.scenarioRegistry.loadScenarioById(id, app.sceneManager.scene);
        await new Promise((r) => setTimeout(r, 60));

        let meshCount = 0;
        let totalVertices = 0;
        let invalidBoundingBoxes = 0;
        let nanVerticesFound = 0;
        let missingMaterials = 0;

        app.sceneManager.scene.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            meshCount++;
            const geom = node.geometry;
            if (!geom) {
              invalidBoundingBoxes++;
              return;
            }

            if (!geom.boundingBox) {
              geom.computeBoundingBox();
            }

            const box = geom.boundingBox;
            if (!box || isNaN(box.min.x) || isNaN(box.min.y) || isNaN(box.min.z) ||
                isNaN(box.max.x) || isNaN(box.max.y) || isNaN(box.max.z)) {
              invalidBoundingBoxes++;
            }

            const posAttr = geom.getAttribute('position');
            if (posAttr) {
              totalVertices += posAttr.count;
              for (let i = 0; i < posAttr.count; i++) {
                if (isNaN(posAttr.getX(i)) || isNaN(posAttr.getY(i)) || isNaN(posAttr.getZ(i))) {
                  nanVerticesFound++;
                  break;
                }
              }
            } else {
              invalidBoundingBoxes++;
            }

            if (!node.material) {
              missingMaterials++;
            }
          }
        });

        results[id] = {
          meshCount,
          totalVertices,
          invalidBoundingBoxes,
          nanVerticesFound,
          missingMaterials
        };
      }

      return results;
    });

    console.log('Scenario geometry audit results:', JSON.stringify(scenarioAudit, null, 2));

    for (const [scenarioId, data] of Object.entries(scenarioAudit)) {
      if (data.meshCount === 0) {
        throw new Error(`Scenario ${scenarioId} generated 0 meshes`);
      }
      if (data.totalVertices === 0) {
        throw new Error(`Scenario ${scenarioId} has 0 vertices`);
      }
      if (data.invalidBoundingBoxes > 0) {
        throw new Error(`Scenario ${scenarioId} has ${data.invalidBoundingBoxes} invalid bounding boxes`);
      }
      if (data.nanVerticesFound > 0) {
        throw new Error(`Scenario ${scenarioId} has ${data.nanVerticesFound} NaN vertices`);
      }
      if (data.missingMaterials > 0) {
        throw new Error(`Scenario ${scenarioId} has ${data.missingMaterials} missing materials`);
      }
    }
    console.log('PASSED: All 7 scenario rooms have valid non-empty meshes, finite bounds, and valid materials.');

    console.log('--- Step 3: Audit Room 04 Non-Coplanar Geometry Offsets & Z-Fighting ---');
    const zFightingCheck = await page.evaluate(async () => {
      const app = window.__VAULT_APP__;
      await app.scenarioRegistry.loadScenarioById('room_04', app.sceneManager.scene);
      await new Promise((r) => setTimeout(r, 60));

      const findObj = (name) => {
        let found = null;
        app.sceneManager.scene.traverse((node) => {
          if (node.name === name) found = node;
        });
        return found;
      };

      const obsFrame = findObj('obs_frame');
      const obsGlass = findObj('obs_glass');
      const corridorFrame = findObj('corridor_lintel') || findObj('corridor_jamb_left');
      const archwayReveal = findObj('corridor_reveal_left') || findObj('corridor_reveal_right');
      const corridorDoor = findObj('door_corridor');
      const exitDoorFrame = findObj('exit_lintel') || findObj('exit_jamb_back');
      const exitArchReveal = findObj('exit_reveal_back') || findObj('exit_reveal_front');
      const exitDoorPanel = findObj('prop_door');
      const vaultChassis = findObj('prop_vault');
      const faceplate = findObj('vault_faceplate');

      return {
        hasObsFrame: !!obsFrame,
        hasObsGlass: !!obsGlass,
        obsFramePosZ: obsFrame ? obsFrame.position.z : null,
        obsGlassPosZ: obsGlass ? obsGlass.position.z : null,
        glassOffset: obsFrame && obsGlass ? Math.abs(obsGlass.position.z - obsFrame.position.z) : null,

        hasCorridorFrame: !!corridorFrame,
        hasArchwayReveal: !!archwayReveal,
        hasCorridorDoor: !!corridorDoor,
        corridorFramePosZ: corridorFrame ? corridorFrame.position.z : null,
        archwayRevealPosZ: archwayReveal ? archwayReveal.position.z : null,
        corridorSeparation: corridorFrame && archwayReveal ? Math.abs(corridorFrame.position.z - archwayReveal.position.z) : null,

        hasExitDoorFrame: !!exitDoorFrame,
        hasExitArchReveal: !!exitArchReveal,
        hasExitDoorPanel: !!exitDoorPanel,
        exitFramePosX: exitDoorFrame ? exitDoorFrame.position.x : null,
        exitArchPosX: exitArchReveal ? exitArchReveal.position.x : null,
        exitSeparation: exitDoorFrame && exitArchReveal ? Math.abs(exitDoorFrame.position.x - exitArchReveal.position.x) : null,

        hasVaultChassis: !!vaultChassis,
        hasFaceplate: !!faceplate,
        faceplatePosZ: faceplate ? faceplate.position.z : null
      };
    });

    console.log('Z-fighting geometry audit result:', JSON.stringify(zFightingCheck, null, 2));

    if (!zFightingCheck.hasObsFrame || !zFightingCheck.hasObsGlass) {
      throw new Error('Observation frame or glass mesh missing in Room 04');
    }
    if (zFightingCheck.glassOffset !== null && zFightingCheck.glassOffset < 0.001) {
      throw new Error(`Observation glass coplanar with frame: offset = ${zFightingCheck.glassOffset}`);
    }

    if (!zFightingCheck.hasCorridorFrame || !zFightingCheck.hasArchwayReveal) {
      throw new Error('Corridor frame or reveal mesh missing in Room 04');
    }
    if (zFightingCheck.corridorSeparation !== null && zFightingCheck.corridorSeparation < 0.001) {
      throw new Error(`Corridor frame coplanar with archway reveal: separation = ${zFightingCheck.corridorSeparation}`);
    }

    if (!zFightingCheck.hasExitDoorFrame || !zFightingCheck.hasExitArchReveal) {
      throw new Error('Exit door frame or reveal mesh missing in Room 04');
    }
    if (zFightingCheck.exitSeparation !== null && zFightingCheck.exitSeparation < 0.001) {
      throw new Error(`Exit door frame coplanar with exit reveal: separation = ${zFightingCheck.exitSeparation}`);
    }

    console.log('PASSED: Non-coplanar face separations strictly prevent Z-fighting on architectural apertures.');

    console.log('--- Step 4: Verify Room 04 Modular Sub-Factory Entities ---');
    const entityCheck = await page.evaluate(() => {
      const app = window.__VAULT_APP__;
      const expectedNames = [
        'prop_desk',
        'prop_chair',
        'prop_vault',
        'prop_telephone',
        'prop_key',
        'prop_painting',
        'prop_bell_jar',
        'prop_envelope',
        'door_corridor',
        'prop_door',
        'vault_dial',
        'vault_knife_switch',
        'vault_crt_screen',
        'specimen_core'
      ];

      const found = {};
      app.sceneManager.scene.traverse((node) => {
        if (node.name && expectedNames.includes(node.name)) {
          found[node.name] = {
            type: node.type,
            visible: node.visible,
            hasPosition: !isNaN(node.position.x)
          };
        }
      });

      return {
        expectedCount: expectedNames.length,
        foundCount: Object.keys(found).length,
        missing: expectedNames.filter((name) => !found[name])
      };
    });

    console.log('Sub-factory entity verification:', entityCheck);
    if (entityCheck.missing.length > 0) {
      throw new Error(`Missing expected modular sub-factory entities: ${entityCheck.missing.join(', ')}`);
    }
    console.log('PASSED: All modular sub-factory components (Shell, Apparatus, Furniture, Props) are instantiated.');

    console.log('--- Step 5: Check Console Errors ---');
    if (consoleErrors.length > 0) {
      throw new Error(`Test failed with console errors: ${consoleErrors.join(' | ')}`);
    }
    console.log('PASSED: 0 console errors during 3D models and geometry test suite.');

    console.log('SUCCESS: All 3D model and geometry test assertions passed.');
  } finally {
    page.off('console', errorHandler);
    page.off('pageerror', pageErrorHandler);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  console.log(`3D Models & Geometry test server running on ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--autoplay-policy=no-user-gesture-required'
    ]
  });
  const page = await browser.newPage();
  let exitCode = 0;
  try {
    await runSuite(page, baseUrl);
  } catch (err) {
    console.error('TEST FAILED:', err);
    exitCode = 1;
  } finally {
    await browser.close();
    close();
    process.exit(exitCode);
  }
}
