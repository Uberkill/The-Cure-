# The Vault: Room 04 — Master Phased Implementation Plan

> **Architectural Overview**  
> Complete execution roadmap for upgrading the facility from single-step data transcription into a multi-layered psychological descent across five distinct, pair-by-pair phases. Every phase introduces dedicated diegetic hardware screens, fail-safe state machines, and synchronized storytelling while maintaining 100% test determinism and WebGL performance budgets.

---

## Phase Matrix Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PHASED EXECUTION MATRIX                               │
├─────────┬──────────────────────────┬──────────────────────┬─────────────────────┤
│ PHASE   │ TARGET CHAMBERS          │ CORE INTERACTION     │ VERIFICATION SUITE  │
├─────────┼──────────────────────────┼──────────────────────┼─────────────────────┤
│ Phase 0 │ Foundational Core        │ Schema & Base Modal  │ Typecheck & Build   │
│ Phase 1 │ Acts I & II (Pair I)     │ Tektronix CRT & UV   │ test_pair_1_e2e.js  │
│ Phase 2 │ Acts III & IV (Pair II)  │ Hydraulics & Chladni │ test_pair_2_e2e.js  │
│ Phase 3 │ Acts V & VI (Pair III)   │ Microfiche & Wiretap │ test_pair_3_e2e.js  │
│ Phase 4 │ Acts VII & VIII (Pair IV)│ Power Grid & Mirror  │ test_full_descent   │
│ Phase 5 │ Full System Polish       │ Performance & VRAM   │ npm run test:all    │
└─────────┴──────────────────────────┴──────────────────────┴─────────────────────┘
```

---

## Phase 0: Foundational Core, Typed Schema & Scaffolding

### Objective
Establish the common type system, state hydration contracts, and diegetic hardware screen base classes without altering running chamber code.

### Tasks & File Ledger
1. **Typed State Contracts (`src/types/cure.ts`)**:
   - Declares `CureGameStateSlice` and individual act states (`Act01SterileState` through `Act08VelvetLoungeState`).
   - Declares strict integer boundaries for discrete puzzle logic (e.g. `tubWaterLevels: [number, number, number]`).
2. **Diegetic Screen Interface & Base Class (`src/ui/screens/`)**:
   - `IDiegeticScreen.ts`: Defines `open()`, `close()`, `getState()`, `hydrate()`, `reset()`, and `stepControl()`.
   - `DiegeticScreenBase.ts`: Implements focus trapping, `Escape` key isolation, DOM modal mounting, and Web Audio cleanup.
   - `diegetic_screens.css`: Brutalist 1970s hardware bezel and viewport styles.
3. **Scaffolded Screen Modules**:
   - `TektronixCrtScreen.ts`, `DispensaryCartScreen.ts`, `HydraulicManifoldScreen.ts`, `BinauralSynthesizerScreen.ts`, `MicroficheViewerScreen.ts`, `WiretapTapeDeckScreen.ts`, `GalvanometerGridScreen.ts`, `SwitchboardMirrorScreen.ts`.
4. **Verification**:
   - `npm run typecheck` passes with zero errors.

---

## Phase 1: Pair I — Acts I & II (The Calibration & The Somatic Ward)

### Objective
Build the definitive opening hook: Act I (Sterile Examination) and Act II (The Sleep Ward). Transform the first 10 minutes into a tense, tactile, emotionally arresting experience.

### Act I: The Sterile Examination (Examination Room 04)
- **Narrative Beat**: Tension Coil (Ringing telephone with severed cord -> Hypnotic monologue -> 2-second acoustic vacuum -> Tactile desk grounding -> Lissajous entrainment).
- **Interactive Props**:
  - `prop_telephone`: Answers incoming call; triggers monotone monologue and subtitles.
  - `prop_brass_shunt`: Cold machined cylinder collected from desk into inventory.
  - `prop_tektronix_console`: Opens `TektronixCrtScreen`.
- **Tektronix CRT Screen Mechanics**:
  - Drag brass shunt into empty ceramic fuse clips -> vacuum tube orange filaments ignite -> phosphor wave bursts to life.
  - Frequency dial sweeps pitch; at 528 Hz, wave locks into a pulsating circular Lissajous loop.
  - Internal solenoid clicks open; knife switch unlocks.
  - Dragging knife switch down trips the forward corridor airlock with a concussive pneumatic hiss.

### Act II: The Sleep Ward (Observation Dormitory 02)
- **Narrative Beat**: Somatic horror (Motionless linen-swathed patient silhouettes in Cots 101–103; Cot 104 is vacant with open restraints).
- **Interactive Props**:
  - `prop_uv_toggle`: Wall surgical switch; toggles deep indigo ultraviolet blacklight mode.
  - Luminescent handwriting revealed under UV: *"WE ARE THE CURE"* and glowing chemical glyphs on Cot 104.
  - `prop_trolley_console`: Opens `DispensaryCartScreen`.
- **Dispensary Cart Screen Mechanics**:
  - Adjust IV peristaltic drip clamp to synchronize drip tempo with 68 bpm resting cardiac pulse -> deadbolt disengages.
  - Rotate three brass tumblers to align chemical triad: `[Nitrous] - [Bromide] - [Valerian]`.
  - Drawer slides open, releasing Memory Crystal 01 (Prismatic Quartz).

### Verification
- Run `tests/test_pair_1_e2e.js`: Verifies telephone pickup, shunt insertion, Lissajous frequency lock, airlock opening, UV mode toggle, IV drip synchronization, and crystal collection.

---

## Phase 2: Pair II — Acts III & IV (The Visceral Basin & The Acoustic Void)

### Objective
Implement industrial physical processes: hydraulic fluid equilibrium in Hydrotherapy and acoustic phase cancellation in Audiology.

### Act III: The Hydrotherapy Room (Immersion Basin 03)
- **Narrative Beat**: Visceral institutional hygiene (porcelain tubs with leather restraints; smell of copper and salt).
- **Interactive Props**:
  - `prop_manifold_console`: Opens `HydraulicManifoldScreen`.
  - `prop_submerged_valve`: Submerged brass valve on bottom of Tub 2 revealed only when water drops to 0.
  - `prop_emergency_dump`: Industrial red lever for non-destructive sump reset.
- **Hydraulic Manifold Screen Mechanics**:
  - Three brass valve wheels transfer water between interconnected tubs in discrete integer steps `[0..4]`.
  - Emptying Tub 2 exposes the submerged bypass valve. Opening the valve equalizes all three tubs to 2 units.
  - Bourdon pressure gauge needle drops from 45 PSI to 0.0 PSI. Pneumatic piston floats floor grate up, revealing Memory Crystal 02 (Oxidized Bronze).

### Act IV: The Audiology Vault (Vault 04)
- **Narrative Beat**: Reality fracture (geometric wall paintings warp angles; towering amplifier monolith).
- **Interactive Props**:
  - `prop_horn_left` / `prop_horn_right`: Turnable exponential acoustic horns.
  - `prop_binaural_console`: Opens `BinauralSynthesizerScreen`.
- **Binaural Synthesizer Screen Mechanics**:
  - Directional compass dials aim horns at 45 deg and 135 deg toward central lead baffle.
  - Toggle $180^\circ$ phase-inversion bridge; sweep carrier frequency to 652 Hz.
  - Live Chladni sand simulation snaps into a symmetrical geometric mandala; audio cancels into absolute dead silence; lead baffle releases Memory Crystal 03 (Fractured Amethyst).

### Verification
- Run `tests/test_pair_2_e2e.js`: Verifies discrete siphon fluid steps, 0.0 PSI grate release, emergency dump reset, horn azimuth steering, Chladni nodal lock, and crystal retrieval.

---

## Phase 3: Pair III — Acts V & VI (The Institutional Memory & The Executive Core)

### Objective
Implement optical microfilm deduction in the Archive and wiretap tape analysis in the Director's Office.

### Act V: The Archive (Archive Ward 05)
- **Narrative Beat**: Deep sickness (40 steel cabinets; severed telephone cords coiling like roots).
- **Interactive Props**:
  - `prop_microfiche_reader`: Opens `MicroficheViewerScreen`.
  - `prop_pneumatic_terminal`: Brass tube dispatcher.
- **Microfiche Viewer Screen Mechanics**:
  - Mount damaged microfilm reel; rotate optical focus ring to resolve blurry text into syndicate departmental organigram.
  - Deduce Subject 104's excision department: *Acoustic Dissociation // Gamma-07*.
  - Dial pneumatic tube selector to `[GAMMA]` and `[07]`. Canister whistling through ceiling pipes lands in hopper with Obsidian Crystal 04.

### Act VI: The Director's Office (The Core)
- **Narrative Beat**: The void (executive desk floating in pitch-black darkness under a single spotlight).
- **Interactive Props**:
  - `prop_executive_desk`: Opens `WiretapTapeDeckScreen`.
  - `prop_carriage_clock`: Brass clock with movable hands.
- **Wiretap Tape Deck Screen Mechanics**:
  - Drag rotary telephone wheel clockwise to dial intercepted wiretap extension.
  - Rewind tape deck; flip speed lever to half-speed to decode intercepted voice timestamp (*"three minutes past eleven"*).
  - Set carriage clock hands to `11:03`. Electromagnetic solenoid releases secret drawer, revealing Celadon Crystal 05.

### Verification
- Run `tests/test_pair_3_e2e.js`: Verifies optical focus resolution, pneumatic tube canister delivery, half-speed tape decoding, rotary phone dialing, and carriage clock unlock.

---

## Phase 4: Pair IV — Acts VII & VIII (The Overload Synthesis & The Subway Climax)

### Objective
Implement the power distribution overload in Room 04 and the spatial mirror paradox in the Velvet Lounge/Subway.

### Act VII: The Synthesis Chamber (The Overload)
- **Narrative Beat**: Catastrophic power surge as all 5 crystals are slotted into the central console.
- **Interactive Props**:
  - `prop_galvanometer_grid`: Opens `GalvanometerGridScreen`.
- **Galvanometer Grid Screen Mechanics**:
  - 5 crystal sockets energized. Galvanometer needles peg into red hazard zones.
  - Adjust 5 ceramic resistance slider shunts until each channel balances to $100\,\Omega$.
  - All 5 needles center in green safe zone. Main hydraulic bus lever unseals left steel blastdoor to Velvet Lounge.

### Act VIII: The Velvet Lounge & Subway (The Deployment)
- **Narrative Beat**: Subway passenger car transition; mirror paradox; compliance confirmation.
- **Interactive Props**:
  - `prop_mirror_station`: Opens `SwitchboardMirrorScreen`.
  - `prop_final_payphone`: Solitary ringing payphone.
- **Switchboard Mirror Screen Mechanics**:
  - Detect table reflection discrepancy; drag decanter onto real table to align coordinates. Mirror shifts to transparent glass.
  - Patch switchboard plug from Trunk 104 into Line 4.
  - Payphone rings. Player lifts handset. Their own voice confirms compliance. 528 Hz pure tone drone hits at full dynamic range, cutting to black.

### Verification
- Run `tests/test_pair_4_e2e.js`: Verifies 5-channel shunt balancing, airlock opening, mirror reflection alignment, switchboard patching, and final payphone debrief.

---

## Phase 5: Master Verification & Performance Hardening

### Objective
Run complete test matrix across all 8 acts, asserting zero regressions, WebGL budgets, and zero memory leaks.

### Checklist
1. `npm run typecheck`: Zero errors.
2. `npm run build`: Production bundle builds under size budgets.
3. `npm run test:models`: 8 chambers audited for valid geometry, zero coplanar Z-fighting.
4. `npm run test:perf`: 60 FPS verified, draw calls < 220, memory delta = 0 across 20 rapid room traversals.
5. `npm run test:all`: Full suite passing deterministically.
