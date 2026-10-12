# The Vault: Sub-Level 04 - Master Design System Specification

This specification serves as the immutable, authoritative single source of truth for all visual, typographic, tactile, and diegetic interface design across **The Vault: Sub-Level 04**.

---

## 1. Aesthetic Philosophy: Analogue Clinical Brutalism

The aesthetic identity of *The Vault* is defined as **Analogue Clinical Brutalism**—a synthesis of mid-20th-century institutional medical facilities, Cold War telecommunication surveillance, and existential psychological dread.

### Thematic Influences
* **Kiyoshi Kurosawa (*Cure*, *Pulse*)**: Quiet, rational, chilled institutional calm. Evil does not announce itself with jump scares; it operates through soothing routine, hums, and rhythmic repetition.
* **David Lynch (*Twin Peaks*, *Mulholland Drive*)**: Uncanny mundane domesticity. Unplugged rotary telephones, chevron floors, Bakelite fixtures, smoked teak, and abrupt acoustic silences ("the nothing").
* **Corporate Partitioning (*Severance*, Kafka)**: Human consciousness treated as malfunctioning office hardware. Clinical doublespeak (*limbic friction*, *equilibrium protocol*, *voluntary alignment*), stamped intake records, and declassified dossiers.

### Non-Negotiable Guardrails
1. **Zero Emojis**: Emojis are strictly prohibited in all source code, UI components, HTML templates, button labels, badges, tooltips, comments, docstrings, commit messages, and logs. Iconography must exclusively utilize pure geometric SVG line art or monospace typographic glyphs.
2. **Zero Generic AI Aesthetics**: No purple or indigo neon gradient borders. No blurred glowing orbs. No centered hero cards with sparkle icons. Interfaces must simulate authentic tactile matter: ivory cardstock, heavy cast Bakelite, glazed subway tile, brushed stainless steel, and stamped ink.
3. **Physical Diegesis**: Every interface element must represent a physically plausible mid-century apparatus or document. Modals are physical dossiers, screens are cathode-ray oscilloscopes, buttons are mechanical relays or Bakelite pushers.

---

## 2. Master Design Tokens

### 2.1. Color Palette Tokens

```css
:root {
  /* Architectural & Spatial Surfaces */
  --color-alabaster: #EDF0EB;         /* Ivory cardstock, unglazed tile, clean modal paper */
  --color-alabaster-dim: #E2E7DF;     /* Aged dossier paper, drawer card backing */
  --color-terrazzo-base: #D8DED6;     /* Terrazzo stone aggregate, structural dividers */
  --color-sage-deep: #2D4A3E;         /* Glazed ceramic wall tile, primary brand accent */
  --color-sage-accent: #3D5E50;       /* Highlighted tile joints, active apparatus toggles */
  --color-sage-muted: #577366;        /* Secondary hardware labels, inactive channels */
  --color-chrome-tubular: #D4D8DB;    /* Marcel Breuer tubular frames, IV poles, caster rings */

  /* Hardware & Chassis Surfaces (Bakelite & Cast Iron) */
  --color-chassis-dark: #141816;      /* Tektronix apparatus bezel outer housing */
  --color-chassis-panel: #1E2220;     /* Equipment apron, secondary console body */
  --color-chassis-border: #3D4642;    /* Machined metal bezel border, panel seams */
  --color-teak-smoked: #1F1A18;       /* Heavy mid-century furniture woodwork, Bakelite knobs */

  /* Instrument & Cathode Displays (CRT Phosphors) */
  --color-crt-bg: #080D0A;            /* Unexcited phosphor glass viewport interior */
  --color-crt-phosphor: #4ADE80;      /* P1 phosphor green beam, Lissajous waveform trace */
  --color-crt-phosphor-dim: #235A38;  /* Reticle graticule grid lines, standby trace */
  --color-crt-amber: #FBBF24;         /* Telemetry readouts, frequency calibration alert */
  --color-crt-amber-dim: #7C5810;     /* Amber filament glow, standby status border */

  /* Mechanical Accents & Fasteners */
  --color-brass-cast: #C28833;        /* Machined shunts, dial dials, escapement gears */
  --color-brass-bright: #E5A84B;      /* Polished contact pins, illuminated shunt highlight */

  /* Warnings, Seals & Purge Alerts */
  --color-crimson-wax: #8B1E23;       /* Intake seal wax, restricted rubber stamps */
  --color-crimson-glow: #B8282E;      /* Emergency beacon indicator, breaker trip lamp */
  --color-crimson-muted: #5F1317;     /* Subdued warning borders, declassified header lines */

  /* Typographic Inks */
  --ink-primary: #141A21;             /* Deep carbon black ink for document text and titles */
  --ink-secondary: #4A5568;           /* Clinical field descriptions, metadata, subtitles */
  --ink-muted: #718096;               /* Inactive telemetry, serial numbers, footnote stamps */
  --ink-inverse: #EDF0EB;             /* White-alabaster text against dark hardware bezels */

  /* Glassmorphism & Translucency */
  --glass-bg: rgba(237, 240, 235, 0.88); /* Frosted cardstock modal filter */
  --glass-border: rgba(20, 26, 33, 0.12); /* 1px hairline boundary stroke */
  --glass-hardware: rgba(20, 24, 22, 0.92); /* Dark glass CRT viewport housing */
}
```

### 2.2. Typographic Matrix

Three font families are loaded with explicit system font fallbacks to guarantee 100% offline rendering:

```css
:root {
  --font-serif: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --font-sans: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
}
```

| Token | Size | Line Height | Tracking | Weight | Target Usage |
|---|---|---|---|---|---|
| `--type-display-xl` | 38px–48px | 1.1 | `-0.01em` | 400 | Editorial Chapter Titles, Master Headlines |
| `--type-display-lg` | 26px–32px | 1.2 | `0em` | 400 | Modal Dossier Headlines, Chamber Names |
| `--type-display-md` | 20px–24px | 1.3 | `0.02em` | 600 | Apparatus Sub-panel Titles, Instrument Models |
| `--type-body-lg` | 15px–16px | 1.5 | `0.01em` | 400 | Case Intake Paragraphs, Narrative Dossiers |
| `--type-body-md` | 13px–14px | 1.5 | `0.02em` | 300 / 400 | Standard UI Descriptions, Instructions |
| `--type-ui-btn` | 11px–12px | 1.0 | `0.12em` | 500 / 600 | Pill Action Buttons, Navigation Links |
| `--type-mono-sm` | 10px–11px | 1.4 | `0.15em` | 400 / 500 | Coordinates, Clock Escapements, Sliders |
| `--type-mono-xs` | 9px | 1.3 | `0.20em` | 600 | Classified Stamps, Technical Telemetry, Pips |

#### Monospace Formatting Directive
All sector codes, timestamps, coordinates, diagnostic telemetry, and instrument readouts **MUST** be styled in monospace uppercase with wide tracking (`letter-spacing: 0.15em` to `0.25em`).

---

## 3. Spatial & Geometry Tokens

### 3.1. Modular 4px Spacing Scale

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

### 3.2. Border Radius Hierarchy (Rounding & Bounding)

To eliminate visual drift, border radii are mapped strictly to functional categories:

```css
:root {
  --radius-sharp: 0px;       /* Machined brass shunts, redaction bars, paper tabs */
  --radius-xs: 2px;          /* Value badges, technical tags, rubber stamp borders */
  --radius-sm: 4px;          /* Dossier paper sheets, group boxes, observation subtitle */
  --radius-md: 6px;          /* CRT viewport bezel, inner apparatus frames */
  --radius-lg: 8px;          /* Outer hardware console chassis, terminal housings */
  --radius-pill: 9999px;     /* Pill action buttons, slider tracks, filter capsules */
  --radius-circle: 50%;      /* Rotary dials, indicator lamps, wax seals, gear buttons */
}
```

### 3.3. Border & Hairline Standards

* **Hairline Rule**: Dividers and sheet boundaries use 1px solid hairlines: `1px solid rgba(20, 26, 33, 0.12)` on light paper, or `1px solid rgba(255, 255, 255, 0.10)` on dark chassis.
* **Machined Bezel**: Outer hardware frames use 2px solid structural borders: `2px solid #3D4642`.
* **CRT Screen Rim**: Inner cathode displays use a recessed 3px border: `3px solid #141B17`.
* **Rubber Stamps**: Institutional stamps use 2px solid border with deliberate misalignment.

### 3.4. Elevation & Depth Architecture

Mid-century physical depth relies on crisp, high-density drop shadows and subtle inner bevels rather than diffuse modern glows:

```css
:root {
  --elevation-flat: none;
  --elevation-inset: inset 0 2px 4px rgba(0, 0, 0, 0.35); /* Recessed gauge wells, sockets */
  --elevation-sm: 0 2px 8px rgba(0, 0, 0, 0.12);           /* Badges, unpressed buttons */
  --elevation-md: 0 4px 16px rgba(0, 0, 0, 0.22);          /* Floating utility pills, dropdowns */
  --elevation-lg: 0 16px 48px rgba(0, 0, 0, 0.45);         /* Dossier paper modal, blueprint */
  --elevation-chassis: 0 24px 64px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  --elevation-crt-glow: 0 0 16px rgba(74, 222, 128, 0.35); /* Active phosphor lock */
  --elevation-amber-glow: 0 0 16px rgba(251, 191, 36, 0.35); /* Standby indicator */
  --elevation-crimson-glow: 0 0 16px rgba(184, 40, 46, 0.40); /* Active alarm lamp */
}
```

### 3.5. Semantic Z-Index Stack

Standardized z-index layers prevent cross-modal occlusion:

```css
:root {
  --z-canvas: 1;               /* WebGL 3D canvas viewport */
  --z-vignette: 2;             /* High-key vignette & grain overlay */
  --z-hud: 10;                 /* Permanent HUD cards, crosshair, bottom shelf */
  --z-hud-floating: 20;        /* Floating prompt pills, active reticle badge */
  --z-modal-inspect: 50;       /* 3D Key turntable examination mode */
  --z-modal-overlay: 100;      /* Standard 2D modals (Settings, Dossier reader) */
  --z-diegetic-screen: 12000;  /* 8-Act hardware puzzle consoles & CRT monitors */
  --z-main-menu: 15000;        /* Boot sequence & primary start terminal */
  --z-cutscene-blackout: 20000;/* Act VIII terminal conclusion blackout */
}
```

---

## 4. UI Component Library Standards

### 4.1. Tactile Pill Buttons (`.pill-btn`)
* **Geometry**: Full capsule (`border-radius: var(--radius-pill)`), height 36px–40px, padding `8px 20px`.
* **Standard Variant**: Alabaster cardstock background (`#EDF0EB`), 1px solid `var(--ink-primary)` border, `var(--ink-primary)` text. Inverts to solid `var(--ink-primary)` background with Alabaster text on hover (`transform: translateY(-1px)`).
* **Primary Variant (`.pill-btn.active`, `.pill-btn-primary`)**: Solid `var(--color-sage-deep)` background, white text, 1px solid `var(--color-sage-deep)` border.
* **Danger Variant (`.pill-btn-danger`)**: 1px solid `var(--color-crimson-wax)` border, crimson text. Inverts to crimson background with white text on hover.
* **Touch Target Requirement**: All interactive buttons enforce a minimum clickable area of 44x44px.

### 4.2. Circular Tactile Utility Buttons (`.settings-gear-btn`, `.inventory-btn`)
* **Geometry**: `44x44px` perfect circle (`border-radius: var(--radius-circle)`).
* **Surface**: 1px solid `rgba(20, 26, 33, 0.22)` border, `rgba(235, 239, 235, 0.88)` background, shadow `0 4px 12px rgba(0, 0, 0, 0.25)`.
* **Iconography**: Centered 22x22px inline SVG with `stroke-width: 1.75`.
* **Interaction**: Rotate 35 degrees with scale `1.05` on hover using `cubic-bezier(0.2, 0.8, 0.2, 1)`.

### 4.3. Diegetic Hardware Consoles (`.diegetic-housing`)
* **Housing**: Dark textured Bakelite chassis (`#1E2220`), machined border (`2px solid #3D4642`), `border-radius: var(--radius-lg)`.
* **Header Bar**: `#141816` background, 1px border-bottom (`#2B322F`), model designation stamped in monospace green-gray (`#8B9991`).
* **Close / Disengage Action**: Tactile recessed button (`.diegetic-btn-close`) styled as a spring-loaded disengage button.

### 4.4. CRT Oscilloscope Displays (`.crt-viewport-container`)
* **Bezel**: Recessed frame (`background: #080D0A`, border `3px solid #141B17`, shadow `var(--elevation-inset)`).
* **Canvas Rendering**: High-DPI scaled with `window.devicePixelRatio`. Waveform drawn in P1 phosphor green (`#4ADE80`) with `shadowBlur: 10`, `shadowColor: #4ADE80`.
* **Scanline Overlay**: Continuous CSS raster grid (`background-size: 100% 4px`) simulating cathode-ray line persistence.
* **Phosphor Glare**: Circular radial gradient overlay simulating the curved glass surface of an electron gun CRT tube.

### 4.5. Case Dossier Paper Sheets (`.dossier-paper`)
* **Material**: Ivory cellulose cardstock (`#FBFBF9`), hairline border (`1px solid #D5DAD3`), shadow `var(--elevation-lg)`.
* **Header Stamp**: Monospace uppercase header with wide tracking (`0.28em`), thin separator line.
* **Wax Seal**: Circular crimson seal (`44x44px`, `#8B1E23`, border `2px solid #5F1317`) stamped with patient registration code (`104`).
* **Interactive 3D Unseal**: Opens with 3D perspective animation (`perspective: 1200px`, `rotateX: 70deg` to `0deg`).

### 4.6. Classified Rubber Stamps & Redactions
* **Restricted Stamp (`.stamp-restricted`)**: 2px solid `var(--color-crimson-wax)` border, crimson monospace text, rotated `-2deg` to simulate manual bureaucratic stamping.
* **Cleared Stamp (`.stamp-cleared`)**: 2px solid `var(--color-sage-deep)` border, sage-deep monospace text, rotated `1.5deg`.
* **Redaction Bar (`.redaction-bar`)**: Solid carbon black block (`background: var(--ink-primary)`) obscuring classified intelligence text until player clearance is verified.

### 4.7. Bourdon Pressure Gauges
* **Geometry**: 160px–220px circular brass-rimmed dial.
* **Face**: Terrazzo-tinted ivory face with radial dial ticks (10 kPa increments).
* **Needle**: High-contrast needle with physical oscillation physics (damped second-order spring harmonic motion).

---

## 5. Motion & Animation Standards

Interface animations must reflect the mechanical inertia of 1970s analogue machinery—zero bouncy spring cartoon physics.

```css
:root {
  --ease-mechanical: cubic-bezier(0.1, 0.9, 0.2, 1);  /* Heavy relay throws, shutter drops */
  --ease-tactile: cubic-bezier(0.2, 0.8, 0.2, 1);     /* Button hover states, needle flicks */
  --ease-cinematic: cubic-bezier(0.4, 0.0, 0.2, 1);   /* Fade transitions, camera pans */

  --dur-fast: 150ms;                                  /* Button active, click feedback */
  --dur-normal: 250ms;                                /* Hover elevations, reticle prompts */
  --dur-slow: 600ms;                                  /* Modal pop-ins, shutter sliding */
  --dur-cinematic: 2500ms;                            /* Chapter card fade, title dissolve */
}
```

### Keyframe Animations
* **`crt-scanline-flicker`**: Subtle 0.02 opacity jitter simulating electron beam interference.
* **`needle-bounce`**: Damped oscillation around target value when hydrostatic or resistance values change.
* **`dossier-unseal`**: 3D perspective fold-down from 70deg inclination into planar focus.
* **`beacon-pulse`**: 2.5s rhythmic respiration of the architectural blueprint location pip.

---

## 6. Standardized SVG Iconography Catalog

All icons use clean inline SVG conforming to this strict specification:
* **viewBox**: `0 0 24 24`
* **stroke**: `currentColor`
* **stroke-width**: `1.75`
* **fill**: `none`
* **stroke-linecap**: `round`
* **stroke-linejoin**: `round`

### Permitted Icon Standards

```html
<!-- Settings Gear (44x44px button) -->
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="3"></circle>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
</svg>

<!-- Patient Inventory Backpack -->
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 10v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9"></path>
  <path d="M10 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1"></path>
  <path d="M4 10h16"></path>
  <path d="M22 10a2 2 0 0 0-2-2h-3"></path>
  <path d="M2 10a2 2 0 0 1 2-2h3"></path>
  <path d="M9 22v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4"></path>
</svg>

<!-- Modal Close Cross -->
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="18" y1="6" x2="6" y2="18"></line>
  <line x1="6" y1="6" x2="18" y2="18"></line>
</svg>

<!-- Architectural Blueprint Compass -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
</svg>
```

---

## 7. Compliance Matrix: Do's and Don'ts

| Feature | Permitted (Compliant) | Prohibited (Non-Compliant) |
|---|---|---|
| **Iconography** | Pure SVG line paths (`stroke-width: 1.5–2px`) | Unicode Emojis, colored glyphs, Lucide icon bundles |
| **Color Schemes** | Alabaster `#EDF0EB`, Sage `#2D4A3E`, Terrazzo `#D8DED6` | Purple neon borders, saturated cyber cyan, magenta |
| **Phosphors** | P1 Phosphor Green `#4ADE80`, CRT Amber `#FBBF24` | Neon Lime `#00FF88`, generic web green `#00FF00` |
| **Typography** | `Playfair Display`, `Outfit`, `JetBrains Mono` | Comic Sans, Inter, Roboto, Arial, AI-slop sans |
| **Card Borders** | 1px hairlines (`rgba(20,26,33,0.12)`), crisp shadows | Glowing purple gradients, 3px blurry drop shadows |
| **Button Shapes** | Pill (`border-radius: 9999px`) or Circle (`50%`) | Arbitrary rectangles with `border-radius: 10px` |
| **Text Casing** | Technical data uppercase (`0.15em` tracking) | Mixed-case telemetry strings, unspaced numbers |
| **Sounds** | Authentic relay clicks, 45 Hz binaural hum, tape hiss | Generic 8-bit beeps, arcade chimes, synth pads |
| **Document State**| Rubber stamps (`RESTRICTED`), black ink redactions | Yellow highlight pens, modern badge stickers |

---

## 8. Living HTML Showcase Reference

The living, interactive showcase for this design system is maintained at [`design_system.html`](design_system.html). It renders all permitted color tokens, live interactive components, real-time CRT oscilloscopes, damped pressure gauges, and SVG icons in a standalone browser environment.
