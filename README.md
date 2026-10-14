# The Cure: Room 04

A 3D psychological mystery game set in an isolated clinical research facility. You awaken in an examination room with no memory of how you arrived. To uncover the truth, you must navigate Sub-Level 04 and operate tactile analog machinery: oscilloscopes, pressure manifolds, rotary dials, and tape decks. As you restore power and bypass mechanical interlocks, you uncover classified records detailing why Subject 104 was admitted, and what The Cure is designed to do.

Live demo: [https://uberkill.github.io/The-Cure-/](https://uberkill.github.io/The-Cure-/)

Built in TypeScript with Three.js, Vite, and the Web Audio API.

---

## Getting Started

### Prerequisites
- Node.js 22 or higher
- npm 9 or higher

### Installation
```bash
git clone https://github.com/Uberkill/The-Cure-.git
cd The-Cure-
npm install
```

### Development Server
```bash
npm run dev
```
Starts the local development server at `http://localhost:3000`.

### Production Build
```bash
npm run build
```
Generates a static production bundle in `dist/`, configured with relative paths for GitHub Pages and static hosts.

---

## Controls

The game provides two interface modes: Desktop (mouse and keyboard) and Touch/Tablet (gestures). The mode is detected on startup and can be adjusted in Settings.

### Desktop
- **Look / Orbit**: Click and drag the left mouse button.
- **Inspect / Interact**: Click on any highlighted reticle or interactive prop.
- **Zoom**: Mouse scroll wheel.
- **Step Back**: Press `ESC` or click the top-left return card.
- **Facility Map**: Press `M` or click the header map button.
- **Inventory Ledger**: Press `I` or click the ledger button.

### Touch / Mobile / iPad
- **Look / Gaze**: Drag one finger across the screen.
- **Inspect / Interact**: Tap on reticle targets or tactile switches.
- **Zoom**: Two-finger pinch.
- **Step Back**: Tap the `[STEP BACK]` button in the upper left.

---

## Testing

```bash
# Run unit tests (89 tests across 13 suites)
npm run test:unit

# Strict TypeScript type check
npm run typecheck

# Fast regression suite (Unit + Typecheck + Build + 28 E2E suites)
npm run test:fast

# Persistence and settings test
npm run test:save
```

---

## Tech Stack

- **Graphics**: Three.js (WebGL rendering, custom shader effects, procedural geometry)
- **Audio**: Web Audio API (procedural synthesis, cascading CC0 foley, multi-bus routing)
- **Language**: TypeScript (strict mode enabled)
- **Bundler**: Vite
- **Testing**: Vitest for unit tests, Playwright for browser E2E validation

---

## Project Documentation

Detailed technical documents are available in the `docs/` directory:
- [System Architecture](docs/ARCHITECTURE.md)
- [Design System & Palette Tokens](DESIGN_SYSTEM.md)
- [Master Story & Design Bible](docs/THE_CURE_DESIGN_BIBLE.md)
- [Puzzle Design Bible](docs/DIEGETIC_PUZZLE_BIBLE.md)
- [Psychological Framework](docs/PSYCHOLOGICAL_FRAMEWORK.md)
- [Technical Onboarding Guide](docs/ONBOARDING.md)
- [Contributing & Code Style](CONTRIBUTING.md)

---

## License

MIT License. See `LICENSE` for details.
