# The Cure: Room 04 - Master Phased Implementation Plan

> **Architectural Status: COMPLETE**  
> All 18 execution phases for building, hardening, and deploying The Cure have been successfully implemented, audited, and verified via Playwright E2E testing and Vitest unit suites. The system features decoupled diegetic hardware screens, finite state machines, dual interface ergonomics, procedural and CC0 cascading audio, realistic sanatorium geometry, and automated GitHub Actions CI/CD deployment.

---

## Completed Phase Ledger

```text
====================================================================================
                        PHASED EXECUTION MATRIX (COMPLETED)
====================================================================================
PHASE    | TARGET CHAMBERS          | CORE INTERACTION      | VERIFICATION STATUS
------------------------------------------------------------------------------------
Phase 0  | Foundational Core        | Schema & Base Modal   | Verified & Hardened
Phase 1  | Acts I & II (Pair I)     | Tektronix CRT & UV    | Verified (0 console errors)
Phase 2  | Acts III & IV (Pair II)  | Hydraulics & Chladni  | Verified (0 console errors)
Phase 3  | Acts V & VI (Pair III)   | Microfiche & Wiretap  | Verified (0 console errors)
Phase 4  | Acts VII & VIII (Pair IV)| Power Grid & Mirror   | Verified (0 console errors)
Phase 5  | Full System Polish       | Performance & VRAM    | Verified (0 memory leaks)
Phase 6  | Hardening & Blueprint    | Save, Audio & Map     | Verified (44 Unit / 26 E2E)
Phase 7  | Fast Test Infrastructure | Single-Browser & GC   | Verified (67.88s / 26 Suites)
Phase 8  | Tactile Brutalist UI     | Canvas Instrumentation| Verified (11 Unit Suites)
Phase 9  | Physical 3D Gem Drops    | Unseal & Interlocks   | Verified (0 Bypass Exploits)
Phase 10 | 3-Wing Facility Flow     | Spatial Progression   | Verified (8 Room Walkthrough)
Phase 11 | Camera Disengage HUD     | Universal Step-Back   | Verified (test:raycast 12/12)
Phase 12 | Streamlined Asset Case   | Form 104-INV Ledger   | Verified (No Spoiler Clutter)
Phase 13 | Clearance Cipher Gate    | Dev Mode Gate & Test  | Verified (71 Unit / 27 E2E)
Phase 14 | Material-Aware Audio     | Cascading Foley & Mix | Verified (89 Unit / Testbed)
Phase 15 | Form 104-O Orientation   | Pre-Admission Dossier | Verified (E2E & CI Bypass)
Phase 16 | Dual Interface Engine    | Desktop vs Touch Mode | Verified (4 Viewports / E2E)
Phase 17 | Sleep Ward Realism       | Tubular Hospital Cots | Verified (Visual & Raycast)
Phase 18 | Rebrand & CI/CD Pipeline | Deploy & Unslop Audit | Verified (Node 22 / Pages)
====================================================================================
```

## Detailed Phase Ledger (Phases 8 to 18)

### Phase 8: Clinical Brutalism Tactile UI Components & Precision Dial
- **Scope:** Replaced generic HTML range inputs and flat buttons with dedicated, high-fidelity tactile instrumentation widgets in `src/ui/components/`:
  - `BourdonGauge`: High-DPI canvas dial with dual mechanical needles, damped spring physics, and knurled emergency bleeder valve.
  - `SightGlassManometer`: Vertical medical borosilicate glass tube with dynamic fluid meniscus and pulsed siphon animation.
  - `RotaryDial`: 1970s institutional spring-back telephone rotary dial with mechanical stop governor and zero dropped inputs during rapid clicks.
  - `PatchMatrix`: Dual-tier PBX switchboard jack array with pointer-guarded SVG patch cables.
  - `ReelTapeTransport`: Dual counter-rotating tape reels, mechanical odometer, and backlit VU meter with damped needle deflection.
  - `StripChartRecorder`: Continuous scrolling calibrated paper grid displaying live impedance bridge null balancing.
- **Verification:** Unit tests and Playwright integration tests confirming zero rAF timer leaks on teardown.

### Phase 9: Physical 3D Gem Drops & Anti-Bypass Security Interlocks
- **Scope:** Decoupled 2D puzzle terminal solves from premature inventory injection across Rooms 02 to 06:
  - Memory crystals exist as physical in-world 3D meshes that unseal inside the scene upon puzzle completion:
    - Room 02: Prismatic Quartz unseals from the dispensary cart drawer with pneumatic hiss.
    - Room 03: Oxidized Bronze unseals as the hydrostatic floor drain plate slides aside.
    - Room 04: Amethyst Core unseals from decoupled speaker diaphragm following acoustic null.
    - Room 05: Pitch-Black Obsidian unseals from sliding Filing Drawer 104 upon pneumatic canister arrival.
    - Room 06: Glowing Celadon unseals from executive desk secret compartment upon wiretap decode.
  - Anti-Bypass Interlocks: Clicking crystal meshes prior to verified puzzle solve triggers authentic rejection prompts, preventing sequence breaking.
- **Verification:** E2E test suites (`test_pair_1_e2e.js` through `test_pair_4_e2e.js`) verify physical 3D click and pickup.

### Phase 10: Spatial Hierarchy, 3-Wing Facility Re-architecture & Naturalistic Anterooms
- **Scope:** Replaced the artificial 8-door hub layout with a 3-wing hospital facility architecture:
  - **Wing A (Clinical Care):** Concourse -> Sleep Ward (02) -> en-suite archway to Hydrotherapy Suite (03).
  - **Wing B (Diagnostics & Records):** Concourse -> Audiology Vault (04) -> reinforced records gate to The Archive (05).
  - **Wing C (Administration & Deep Sub-Core):** Concourse -> Director's Office (06) -> concealed hatch to Synthesis Core (07) -> blown blastdoor to Velvet Lounge (08).
  - Integrated naturalistic in-between vestibules (Scrubbing Anteroom, Steam & Linen Vestibule, Acoustic Sound Lock, Pneumatic Transit Junction, Administrative Anteroom, Concrete Maintenance Conduit) featuring environmental lore and zero puzzle blockers.
- **Verification:** Bidirectional transit verified via `tests/test_blueprint_non_linear_transit.js`.

### Phase 11: Top-Left Camera Disengage HUD & Multi-Viewpoint Navigation
- **Scope:** Built unified `#btn-camera-disengage` HUD control providing one-click camera retreat to default room overview:
  - Semi-translucent brutalist glass aesthetic (`rgba(22, 27, 24, 0.82)`, backdrop blur, phosphor hover accent).
  - Dynamic display: dormant at room overview; smoothly slides in whenever the camera focuses on any of the 38+ interactive inspection targets facility-wide.
  - Full keyboard parity: physical `Escape` key and HUD button execute the identical smooth transition.
- **Verification:** Verified via `npm run test:raycast` (12 browser assertions covering overview dormancy, inspection reveal, click disengage, and Escape synchronization).

### Phase 12: Streamlined Asset Manifest (FORM 104-INV) Specimen Ledger
- **Scope:** Overhauled `#modal-inventory` into a dual-pane 1970s clinical specimen evidence case:
  - Default unified `'all'` tray displaying all acquired assets together, eliminating confusion when picking up records or keys.
  - Anti-spoiler design: omitted 5 uncollected crystal cards in favor of a clean header count badge (`#badge-count-crystals: X / 5`).
  - Master-detail inspector: technical orthographic SVG schematics, specimen designations, serial numbers, and diegetic action buttons (`[EXAMINE 3D ARTIFACT]`, `[READ DOSSIER]`).
- **Verification:** Tested in `src/ui/screens/AssetManifestScreen.spec.ts` and E2E regression suites.

### Phase 13: Developer Mode Clearance Cipher & Test Harness Expansion
- **Scope:** Hardened Developer Mode inspection tools and consolidated test runner:
  - Subject Clearance Cipher (`104`) gating developer mode debug controls and scene teleportation.
  - Anti-spam lockout: 3 incorrect passcode submissions trigger a 5-second lockout with tactile buzzer audio.
  - Expanded test harness to 71 Vitest assertions across 11 test suites and 27 Playwright suites in `npm run test:fast`.
- **Verification:** 100% pass across `npm run typecheck`, `npm run test:unit`, and `npm run test:fast`.

### Phase 14: Material-Aware Audio Infrastructure & Cascading Foley
- **Scope:** Overhauled sound architecture to support public domain / CC0 foley assets and hot-swappable room music:
  - Cascading resolution hierarchy: User MP3/WAV override -> Bundled CC0 WAV asset -> Procedural Web Audio synthesis.
  - Material-aware dispatcher for paper rustle, wooden drawers, metal latches, clock escapements, knife switches, glass clinks, and pneumatic releases.
  - Smooth dual-channel music crossfading over 2.0s exponential gain transitions.
  - Standalone audio testbed (`public/audio_showcase.html`) for auditioning cues and live frequency sweeps.
- **Verification:** Vitest test suite `src/audio/AudioEngine.spec.ts` (14 assertions) and Playwright audio showcase tests.

### Phase 15: Form 104-O Diegetic Orientation & Onboarding Dossier
- **Scope:** Created 3-stage pre-admission orientation card between main menu and Room 04 awakening:
  - Stage 1: Subject 104 intake tags and limbic matrix schematic.
  - Stage 2: Hardware controls and touch/mouse device-adaptive pictograms.
  - Stage 3: Sanatorium Law directives and hydraulic egress guidelines.
  - Automated test bypass for CI and developer mode.
- **Verification:** Dedicated E2E test `tests/test_game_orientation_flow.js` verifying step navigation and bypass logic.

### Phase 16: Dual Interface Mode & Universal Touch Ergonomics
- **Scope:** Architected dual interface mode ensuring high-fidelity PC controls alongside touch device optimization:
  - 3-way settings toggle: `[AUTO]`, `[PC DESKTOP]`, and `[TOUCH / TABLET]`, persisted in local storage.
  - Dynamic vertical FOV compensation clamped between 40 and 65 degrees based on viewport aspect ratio.
  - Universal pointer raycasting using `getBoundingClientRect()` NDC coordinates with 14px slop for touch taps.
  - Responsive layout adaptations: single-column cards, 44px minimum touch targets, and pinned scroll containers.
- **Verification:** Verified via `tests/audit_dual_mode_ui_ux.js` across 4 distinct viewport configurations (mobile, tablet, desktop, 4K).

### Phase 17: Sleep Ward Sanatorium Realism & Hospital Cot Overhaul
- **Scope:** Overhauled Room 02 Sleep Ward furniture to reflect authentic sanatorium ward architecture:
  - Replaced solid box geometries with tubular enameled steel hospital cots featuring authentic under-bed clearance.
  - Wall-flush tall headboards with structural rails; lower footboards facing the central ward aisle.
  - Direct footboard crossbar mounting for patient clipboards (Forms 101 to 104) at an 18-degree viewing angle.
  - Faded sanatorium materials: bleached canvas mattresses, institutional sheets, washed wool blankets, and aged leather restraint straps.
- **Verification:** Verified via `tests/audit_sleep_ward_cots.js` and visual screenshot review.

### Phase 18: Rebranding, CI/CD Pipeline & Anti-AI Slop Hardening
- **Scope:** Completed full project rebranding to "The Cure" and hardened deployment infrastructure:
  - Rebranded title, menus, telemetry panels, scenario labels, and package manifests.
  - Implemented dual-write save system (`the_cure_save_record` and `the_vault_save_record`) for backward compatibility.
  - Deployed GitHub Actions workflow `.github/workflows/deploy.yml` with Node.js 22 runner targeting GitHub Pages.
  - Conducted full anti-AI slop audit: removed all em-dashes, en-dashes, and AI marketing tropes from documentation and source files.
- **Verification:** Clean pass across `npm run typecheck`, 89 Vitest unit tests, 28 fast Playwright suites, and live GitHub Pages verification at `https://uberkill.github.io/The-Cure-/`.

---

## Verification Protocol

To prevent regressions, all changes must pass:
1. **Strict TypeScript Typecheck**: `npm run typecheck` exits with 0 errors.
2. **Vitest Unit Suite**: `npm run test:unit` executes all 89 unit tests across 13 test suites.
3. **Consolidated High-Speed Runner**: `npm run test:fast` executes all 28 Playwright suites in under 80 seconds.
4. **Clean Git Index**: Zero emojis, zero synthetic em-dashes, and zero leaked local machine paths.
