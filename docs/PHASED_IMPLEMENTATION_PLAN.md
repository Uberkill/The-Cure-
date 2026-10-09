# The Vault: Room 04 — Master Phased Implementation Plan

> **Architectural Overview**  
> Complete execution roadmap for upgrading the facility from single-step data transcription into a multi-layered psychological descent across 8 Acts (organized into 5 execution phases). Every phase introduces dedicated diegetic hardware screens, fail-safe state machines, and synchronized storytelling while maintaining 100% test determinism, strict Git loop version control, and WebGL performance budgets.

---

## The Verification & Version Control Loop (Applied to ALL Phases)

To prevent cascading failures, broken states, and untested edge cases, **every single phase** MUST conclude with the following strict loop before proceeding:

1. **Edge Case & Failure State Validation**:
   - Manually test rapid clicking, sequence breaking (e.g., trying to use an item before having it), and interrupting camera transitions.
   - Verify state determinism: hydrate the game state directly into the new Act from a cold boot to ensure no dependencies on previous Acts.
2. **Playwright E2E Suite Execution**:
   - Run the specific `test_pair_[X]_e2e.js` suite.
   - Assert `data-testid` elements on new diegetic screens, test focus trapping, and verify `Escape` key teardown.
   - Verify `AudioContext` and oscillators are explicitly destroyed to prevent Web Audio memory leaks (using explicit spies on `AudioContext` closure in the test).
3. **Strict Git Checkpoint (The Rollback Protocol)**:
   - If tests **PASS**: `git add .` and `git commit -m "feat(act-X): implement diegetic mechanics and pass E2E"`
   - If tests **FAIL**: 
     - Do **NOT** `git reset --hard` (which destroys debugging context).
     - Commit to a temporary debug branch (`git checkout -b debug/act-X-failure`, `git commit -m "wip: broken state"`).
     - Diagnose the issue, fix it, verify tests pass, then merge back to main and delete the debug branch.

---

## Phase Matrix Overview

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PHASED EXECUTION MATRIX                               │
├─────────┬──────────────────────────┬──────────────────────┬─────────────────────┤
│ PHASE   │ TARGET CHAMBERS          │ CORE INTERACTION     │ VERIFICATION SUITE  │
├─────────┼──────────────────────────┼──────────────────────┼─────────────────────┤
│ Phase 0 │ Foundational Core        │ Schema & Base Modal  │ Typecheck & Build   │
│ Phase 1 │ Acts I & II (Pair I)     │ Tektronix CRT & UV   │ test_pair_1_e2e.js  │
│ Phase 2 │ Acts III & IV (Pair II)  │ Hydraulics & Chladni │ test_pair_2_e2e.js  │
│ Phase 3 │ Acts V & VI (Pair III)   │ Microfiche & Wiretap │ test_pair_3_e2e.js  │
│ Phase 4 │ Acts VII & VIII (Pair IV)│ Power Grid & Mirror  │ test_pair_4_e2e.js  │
│ Phase 5 │ Full System Polish       │ Performance & VRAM   │ test_all.js         │
└─────────┴──────────────────────────┴──────────────────────┴─────────────────────┘
```

---

## Phase 0: Foundational Core, Typed Schema & Scaffolding

### Objective
Establish the common type system, state hydration contracts, and diegetic hardware screen base classes without altering running chamber code.

### Tasks
1. **Typed State Contracts (`src/types/cure.ts`)**: Declares `CureGameStateSlice` and strict integer boundaries for discrete puzzle logic.
2. **Diegetic Screen Interface (`src/ui/screens/`)**: Implements focus trapping, `Escape` key isolation, DOM modal mounting, and Web Audio cleanup.
3. **Test Infrastructure**: Ensure Playwright E2E is configured to spy on `AudioEngine` cleanup functions.

**Git Loop Execution**: Run `npm run typecheck`, commit scaffolding.

---

## Phase 1: Pair I — Acts I & II (The Calibration & The Somatic Ward)

### Case 1: Act I - The Sterile Examination
- **Mechanics**: `prop_telephone` monologue -> `prop_tektronix_console` Lissajous entrainment at 528 Hz.
- **Edge Cases**: Rapid-clicking the knife switch; closing the screen mid-animation.
- **E2E Assertions**: Verify `data-testid="oscilloscope-canvas"` renders; verify AudioContext suspends on close.

### Case 2: Act II - The Sleep Ward
- **Mechanics**: `prop_uv_toggle` blacklight -> `prop_trolley_console` IV drip synchronization (68 bpm) -> Tumbler alignment `[Nitrous, Bromide, Valerian]`.
- **Edge Cases**: UV toggle spammed; IV drip integer overflow.
- **E2E Assertions**: Verify material swaps on UV toggle; verify memory crystal state mutation.

**Git Loop Execution**: Run `test_pair_1_e2e.js`. Commit on pass; branch on fail.

---

## Phase 2: Pair II — Acts III & IV (The Visceral Basin & The Acoustic Void)

### Case 3: Act III - The Hydrotherapy Room
- **Mechanics**: `prop_manifold_console` 3-valve hydraulic fluid transfer `[0..4]` -> Sump drain -> Crystal retrieval.
- **Edge Cases**: Water transfer exceeding integer bounds; bypassing emergency dump.
- **E2E Assertions**: Assert hydraulic array sums to exactly 6 at all times; assert 0.0 PSI trigger.

### Case 4: Act IV - The Audiology Vault
- **Mechanics**: `prop_binaural_console` horn azimuth steering (45/135 deg) -> Phase-inversion at 652 Hz -> Chladni node lock.
- **Edge Cases**: Float precision errors on frequency slider; audio buffer memory leak.
- **E2E Assertions**: Verify Chladni geometry generation; verify pure silence (gain = 0) on phase lock.

**Git Loop Execution**: Run `test_pair_2_e2e.js`. Commit on pass; branch on fail.

---

## Phase 3: Pair III — Acts V & VI (The Institutional Memory & The Executive Core)

### Case 5: Act V - The Archive
- **Mechanics**: `prop_microfiche_reader` optical focus -> deduce Gamma-07 -> Pneumatic tube routing.
- **Edge Cases**: Submitting tube canister before focus is resolved; routing to invalid department.
- **E2E Assertions**: Validate blur filter CSS properties; assert hopper delivery timeout.

### Case 6: Act VI - The Director's Office
- **Mechanics**: `prop_executive_desk` rotary phone -> Wiretap tape half-speed decode -> Carriage clock set to 11:03.
- **Edge Cases**: Clock hand drag-rotation snapping issues; tape playback looping indefinitely.
- **E2E Assertions**: Verify clock angle to time string conversion; assert tape playback halt on exit.

**Git Loop Execution**: Run `test_pair_3_e2e.js`. Commit on pass; branch on fail.

---

## Phase 4: Pair IV — Acts VII & VIII (The Overload Synthesis & The Subway Climax)

### Case 7: Act VII - The Synthesis Chamber
- **Mechanics**: `prop_galvanometer_grid` 5-channel resistance balancing to $100\,\Omega$.
- **Edge Cases**: Dragging multiple shunts simultaneously causing state race conditions.
- **E2E Assertions**: Assert total resistance mathematical sum; verify blastdoor hydraulic release animation.

### Case 8: Act VIII - The Velvet Lounge & Climax
- **Mechanics**: `prop_switchboard` / `prop_lounge_mirror` decanter reflection alignment -> Switchboard patch Trunk 104 to Line 4 -> Final payphone debrief and 528 Hz sonic blast.
- **Edge Cases**: Payphone clicked before switchboard patched; decanter paradox removed; duplicate audio trigger prevention.
- **E2E Assertions**: Assert switchboard graph connections; verify 528 Hz climax tone; verify `#view-terminal-blackout` view transition.

**Git Loop Execution**: Run `node tests/test_pair_4_e2e.js` and `node tests/test_phase4_edge_cases.js`. Commit on pass; branch on fail.

---

## Phase 5: Master Verification, Deep Edge Cases & Performance Hardening

### Objective
Execute the full unified test suite and deep edge-case fuzzing across all 8 acts to guarantee global determinism, memory stability, and zero regressions.

### Execution Ledger
1. `npm run typecheck`: Zero errors across all TypeScript definitions.
2. `npm run build`: Production bundle builds cleanly in ~1.5s under size budgets.
3. `npm run test:models`: All 8 chambers audited for valid geometry, zero coplanar Z-fighting.
4. `npm run test:perf`: 60 FPS verified, draw calls < 220, memory delta = 0 across 20 rapid room traversals.
5. `npm run test:deep-edge`: Deep edge cases fuzzed across Acts III–VIII (fluid conservation laws, out-of-bounds input clamping, sliding buffer window, breaker reset hotkeys, and decanter parity invariance).
6. `npm run test:all`: Full 20+ suite matrix passing deterministically with 0 console errors.
7. **Final Commit**: Completed with zero emojis, strict typing, and high-signal commit log.
