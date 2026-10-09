# The Vault: Room 04 - Technical Onboarding & Architecture Guide


## 1. Project Overview & Aesthetic Identity

"The Vault: Room 04" is an interactive 3D psychological thriller web application built with Three.js, Vite, and TypeScript.
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

The project avoids monolithic god-objects by enforcing decoupled boundaries mediated by a typed Publish/Subscribe EventBus:

```
src/
├── main.ts                    # Application bootstrap, lifecycle loop, and resize handlers
├── types/
│   └── index.ts               # Core TypeScript interfaces, GameStage enum, event payloads
├── core/
│   ├── EventBus.ts            # Decoupled singleton pub/sub mediator
│   ├── GameState.ts           # Central Finite State Machine (FSM) & puzzle stages
│   └── Telemetry.ts           # Diagnostic logging, crash resilience & WebGL recovery
├── audio/
│   ├── AudioEngine.ts         # Procedural Web Audio API synthesizer & cassette logs
│   └── MusicTrackManager.ts   # Custom track audio loader with smooth crossfading
├── rendering/
│   ├── SceneManager.ts        # Three.js renderer, ACESFilmic tone mapping, PCF shadows
│   └── CameraDirector.ts      # OrbitControls & cinematic camera transitions with input locks
├── entities/
│   ├── ProceduralTextures.ts  # Canvas-generated ceramic tiles, terrazzo, CRT screen maps
│   ├── ProceduralRoom04.ts    # Procedural 3D geometry fallback for Room 04 (The Central Hub)
│   ├── HubDecayManager.ts     # Progressive material rot, bruising, and weeping in Room 04
│   └── CRTNodePatcher.ts      # 2D Canvas phosphor node-linking minigame
├── scenarios/
│   ├── ScenarioRegistry.ts    # Chamber loader with recursive GPU VRAM disposal
│   ├── Room04_SterileChamber.ts # Act I Hub chamber logic
│   ├── Room02_SleepWard.ts    # Act II Sleep Ward & 3-digit rotary lock (1-0-4)
│   ├── Room03_Hydrotherapy.ts # Act III Hydrotherapy chamber & valve manifold puzzle
│   ├── Room04_AudiologyVault.ts # Act IV Audiology chamber & 741 Hz amplifier slider
│   ├── Room05_Archive.ts      # Act V Archive maze & patient filing drawer 104
│   ├── Room06_DirectorsOffice.ts # Act VI Void office & breathing telephone
│   └── Room08_VelvetLounge.ts # Act VIII Lynchian climax with sole ringing payphone
├── interaction/
│   ├── RaycastManager.ts      # Cursor hover reticle & drag-vs-click separation (<6px / <500ms)
│   ├── InspectionManager.ts   # Isolated WebGL 3D turntable for inspecting items (Brass Key)
│   └── DevTransformGizmo.ts   # In-Engine 3D transform tool for Dev Mode
├── editor/
│   ├── Dev3DEditorPanel.ts    # React-like DOM Dev tool for multi-select and live persistence
│   ├── EditorServerSync.ts    # Local API hooks to auto-save layout.json
│   ├── EditorVisualizers.ts   # Raycast hover bounding box visualizers
│   └── EditorPrefabs.ts       # Spawners for clocks, lights, and set dressing
│   └── InspectionManager.ts   # Isolated WebGL 3D turntable for inspecting items (Brass Key)
└── ui/
    ├── ScreenManager.ts       # View state router (title, chamber, dossier, inspect, debrief)
    └── UIManager.ts           # Chapter cards, sensory subtitles, and modal controls
```

### Core Communication Contracts
- **`EventBus.ts`:** All inter-module events are strictly typed (`game:stage_transition`, `camera:move_to_hotspot`, `puzzle:crystal_collected`, `puzzle:crt_patch_completed`, `ui:view_changed`, `ui:subtitle_changed`).
- **`GameState.ts`:** Strict linear stage machine tracking progression from `ACT_1_HUB_AWAKEN` through `ACT_8_SUBWAY_CLIMAX`.
- **`ScenarioRegistry.ts`:** Loads individual room scenario classes, swaps active scene graphs, and executes `disposeHierarchy()` on unmounted meshes and textures to prevent WebGL memory leaks. Automatically triggers `AudioEngine.getInstance().teardownScenarioAudio()` on room unmount.
- **`AudioEngine.ts` Audio Cascading & Limiter Safeguards:**
  - Hardware Master Limiter: `DynamicsCompressorNode` (`threshold: -14dB`, `knee: 24`, `ratio: 10`, `attack: 0.003s`, `release: 0.20s`) inserted before `destination` to prevent digital clipping when voices sum.
  - Active Sweep Oscillator Cancellation: `playToneAlignmentSweep` ramps down and disconnects previous sweeps before scheduling new frequencies, eliminating voice stacking explosions during rapid slider/dial manipulation.
  - Node Lifecycle Cleanup: One-shot nodes (`playTumblerClick`, `playPneumaticHiss`, `playWaterDrip`, `playHandsetClick`) attach `onended` callbacks to immediately disconnect gain nodes upon completion.

---

## 3. The 8-Act Hub-and-Spoke Narrative Progression

1. **Act I: The Central Hub (The Reception)**
   - Wakes in Room 04. Unseals Crimson Dossier on desk.
   - Calibrates rotary dial to 528 Hz. Primary relay thrown. Forward corridor door unseals.
2. **Act II: Room 02 - The Sleep Ward**
   - Investigates Subject 101-103 clipboards.
   - Solves 3-digit rotary lock (1-0-4) on dispensary trolley to recover Quartz Crystal.
   - Returns to Hub, patches CRT Node 1, listens to Audio Log 1 ("A cure for human sorrow").
3. **Act III: Room 03 - The Hydrotherapy Chamber**
   - Balances 3 brass valves on manifold to reduce pressure to 0 PSI. Recovers Bronze Crystal.
   - Returns to Hub (Decay Level 2), patches CRT Node 2, listens to Audio Log 2 ("Flesh is the infection").
4. **Act IV: Room 04 - The Audiology Vault**
   - Tunes amplifier frequency slider to 741 Hz to match resonant harmonic. Recovers Amethyst Crystal.
   - Returns to Hub (Decay Level 3), patches CRT Node 3, listens to Audio Log 3 ("Death is absolute alignment").
5. **Act V: Room 05 - The Archive**
   - Searches spiral cabinet maze for drawer 104. Recovers Obsidian Crystal.
   - Returns to severely bruised Hub (Decay Level 4), patches CRT Node 4, listens to Audio Log 4 ("The carrier is ready").
6. **Act VI: Room 06 - The Director's Office**
   - Crosses pitch-black void to spotlighted mahogany desk. Answers telephone with wet breathing. Recovers Celadon Crystal.
7. **Act VII: The Central Hub - Synthesis & Blackout**
   - Final harmonic lock triggers total electrical blackout and 3-second acoustic void.
   - Exit blastdoor blows open with concussive air hiss and warm amber spill.
8. **Act VIII: The Velvet Lounge (The Deployment)**
   - Steps through blastdoor into Lynchian red velvet lounge.
   - All environment interaction disabled except the solitary ringing payphone.
   - Answering the receiver plays player voice: *"The exit is open. The cure is spreading. Thank you for your compliance."*
   - Concussive 528 Hz sonic blast; permanent cut to black.

---

## 4. Runbook: Execution & Testing Commands

### Windows One-Click Launchers
- `start.bat`: Starts local Vite development server and opens default browser.
- `run.bat`: Runs automated end-to-end verification and diagnostic checks.

### Terminal Commands (PowerShell / Command Prompt)
```powershell
# Typecheck TypeScript source
npm run typecheck

# Production build bundle
npm run build

# Run 3D and Audio Stress Test Suite (TypeScript check + Playwright stress suite)
npm test

# Run all test suites sequentially
npm run test:all

# Start local preview server
npm run preview

# Start development live reload
npm run dev
```

### Automated Playwright Test Suites
Run these scripts using Node.js to verify functionality:
```powershell
# 1. 3D Bounds, Audio Burst Limiting, VRAM Leak Check, Aspect Ratio & Visibility
node test_3d_and_audio_stress.js

# 2. Room 04 360 Enclosure, Persistent Header HUD & Audio Startup State Audit
node test_room04_audit_and_360.js

# 3. Visual Verification & Screenshots (WebGL Angle)
node verify_room04_visuals.js

# 4. Modal Overlays, Close X, 3D Key Turntable & Click-vs-Drag Audit
node test_interactions_and_overlays.js

# 5. Full 8-Act Hub-and-Spoke Narrative Descent E2E
node test_full_descent_e2e.js

# 6. Verify 0 VRAM memory leaks during infinite rapid scene transitions
npm run test:memory

# 7. Spam-click event lock validation and camera transition state integrity
npm run test:click
```

---

