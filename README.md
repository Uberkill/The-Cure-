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

