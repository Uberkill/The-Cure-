# The Vault: Room 04 - Master Phased Implementation Plan

> **Architectural Status: COMPLETE**  
> All 5 execution phases for upgrading the facility into a multi-layered psychological descent across 8 Acts have been successfully implemented, hardened, and verified via Playwright E2E testing. The system now features decoupled diegetic hardware screens, stable finite state machines, and synchronized storytelling, all while maintaining strict WebGL performance budgets and 0 memory leaks.

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
====================================================================================
```

## Detailed Phase Ledger (Phases 8–13)

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
  - Memory crystals now exist as physical in-world 3D meshes that unseal inside the scene upon puzzle completion:
    - Room 02: Prismatic Quartz unseals from the dispensary cart drawer with pneumatic hiss.
    - Room 03: Oxidized Bronze unseals as the hydrostatic floor drain plate slides aside.
    - Room 04: Amethyst Core unseals from decoupled speaker diaphragm following acoustic null.
    - Room 05: Pitch-Black Obsidian unseals from sliding Filing Drawer 104 upon pneumatic canister arrival.
    - Room 06: Glowing Celadon unseals from executive desk secret compartment upon wiretap decode.
  - Anti-Bypass Interlocks: Clicking crystal meshes prior to verified puzzle solve triggers authentic rejection prompts, preventing sequence breaking.
- **Verification:** E2E test suites (`test_pair_1_e2e.js` through `test_pair_4_e2e.js`) verify physical 3D click and pickup.

### Phase 10: Spatial Hierarchy, 3-Wing Facility Re-architecture & Naturalistic Anterooms
- **Scope:** Eliminated the artificial 8-door hub layout in favor of a believable 3-wing hospital facility architecture:
  - **Wing A (Clinical Care):** Concourse -> Sleep Ward (02) -> en-suite archway to Hydrotherapy Suite (03).
  - **Wing B (Diagnostics & Records):** Concourse -> Audiology Vault (04) -> reinforced records gate to The Archive (05).
  - **Wing C (Administration & Deep Sub-Core):** Concourse -> Director's Office (06) -> concealed hatch to Synthesis Core (07) -> blown blastdoor to Velvet Lounge (08).
  - Integrated naturalistic in-between vestibules (Scrubbing Anteroom, Steam & Linen Vestibule, Acoustic Sound Lock, Pneumatic Transit Junction, Administrative Anteroom, Concrete Maintenance Conduit) featuring environmental lore and zero puzzle blockers.
- **Verification:** Seamless bidirectional transit verified via `tests/test_blueprint_non_linear_transit.js`.

### Phase 11: Top-Left Camera Disengage HUD & Multi-Viewpoint Navigation
- **Scope:** Built unified `#btn-camera-disengage` HUD control providing one-click camera retreat to default room overview:
  - Semi-translucent brutalist glass aesthetic (`rgba(22, 27, 24, 0.82)`, backdrop blur, phosphor hover accent).
  - Dynamic display: dormant at room overview; smoothly slides in whenever the camera focuses on any of the 38+ interactive inspection targets facility-wide.
  - Full keyboard parity: physical `Escape` key and HUD button execute the identical smooth transition.
- **Verification:** Verified via `npm run test:raycast` (12 browser assertions covering overview dormancy, inspection reveal, click disengage, and Escape synchronization).

### Phase 12: Streamlined Asset Manifest (FORM 104-INV) Specimen Ledger
- **Scope:** Overhauled `#modal-inventory` into a dual-pane 1970s clinical specimen evidence case:
  - Default unified `'all'` tray displaying all acquired assets together, eliminating confusion when picking up records or keys.
  - Anti-spoiler design: omitted 5 uncollected crystal cards ("LOCKED IN CHAMBER") in favor of a clean header count badge (`#badge-count-crystals: X / 5`).
  - Master-detail inspector: technical orthographic SVG schematics, specimen designations, serial numbers, and diegetic action buttons (`[EXAMINE 3D ARTIFACT]`, `[READ DOSSIER]`).
- **Verification:** Tested in `src/ui/screens/AssetManifestScreen.spec.ts` and E2E regression suites.

### Phase 13: Developer Mode Clearance Cipher & Test Harness Expansion
- **Scope:** Hardened Developer Mode inspection tools and consolidated test runner:
  - Subject Clearance Cipher (`104`) gating developer mode debug controls and scene teleportation.
  - Anti-spam brute-force lockout: 3 incorrect passcode submissions trigger a 5-second lockout with tactile buzzer audio.
  - Expanded test harness to 71 Vitest assertions across 11 test suites and 27 Playwright suites in `npm run test:fast`.
- **Verification:** 100% green pass across `npx tsc --noEmit`, `npm run test:unit`, and `npm run test:fast`.

---

## The Verification Protocol (Historical Context)
To prevent cascading failures during implementation, every phase was subjected to:
1. **Edge Case & Failure State Validation**: Testing rapid clicking, sequence breaking, and interrupting camera transitions.
2. **Playwright E2E Suite Execution**: Asserting `data-testid` elements on diegetic screens, focus trapping, and verifying explicit `AudioContext` teardown.
3. **Strict Git Checkpointing**: Features were committed only upon full test suite success.
4. **Single-Browser High-Speed Regression**: Consolidated runner (`npm run test:fast`) executing 27 suites sequentially inside isolated browser contexts, disposing WebGL canvases to ensure zero GPU resource leaks.

The project continues to uphold this testing standard for all future features.

