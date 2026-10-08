# Design System Specification: The Vault (Room 04)

## 1. Aesthetic Thesis & Visual Language
* **Design Philosophy:** Bauhaus Modernist Clinical Horror / Uncanny High-Key Order.
* **Core Influences:** *Severance* (Lumon Industries corporate geometry), *A Cure for Wellness* (Swiss sanatorium sterility), David Lynch (*Twin Peaks* / *Eraserhead* acoustic and physical stillness), *The Room* (tactile mechanical lockboxes).
* **Guiding Principle:** Horror achieved through extreme cleanliness, razor-sharp geometric alignment, and complete stillness rather than darkness or blood. Every physical surface has weight, texture, and light response.

---

## 2. Color Palette & Design Tokens

### Primary Architectural Surfaces
```css
:root {
  /* Alabaster Chalk Walls & Ceiling */
  --color-alabaster: #EDF0EB;
  --color-alabaster-dim: #D5DAD3;
  --color-chalk-shadow: #B6C0B4;

  /* Clinical Sage Ceramic Tile Wainscot */
  --color-sage-deep: #2D4A3E;
  --color-sage-glaze: #3C6353;
  --color-sage-shadow: #1A2F26;
  --color-grout-dark: #121D18;

  /* High-Gloss Terrazzo Floor */
  --color-terrazzo-base: #D8DED6;
  --color-terrazzo-fleck-dark: #2F3831;
  --color-terrazzo-fleck-cream: #EFEFE9;
  --color-brass-inlay: #C28833;

  /* Accents & Signatures */
  --color-brass-cast: #C28833;
  --color-brass-specular: #F5D38A;
  --color-teak-smoked: #1F1A18;
  --color-crimson-wax: #8B1E23;
  --color-crimson-glow: #B8282E;
  --color-chrome-tubular: #D4D8DB;
  --color-crt-phosphor: #4ADE80;
  --color-crt-amber: #FBBF24;

  /* Typography & Ink */
  --ink-primary: #141A21;
  --ink-secondary: #4A5568;
  --ink-muted: #718096;
  --ink-ghost: #A0AEC0;
}
```

---

## 3. Typography System

The typographical architecture strictly follows an **editorial art-house film aesthetic**. All boxy dashboard containers are eliminated in favor of direct typographic hierarchy.

```css
:root {
  /* Font Families */
  --font-serif: 'Playfair Display', Didot, 'Cinzel', Georgia, serif;
  --font-sans: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
}
```

### Type Scale & Hierarchy
* **Film Act Tag:**
  * Typeface: `--font-sans`
  * Size: `10px` | Weight: `600` | Transform: `uppercase` | Letter-Spacing: `0.28em`
  * Color: `--ink-muted`
  * Anchor: Top-Left (Precedes Chapter Title)
* **Chapter Title (Primary Hero):**
  * Typeface: `--font-serif`
  * Size: `38px` | Weight: `400` | Line-Height: `1.1` | Letter-Spacing: `-0.01em`
  * Color: `--ink-primary`
  * Example: *"The Sterile Chamber"*
* **Institutional Location Tag:**
  * Typeface: `--font-sans`
  * Size: `11px` | Weight: `400` | Letter-Spacing: `0.14em`
  * Color: `--color-sage-deep`
  * Example: *"Room 04 • Sanatorium of Cognitive Alignment"*
* **Narrative Observation Subtitle:**
  * Typeface: `--font-serif`
  * Style: `italic` | Size: `15px` | Weight: `400` | Letter-Spacing: `0.02em`
  * Color: `--ink-primary`
  * Container: Pill bar with `rgba(246, 248, 246, 0.88)`, `backdrop-filter: blur(12px)`, subtle border.
* **Technical Labels & Status Indicators:**
  * Typeface: `--font-mono`
  * Size: `10px` | Weight: `500` | Transform: `uppercase` | Letter-Spacing: `0.18em`
  * Color: `--ink-muted`

---

## 4. UI Component Library & Layout Geometry

### 4.1. Screen Layout Quadrants
* **Top-Left (Editorial Header):** Chapter tag, film title, sanatorium room descriptor. Pure typography, zero enclosing cards.
* **Top-Right (Acoustic Atmosphere & System Status):** Minimalist audio control pills (`Lynchian Drone (45Hz)`, `Fluorescent Ballast`, `Rotary Phone Tone`) and telemetry indicator (`DIAGNOSTIC: NOMINAL`).
* **Center (Golden Ratio Reticle):** Fine 1px crosshair with crimson center dot (4px). Dynamically pulses and shows interaction label when raycaster intercepts an interactable prop.
* **Bottom-Center (Observation Subtitle & Scenario Dock):** Floating italic subtitle capsule positioned above the camera scenario switchers (`I. Overview`, `II. The Vault`, `III. The Telephone`, `IV. The Envelope`, `V. The Door`, `Examine Key`).
* **Bottom-Left (Color Palette Strip):** Editorial swatch pills displaying active room hex values.

### 4.2. Glassmorphic Surface Recipe
```css
.glass-panel {
  background: rgba(246, 248, 246, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(20, 26, 33, 0.08);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
}
```

### 4.3. Interactive Button Tokens
```css
.pill-btn {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-secondary);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(20, 26, 33, 0.12);
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.pill-btn:hover {
  background: #ffffff;
  color: var(--ink-primary);
  border-color: var(--color-sage-deep);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(45, 74, 62, 0.12);
}
```

---

## 5. 3D PBR Material Standards

All materials in Three.js follow calibrated Physical Standard parameters:

| Material ID | Base Color | Roughness | Metalness | Special Properties |
| :--- | :--- | :--- | :--- | :--- |
| `ceramicGreenTiles` | `#2D4A3E` | `0.12` | `0.15` | Canvas procedural bevel bump map (intensity 0.35), clearcoat 0.6 |
| `terrazzoFloor` | `#D8DED6` | `0.18` | `0.08` | Canvas procedural aggregate flecks, receives soft PCF shadows |
| `chalkUpperWall` | `#EDF0EB` | `0.85` | `0.02` | Matte plaster diffuse, subtle contact shadow absorption |
| `brassGold` | `#C28833` | `0.28` | `0.85` | Anisotropic highlights on rotary dial, dado rail, cipher keypins |
| `smokedTeak` | `#1F1A18` | `0.52` | `0.04` | Fine wood grain bump, warm directional light reflection |
| `brushedChrome` | `#D4D8DB` | `0.20` | `0.92` | Tubular Bauhaus chair frame |
| `crimsonEnvelope` | `#8B1E23` | `0.48` | `0.05` | Heavy matte rag paper, sealed with glossy crimson wax seal |
| `bellJarGlass` | `#FFFFFF` | `0.06` | `0.00` | Transmission 0.92, IOR 1.52, transparent, thickness 0.12 |

---

## 6. Anti-AI Slop & Zero Emojis Guardrail
* **No Emojis:** Zero emojis across all UI icons, buttons, subtitles, or labels. Use clean inline SVGs or typographic glyphs.
* **No AI Clichés:** No floating purple/indigo gradients, glowing circular cyber-orbs, or generic dark-mode cyberpunk cards. The aesthetic remains grounded in high-end Scandinavian Bauhaus minimalism, mid-century institutional medical furniture, and cold architectural realism.
