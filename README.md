# The Cure: Room 04

A 3D psychological mystery game set in an isolated clinical research facility. Players explore rooms, interact with vintage analog equipment, and solve physical puzzles to uncover what happened in Sub-Level 04.

Built in TypeScript using Three.js, Vite, and the Web Audio API.

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
Generates a static production bundle in `dist/`, ready for hosting on GitHub Pages, Netlify, or any static file host.

---

## Controls

The game includes two interface modes: Desktop (mouse/keyboard) and Touch/Tablet (gestures). The mode is detected automatically and can be switched manually in Settings.

### Desktop
- **Look / Orbit**: Click and drag the left mouse button.
- **Inspect / Interact**: Click on any marked reticle or interactive prop.
- **Zoom**: Mouse scroll wheel.
- **Step Back**: Press `ESC` or click the top-left return card.
- **Facility Map**: Press `M` or click the header map button.
- **Inventory Ledger**: Press `I` or click the backpack button.

### Touch / Mobile / iPad
- **Look / Gaze**: Drag one finger across the screen.
- **Inspect / Interact**: Tap on reticle targets or tactile switches.
- **Zoom**: Two-finger pinch.
- **Step Back**: Tap the `[STEP BACK]` button in the upper left.

---

## Testing

```bash
# Run unit tests
npm run test:unit

# Strict TypeScript type check
npm run typecheck

# Run smoke test suite
npm run test

# Run full automated test suite (Unit + Typecheck + E2E suites)
npm run test:fast
```

---

## Tech Stack

- **Graphics**: [Three.js](https://threejs.org/) (WebGL rendering, custom shader effects, procedural geometry)
- **Audio**: Web Audio API (procedural synthesis, multi-bus gain routing, smooth crossfading)
- **Language**: TypeScript (strict mode enabled)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Testing**: Vitest for unit tests, Playwright for browser E2E validation

---

## Project Documentation

Detailed technical documents are available in the `docs/` folder:
- [System Architecture](docs/ARCHITECTURE.md)
- [Design System & Palette Tokens](DESIGN_SYSTEM.md)
- [Puzzle Design Bible](docs/DIEGETIC_PUZZLE_BIBLE.md)
- [Contributing & Code Style](CONTRIBUTING.md)

---

## License

MIT License. See `LICENSE` for details.
