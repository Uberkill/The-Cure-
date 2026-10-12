# THE VAULT: MASTER DOCUMENTATION

*This document is an automated compilation of all technical, architectural, and design documentation for The Vault project.*

---

# The Vault: Sub-Level 04

An interactive 3D psychological thriller web application built with Three.js, Vite, and TypeScript.
Aesthetic direction: Bauhaus Modernist Psychological Horror (*A Cure for Wellness*, *Severance*, David Lynch).

For technical onboarding, architecture breakdowns, and scenario guidelines:
- Technical Onboarding: [docs/ONBOARDING.md](docs/ONBOARDING.md)
- System Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Design System & Aesthetic Tokens: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)
- Narrative Lore & Puzzle Bible: [docs/DIEGETIC_PUZZLE_BIBLE.md](docs/DIEGETIC_PUZZLE_BIBLE.md)

---

## Chambers & Narrative Progression

The facility comprises 8 connected sectors centered around the Central Hub (Room 04):

1. **Act I: The Reception (Room 04 - Sterile Chamber)**: Central Hub awakening, rotary telephone intake, brass shunt calibration, Tektronix 545B CRT harmonic lock, blastdoor breach.
2. **Act II: The Sleep Ward (Room 02 - Sleep Ward)**: Dormitory isolation, 2-step sequential dispensary machine: Step 1 mechanical shutter (intake code 1-0-4 from clinical charts) unlocking Step 2 internal infusion console (68 BPM peristaltic drip sync + ultraviolet chemical triad [Nitrous - Bromide - Valerian]), unoccluded Cot 104 UV markings (Recovery of Memory Crystal 01: Quartz).
3. **Act III: Hydrotherapy (Room 03 - Hydrotherapy Suite)**: Siphon manifold hydrostatic pressure balance (volume invariant = 6 units), submerged drain hatch unseal (Recovery of Memory Crystal 02: Bronze).
4. **Act IV: The Audiology Vault (Room 04 - Audiology Vault)**: Acoustic null alignment via dual flared directional horns (45 deg / 135 deg azimuth), 741 Hz carrier frequency lock, 180 deg phase cancellation, Chladni plate nodal mandala stabilization (Recovery of Memory Crystal 03: Amethyst).
5. **Act V: The Archive (Room 05 - Archive)**: Microfiche optical viewer, spool alignment, focus correction, Sector Gamma-07 pneumatic dispatch tube canister routing (Recovery of Memory Crystal 04: Obsidian).
6. **Act VI: The Director's Office (Room 06 - Director's Office)**: Nagra SN wiretap tape decode at 0.5x speed, desk carriage clock escapement synchronization to 11:03, executive safe release (Recovery of Memory Crystal 05: Celadon).
7. **Act VII: Synthesis (Room 07 - Synthesis Chamber)**: Galvanometer resistance bridge balancing (100 Ohm equilibrium), 5-crystal cathode core harmonic alignment, facility blackout.
8. **Act VIII: The Velvet Lounge (Room 08 - Velvet Lounge)**: Lynchian chevron floor sanctuary, crystal decanter libation, 1950s telephone switchboard jack routing, compliance payphone finale.

---

## Diegetic Facility Blueprint

Sub-Level 04 includes an interactive architectural blueprint accessible via the **[FACILITY SCHEMATIC]** HUD button or direct in-world interaction with the blueprint board near the Hub blastdoor.
- **Top-Down Architectural Drafting**: 2D SVG floorplan rendered in mid-century clinical drafting style.
- **Fog of War Discovery**: Unvisited chambers are redacted with dark crosshatching and classified bars; visited chambers reveal room schematics, active beacons, and clearance status.
- **Custom Site Iconography**: Unique architectural line icons for each of the 8 sectors.
- **Alignment Progress Tracker**: Displays global facility synchronization status (e.g., 1 / 8 Sectors Synchronized) with status pips.
- **Non-Linear Navigation**: Enables instant bidirectional transit between the Central Hub and unlocked spoke chambers.

---

## Persistence & Audio Calibration Subsystems

- **Diegetic Save System (`SaveManager`)**: Automatic schema v1 persistence to `localStorage` key `the_vault_save_record` on progression milestones (stage transitions, crystal recovery, CRT node patching, inventory additions, and sector travel). Supports manual save, JSON case record export/import (`subject_104_case_record.json`), and atomic purge/reset to Act I baseline.
- **Multi-Bus Audio Routing (`AudioEngine`)**: Master brickwall limiter feeding independent `sfxGain` and `ambientGain` sub-busses. Provides dedicated level sliders with live percentage badges for Master Audio, Mechanical Apparatus SFX, and Ambient Room Tone, plus a continuous 45 Hz binaural drone toggle.
- **Optics & Immersion Controls**: Observation subtitles toggle, CRT scanline mesh overlay toggle, mouse parallax drift toggle, and camera re-alignment button.

---

## Quickstart

### 1. Windows Batch Launcher
Double-click `start.bat` to install dependencies (if needed), launch the Vite development server, and open the application in the default browser.

### 2. Manual Commands
```powershell
# Install dependencies
npm install

# Typecheck source code (strict: true)
npm run typecheck

# Production build bundle
npm run build

# Run unit tests (44 tests across 8 test suites)
npm run test:unit

# Run full fast test pipeline (Unit + Typecheck + Vite Build + 26 E2E suites in ~68s)
npm run test:fast

# Run smoke integration pipeline (Unit + Typecheck + Blueprint + Save + 3D Stress + 360 Audit)
npm run test

# Run legacy concurrent test matrix (44 unit tests + 26 concurrent Playwright E2E suites)
npm run test:all

# Recompile master documentation (Markdown & printable HTML)
npm run docs:build

# Start local development server
npm run dev
```

---

## Automated Test Harness

The testing suite features a dual-mode execution contract. All 26 test scripts under `tests/` export `runSuite(page, baseUrl)` for the unified, single-browser test runner (`tests/run_all_fast.js`), while retaining an independent execution guard (`isMain` checking `import.meta.url`) that launches an ephemeral static server (`server.listen(0)`) for standalone CLI debugging.

### Master Regression Runners
```powershell
# Unified Zero-Leak Full Suite (~68s, 1 Chromium process, isolated browser contexts)
npm run test:fast

# Smoke Test (Unit + 5 Core Integration Tests)
npm run test

# Unit Tests (44 Vitest assertions)
npm run test:unit
```

### Granular Scenario & Stress Suites
Individual test suites can be executed standalone in under 4 seconds without port collisions:

```powershell
# E2E Scenario Progression Suites
npm run test:pair1         # Acts I & II (Hub & Sleep Ward)
npm run test:pair2         # Acts III & IV (Hydrotherapy & Audiology)
npm run test:pair3         # Acts V & VI (Archive & Director's Office)
npm run test:pair4         # Acts VII & VIII (Synthesis & Velvet Lounge)

# Persistence & Settings Suite
npm run test:save          # SaveManager localStorage, auto-save reload & audio sliders

# Edge Case Validation Suites
npm run test:edge          # Act I edge cases & input limits
npm run test:phase2-edge   # Acts III & IV boundary conditions
npm run test:phase3-edge   # Acts V & VI boundary conditions
npm run test:phase4-edge   # Acts VII & VIII boundary conditions
npm run test:deep-edge     # Cross-chamber deep regression matrix

# Facility Blueprint & Navigation
npm run test:facility      # Blueprint modal lifecycle & CRT auto-patch
npm run test:blueprint     # Non-linear cross-spoke transit & state persistence

# Stress & Quality Audits
npm run test:memory        # VRAM disposal & WebGL leak validation
npm run test:click         # Rapid input & event queue stress
npm run test:perf          # Framerate & render budget benchmark
npm run test:ui            # Contrast, ARIA, and DOM accessibility
```



---

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
│   ├── ProceduralRoom04.ts    # Procedural 3D geometry fallback for Room 04 (The Central Hub)
│   ├── HubDecayManager.ts     # Progressive material rot, weeping, and fungal decay in Room 04
│   ├── CRTNodePatcher.ts      # 2D Canvas phosphor node-linking puzzle for crystal integration
│   └── room04/                # Modular Hub sub-assemblies (Shell, Props, Apparatus, Furniture)
├── scenarios/
│   ├── ScenarioRegistry.ts    # Chamber loader with recursive GPU VRAM disposal
│   ├── ScenarioRegistry.spec.ts # Vitest unit tests for scenario lifecycle & mutex locks
│   ├── Room04_SterileChamber.ts # Act I Central Hub
│   ├── Room02_SleepWard.ts    # Act II Sleep Ward (2-step cart machine & UV signs)
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
    └── screens/               # Decoupled Component-Scoped MVC Diegetic Screens
        ├── DiegeticScreenBase.ts       # Abstract lifecycle, focus trapping, and ESC management
        ├── FacilityMapScreen.ts        # Top-down SVG blueprint, fog of war & non-linear transit
        ├── FacilityMapScreen.spec.ts   # Vitest unit tests for blueprint discovery & status
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

Execute commands from `C:\Users\oob\.gemini\antigravity\scratch\the-vault`:

```powershell
# Typecheck
npm run typecheck

# Unit tests (44 tests covering save schema, math invariants, state, registry, and interactions)
npm run test:unit

# Fast unified regression test (Unit + Typecheck + Build + 26 E2E suites in ~68s)
npm run test:fast

# Persistence & Settings E2E Suite
npm run test:save

# Full automated integration pipeline (smoke test)
npm run test

# Run legacy concurrent test matrix (26 concurrent Playwright suites)
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

   const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
   if (isMain) {
     const { server, baseUrl } = await startTestServer(0);
     // launch local browser, run suite, close server
   }
   ```
3. **Ephemeral Port Allocation**:
   Never hardcode static ports (such as 4188, 4198, or 4199). Use `server.listen(0)` via `tests/helpers/testServer.js` to obtain an available operating system port, preventing `EADDRINUSE` race conditions.
4. **State-Driven Assertions Over Fixed Sleeps**:
   Avoid arbitrary `page.waitForTimeout(1000)` calls. In test mode (`?test=true`), CameraDirector animation duration is forced to 0ms and CSS transitions are suppressed. Use deterministic DOM state checks (`page.waitForSelector`, `page.waitForFunction`) to maintain rapid test throughput.

### Save System Debugging
In the browser DevTools Console, inspect persisted state via:
```javascript
JSON.parse(localStorage.getItem('the_vault_save_record'))
```
To bypass save hydration and force a clean Act I test environment, append `?test=1` to the URL.


---

# The Vault: Sub-Level 04 - Design System Specification

This document defines the visual identity, typographic hierarchy, color tokens, and UI component standards for "The Vault: Sub-Level 04".

---

## 1. Aesthetic Concept: Analogue Clinical Brutalism

The interface simulates physical case dossiers, architectural blueprints, and mid-century clinical apparatus from a 1970s clandestine sanatorium. It relies on stark contrast, tactile physical affordances, rigorous typography, and strict functional minimalism.

### Non-Negotiable Guardrails
* **Zero Emojis**: Emojis are strictly prohibited in UI components, buttons, tooltips, logs, comments, and commit messages. Iconography must use pure SVG line art or monospace typographic markers.
* **No Generic AI Aesthetics**: Avoid purple or indigo gradient borders, blurred orbs, floating glowing cards, and empty hero cards with sparkle icons.
* **Physical Diegesis**: Every interaction represents authentic physical mid-century materials: ivory cardstock, Bakelite, smoked teak, brushed stainless steel, and stamped ink.

---

## 2. Color Palette Tokens

```css
:root {
  /* Architectural Color Tokens */
  --color-alabaster: #EDF0EB;       /* Primary cardstock paper & modal housing */
  --color-sage-deep: #2D4A3E;       /* Clinical glazed tile & active system accents */
  --color-terrazzo-base: #D8DED6;   /* Terrazzo stone aggregate & muted paneling */
  --color-brass-cast: #C28833;      /* Instrument dials, knife shunts & lock housings */
  --color-teak-smoked: #1F1A18;     /* Furniture woodwork & heavy Bakelite components */
  --color-crimson-wax: #8B1E23;     /* Classified seals, danger states, purge alerts */
  --color-crimson-glow: #B8282E;    /* Active warning indicator lamps */
  --color-chrome-tubular: #D4D8DB;  /* Medical chassis, caster rings, IV poles */
  --color-crt-phosphor: #4ADE80;    /* Oscilloscope raster waveforms & signal traces */
  --color-crt-amber: #FBBF24;       /* Standby telemetry & warning readouts */

  /* Typographic Ink Tokens */
  --ink-primary: #141A21;           /* Deep ink black for titles, primary body, active borders */
  --ink-secondary: #4A5568;         /* Subheadings, clinical field labels, active controls */
  --ink-muted: #718096;             /* Telemetry labels, disabled metadata, inactive pips */

  /* Glass & Depth Tokens */
  --glass-bg: rgba(246, 248, 246, 0.88);   /* Frosted cardstock backdrop filter */
  --glass-border: rgba(20, 26, 33, 0.08); /* 1px hairline boundary stroke */
}
```

---

## 3. Typographic Hierarchy

All typography uses deliberate Google Fonts loaded in `src/ui/style.css`:

```html
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');
```

| Role | Font Family | Weight & Tracking | Usage |
|---|---|---|---|
| **Editorial Serif** | `'Playfair Display', Georgia, serif` | 400 / 600, Normal Tracking | Chapter titles, chamber headings, dossier card names, modal headlines |
| **Clinical Geometric Sans** | `'Outfit', -apple-system, sans-serif` | 300 / 400 / 500, Tight Tracking | Body text, patient case narratives, instructions, button labels |
| **Typewritten Monospace** | `'JetBrains Mono', monospace` | 400 / 500, Wide Tracking (`0.12em`–`0.2em`) | Coordinates, timestamps, status telemetry, classified tags, rubber stamps |

### Monospace Rule
All technical metadata, sector codes, and telemetry strings MUST be styled in uppercase with explicit letter tracking:
```css
font-family: var(--font-mono);
text-transform: uppercase;
letter-spacing: 0.15em;
```

---

## 4. UI Component Library

### 4.1. Circular Tactile Action Buttons (`.settings-gear-btn`, `.backpack-btn`)
* **Geometry**: `44x44px` circular container adhering to touch target minimums.
* **Affordance**: 1px solid `rgba(20, 26, 33, 0.18)` border, `rgba(235, 239, 235, 0.85)` background, `backdrop-filter: blur(4px)`.
* **Iconography**: Clean 22x22px inline SVG icon with `stroke-width: 1.75`.
* **Motion**: Smooth `250ms` rotation or scale transform on hover with subtle drop shadow.

### 4.2. Tactile Pill Buttons (`.pill-btn`)
* **Shape**: Full capsule curve (`border-radius: 40px`).
* **Standard Variant**: Transparent background, 1px solid `var(--ink-primary)` border, dark text. Inverts to solid `var(--ink-primary)` with ivory text on hover.
* **Primary Variant (`.pill-btn-primary`)**: Solid dark slate background (`#2d3748`), ivory text, elevated drop shadow.
* **Danger Variant (`.pill-btn-danger`)**: 1px solid `var(--color-crimson-wax)` border, crimson text. Inverts to crimson background on hover.

### 4.3. Dossier Panels & Cardstock Cards (`.dossier-paper`, `.facility-sector-card`)
* **Material**: Ivory cardstock background (`#edf0eb` / `#f8faf7`), 1px hairline border (`rgba(20, 26, 33, 0.12)`).
* **Depth**: Crisp 8px to 24px drop shadow (`rgba(20, 26, 33, 0.14)`). Zero blurred color glows.
* **Header**: Split header layout separating title and document metadata from action buttons to prevent visual tangent collisions.

### 4.4. Classified Rubber Stamps (`.stamp-restricted`, `.stamp-cleared`)
* **Border**: Heavy 2px solid border (`var(--color-crimson-wax)` or `var(--color-sage-deep)`).
* **Typography**: Bold `JetBrains Mono` uppercase with `letter-spacing: 0.18em`.
* **Angle**: Subtle 2-degree rotation transform (`transform: rotate(-2deg)`) simulating manual bureaucratic rubber stamping.

### 4.5. Classified Redaction Bars (`.redaction-bar`)
* **Visual**: Solid ink black block (`background: var(--ink-primary)`) obscuring sensitive clearance data until unlocked.
* **Aesthetic**: Simulates typewritten black marker redactions on declassified intelligence files.

### 4.6. Audio & Calibration Sliders
* **Track**: Thin 4px recessed metallic rail with 1px border.
* **Thumb**: Tactile circular brass or dark slate knob with hover expansion.
* **Telemetry Badge**: Dedicated monospace badge (e.g., `#volume-val`) rendering real-time calibrated percentage values.


---

# Technical Architecture Specification: The Vault (Sub-Level 04)

## 1. Architecture Overview & Principles
* **Framework & Tooling:** Vite + TypeScript (`strict: true`), Three.js (`@types/three`), TWEEN.js.
* **Strict Decoupling via Event Mediator:** Zero god objects. The rendering loop, audio engine, state machine, camera director, and UI communicate strictly through a typed publish/subscribe `EventBus`.
* **Single WebGL Context:** A single WebGL renderer manages the room scene and 3D object examination mode via scene swapping and clean camera transitions, preventing WebGL context-limit crashes.
* **Hybrid Asset Pipeline:** Supports loading external `.glb` modular props from Blender (`/assets/models/`) with an automatic, instant fallback to procedural 3D geometry (`ProceduralRoom04.ts`).
* **Diegetic UI Architecture:** All puzzle interfaces, blueprints, and examination surfaces are built as component-scoped diegetic screens with isolated local states, preventing global state pollution.

---

## 2. System Dependency Diagram

```mermaid
flowchart TD
    subgraph UI ["User Interface Layer"]
        ScreenMgr["ScreenManager.ts"]
        UIMgr["UIManager.ts"]
        SettingsModal["Settings Modal (Audio & Archive)"]
        FacilityMap["FacilityMapScreen.ts (Diegetic Blueprint)"]
        DiegeticScreens["DiegeticScreenBase.ts & Console Screens"]
        DomUI["DOM / Cinematic Header & HUD"]
    end

    subgraph Core ["Core State & Messaging"]
        EventBus["EventBus.ts (Pub/Sub Mediator)"]
        GameState["GameState.ts (8-Act GameStage FSM)"]
        SaveMgr["SaveManager.ts (LocalStorage & Case File IO)"]
        Telemetry["Telemetry.ts (Diagnostics & Recovery)"]
    end

    subgraph Audio ["Acoustic Engine"]
        AudioEng["AudioEngine.ts (Multi-Bus Routing & Limiter)"]
        MechSFX["MechanicalSoundFX.ts (Tactile Switches & Latches)"]
        MusicMgr["MusicTrackManager.ts (Audio Stream Mixer)"]
    end

    subgraph Render ["3D Rendering Pipeline"]
        SceneMgr["SceneManager.ts (WebGL, Tone Mapping, Shadows)"]
        CamDir["CameraDirector.ts (Hotspots & Orbit Bounds)"]
        RaycastMgr["RaycastManager.ts (Pointer & Reticle Prompts)"]
        InspectMgr["InspectionManager.ts (3D Turntable Mode)"]
    end

    subgraph Scenarios ["Chamber & Content Pipeline"]
        ScenarioReg["ScenarioRegistry.ts (VRAM Disposal & Loading)"]
        RoomScenarios["Room 04 (Hub) + Rooms 02-08 (Spoke Chambers)"]
        ModelLoader["ModelLoader.ts (GLTF with Procedural Fallback)"]
    end

    DomUI --> ScreenMgr
    ScreenMgr --> EventBus
    FacilityMap --> EventBus
    DiegeticScreens --> EventBus
    UIMgr --> SettingsModal
    SettingsModal --> EventBus
    UIMgr --> EventBus
    RaycastMgr --> EventBus

    EventBus --> GameState
    GameState --> EventBus
    EventBus --> SaveMgr
    SaveMgr --> GameState
    SaveMgr --> EventBus

    EventBus --> AudioEng
    EventBus --> MechSFX
    EventBus --> MusicMgr
    EventBus --> CamDir
    EventBus --> InspectMgr
    EventBus --> UIMgr
    EventBus --> FacilityMap

    SceneMgr --> CamDir
    SceneMgr --> ScenarioReg
    ScenarioReg --> RoomScenarios
    RoomScenarios --> ModelLoader
```

---

## 3. Subsystem Breakdown

### 3.1. Core Messaging (`core/EventBus.ts`)
* Lightweight, strongly typed event mediator.
* Standardized event taxonomy:
  * `input:object_clicked`: `{ objectId: string; hitPoint: THREE.Vector3 }`
  * `input:object_hovered`: `{ objectId: string | null; label: string }`
  * `game:stage_transition`: `{ from: GameStage; to: GameStage }`
  * `puzzle:crystal_collected`: `{ crystalId: CrystalId; roomCode: string }`
  * `puzzle:crt_patch_completed`: `{ crystalId: CrystalId }`
  * `scenario:switch_room`: `{ targetRoomId: string; initialHotspot?: string }`
  * `camera:move_to_hotspot`: `{ hotspotId: string }`
  * `ui:modal_opened` / `ui:modal_closed`: `{ modalId: string }`
  * `audio:trigger_fx`: `{ sound: string }`

### 3.2. Finite State Machine (`core/GameState.ts`)
* Manages progression across the 8-Act narrative arc via `GameStage`:
  * `ACT_1_HUB_AWAKEN` -> `ACT_1_HUB_CORRIDOR_OPEN`
  * `ACT_2_SLEEP_WARD` -> `ACT_2_CRYSTAL_1_RECOVERED` -> `ACT_2_PATCH_1_COMPLETE`
  * `ACT_3_HYDROTHERAPY` -> `ACT_3_CRYSTAL_2_RECOVERED` -> `ACT_3_PATCH_2_COMPLETE`
  * `ACT_4_AUDIOLOGY` -> `ACT_4_CRYSTAL_3_RECOVERED` -> `ACT_4_PATCH_3_COMPLETE`
  * `ACT_5_ARCHIVE` -> `ACT_5_CRYSTAL_4_RECOVERED` -> `ACT_5_PATCH_4_COMPLETE`
  * `ACT_6_DIRECTORS_OFFICE` -> `ACT_6_CRYSTAL_5_RECOVERED`
  * `ACT_7_SYNTHESIS_BLACKOUT`
  * `ACT_8_VELVET_LOUNGE` -> `ACT_8_CONCUSSION_TERMINAL`
* Tracks inventory, pending recovered crystals awaiting CRT patch analysis, and Hub environmental rot degradation.

### 3.3. Diegetic Facility Blueprint (`ui/screens/FacilityMapScreen.ts`)
* Architectural 2D SVG schematic of Sub-Level 04 rendered with clinical grid drafting aesthetics.
* **Fog of War Discovery**: Unvisited sectors are rendered with dark crosshatching and classified redaction bars (`█████`); visited chambers reveal detailed room drafting, apparatus icons, and live beacon dot at the player's coordinates.
* **Custom Site Iconography**: Distinct inline SVG symbols for each sector: CRT waveform (Hub), ECG pulse (Sleep Ward), manifold valve (Hydrotherapy), directional horn (Audiology), film spool (Archive), carriage clock escapement (Director), galvanometer bridge spark (Synthesis), and switchboard jacks (Velvet Lounge).
* **Facility Alignment Tracker**: Displays global sector synchronization status (e.g. "1 / 8 SECTORS SYNCHRONIZED") alongside 8 status pips.
* **Non-Linear Transit**: Allows instant bidirectional travel between the Central Hub and any unlocked/visited sector, enforcing pressure seal interlocks (`PRESSURE SEALED // INTERLOCK RESTRICTED`).

### 3.4. Component-Scoped MVC Diegetic Screens (`ui/screens/`)
* Base class `DiegeticScreenBase.ts` provides lifecycle hooks, DOM focus trapping, Escape key stacking, and cleanup.
* Screens isolate internal console logic:
  * `TektronixCrtScreen.ts`: Act I CRT Lissajous harmonic alignment and knife switch interlock.
  * `DispensaryCartScreen.ts`: Act II 2-step sequential machine: Step 1 mechanical shutter (intake code 1-0-4 from clinical charts) unlocking Step 2 internal infusion console (68 BPM peristaltic drip sync + ultraviolet chemical triad `[Nitrous] - [Bromide] - [Valerian]`).
  * `HydraulicManifoldScreen.ts`: Act III siphon manifold volume conservation and drain unseal.
  * `BinauralSynthesizerScreen.ts`: Act IV dual flared horn azimuth rotation and Chladni nodal plate mandala.
  * `MicroficheViewerScreen.ts`: Act V optical magnification and pneumatic dispatch canister routing.
  * `WiretapTapeDeckScreen.ts`: Act VI half-speed tape decoding and desk carriage clock escapement.
  * `GalvanometerGridScreen.ts`: Act VII resistance bridge network and 200 Ohm breaker trip logic.
  * `SwitchboardMirrorScreen.ts`: Act VIII 1950s telephone jack routing matrix and decanter libation gate.

### 3.5. Scenario Lifecycle & VRAM Disposal (`scenarios/ScenarioRegistry.ts`)
* Manages loading and disposal across all 8 room scenario classes.
* Enforces single-transition concurrency locks (`isSwitching = true`).
* Recursively traverses meshes on scenario unmount to deallocate geometries and materials from GPU VRAM:
  ```typescript
  export function disposeHierarchy(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }
  ```

### 3.6. Multi-Bus Audio Architecture (`audio/AudioEngine.ts` & `MechanicalSoundFX.ts`)
* **Hierarchical Bus Routing**: Master dynamics compressor feeds `masterGain`, which splits into dedicated sub-busses:
  * `sfxGain`: Tactile mechanical switches, relays, knife switches, drawer latches, and phone bells.
  * `ambientGain`: Continuous 45 Hz binaural beat drone, 60/120 Hz ballast hum, room tone, and jazz chords.
* **Independent Gain Controls**: Dedicated sliders in the Settings modal (`#setting-volume`, `#setting-sfx-volume`, `#setting-ambient-volume`) with live percentage readouts (`#volume-val`, `#sfx-val`, `#ambient-val`).
* **Autoplay Compliance**: Gain changes persist to local state without premature `audioCtx.resume()` calls before user gestures.
* **Automatic Tab Suspension**: Suspends `AudioContext` on page visibility blur (`document.hidden`) and restores on focus.

### 3.7. 3D Raycast & Inspection Pipeline (`interaction/`)
* `RaycastManager.ts` resolves child mesh hits to their logical parent interactive group (`prop_*`, `door_*`, `crystal_*`, `exit_*`).
* Enforces dynamic reticle prompt text and exclusive interaction target locks during modal overlays.
* `InspectionManager.ts` runs an isolated 3D turntable canvas with 3-pin mechanical key elevation math.

### 3.8. Persistence & Case Record Architecture (`core/SaveManager.ts`)
* **Schema Version 1 (`SaveGameData`)**: Persists stage, room ID, inventory manifest, collected crystals, patched crystals, pending crystal, calibrated frequency, synthesis flag, visited rooms, and custom settings.
* **Storage Resiliency**: Accesses `localStorage` via safe wrapper `getStorage()` under key `the_vault_save_record`, with automatic fallback to in-memory state in restricted/headless environments.
* **Auto-Save Protocol**: Debounced at 500ms, listening to `game:stage_transition`, `puzzle:crystal_collected`, `puzzle:crt_patch_completed`, `inventory:add`, `ui:inventory_updated`, `scenario:switch_room`, and `settings:updated`.
* **Case Record File Portability**:
  * Export: Serializes intake case file as `subject_104_case_record.json` via Blob download.
  * Import: Validates uploaded JSON against schema version 1 and hydrates `GameState`.
* **Atomic Purge / Reset**: Confirmation modal triggers complete wipe of `localStorage`, teardown of scenario audio, state baseline reset to Act I, and camera return to Sterile Reception.

### 3.9. Automated Verification & Testing Architecture
* **Unit Testing (Vitest)**: 44 unit tests across 8 suites in `src/**/*.spec.ts` testing pure mathematical invariants, save schema serialization, state machine transitions, event mediator routing, and raycast hierarchies.
* **Unified High-Speed Test Architecture (`tests/run_all_fast.js`)**:
  * **Single-Process Chromium Lifecycle**: Launches a single Playwright Chromium instance once for the entire 26-suite regression suite, eliminating recurring browser process spin-up latency and executing the full end-to-end matrix in ~68 seconds.
  * **Context Isolation & GPU WebGL Disposal**: Each test suite is assigned an isolated browser context (`await browser.newContext()`) providing a clean `localStorage`, empty cookies, and pristine DOM state. Calling `await context.close()` after each suite immediately destroys the active Three.js canvas and frees the underlying GPU WebGL context, remaining well beneath Chromium's 16 active WebGL context ceiling.
  * **Dual-Mode Execution Contract**: All 26 test scripts under `tests/` export `runSuite(page, baseUrl)` for the unified runner, while retaining a direct execution guard (`isMain` checking `import.meta.url`) that initializes an ephemeral static HTTP server for standalone debugging.
  * **Ephemeral Port Allocation**: Uses dynamic port binding (`server.listen(0)`) via `tests/helpers/testServer.js` to eliminate `EADDRINUSE` port collisions during concurrent and isolated test runs.
  * **Watchdog Protection**: Each suite is monitored with a 35,000ms async watchdog race to prevent stalled network requests or unhandled promise loops from locking CI pipelines.
* **Granular CLI Runners**: Dedicated scripts (`npm run test:pair1`, `npm run test:pair2`, `npm run test:save`, `npm run test:facility`, etc.) provide targeted scenario verification in under 4 seconds.



---

# The Vault: Room 04 — Master Diegetic Puzzle & Narrative Bible

> **Project Directive**  
> Complete redesign of all eight facility chambers from linear, single-step data transcription ("read code, enter code") into tactile, multi-stage, diegetic analogue machines. Every puzzle is integrated into the overarching **Legion** narrative, operates through a dedicated interactive UI screen, and adheres to strict non-linear dependency graphs, fail-safe resets, and continuous sensory feedback.

---

## 1. Master Narrative Framework: The Legion Metamorphosis

### 1.1 The Truth of Project Legion
The Sanatorium of Cognitive Alignment is not an asylum, nor is it a prison. It is a clandestine Directorate research facility dedicated to **Project Legion**: an experimental psychological and neurological initiative designed to eradicate human suffering by merging individual human consciousness into an unfeeling, compliant collective hive mind.

Subject 104 is not an escaping inmate. Subject 104 is the **final synthesis vessel (Patient Zero)**.

The Directorate discovered that individual human psyches shatter when subjected to complete emotional desensitization. To overcome this limitation, they fractured the trauma across multiple human subjects:
- **Subject 101**: Absorbed acute emotional grief and terror (resulting in uncontrollable physical motor tremors).
- **Subject 102**: Absorbed verbal expression and defiance (resulting in surgical excision of the vocal cords).
- **Subject 103**: Absorbed auditory perception and memory (resulting in acute acoustic dissociation and sensory hallucinations).
- **Subjects 001–100**: Preserved in cold microfiche storage in the Archive—the discarded residue of ninety-nine failed limbic extractions.
- **Dr. H. Vandermeer (The Director)**: Synthesized his own moral guilt into the core crystal, choosing total clinical numbness over remorse.

### 1.2 The Five Memory Crystals as Living Psychic Organs
The recovered crystals are not inanimate gemstones; they are crystallized neurological memory fragments:

| Specimen | Artifact Name | Source Subject | Neurological Trauma | Reward Audio Log |
|---|---|---|---|---|
| **Crystal 01** | Prismatic Quartz | Subject 101 | Motor tremors, limbic weeping, terror | Tape 01: The Discovery of Limbic Decoupling (1973) |
| **Crystal 02** | Oxidized Bronze | Subject 102 | Severed vocal cords, silent screaming | Tape 02: Flesh as the Infection |
| **Crystal 03** | Fractured Amethyst | Subject 103 | Auditory hallucinations, phase psychosis | Tape 03: The Synthesis of Silence |
| **Crystal 04** | Pitch-Black Obsidian | The Archive (001–100) | The Collective Residue ("We are Legion") | Tape 04: The Carrier is Ready |
| **Crystal 05** | Glowing Celadon Core | The Director | The Eradication of Conscience | Tape 05: The Final Inoculation |

### 1.3 The Psychological Decay of the Hub
The Central Hub (Room 04) is the psychological projection of Subject 104's mind. With every crystal recovered and slotted into the central CRT console:
- The pristine alabaster walls bruise and discolor with subcutaneous hematomas.
- The glazed green wainscot tiles weep dark fluid along the mortar lines.
- The warm 1970s analog hum becomes layered with faint, overlapping whispers of previous subjects.
- By Act VII, the chamber undergoes total sensory collapse. The player does not escape into freedom—they are released into the civilian subway network as the perfected carrier of total emotional numbness.

---

## 2. Game Design Analysis: Bad Puzzles vs. The Vault's Diegetic Puzzles

```
┌──────────────────────────────────────────────┐       ┌──────────────────────────────────────────────┐
│          THE 5 SINS OF BAD PUZZLES           │       │         THE 5 VIRTUES OF VAULT PUZZLES       │
├──────────────────────────────────────────────┤       ├──────────────────────────────────────────────┤
│ 1. Data Transcription (Key taped to lock)    │  ───► │ 1. Deductive Triangulation (Rules, not codes)│
│ 2. Invisible State (Blind trial-and-error)   │  ───► │ 2. Continuous Sensory Feedback (Gauges/Audio)│
│ 3. Disconnected Minigames (Generic math)     │  ───► │ 3. Physical Diegesis (Authentic 1970s tools) │
│ 4. Irreversible Deadlocks (Softlock hazard)  │  ───► │ 4. Non-Destructive Fail-Safe Resets          │
│ 5. Narrative Irrelevance (Arbitrary chore)   │  ───► │ 5. Narrative Epiphany (Solution IS the lore) │
└──────────────────────────────────────────────┘       └──────────────────────────────────────────────┘
```

### 2.1 The Five Sins of Bad Puzzles
1. **Data Transcription**: Reading a 3-digit number from a piece of paper and punching it into a 3-digit tumbler. This requires zero cognition; it is manual data entry.
2. **Invisible State (Blind Guessing)**: Puzzles where manipulating a control offers no indication of whether the player is closer to or farther from the solution.
3. **Disconnected Minigames**: Puzzles that feel like generic mobile games dropped into an environment without architectural or narrative justification.
4. **Irreversible Deadlocks**: Puzzles where an incorrect sequence permanently breaks progress or forces manual reload.
5. **Narrative Irrelevance**: Puzzles whose solutions have nothing to do with the environment, the characters, or the story.

### 2.2 The Five Virtues of Vault Puzzles
1. **Deductive Triangulation**: Clues provide relationships, constraints, or medical symptoms. The player synthesizes multiple pieces of environmental evidence to arrive at a conclusion.
2. **Continuous Sensory Feedback**: Needles deflect on calibrated galvanometers, CRT phosphor traces morph in real time, and pitch alters dynamically as the player approaches resonance.
3. **Physical Diegesis**: Every puzzle takes the form of an authentic mid-century piece of apparatus: Bakelite switches, vacuum tube oscilloscopes, optical microfiche projectors, and pneumatic transport tubes.
4. **Non-Destructive Fail-Safe Resets**: Every mechanism features a dedicated physical reset action (circuit trip breaker, emergency hydrostatic dump lever, fluid ballast return) that restores baseline state without penalty.
5. **Narrative Epiphany as Reward**: Solving the puzzle physically unlocks a suppressed memory, an intercepted recording, or a chilling realization about Project Legion.

---

## 3. The 8 Bespoke Diegetic UI Screens & Interaction Mechanics

Every chamber features a dedicated, full-screen or modal **Diegetic Hardware Console** that simulates real physical interaction:

---

### Act I: The Sterile Chamber — The Tektronix CRT & Capacitor Bridge
* **The Diegetic Hardware Console**:
  A 1970s Tektronix dual-trace oscilloscope housed in battleship-gray steel with Bakelite rotary knobs, an analog galvanometer, a blown ceramic fuse socket, and a heavy brass knife switch.
* **The Interactive Mechanics**:
  1. *Fuse Installation*: The player must drag a solid brass shunt from the desk into the open ceramic fuse block on the console apron to restore high-voltage power.
  2. *Frequency & Phase Tuning*: Two large rotary dials (Frequency: 400–700 Hz; Phase: $0^\circ$–$360^\circ$). Rotating the dials recalculates the parametric Lissajous curve in real time:
     $$\begin{cases} x(t) = A \sin(\omega_1 t + \delta) \\ y(t) = B \sin(\omega_2 t) \end{cases}$$
  3. *Sensory Telegraphing*: As the player approaches 528 Hz and $90^\circ$ phase offset, the chaotic wandering green phosphor wave locks into a stable, glowing circular Lissajous ring.
  4. *Throwing the Knife Switch*: Once the ring stabilizes, the interlock solenoid clicks open, enabling the knife switch. Dragging the switch down with a resonant metallic thud depressurizes the corridor airlock.
* **Accessibility / Keyboard Fallback**: Arrow keys step frequency by 1 Hz (Shift+Arrow by 10 Hz); Spacebar toggles the knife switch when armed.
* **Fail-Safe**: Pulling the switch while out of resonance trips the circuit breaker with a spark sound, safely returning the switch to the open position.

---

### Act II: The Sleep Ward — The 2-Step Dispensary Machine & UV Diagnostic Matrix
* **The Diegetic Hardware Console**:
  A stainless steel mobile dispensary cart front-panel designed as a two-stage sequential puzzle machine: an outer mechanical security shutter protecting an internal sedative infusion console, paired with an ultraviolet (UV) diagnostic light switch.
* **The Interactive Mechanics**:
  1. *Step 1: Mechanical Shutter Intake Lock*:
     - The cart's outer stainless steel shutter is secured by a 3-digit rotary tumbler lock (`[ 0 ] - [ 0 ] - [ 0 ]`).
     - Examining the patient charts across the dormitory reveals Subject 104's intake registration:
       - Chart 101: Documents resting heart rate telemetry (68 BPM) and notes Subject 104's intake record.
       - Chart 103: Notes that medication shutters are keyed to each patient's 3-digit intake identifier.
       - Chart 104: Explicitly records Subject 104's registration ID: `104`.
     - Aligning the tumbler dials to `[ 1 ] - [ 0 ] - [ 4 ]` unlatches the outer shutter, sliding it open with a heavy mechanical click and exposing the internal infusion console.
  2. *Step 2: Internal Sedative Infusion Console*:
     - The internal console remains disabled until Step 1 is unlocked.
     - *Diagnostic UV Shift*: Toggling the darkroom UV blacklight switch floods the ward with deep ultraviolet light. Perimeter curtain drapes are retracted against the wall to ensure unoccluded visibility of all cots.
     - *Cot 104 Examination Hotspot*: Moving camera to `[EXAMINE: VACANT COT 104]` reveals glowing luminescent chemical stamps on Cot 104's double-sided headboard: `[ NITROUS ] - [ BROMIDE ] - [ VALERIAN ]`.
     - *Peristaltic IV Drip Calibration*: The player drags the IV roller clamp to 68 BPM matching the cardiac rest rate from Chart 101. Droplet audio synchronizes with the sight-glass pulse.
     - *Chemical Tumbler Alignment*: Rotating the three chemical wheels to `[Nitrous] - [Bromide] - [Valerian]` unlatches the secondary deadbolt.
  3. *Reward*:
     - The motorized dispensary drawer rolls open, revealing **Memory Crystal 01 (Prismatic Quartz)**.
* **Sensory Telegraphing**:
  - Drip sight-glass bubbles in real-time. Droplet audio tempo matches visual drip animation.
  - Tumbler wheels emit heavy spring-loaded ratchet clicks with tactile resistance.
* **Accessibility / Keyboard Fallback**: Keys 1, 2, 3 select active tumblers; Up/Down keys step through tumbler values.
* **Fail-Safe**: Closing the shutter or zeroing the IV clamp non-destructively returns the mechanism to baseline.

---

### Act III: The Hydrotherapy Room — The Hydraulic Pressure Manifold
* **The Diegetic Hardware Console**:
  A heavy cast-iron boiler plate manifold featuring three large spoked brass valve wheels (Tanks 1, 2, 3), three vertical glass level tubes showing colored hydrostatic fluid heights, a center Bourdon-tube pressure dial (0–60 PSI), and a red emergency dump lever.
* **The Interactive Mechanics**:
  1. *Hydrostatic Siphon Balancing*: The three tanks are interconnected via differential pressure lines. Turning Valve 1 siphons fluid into Tank 2; turning Valve 2 siphons into Tank 3.
  2. *Equilibrium Goal*: The player must balance all three water columns to the calibrated datum mark (1.2m). When balanced, hydrostatic differential cancels to exactly 0.0 PSI.
  3. *Grate Float Release*: At 0.0 PSI, an air piston hiss sounds, the iron floor grate rises, and Crystal 02 floats to the surface on a brass buoy.
* **Sensory Telegraphing**:
  - Fluid heights bob and settle with fluid inertia inside the glass sight-tubes.
  - The Bourdon gauge needle trembles with water-hammer pipe thumps when valves are turned.
* **Accessibility / Keyboard Fallback**: Keys A, B, C select valves; Left/Right keys rotate valve wheels in quarter-turn increments.
* **Fail-Safe**: Pulling the red "EMERGENCY DUMP" lever flushes all tanks to empty in 3 seconds with a loud draining gurgle, resetting all valves to default closed positions.

---

### Act IV: The Audiology Vault — The Binaural Phase Synthesizer
* **The Diegetic Hardware Console**:
  A brushed-aluminum acoustic control deck featuring two circular azimuth turntable compasses (controlling directional horns), a $180^\circ$ phase-inversion toggle, a frequency sweep potentiometer, and a live Chladni sand resonance plate display.
* **The Interactive Mechanics**:
  1. *Acoustic Steering*: Dragging the two horn compass dials directs sound waves toward the center monolith (Left Horn: $45^\circ$, Right Horn: $135^\circ$).
  2. *Phase Cancellation*: Toggling the phase switch inverts the secondary wave by $\pi$ radians ($180^\circ$).
  3. *Resonance Alignment*: Sweeping the frequency dial to the lead baffle's natural resonant frequency (652 Hz) causes the high-amplitude acoustic screeching to destructively cancel into complete, dead room silence.
  4. *Chladni Nodal Formation*: The sand particles on the plate dance erratically until true cancellation, where they snap into a symmetrical geometric mandala, releasing the amethyst crystal.
* **Sensory Telegraphing**:
  - Dynamic Web Audio binaural panning and phase-inversion: audio physically cancels out in the player's headphones.
  - Sand particles on the Chladni plate compute real-time modal vibration geometry.
* **Accessibility / Keyboard Fallback**: Left/Right arrows rotate active horn azimuth; Spacebar toggles phase inversion; Up/Down arrows sweep frequency.
* **Fail-Safe**: The frequency dial sweeps continuously; turning it away from resonance safely disengages the acoustic null without lockouts.

---

### Act V: The Archive — The Optical Microfiche Viewer & Pneumatic Dispatch
* **The Diegetic Hardware Console**:
  A desktop optical microfilm reader with an illuminated frosted-glass viewing screen, manual film reel advance knobs, a knurled focus ring, and an integrated brass pneumatic tube transport terminal with rotary sector selector dials.
* **The Interactive Mechanics**:
  1. *Mounting & Focusing Film*: The player mounts a recovered microfilm strip into the glass carrier, turning the focus ring to resolve blurry text into crisp, high-contrast syndicate records.
  2. *Cross-Index Deduction*: The projected document reveals the departmental code for Subject 104's limbic excision: *Department of Acoustic Dissociation // Grid Coordinate Gamma-07*.
  3. *Pneumatic Canister Dispatch*: The player inserts an empty brass canister into the tube terminal, dials the brass sector wheels to `[GAMMA]` and `[07]`, and throws the vacuum lever.
  4. *Canister Delivery*: An audible whoosh travels across the ceiling piping; a heavy metal canister drops into the receiving hopper, containing the Obsidian Crystal and unredacted case files.
* **Sensory Telegraphing**:
  - Optical lens distortion and blur shader that clarifies as the knurled focus ring is turned.
  - authentic pneumatic vacuum suction sound followed by the mechanical clang of the brass canister landing in the wire hopper.
* **Accessibility / Keyboard Fallback**: Arrow keys pan microfilm; Bracket keys `[` and `]` adjust optical focus; Number keys select dispatch coordinates.
* **Fail-Safe**: Dialing an invalid sector returns the canister empty with a rejected buzzer sound and an index error slip.

---

### Act VI: The Director's Office — The Reel-to-Reel Wiretap Deck & Rotary Phone
* **The Diegetic Hardware Console**:
  A split executive console featuring a Nagra-style portable reel-to-reel magnetic tape recorder (with spinning aluminum reels, VU meters, and speed lever) paired with a heavy cream Bakelite rotary telephone.
* **The Interactive Mechanics**:
  1. *Rotary Telephone Interaction*: Clicking the telephone pulls up an interactive faceplate. Dragging the rotary dial clockwise to a number hole and releasing it triggers authentic spring-loaded mechanical return clicks.
  2. *Wiretap Analysis*: The player loads an intercepted magnetic tape into the recorder. Pressing *Rewind* spools the tape back with high-frequency tape chatter. Flipping the speed switch to *Half-Speed* clarifies a deep, distorted voice disclosing the Director's safe unlock timestamp: *"Three minutes past eleven."*
  3. *Clock Escapement Alignment*: The player sets the hands of the desk's carriage clock to `11:03`, releasing the electromagnetic lock on the concealed desk drawer.
* **Sensory Telegraphing**:
  - Reel-to-reel tape spools visibly rotate at rates matching playback speed.
  - VU meters bounce to audio waveforms.
  - Rotary phone dial has true inertial drag physics and audio clicks proportional to the number dialed.
* **Accessibility / Keyboard Fallback**: Number keys 0–9 trigger authentic automated rotary dial sequences.
* **Fail-Safe**: The clock hands and tape deck can be rewound or adjusted infinitely with zero softlocks.

---

### Act VII: The Synthesis Chamber — The 5-Channel Galvanometer Energy Grid
* **The Diegetic Hardware Console**:
  A massive power distribution switchboard featuring five crystal receptacle sockets, five analog galvanometer needle meters, five ceramic knife shunts, and a main hydraulic bus lever.
* **The Interactive Mechanics**:
  1. *Crystal Energy Routing*: Placing the five recovered crystals into their sockets energizes five distinct circuit channels. Each channel displays a massive power surge on its galvanometer.
  2. *Resistance Shunt Balancing*: The player slides the five ceramic knife shunts to balance electrical load across all five sectors. The circuit rule requires balancing each channel to exactly $100\,\Omega$.
  3. *Galvanometer Alignment*: As shunts are balanced, all five needles stabilize in the center green zone ($0 \pm 2\,\text{mA}$).
  4. *Airlock Release*: Engaging the main hydraulic bus lever releases the massive steel blast door leading to the Velvet Lounge.
* **Sensory Telegraphing**:
  - High-voltage electrical arcs buzz and diminish as circuits balance.
  - Analog galvanometer needles tremble under simulated magnetic damping.
* **Accessibility / Keyboard Fallback**: Keys 1–5 select channels; Left/Right arrows adjust resistance slider shunts.
* **Fail-Safe**: Overloading a channel trips the master circuit breaker with a loud clack, returning all shunts to neutral.

---

### Act VIII: The Velvet Lounge — The Mirror Paradox & Operator Switchboard
* **The Diegetic Hardware Console**:
  A dual-view inspection terminal comparing the physical room against the floor-to-ceiling observation mirror reflection, alongside a vintage 1950s telephone operator switchboard with braided cloth patch cords.
* **The Interactive Mechanics**:
  1. *Mirror Discrepancy Identification*: The player spots that the mirror reflects a crystal decanter resting on the lounge table, whereas the physical table in the room is empty.
  2. *Spatial Alignment*: Finding the decanter in the room and dragging it onto the real table matching the mirror's coordinates causes the mirror surface to ripple and become transparent glass.
  3. *Switchboard Trunk Patching*: The player grabs a patch cord and connects Socket 104 to Line 4 (Sterile Chamber origin).
  4. *The Climax*: The solitary payphone rings deafeningly. Answering the handset plays the player's own voice confirming total compliance, triggering the 528 Hz blackout finale.
* **Sensory Telegraphing**:
  - Mirror glass features a dynamic chromatic aberration ripple when reality alignment occurs.
  - Patch cord insertion produces authentic 60 Hz line crackle and telephone dial tone.
* **Accessibility / Keyboard Fallback**: Tab key cycles patch cord plugs; Enter key inserts plug into active jack.

---

## 4. Software Architecture & Implementation Contract

To prevent memory leaks, state corruption, and test flakiness, all diegetic screens adhere to a standardized interface:

### 4.1 The `IDiegeticScreen` Interface
```typescript
export interface IDiegeticScreen<TState = Record<string, unknown>> {
  readonly id: string;
  readonly isModal: boolean;
  
  // Lifecycle
  open(initialData?: unknown): void;
  close(): void;
  teardown(): void;

  // State Persistence & Hydration
  getState(): TState;
  hydrate(state: TState): void;
  reset(): void;

  // Accessibility & Fallback
  stepControl(controlId: string, delta: number): void;
}
```

### 4.2 Focus Trapping & Resource Cleanup Protocols
When any diegetic screen opens:
1. **Input Isolation**: `RaycastManager.setEnabled(false)` and `CameraDirector.setControlsEnabled(false)` are triggered immediately, preventing mouse movements or clicks from affecting the 3D scene.
2. **Keyboard Trapping**: Global key listeners capture `Escape` to close the modal cleanly without triggering external camera transitions.
3. **Resource Teardown**: Upon calling `close()` or `teardown()`:
   - All active Web Audio oscillator nodes are disconnected and stopped.
   - All `requestAnimationFrame` IDs are cancelled.
   - All DOM pointer, touch, and keyboard listeners are detached.

---

## 5. Comprehensive Asset Ledger

| Act | Screen Component | Type | New Assets Required | Audio Effects Required |
|---|---|---|---|---|
| **Act I** | `TektronixCrtScreen` | Canvas 2D + WebGL | Lissajous shader, Bakelite knob sprites, ceramic fuse mesh | 60 Hz mains hum, relay snap, knife switch thud |
| **Act II** | `DispensaryCartScreen` | DOM Overlay + Canvas | Stainless steel panel texture, UV blacklight CSS filter, 8 chemical glyph SVG icons | Peristaltic fluid drip, tumbler ratchet click, solenoid deadbolt clunk |
| **Act III** | `HydraulicManifoldScreen` | Canvas 2D + SVG | Bourdon pressure gauge graphic, spoked brass valve wheel textures, fluid sight-glass tubes | Water hammer pipe knock, steam hiss, drainage gurgle, hydraulic piston dump |
| **Act IV** | `BinauralSynthesizerScreen` | Canvas 2D (Chladni) | Chladni modal simulation engine, azimuth compass dials, phase-inversion toggle switch | Binaural sine tone generator, high-pitch acoustic whistle, phase-cancellation silence |
| **Act V** | `MicroficheViewerScreen` | Canvas 2D + CSS | Microfilm organigram documents, knurled brass focus ring, pneumatic tube hopper UI | Optical lens click, vacuum tube whoosh, canister metal landing clang |
| **Act VI** | `WiretapTapeDeckScreen` | Canvas 2D + DOM | Nagra tape deck graphic, rotating tape spools, cream rotary telephone dial with spring physics | Rotary dial spring-back ratchet, tape spool whir, half-speed voice playback, carriage clock bell |
| **Act VII** | `GalvanometerGridScreen` | Canvas 2D + DOM | 5 galvanometer needle meters, ceramic knife shunt tracks, high-voltage bus lever | Electrical spark arc, magnetic needle bounce, high-voltage transformer hum |
| **Act VIII** | `SwitchboardMirrorScreen` | Canvas 2D + WebGL | Split-pane mirror shader, cloth-braided patch cord physics, switchboard jack panel | 60 Hz line crackle, patch plug snap, dual-gong mechanical telephone bell |

---

## 6. Phased Implementation Roadmap

1. **Phase 1: Vertical Slice (Acts I & II)**
   - Implement `TektronixCrtScreen` and `DispensaryCartScreen`.
   - Wire `IDiegeticScreen` into `Room04_SterileChamber.ts` and `Room02_SleepWard.ts`.
   - Update Playwright test suites (`test_full_descent_e2e.js`, `test_ui_and_accessibility.js`).
2. **Phase 2: Fluids & Acoustics (Acts III & IV)**
   - Implement `HydraulicManifoldScreen` and `BinauralSynthesizerScreen`.
   - Connect dynamic Web Audio phase-cancellation and Chladni resonance simulation.
3. **Phase 3: The Archive & The Directorate (Acts V & VI)**
   - Implement `MicroficheViewerScreen` and `WiretapTapeDeckScreen` with rotary phone drag mechanics.
4. **Phase 4: Climax & Synthesis (Acts VII & VIII)**
   - Implement `GalvanometerGridScreen` and `SwitchboardMirrorScreen`.
   - Finalize the Lynchian psychological descent and telephone climax.


---

# THE CURE: ROOM 04 — Master Narrative & Opening Triad Architecture

> **Aesthetic & Philosophical Manifesto**  
> Inspired by Kiyoshi Kurosawa's psychological masterpiece *Cure* (1997), *The Cure: Room 04* reframes the escape-room paradigm into a hypnotic psychological descent. Human sorrow, empathy, and free will are diagnosed by the Directorate as an unbearable psychological contagion. Total emotional numbness and unthinking compliance are heralded as **The Cure**.  
> The protagonist (Subject 104) is not an escaped prisoner fighting against an oppressive system; Subject 104 is being systematically calibrated as the carrier—**Patient Zero**—destined to unleash The Cure into the civilian populace.

---

## 1. Thematic DNA: The Influence of Kiyoshi Kurosawa's *Cure* (1997)

In Kurosawa's *Cure*, the amnesiac wanderer Mamiya destroys human morality not through physical violence or supernatural power, but through **hypnotic compulsion**:
1. **Sensory Entrainment**: Repetitive, soothing, tactile sensory triggers (the rhythmic click of a lighter flame, the trickling of spilled water, a steady low-frequency tone).
2. **The Disorienting Socratic Inversion**: Monotone, hypnotic questioning (*"Who are you?", "Tell me about yourself", "Is that really what you want?"*) that dismantles the victim's sense of identity until their repressed instincts surface.
3. **The Viral Succession**: The investigator does not defeat the antagonist; the investigator absorbs the philosophy, becomes infected, and steps out into the bustling city as the new apostle of the contagion.

In *The Cure: Room 04*, we translate these cinematic principles into interactive game design:
- **The Telephone as the Hypnotist**: The vintage cream telephone is not an exposition delivery radio; it is the soothing, monotone conduit through which the Directorate entrains Subject 104.
- **Puzzles as Calibrations**: The player never "breaks" a lock. Every puzzle they solve is a diagnostic test they willingly submit to in order to verify that their emotional friction has been eliminated.
- **The Climax as Succession**: When the player reaches Act VIII and answers the final subway payphone, they do not escape. They hear their own voice confirming compliance. They step out of the train doors into the metropolis as The Cure.

---

## 2. The Golden Triad: The Critical Hook (Acts I, II, and III)

If the first ten minutes of a psychological puzzle game fail to intrigue, unnerve, and reward the player, the rest of the game is irrelevant. The opening three acts form a deliberate emotional and mechanical progression:

```
┌─────────────────────────────────┐
│     ACT I: THE CALIBRATION      │  Mood: Immaculate clinical cleanliness masking cosmic dread.
│     (Sterile Examination)       │  Hook: Hypnotic telephone voice + Tactile CRT Lissajous wave.
└────────────────┬────────────────┘
                 │ (Forward Corridor Unseals)
                 ▼
┌─────────────────────────────────┐
│     ACT II: THE SOMATIC DORM    │  Mood: Eerie, unsettling, quiet breathing of dormant patients.
│       (The Sleep Ward)          │  Hook: Diagnostic UV blacklight reveals frantic glowing truth.
└────────────────┬────────────────┘
                 │ (Deep Descent Spoke)
                 ▼
┌─────────────────────────────────┐
│    ACT III: THE VISCERAL BASIN  │  Mood: Brutal institutional hygiene; smell of copper and salt.
│      (The Hydrotherapy Room)    │  Hook: Dynamic hydrostatic water siphoning + submerged secrets.
└─────────────────────────────────┘
```

---

### Act I: The Sterile Examination (Examination Room 04)
*Target Playtime: 3 to 4 minutes | Difficulty: Accessible, Highly Tactile, Deeply Intriguing*

#### The Emotional Arc
The player awakens from complete sensory deprivation. The room is blindingly white, pristine, symmetrical, and silent except for a 60 Hz electrical hum. The initial feeling is calm and sterile, but this calm quickly curdles into unsettling ambiguity.

#### Beat-by-Beat Player Journey
1. **Beat 1: Awakening & The Ringing Bell (0:00 - 0:30)**
   - The screen transitions smoothly from black into sharp focus.
   - The cream rotary telephone on the teak desk begins to ring with a muted, rhythmic chime.
   - Reticle hover updates to: `[ANSWER TELEPHONE]`.
2. **Beat 2: The Hypnotic Voiceover (0:30 - 1:15)**
   - The player clicks the handset. The bell cuts out instantly into dead room silence.
   - A flat, calm, unhurried voice speaks directly into the ear (accompanied by synchronized diegetic subtitles):
     > *"Who are you? Look at your hands. No bruises. No bindings. You believe you were brought here against your will. But tell me: who was it that walked through the front doors? The numbers on the envelope are not a cage. They are your baseline. Finish your harmonic calibration. The corridor is waiting."*
   - Handset clicks back onto the cradle with a heavy mechanical clunk.
3. **Beat 3: Investigating the Desk (1:15 - 2:00)**
   - On the desk rests the **Crimson Dossier** and a heavy, cold **Brass Cylinder Shunt**.
   - Inspecting the dossier reveals the intake declaration:
     ```
     DIRECTORATE FOR LIMBIC STABILIZATION
     PATIENT DESIGNATION: SUBJECT 104
     ADMISSION REASON: CHRONIC HUMAN SORROW & COGNITIVE FRICTION
     PRESCRIPTION: COMPLETE DE-COUPLING // THE CURE
     ```
   - The player picks up the brass shunt (`prop_brass_shunt` added to inventory).
4. **Beat 4: The Tektronix CRT Console (2:00 - 3:15)**
   - Clicking the oscilloscope console opens the bespoke **Tektronix Diegetic Screen**.
   - **Step 1 (Physical Power Restoration)**: The ceramic fuse block on the console apron is empty. The player drags the brass shunt from inventory into the spring clips. *CLACK.* Vacuum tube filaments behind the rear louvers ignite with an orange glow; the green phosphor screen bursts into life with erratic, jittery noise.
   - **Step 2 (Harmonic Entrainment)**: Two large Bakelite knobs control Frequency (400–700 Hz) and Phase ($0^\circ$–$360^\circ$). Rotating the frequency knob sweeps the pitch upward. As frequency approaches 528 Hz, the chaotic noise folds into a smooth, hypnotic circular Lissajous ring. The 528 Hz sine wave creates a soothing, acoustic trance effect.
   - **Step 3 (The Interlock Release)**: Once the Lissajous ring locks into a perfect glowing circle, an electromagnetic solenoid clicks open with a sharp *TICK*. The heavy ceramic knife switch lever unlocks.
   - **Step 4 (Throwing the Switch)**: Dragging the knife switch down produces a thunderous mechanical contact sound and an electrical snap.
5. **Beat 5: The Threshold Unseals (3:15 - 3:45)**
   - The forward steel blastdoor groans as hydraulic pressure releases with a massive pneumatic hiss.
   - The door slowly swings outward into the darkness, revealing the flickering corridor tiles ahead.
   - Subtitle: *"Harmonic baseline achieved. The airlock unseals. The descent into The Cure begins."*

---

### Act II: The Sleep Ward (Observation Dormitory 02)
*Target Playtime: 5 to 7 minutes | Difficulty: Multi-Track Deductive, Visceral, Atmospheric*

#### The Emotional Arc
Transitioning from the pristine safety of Room 04 into the Sleep Ward introduces somatic unease and visceral horror. The long room contains two rows of olive military cots. But unlike Room 04, this room is populated.

#### The Physical & Narrative Setting
- **The Catatonic Subjects**: Cots 101, 102, and 103 hold motionless human figures swathed in clinical linen bandages. Faint, rhythmic breathing sounds echo through the room. Glass IV carboys hang from steel poles beside each bed, dripping cloudy sedative fluid.
- **Cot 104 (The Vacant Bed)**: Cot 104's restraints are unbuckled; its pillow is dented; its bed linen is rumpled. The realization strikes: *This is where you slept before you were moved to Examination Room 04.*

#### The Mechanics & The UV Blacklight Shift
1. **The Diagnostic UV Light Switch**:
   - Beside the entrance door is an industrial toggle switch labeled: `SURGICAL INSPECTION // UV ILLUMINATION`.
   - Flipping the switch cuts the buzzing fluorescent tubes and floods the dormitory with deep indigo ultraviolet blacklight.
2. **The Hidden Truth Revealed Under UV**:
   - The walls, cots, and linen bandages are covered in luminescent chemical stains and frantic, scratched handwriting:
     - Above Cot 101: *"HE CANNOT STOP CRYING // THE CURE EXTRACTS THE TEARS"*
     - Above Cot 102: *"THE VOCAL CORDS ARE RESISTANCE // CUT THEM TO CURE THEM"*
     - Above Cot 104: *"PATIENT ZERO // COMPLIANCE IS INEVITABLE // WE ARE THE CURE"*
   - On the headboard of Cot 104, three luminescent chemical symbols glow brightly:
     `[ NITROUS ] - [ BROMIDE ] - [ VALERIAN ]`
3. **The 2-Step Mobile Dispensary Cart Console**:
   - Clicking the stainless steel cart opens the bespoke **Dispensary Cart Screen**.
   - **Step 1 (Mechanical Shutter Intake Lock)**: The outer security shutter is locked by a 3-digit tumbler lock. Clinical charts across the ward reveal Subject 104's registration ID: Chart 101 notes Subject 101's resting cardiac rate (68 BPM) alongside 104's intake; Chart 103 explains that medication shutters require the patient's 3-digit code; Chart 104 confirms the registration ID is `104`. Entering `[ 1 ] - [ 0 ] - [ 4 ]` unlatches the outer shutter with a mechanical click, sliding it open to reveal the internal infusion console.
   - **Step 2 (Internal Sedative Infusion Console)**:
     - *Peristaltic IV Drip Calibration*: Adjusting the knurled roller clamp on the IV sight-glass to 68 BPM synchronizes droplet audio with the heart monitor.
     - *Chemical Tumbler Alignment*: Rotating the three brass wheels to `[Nitrous] - [Bromide] - [Valerian]` unlatches the secondary electromagnetic deadbolt.
4. **The Reward**:
   - The heavy stainless drawer rolls open on oiled ball bearings, revealing **Memory Crystal 01 (Prismatic Quartz)** pulsing with faint bioluminescence.
   - Returning to Room 04 and inserting Crystal 01 plays **Cassette Tape 01**:
     > *"Dr. Vandermeer recording. August 14, 1973. Subject 101 wept for seven days after limbic decoupling. The grief had nowhere to go, so we crystallized it. Sorrow is not an emotional truth. It is an evolutionary defect. We are perfecting The Cure."*

---

### Act III: The Hydrotherapy Room (Immersion Basin 03)
*Target Playtime: 6 to 8 minutes | Difficulty: Spatial, Physical, Hydraulic Equilibrium*

#### The Emotional Arc
Cold institutional hygiene meets visceral dread. The room is lined with pale turquoise tiles weeping condensation. In the center sit three massive porcelain clawfoot immersion tubs equipped with heavy leather restraint harnesses. A distinct smell of copper, wet stone, and saline hangs in the air.

#### The Narrative Revelation
Hydrotherapy was not physical therapy—it was used to induce sensory drowning to suppress the limbic nervous system of Subject 102. When Subject 102 continued to scream under water, the Directorate excised their vocal cords.

#### The Hydraulic Manifold Screen
1. **The Physical Apparatus**:
   - In the center of the wall stands a heavy cast-iron boiler plate manifold featuring three large spoked brass valve wheels (Tanks 1, 2, 3), three vertical glass level tubes showing colored water columns, and a central Bourdon pressure dial reading `45 PSI`.
2. **The Discrete Siphon Puzzle (Zero Drift, Pure Logic)**:
   - The three immersion tubs are interconnected via gravity siphons. Fluid levels are measured in discrete integer increments (0 to 4 units):
     - Initial State: Tub 1 = 4 (Overflowing), Tub 2 = 1 (Murky low water), Tub 3 = 0 (Bone dry).
   - Turning Valve 1 transfers 2 units from Tub 1 to Tub 2.
   - Turning Valve 2 transfers 1 unit from Tub 2 to Tub 3.
   - Turning Valve 3 recirculates 1 unit from Tub 3 to Tub 1.
3. **The Submerged Discovery**:
   - As the player siphons water out of Tub 2 (dropping its level to 0), the murky saline clears, revealing a submerged brass bypass valve bolted to the drain tile.
   - Clicking the submerged bypass valve equalizes all three tubs to exactly 2 units (the center green datum mark).
   - Hydrostatic differential cancels out: the Bourdon pressure dial swings smoothly from 45 PSI down to **0.0 PSI**.
4. **The Grate Release**:
   - With pressure relieved, an air piston hiss echoes across the room.
   - The heavy cast-iron floor drain grate floats upward on a pneumatic sleeve, revealing **Memory Crystal 02 (Oxidized Bronze)** resting inside a brass strainer.
5. **The Fail-Safe Mechanism**:
   - An industrial red "EMERGENCY SUMP BLOWOUT" lever mounted near the door allows the player to flush all three tubs to empty at any time with a loud gurgle, instantly resetting the system to baseline without penalty.
6. **The Reward Audio Log (Cassette Tape 02)**:
   > *"Dr. Vandermeer recording. Observation 44. Flesh is the fundamental infection. When Subject 102 was immersed in the hyper-saline bath, they tried to scream, but no sound escaped the throat. True peace is the absence of voice. Compliance is equilibrium."*

---

## 3. Technical Implementation Architecture

### 3.1 State Schema Enhancements
In `src/core/GameState.ts`, extend the state model with explicit, strictly typed fields:

```typescript
export interface CureGameStateSlice {
  // Act I State
  telephoneAnswered: boolean;
  brassShuntInserted: boolean;
  frequencyTuned: boolean;
  knifeSwitchClosed: boolean;
  
  // Act II State
  uvLightActive: boolean;
  ivDripBpm: number;
  dispensaryTumblers: [string, string, string];
  
  // Act III State
  tubWaterLevels: [number, number, number]; // Discrete integers 0..4
  submergedValveTurned: boolean;
  manifoldBalanced: boolean;
}
```

### 3.2 The `DiegeticScreenBase` Class
Create `src/ui/screens/DiegeticScreenBase.ts` providing standard:
- Focus trapping and `Escape` key routing.
- Web Audio oscillator cleanup on teardown.
- Keyboard accessibility stepping (`ArrowLeft`, `ArrowRight`, `Space`, `Enter`).
- Integration with `EventBus`.

### 3.3 Audio Engine & Fallback Guarantees
- Oscillators for 528 Hz and frequency sweeps are synthesized in real time via Web Audio API, requiring zero external MP3 assets.
- All spoken voiceover lines are mirrored in real-time through `ui:subtitle_changed` to ensure total narrative delivery on all devices.

---

## 4. Summary of Improvements

1. **Compelling Psychological Premise**: Anchoring the game in Kiyoshi Kurosawa's *Cure* (1997) transforms arbitrary room puzzles into a deeply unsettling, hypnotic study of compliance and psychological contagion.
2. **Unmatched First Impression**: Act I hooks the player in under 4 minutes with a ringing telephone, a hypnotic voice, a heavy brass shunt, a live Tektronix Lissajous wave, and a concussive blastdoor release.
3. **Visceral Emotional Variety**: Act II shifts into somatic dread with catatonic patients and glowing UV blacklight; Act III introduces tactile industrial hydraulics and fluid equilibrium.
4. **Bulletproof Technical Integrity**: Discrete integer mechanics, fail-safe reset levers, procedural Web Audio generation, and strict TypeScript state serialization guarantee 100% test determinism.


---

## 3. The 8-Act Hub-and-Spoke Narrative Structure (Synthesized)
*Note: The old 'escape room' mechanical structure (recovering crystals to fix a door) has been fully absorbed and recontextualized into The Cure framework. The player is not fixing a door to escape; they are passing diagnostic calibrations to prove they are ready to carry The Cure.*

```
[THE HUB: THE SURFACE] (Room 04: Sterile Reception & CRT Terminal)
         │
         ├───> [ACT II: THE SLEEP WARD] (First Descent ──> Crystal 1: Quartz)
         │           │
         │           └───> Return to Hub: Patch CRT Node 1 (Audio Log 1)
         │
         ├───> [ACT III: THE HYDROTHERAPY ROOM] (Second Descent ──> Crystal 2: Drained Brass)
         │           │
         │           └───> Return to Hub: Patch CRT Node 2 (Audio Log 2)
         │
         ├───> [ACT IV: THE AUDIOLOGY VAULT] (Reality Fracture ──> Crystal 3: Amplifier Cone)
         │           │
         │           └───> Return to Hub: Patch CRT Node 3 (Audio Log 3)
         │
         ├───> [ACT V: THE ARCHIVE] (Deep Sickness ──> Crystal 4: Pitch-Black Jagged)
         │           │
         │           └───> Return to Hub: The Hub Decays (Audio Log 4)
         │
         └───> [ACT VI: THE DIRECTOR'S OFFICE] (The Core ──> Crystal 5: Glowing Heart)
                     │
                     └───> [ACT VII: THE SYNTHESIS] (All 5 Crystals Patched ──> Hub Blackout)
                                 │
                                 └───> [ACT VIII: THE ESCAPE / DEPLOYMENT] (The 1950s Subway)
```

### The Five Memory Crystals as Living Psychic Organs
The recovered crystals are not inanimate gemstones; they are crystallized neurological memory fragments from the subjects who failed the calibration:

| Specimen | Artifact Name | Source Subject | Neurological Trauma | Reward Audio Log |
|---|---|---|---|---|
| **Crystal 01** | Prismatic Quartz | Subject 101 | Motor tremors, limbic weeping, terror | Tape 01: The Discovery of Limbic Decoupling (1973) |
| **Crystal 02** | Oxidized Bronze | Subject 102 | Severed vocal cords, silent screaming | Tape 02: Flesh as the Infection |
| **Crystal 03** | Fractured Amethyst | Subject 103 | Auditory hallucinations, phase psychosis | Tape 03: The Synthesis of Silence |
| **Crystal 04** | Pitch-Black Obsidian | The Archive (001–100) | The Collective Residue ("We are Legion") | Tape 04: The Carrier is Ready |
| **Crystal 05** | Glowing Celadon Core | The Director | The Eradication of Conscience | Tape 05: The Final Inoculation |

With every crystal recovered and slotted into the central CRT console, the pristine alabaster walls of the Hub bruise and discolor. The visual corruption is the side-effect of Subject 104 successfully digesting the trauma of others and erasing it from their own mind.


---

# The Tripartite Psychological Horror Framework: The Architecture of Dread

> **Design Principle**  
> Rather than imitating a single cinematic work, *The Vault: Room 04* synthesizes three foundational traditions of psychological and existential dread: **Kiyoshi Kurosawa's hypnotic contagion**, **David Lynch's uncanny surrealism and tension modulation**, and **the corporate doublespeak of partitioned selfhood (*Severance*)**.  
> This framework serves as an additive layer, enriching the existing eight chambers with profound emotional resonance, tactile intrigue, and masterfully paced psychological tension.

---

## 1. The Three Cinematic & Philosophical Pillars

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    THE TRIPARTITE PSYCHOLOGICAL MOSAIC                          │
├─────────────────────────┬──────────────────────────┬────────────────────────────┤
│   KIYOSHI KUROSAWA      │       DAVID LYNCH        │      CORPORATE DISSOCIATION│
│   (Cure, Pulse)         │  (Twin Peaks, Mulholland)│       (Severance, Kafka)   │
├─────────────────────────┼──────────────────────────┼────────────────────────────┤
│ • Ambient contagion     │ • Uncanny mundane objects│ • Administrative euphemisms│
│ • Hypnotic amnesia      │ • Dream-logic geometry   │ • Partitioned consciousness│
│ • Repetitive rituals    │ • The "Tension Coil"     │ • Human sorrow as a defect │
│ • Quiet, rational dread │ • Intense acoustic vacuum│ • The illusion of consent  │
└─────────────────────────┴──────────────────────────┴────────────────────────────┘
```

### Pillar I: Kiyoshi Kurosawa — Ambient Contagion & Hypnotic Calm
- **The Philosophy**: In Kurosawa's *Cure* (1997) and *Pulse* (2001), horror does not announce itself with screeching monsters or sudden violence. It is quiet, rational, and chillingly polite. Evil spreads like a sensory virus—carried by a repetitive rhythm, a trickling of water, or a monotone question.
- **Application in The Vault**:
  - The facility staff never threaten or scream at Subject 104. The voices on recordings and over the telephone are measured, articulate, and soothing.
  - The horror comes from realizing that compliance feels peaceful. The temptation to stop resisting and let the mind go numb is the true threat.

### Pillar II: David Lynch — The Uncanny Mundane & The Tension Coil
- **The Philosophy**: In Lynch's cinema (*Twin Peaks: The Return*, *Mulholland Drive*, *Lost Highway*), horror resides in ordinary mid-century domesticity: an unplugged cream telephone that rings anyway, a radiator that emits an organic hum, an empty hallway that feels alive.
- **The Emotional Waveform ("Give Fear, Then Take It Away")**:
  - Lynch builds unbearable tension not by exploding into a jump scare, but by holding an uncomfortable moment until it hurts—and then abruptly **cutting to complete, dead silence**.
  - Taking the fear away leaves the audience in a sensory vacuum (*"the nothing"*). In that breathless silence, the player's own imagination takes over, magnifying every subtle visual texture, every shadow, and every faint click.

### Pillar III: Corporate Dissociation — The Bureaucracy of the Self (*Severance*)
- **The Philosophy**: Inspired by *Severance*, Franz Kafka's bureaucratic nightmares, and Mark Fisher's *Capitalist Realism*, the facility treats the human soul as malfunctioning office hardware that simply requires scheduled maintenance.
- **Application in The Vault**:
  - Extreme emotional trauma is described in cheerful corporate wellness language: *"limbic friction"*, *"equilibrium protocol"*, *"phase stabilization"*, *"voluntary cognitive alignment"*.
  - The Crimson Dossier treats the player's identity not as a human biography, but as an administrative intake requisition. Did the "you" of yesterday choose to enter this facility? If you signed the intake document, is your current self bound by that choice?

---

## 2. Act I: The Master Tension Coil (Beat-by-Beat Modulation)

To ensure the player is utterly transfixed within the first four minutes, Act I executes a precise oscillation between **Suspense**, **Fear/Dread**, **The Sensory Vacuum**, and **Tactile Mechanical Relief**:

```
Intensity
   ▲
100│                      [Fear Spike: The Voice]
   │                             /\
 75│                            /  \
   │                           /    \
 50│   [Awakening: Suspense]  /      \
   │            /\           /        \       [Tactile Relief: Harmonic Lock & Blastdoor]
 25│           /  \         /          \                     /─────────\
   │          /    \       /            \                   /           \
  0└─────────/──────\─────/              \─────────────────/─────────────\────► Time
           0:00    0:30  0:45           1:15              2:00          3:30
                                   [The Acoustic Vacuum]
```

### The Emotional Beats in Detail:

#### Beat 1: The Cold Awakening (0:00 - 0:30) — *Suspense & Uncanny Realism*
- **Visual**: The player opens their eyes. Symmetrical white walls, pristine pale terrazzo floor, smoked teak desk.
- **Acoustic**: A dry, sterile 60 Hz electrical fluorescent light hum.
- **The Hook**: Before the player moves, the cream rotary telephone on the desk rings with a muffled, rhythmic chime.
- **The Lynchian Tell**: Looking closely at the telephone, its curly cord dangles loosely onto the floor, severed. It is ringing without a wall connection.

#### Beat 2: The Ringing Phone (0:30 - 1:15) — *The Dread Spike*
- **Action**: The player lifts the receiver. The ringing stops instantly.
- **Acoustic**: A low 40 Hz binaural drone swells subtly beneath the dialogue, creating physical acoustic tension.
- **The Voice**: A flat, calm voice speaks with chillingly cordial intimacy:
  > *"Subject 104. You believe you were brought here against your will. But tell me: who was it that signed the intake sheet? Look at your hands. No bruises. No bindings. You chose to be cured. We all chose it. Finish your harmonic calibration. The corridor is waiting."*
- **The Climax of the Call**: On the final word *"waiting"*, the line emits a sharp electrical pulse.

#### Beat 3: The Acoustic Vacuum (1:15 - 1:45) — *The "Nothing"*
- **The Subversion**: Instead of a jump scare or an alarm, **everything cuts out completely**.
- **Acoustic**: Zero decibels. Absolute silence for two full seconds. The 60 Hz fluorescent hum, the drone, the phone—gone.
- **Psychological Effect**: The player's nervous system braces for an attack that never comes. The dread collapses into hypnotic stillness. The player takes a deep breath. In this vacuum, the player feels acutely present in the physical room.

#### Beat 4: Tactile Grounding (1:45 - 2:30) — *Observation & Tangible Props*
- **Visual**: The faint fluorescent hum slowly fades back in, grounding the room in reality.
- **Action**: The player investigates the desk.
  - Beside the phone lies the **Crimson Dossier**: stamped with official corporate seals and intake protocols.
  - Beside the dossier sits a **Heavy Brass Cylinder Shunt**: machined brass with knurled grip, cold to the touch. The player picks it up (`prop_brass_shunt` acquired).
- **The Mental Connection**: The player looks at the central Tektronix oscilloscope console on the desk apron. There is an empty ceramic fuse block with exposed brass spring clips.

#### Beat 5: Tactile Mechanical Mastery (2:30 - 3:30) — *Catharsis & Agency*
- **Action**: Clicking the Tektronix console opens the diegetic hardware screen.
  - The player snaps the brass shunt into the fuse clips. *CLANK.* Vacuum tubes ignite behind the ventilation louvers with a rich orange glow.
  - The player rotates the large Bakelite frequency dial. As the frequency approaches 528 Hz, the erratic green phosphor wave smoothly stabilizes into a glowing circular Lissajous loop.
  - A heavy internal solenoid trips open with a metallic *TICK*.
  - The player drags down the heavy ceramic knife switch.
- **The Payoff**: A concussive pneumatic hiss releases through the wainscoting. The forward steel blastdoor swings open into the dark observation corridor. The player has earned their progress through observation and tactile manipulation.

---

## 3. Additive Integration Across Subsequent Acts

This tripartite framework layers onto the existing chambers without altering their established architectural layouts:

| Act | Chamber | Kurosawa Element | Lynch Element | Severance Element |
|---|---|---|---|---|
| **Act II** | The Sleep Ward | Silent patients with slow, shared breathing tempo. | Turning off lights reveals glowing handwritten messages on the ceiling. | Medical charts documenting "vocal cord severance" as successful symptom management. |
| **Act III** | Hydrotherapy Room | Drowning sensations and acoustic siphoning. | A submerged hydrophone playing faint ballroom music beneath the surface. | Clinical plaques describing hyper-saline immersion as a standard employee perk. |
| **Act IV** | Audiology Vault | Phase cancellation inducing auditory hallucinations. | Wall paintings that warp their geometric angles when not viewed directly. | Acoustic testing measuring employee resistance to Directorate directives. |
| **Act V** | The Archive | Infinite spiral of cabinets; phone cords coiling like roots. | Pneumatic canisters arriving with personal items belonging to the player. | Discarded personnel files stamped "SEVERED & PRESERVED // NON-COMPLIANT". |
| **Act VI** | Director's Office | Intercepted telephone tape recording of the Director's voice. | Executive desk floating in infinite black void under a single spotlight. | The realization that the Director subjected himself to the same severance procedure. |
| **Act VII** | Synthesis Chamber | Overwhelming acoustic entrainment locking all frequencies. | Total blackout followed by warm amber light spilling through an unexpected door. | The final corporate appraisal declaring Subject 104 "100% Aligned". |
| **Act VIII** | Velvet Lounge / Subway | The viral carrier stepping out into the civilian city. | A one-way mirror showing a silhouette reflection with no human features. | The final telephone call: your own voice thanking yourself for your compliance. |

---

## 4. Technical Safeguards (Senior Technical Reviewer Verified)

1. **Non-Blocking Audio Architecture**:
   - The acoustic vacuum and frequency swells route through native Web Audio nodes and EventBus notifications.
   - If audio is muted or restricted by browser autoplay policies, all narrative beats display synchronized diegetic subtitles (`ui:subtitle_changed`).
2. **Zero Input Lockouts**:
   - During phone voiceover and tension beats, the player remains free to look around or interact with desk props. Rapid clicks or early interactions register cleanly without race conditions.
3. **Deterministic State Progression**:
   - All narrative milestones are recorded in `GameState` flags (`telephoneAnswered`, `brassShuntInserted`, `harmonicLocked`), ensuring test scripts and save states remain 100% deterministic.


---

# The Vault: Room 04 - Master Phased Implementation Plan

> **Architectural Status: COMPLETE**  
> All 5 execution phases for upgrading the facility into a multi-layered psychological descent across 8 Acts have been successfully implemented, hardened, and verified via Playwright E2E testing. The system now features decoupled diegetic hardware screens, stable finite state machines, and synchronized storytelling, all while maintaining strict WebGL performance budgets and 0 memory leaks.

---

## Completed Phase Ledger

```text
====================================================================================
                        PHASED EXECUTION MATRIX (COMPLETED)
====================================================================================
PHASE   | TARGET CHAMBERS          | CORE INTERACTION     | VERIFICATION STATUS
------------------------------------------------------------------------------------
Phase 0 | Foundational Core        | Schema & Base Modal  | Verified & Hardened
Phase 1 | Acts I & II (Pair I)     | Tektronix CRT & UV   | Verified (0 console errors)
Phase 2 | Acts III & IV (Pair II)  | Hydraulics & Chladni | Verified (0 console errors)
Phase 3 | Acts V & VI (Pair III)   | Microfiche & Wiretap | Verified (0 console errors)
Phase 4 | Acts VII & VIII (Pair IV)| Power Grid & Mirror  | Verified (0 console errors)
Phase 5 | Full System Polish       | Performance & VRAM   | Verified (0 memory leaks)
Phase 6 | Hardening & Blueprint    | Save, Audio & Map    | Verified (44 Unit / 26 E2E)
Phase 7 | Fast Test Infrastructure | Single-Browser & GC  | Verified (67.88s / 26 Suites)
====================================================================================
```

## The Verification Protocol (Historical Context)
To prevent cascading failures during implementation, every phase was subjected to:
1. **Edge Case & Failure State Validation**: Testing rapid clicking, sequence breaking, and interrupting camera transitions.
2. **Playwright E2E Suite Execution**: Asserting `data-testid` elements on diegetic screens, focus trapping, and verifying explicit `AudioContext` teardown.
3. **Strict Git Checkpointing**: Features were committed only upon full test suite success.
4. **Single-Browser High-Speed Regression**: Consolidated runner (`npm run test:fast`) executing 26 suites sequentially inside isolated browser contexts, disposing WebGL canvases to ensure zero GPU resource leaks.

The project continues to uphold this testing standard for all future features.



---

