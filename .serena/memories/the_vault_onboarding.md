# Project Memory: The Vault: Room 04

## Project Overview
Interactive 3D psychological thriller web simulation built in Three.js, Vite, and TypeScript.
Path: `C:\Users\oob\.gemini\antigravity\scratch\the-vault`
Aesthetic: Bauhaus Modernist Psychological Horror (David Lynch, A Cure for Wellness, Severance).

## Architecture & Subsystems
- **EventBus**: `src/core/EventBus.ts` typed publish/subscribe singleton mediator.
- **GameState**: `src/core/GameState.ts` FSM managing acts from ACT_1_HUB_AWAKEN to ACT_8_SUBWAY_CLIMAX.
- **ScenarioRegistry**: `src/scenarios/ScenarioRegistry.ts` dynamic room swapping with recursive GPU memory cleanup (`disposeHierarchy()`) and automatic audio teardown.
- **Room 04 Architectural Doors & 360 Enclosure**: `src/entities/ProceduralRoom04.ts`
  - Back Wall ($z = -6.78$): Centered Forward Observation Corridor door in dedicated architectural frame ($x \in [-1.0, 1.0]$) with green status LED and dark peephole door panel.
  - Left Wall ($x = -6.78$): Heavy Exit Blastdoor assembly ($z \in [-3.8, -2.2]$) with brass lock wheel, perimeter ribs, and red status LED.
  - Wall wainscots and upper plaster walls are split cleanly around door openings with zero coplanar faces (zero Z-fighting). Redundant white door removed.
  - Complete 4-wall perimeter enclosure (Back, Left, Right with acoustic vent panel, Front with observation window, and Ceiling with recessed cove).
  - Glass bell jars use `transparent: false`, `transmission: 0.95`, `depthWrite: true`, `renderOrder: 10` for depth sorting stability.
- **CameraDirector**: `src/rendering/CameraDirector.ts` clamped 360-degree orbital controls (`minPolarAngle: Math.PI / 6`, `maxPolarAngle: Math.PI / 2.08`, `minDistance: 1.2`, `maxDistance: 6.4`) with dedicated hotspots (`vault`, `door`, `corridor`, `desk`, `phone`, `bell`, `envelope`).
- **Persistent Header HUD**: `src/ui/UIManager.ts` & `src/ui/style.css` top-left Act and room titles permanently visible (`opacity: 1`) without fading out.
- **Settings Modal & Acoustic Synthesis Controls**:
  - Main game viewport kept purely cinematic; floating audio buttons moved into `#modal-settings` under "Acoustic Synthesis Layers" (`#btn-drone`, `#btn-flicker`, `#btn-phone`).
  - Subtle faded gear button at bottom-right opens settings.
  - Master bus DynamicsCompressorNode limiter (-14dB, knee 24, ratio 10:1) preventing digital clipping.
  - Active sweep oscillator cancellation preventing voice stacking explosions during rapid frequency sweeps.
- **Act 1 Vault Gameplay Flow**:
  - Harmonic resonance suite UI (`#freq-console`) remains hidden at start and is only displayed when clicking the 3D Vault apparatus (`hotspotId === 'vault'`).
  - Player inspects dossier on desk for 528 Hz target, tunes console dial to 528 Hz, throws relay switch, unsealing the forward corridor door into Act 2.

## Runbook & Verification
- Typecheck: `npm run typecheck`
- Production Build: `npm run build`
- Test Suite: `npm test`
- All Tests: `npm run test:all`
- Automated Suites:
  1. `test_3d_and_audio_stress.js` (AABB 3D prop collision check, audio burst limiting, VRAM leak disposal, aspect ratio sync, tab visibility suspension).
  2. `test_room04_audit_and_360.js` (Audio startup silence, manual drone toggle in settings, permanent top-left header HUD, 4-wall 360 geometry, interior orbit bounds).
  3. `test_interactions_and_overlays.js` (Modal X close, key turntable, drag vs click).
  4. `test_full_descent_e2e.js` (8-act point-and-click descent).
- Windows Launchers: `start.bat`, `run.bat`.

## Knowledge Graph (Graphify)
The project is indexed in `graphify-out/`:
- `graphify-out/graph.json` (1,831 nodes, 3,881 edges, 112 communities)
- `graphify-out/GRAPH_REPORT.md`
- `graphify-out/graph.html`
- `graphify-out/GRAPH_TREE.html`
- Query CLI: `python -m graphify query "<question>"`
- Rebuild: `python run_graphify_pipeline.py`