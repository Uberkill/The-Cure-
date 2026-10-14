# The Vault: Sub-Level 04 - Technical Onboarding & Architecture Guide

## 1. Project Overview & Aesthetic Identity

"The Vault: Sub-Level 04" is an interactive 3D psychological thriller web application built with Three.js, Vite, and TypeScript.
The narrative and visual design follow a strict Bauhaus Modernist Psychological Horror aesthetic inspired by David Lynch (*Mulholland Drive*), Gore Verbinski (*A Cure for Wellness*), and *Severance*.

- **Setting:** Sanatorium of Cognitive Alignment, Sub-Level 04.
- **Protagonist:** Subject 104.
- **Visual Principles:**
  - Glazed sage-green ceramic subway tiles with bevel highlights and recessed grout bump maps.
  - Fine pale terrazzo floor with marble aggregate chips and symmetrical brass dividers.
  - Marcel Breuer tubular chrome and smoked teak Bauhaus furniture.
  - Titanium and chalk instrumentation with phosphor green CRT oscilloscope displays.
  - High-contrast clinical shadows via directional key and focused surgical spotlights.
  - Dark glassmorphic HUD overlays with hairline reticles, Outfit sans-serif typography, and zero generic modern UI tropes.

---

## 2. System Architecture & Modular Decoupling

The project avoids monolithic god-objects by enforcing decoupled boundaries mediated by a typed Publish/Subscribe EventBus. We enforce a Component-Scoped MVC architecture for our diegetic screens.

```
src/
├── main.ts                    # Application bootstrap, lifecycle loop, and resize handlers
├── types/
│   ├── index.ts               # Core TypeScript interfaces, GameStage enum, event payloads
│   └── cure.ts                # 8-Act narrative state slice interfaces
├── core/
│   ├── EventBus.ts            # Decoupled singleton pub/sub mediator
│   ├── GameState.ts           # Central Finite State Machine (FSM) & puzzle stages
│   ├── SaveManager.ts         # Persistent browser storage (schema v1), export/import & reset
│   ├── SaveManager.spec.ts    # Vitest unit tests for save serialization & hydration
│   └── Telemetry.ts           # Diagnostic logging, crash resilience & WebGL recovery
├── audio/
│   ├── AudioEngine.ts         # Multi-bus Web Audio synthesizer, sub-busses & brickwall limiter
│   ├── MechanicalSoundFX.ts   # Tactile click, latch, and switch SFX generator
│   └── MusicTrackManager.ts   # Custom track audio loader with smooth crossfading
├── rendering/
│   ├── SceneManager.ts        # Three.js renderer, ACESFilmic tone mapping, PCF shadows
│   ├── CameraDirector.ts      # OrbitControls & cinematic camera transitions with input locks
│   └── AnimatorSystem.ts      # Tween update pipeline for smooth prop animations
├── interaction/
│   ├── RaycastManager.ts      # Pointer raycasting, hierarchy traversal, dynamic reticle prompts
│   ├── InspectionManager.ts   # 3D key examination turntable mode with pin alignment
│   ├── DevTransformGizmo.ts   # Interactive 3D translation/rotation manipulation gizmo
│   └── InteractionPipelines.spec.ts # Vitest unit tests for raycast traversal & pin math
├── entities/
│   ├── ProceduralTextures.ts  # Canvas-generated ceramic tiles, terrazzo, CRT screen maps
│   ├── ProceduralRoom04.ts    # Procedural 3D geometry fallback for Room 04 (The Central Concourse)
│   ├── HubDecayManager.ts     # Progressive material rot, weeping, and fungal decay in Room 04
│   ├── CRTNodePatcher.ts      # 2D Canvas phosphor node-linking puzzle for crystal integration
│   └── room04/                # Modular Hub sub-assemblies (Shell, Props, Apparatus, Furniture)
├── scenarios/
│   ├── ScenarioRegistry.ts    # Chamber loader with recursive GPU VRAM disposal
│   ├── ScenarioRegistry.spec.ts # Vitest unit tests for scenario lifecycle & mutex locks
│   ├── Room04_SterileChamber.ts # Act I Central Concourse (The Sterile Reception)
│   ├── Room02_SleepWard.ts    # Act II Sleep Ward (2-step cart machine, dual-row cots, UV signs)
│   ├── Room03_Hydrotherapy.ts # Act III Hydrotherapy (Siphon pressure manifold)
│   ├── Room04_AudiologyVault.ts # Act IV Audiology Vault (Acoustic null & Chladni mandala)
│   ├── Room05_Archive.ts      # Act V Archive (Microfiche reader & pneumatic dispatch)
│   ├── Room06_DirectorsOffice.ts # Act VI Director's Office (Wiretap deck & carriage clock)
│   ├── Room07_SynthesisChamber.ts # Act VII Synthesis Chamber (Galvanometer bridge)
│   ├── Room08_VelvetLounge.ts # Act VIII Velvet Lounge (Switchboard & compliance finale)
│   └── Room99_Sandbox.ts      # Developer 3D sandbox chamber
└── ui/
    ├── UIManager.ts           # Global HUD overlays, subtitles, settings modal, and reticle prompts
    ├── ScreenManager.ts       # Transitions between 3D Canvas, Terminal, and Cinematic overlays
    ├── Dev3DEditorPanel.ts    # In-game inspector for live prop transform adjustments
    ├── CameraDisengageHUD.spec.ts # Vitest unit tests for camera disengage HUD
    ├── components/            # Tactile Brutalist physical instrumentation widgets
    │   ├── BourdonGauge.ts        # High-DPI dual-needle Bourdon tube pressure gauge
    │   ├── ClinicalClipboard.ts   # Tactile clipboard with dual metal clips and forms
    │   ├── MechanicalTumblerBank.ts # 3-digit brass tumbler code wheel with ratchet audio
    │   ├── PatchMatrix.ts         # Dual-tier telephone PBX switchboard jack matrix
    │   ├── ReelTapeTransport.ts   # Reel-to-reel tape transport with mechanical odometer
    │   ├── RotaryDial.ts          # Authentic spring-back mechanical rotary telephone dial
    │   ├── SightGlassManometer.ts # Vertical medical glass tube manometer with meniscus
    │   └── StripChartRecorder.ts  # Rolling galvanometer paper chart with jitter needle
    └── screens/               # Decoupled Component-Scoped MVC Diegetic Screens
        ├── DiegeticScreenBase.ts       # Abstract lifecycle, focus trapping, and ESC management
        ├── FacilityMapScreen.ts        # Top-down SVG blueprint, fog of war & non-linear transit
        ├── FacilityMapScreen.spec.ts   # Vitest unit tests for blueprint discovery & status
        ├── AssetManifestScreen.ts      # FORM 104-INV specimen ledger & evidence case
        ├── AssetManifestScreen.spec.ts # Vitest unit tests for asset manifest tray progression
        ├── StaffRosterScreen.ts        # FORM 108-STAFF clinical personnel directory
        ├── StaffRosterScreen.spec.ts   # Vitest unit tests for personnel dossier modal
        ├── ClinicalClipboardScreen.ts  # FORM 101-104 clinical intake clipboard overlay
        ├── TektronixCrtScreen.ts       # Act I Oscilloscope harmonic calibration
        ├── DispensaryCartScreen.ts     # Act II 2-Step Shutter & Sedative Infusion console
        ├── HydraulicManifoldScreen.ts  # Act III Siphon hydrostatic pressure valves
        ├── MicroficheViewerScreen.ts   # Act V Optical microfilm directory
        ├── WiretapTapeDeckScreen.ts    # Act VI Reel-to-reel deck & carriage clock controls
        ├── GalvanometerGridScreen.ts   # Act VII Resistor bridge network
        ├── SwitchboardMirrorScreen.ts  # Act VIII Patch cord jack routing
        ├── PuzzleInvariants.spec.ts    # Vitest unit tests for puzzle math invariants
        └── binaural/                   # Act IV MVC Component Structure
            ├── BinauralTemplate.ts        # HTML Template View
            ├── BinauralAudio.ts           # WebAudio synthesis layer
            ├── ChladniRenderer.ts         # Canvas 2D physics layer
            └── BinauralSynthesizerScreen.ts # Controller glue logic
```

---

## 3. Component-Scoped MVC UI Pattern

To maintain maintainability across 8 interactive puzzle consoles, each diegetic screen implements `IDiegeticScreen` via `DiegeticScreenBase`:
- State is strictly isolated inside the Controller.
- Pure HTML template generation is decoupled from interaction logic.
- Audio synthesis and 2D canvas simulation run in dedicated worker/renderer classes.
- Modals register lifecycle events (`ui:modal_opened`, `ui:modal_closed`) on `EventBus` to synchronize camera controls and focus traps.

---

## 4. The 3D Content & Asset Pipeline

Models are loaded via `ModelLoader.ts`. If an external `.glb` file is not present in `public/assets/models/`, the loader transparently falls back to procedural geometry primitives. This guarantees zero runtime crashes or missing-asset blocking during development.

---

## 5. Development & Testing Workflow

Execute commands from the repository root:

```powershell
# Typecheck
npm run typecheck

# Unit tests (71 tests across 11 suites covering save, math invariants, components, screens, and HUD)
npm run test:unit

# Fast unified regression test (Unit + Typecheck + Build + 27 E2E suites in ~68s)
npm run test:fast

# Interactive 3D Raycasting & Camera Disengage HUD Audit (12 browser assertions)
npm run test:raycast

# Persistence & Settings E2E Suite
npm run test:save

# Full automated integration pipeline (smoke test)
npm run test

# Run legacy concurrent test matrix (27 concurrent Playwright suites)
npm run test:all

# Recompile master documentation (Markdown & HTML)
npm run docs:build
```

### Test Authoring & Dual-Mode Contract
Every integration and E2E test script in `tests/` conforms to a standardized dual-mode contract:
1. **Runner Module Export**:
   Each test file must export an asynchronous suite entrypoint:
   ```javascript
   export async function runSuite(page, baseUrl) {
     // Perform navigation, interactions, and assertions
   }
   ```
   This allows `tests/run_all_fast.js` to run the suite inside a dedicated browser context (`browser.newContext()`) without launching a new Chromium process.
2. **Direct CLI Execution Guard**:
   Each test file retains an execution block for isolated CLI execution:
   ```javascript
   import { pathToFileURL } from 'url';
   import { startTestServer } from './helpers/testServer.js';

   const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('test_name.js');
   if (isMain) {
     const { server, baseUrl } = await startTestServer(0);
     // launch local browser, run suite, close server
   }
   ```
3. **Ephemeral Port Allocation**:
   Never hardcode static ports (such as 4188, 4198, or 4199). Use `server.listen(0)` via `tests/helpers/testServer.js` to obtain an available operating system port, preventing `EADDRINUSE` race conditions.
4. **State-Driven Assertions Over Fixed Sleeps**:
   Avoid arbitrary `page.waitForTimeout(1000)` calls. In test mode (`?test=true`), CameraDirector animation duration is forced to 0ms and CSS transitions are suppressed. Use deterministic DOM state checks (`page.waitForSelector`, `page.waitForFunction`) to maintain rapid test throughput.

---

## 6. Developer Mode & Clearance Cipher

Developer Mode provides comprehensive 3D scene inspection, gizmo transformations, and stage warping:
- **Toggle Access:** Press `Ctrl+Shift+D` or click the `#btn-open-dev-editor` button in the System Settings overlay (`#modal-settings`).
- **Clearance Cipher Challenge:**
  - Unlocking advanced developer controls requires entering the Subject Clearance Cipher: `104`.
  - Input field `#input-dev-passcode` validates the cipher upon submission (`#btn-dev-passcode-submit`).
  - Correct validation unseals the scene transform gizmo and scenario teleportation matrix.
  - Three consecutive invalid passcode attempts trigger a temporary 5-second lockout with tactile buzzer feedback to prevent accidental input spam.

### Save System Debugging
In the browser DevTools Console, inspect persisted state via:
```javascript
JSON.parse(localStorage.getItem('the_vault_save_record'))
```
To bypass save hydration and force a clean Act I test environment, append `?test=1` to the URL.
