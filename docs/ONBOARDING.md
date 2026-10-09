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

The project avoids monolithic god-objects by enforcing decoupled boundaries mediated by a typed Publish/Subscribe EventBus. We heavily utilize a Component-Scoped MVC architecture for our diegetic screens.

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
│   ├── Room02_SleepWard.ts    # Act II Sleep Ward 
│   ├── Room03_Hydrotherapy.ts # Act III Hydrotherapy chamber
│   └── Room04_AudiologyVault.ts # Act IV Audiology chamber
└── ui/
    ├── UIManager.ts           # Global HUD overlays and reticle raycast prompts
    ├── ScreenManager.ts       # Transitions between 3D Canvas, Terminal, and Cinematic overlays
    └── screens/               # Decoupled Component-Scoped MVC Diegetic Screens
        ├── DiegeticScreenBase.ts # Abstract lifecycle & focus trapping
        └── binaural/          # Example MVC Component Structure
            ├── BinauralTemplate.ts        # HTML Template View
            ├── BinauralAudio.ts           # WebAudio synthesis layer
            ├── ChladniRenderer.ts         # Canvas 2D physics layer
            └── BinauralSynthesizerScreen.ts # Controller glue logic
```

### Component-Scoped MVC UI
To prevent code bloat, our interactive puzzle screens (e.g., the Binaural Synthesizer, Wiretap Deck) are decoupled. We do **not** use a global state manager (like Redux) for puzzles. Instead:
- State is strictly isolated inside the Controller (e.g., `BinauralSynthesizerScreen.ts`).
- DOM strings are externalized to Template files.
- Audio and Canvas rendering are separated into their own reusable classes.
- The Controller listens to DOM events, updates the local state, and passes data to the audio/render layers.

---

## 3. The 3D Sandbox & Content Pipeline
Models are loaded via `ModelLoader.ts`. If an external `.glb` file fails to fetch, the loader intercepts the 404 error and injects a procedural geometry fallback (e.g., `EditorPrefabs.ts`). This guarantees the WebGL context never crashes due to a missing asset.
