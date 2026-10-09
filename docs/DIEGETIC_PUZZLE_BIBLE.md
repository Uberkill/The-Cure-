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

### Act II: The Sleep Ward — The Sedative Dispensary & UV Diagnostic Matrix
* **The Diegetic Hardware Console**:
  A stainless steel mobile dispensary cart front-panel featuring three heavy brass rotary tumblers engraved with alchemical/chemical glyphs, a fluid sight-glass, an IV peristaltic drip roller clamp, and a darkroom Ultraviolet (UV) lamp switch.
* **The Interactive Mechanics**:
  1. *Diagnostic UV Shift*: Flipping the UV toggle turns the viewport into high-contrast indigo blacklight. Under UV light, glowing chemical stamps and handprints become visible across Cot 104's linens and chart.
  2. *Drip Calibration*: The player drags the IV roller clamp to adjust flow rate. A pulsing acoustic droplet sound plays; the sight-glass fills. Matching the drip rate to the patient's recorded resting heart rate (68 bpm) unlatches the cart's electromagnetic deadbolt.
  3. *Chemical Tumbler Alignment*: The player rotates the three brass tumblers to match the three active sedatives deduced from the charts: `[Nitrous] - [Bromide] - [Valerian]`.
* **Sensory Telegraphing**:
  - Drip sight-glass bubbles in real-time. Droplet audio tempo matches visual drip animation.
  - Tumbler wheels emit heavy spring-loaded ratchet clicks with tactile resistance.
* **Accessibility / Keyboard Fallback**: Keys 1, 2, 3 select tumblers; Up/Down keys step through the 8 chemical glyphs.
* **Fail-Safe**: Releasing the roller clamp flushes the sight-glass back into a gravity ballast reservoir.

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
