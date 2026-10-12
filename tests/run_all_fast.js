import { chromium } from 'playwright';
import { startTestServer } from './helpers/testServer.js';

import { runSuite as runPair1 } from './test_pair_1_e2e.js';
import { runSuite as runPhase1Edge } from './test_phase1_edge_cases.js';
import { runSuite as runPair2 } from './test_pair_2_e2e.js';
import { runSuite as runPhase2Edge } from './test_phase2_edge_cases.js';
import { runSuite as runPair3 } from './test_pair_3_e2e.js';
import { runSuite as runPhase3Edge } from './test_phase3_edge_cases.js';
import { runSuite as runPair4 } from './test_pair_4_e2e.js';
import { runSuite as runPhase4Edge } from './test_phase4_edge_cases.js';
import { runSuite as runDeepEdge } from './test_deep_edge_cases_acts_3_to_8.js';
import { runSuite as run3dAudioStress } from './test_3d_and_audio_stress.js';
import { runSuite as runRoom04Audit } from './test_room04_audit_and_360.js';
import { runSuite as runInteractions } from './test_interactions_and_overlays.js';
import { runSuite as runFullDescent } from './test_full_descent_e2e.js';
import { runSuite as run3dEditor } from './test_3d_editor.js';
import { runSuite as run3dModelsGeom } from './test_3d_models_and_geometry.js';
import { runSuite as runPerfFramerate } from './test_performance_and_framerate.js';
import { runSuite as runUiAccessibility } from './test_ui_and_accessibility.js';
import { runSuite as runMemoryLeaks } from './test_memory_leak_transitions.js';
import { runSuite as runRapidClicks } from './test_rapid_click_resilience.js';
import { runSuite as runScenarioJumps } from './test_scenario_jump_buttons.js';
import { runSuite as runOnboardingSpeed } from './test_onboarding_speed.js';
import { runSuite as runFacilityMapCrt } from './test_facility_map_and_crt_progression.js';
import { runSuite as runAudiologyOverhaul } from './test_audiology_3d_overhaul.js';
import { runSuite as runBlueprintTransit } from './test_blueprint_non_linear_transit.js';
import { runSuite as runSaveSystemAudio } from './test_save_system_and_audio_settings.js';
import { runSuite as runAppE2E } from './test_app_e2e.js';

const SUITES = [
  { name: 'Pair 1 E2E (Acts I & II)', run: runPair1 },
  { name: 'Phase 1 Edge Cases', run: runPhase1Edge },
  { name: 'Pair 2 E2E (Acts III & IV)', run: runPair2 },
  { name: 'Phase 2 Edge Cases', run: runPhase2Edge },
  { name: 'Pair 3 E2E (Acts V & VI)', run: runPair3 },
  { name: 'Phase 3 Edge Cases', run: runPhase3Edge },
  { name: 'Pair 4 E2E (Acts VII & VIII)', run: runPair4 },
  { name: 'Phase 4 Edge Cases', run: runPhase4Edge },
  { name: 'Deep Edge Cases (Acts III - VIII)', run: runDeepEdge },
  { name: '3D & Audio Stress', run: run3dAudioStress },
  { name: 'Room 04 Audit & 360 Examination', run: runRoom04Audit },
  { name: 'Interactions & Overlays Audit', run: runInteractions },
  { name: 'Full Descent 8-Act Walkthrough', run: runFullDescent },
  { name: '3D Room Editor', run: run3dEditor },
  { name: '3D Models & Geometry Audit', run: run3dModelsGeom },
  { name: 'Performance & Framerate Budgets', run: runPerfFramerate },
  { name: 'UI & Accessibility Standards', run: runUiAccessibility },
  { name: 'Memory Leak Transitions', run: runMemoryLeaks },
  { name: 'Rapid Click Resilience', run: runRapidClicks },
  { name: 'Scenario Jump Buttons Sync', run: runScenarioJumps },
  { name: 'Onboarding Speed Responsiveness', run: runOnboardingSpeed },
  { name: 'Facility Map & CRT Progression', run: runFacilityMapCrt },
  { name: 'Audiology 3D Overhaul', run: runAudiologyOverhaul },
  { name: 'Blueprint Non-Linear Transit', run: runBlueprintTransit },
  { name: 'Save System & Audio Settings', run: runSaveSystemAudio },
  { name: 'App E2E Core Verification', run: runAppE2E }
];

const WATCHDOG_TIMEOUT_MS = 35000;

async function main() {
  const overallStart = Date.now();
  console.log('================================================================');
  console.log('STARTING CONSOLIDATED HIGH-SPEED TEST RUNNER');
  console.log(`Registered Suites: ${SUITES.length}`);
  console.log('================================================================');

  const { baseUrl, close: closeServer } = await startTestServer();
  console.log(`[TEST SERVER] Ephemeral static server live at ${baseUrl}`);

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--autoplay-policy=no-user-gesture-required'
    ]
  });

  const cleanup = async () => {
    try {
      await browser.close();
    } catch {
      // Browser may already be closed
    }
    closeServer();
  };

  process.once('SIGINT', async () => {
    console.log('\n[ABORT] SIGINT received, cleaning up...');
    await cleanup();
    process.exit(1);
  });
  process.once('SIGTERM', async () => {
    console.log('\n[ABORT] SIGTERM received, cleaning up...');
    await cleanup();
    process.exit(1);
  });

  const results = [];
  let failedCount = 0;

  try {
    for (let i = 0; i < SUITES.length; i++) {
      const suite = SUITES[i];
      const suiteIndexStr = `[${String(i + 1).padStart(2, '0')}/${String(SUITES.length).padStart(2, '0')}]`;
      console.log(`\n${suiteIndexStr} RUNNING: ${suite.name}`);
      const suiteStart = Date.now();

      // Launch fresh isolated browser context for 100% state encapsulation
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 }
      });
      const page = await context.newPage();

      let suiteError = null;
      let watchdogTimer = null;

      try {
        const suitePromise = suite.run(page, baseUrl);
        const watchdogPromise = new Promise((_, reject) => {
          watchdogTimer = setTimeout(() => {
            reject(new Error(`Suite exceeded watchdog timeout (${WATCHDOG_TIMEOUT_MS}ms)`));
          }, WATCHDOG_TIMEOUT_MS);
        });

        await Promise.race([suitePromise, watchdogPromise]);
      } catch (err) {
        suiteError = err;
      } finally {
        if (watchdogTimer) clearTimeout(watchdogTimer);
        // Explicitly close context to destroy WebGL canvases and reclaim GPU resources
        try {
          await context.close();
        } catch {
          // Context may have already closed
        }
      }

      const durationMs = Date.now() - suiteStart;
      const durationSec = (durationMs / 1000).toFixed(2);

      if (suiteError) {
        failedCount++;
        console.error(`${suiteIndexStr} FAILED (${durationSec}s): ${suiteError.message || suiteError}`);
        results.push({ name: suite.name, status: 'FAIL', durationSec, error: suiteError.message || String(suiteError) });
      } else {
        console.log(`${suiteIndexStr} PASSED (${durationSec}s)`);
        results.push({ name: suite.name, status: 'PASS', durationSec, error: null });
      }
    }
  } finally {
    await cleanup();
  }

  const totalDurationSec = ((Date.now() - overallStart) / 1000).toFixed(2);

  console.log('\n================================================================');
  console.log('TEST EXECUTION SUMMARY');
  console.log('================================================================');
  for (const r of results) {
    const statusCol = r.status.padEnd(6);
    const durationCol = `${r.durationSec}s`.padStart(7);
    const line = `${statusCol} | ${durationCol} | ${r.name}`;
    if (r.status === 'PASS') {
      console.log(line);
    } else {
      console.error(`${line} -> ${r.error}`);
    }
  }
  console.log('----------------------------------------------------------------');
  console.log(`TOTAL DURATION: ${totalDurationSec}s`);
  console.log(`PASSED: ${SUITES.length - failedCount} / ${SUITES.length}`);
  console.log(`FAILED: ${failedCount} / ${SUITES.length}`);
  console.log('================================================================');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('CRITICAL RUNNER EXCEPTION:', err);
  process.exit(1);
});
