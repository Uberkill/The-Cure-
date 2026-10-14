# Contributing to The Cure

Thank you for your interest in contributing to The Cure: Room 04. This document outlines coding standards, engineering practices, and testing workflows for the project.

---

## 1. Development Principles

### 1.1 Strict TypeScript Types
- All source code must pass strict TypeScript checks (`npm run typecheck`).
- Use explicit interfaces and types rather than loose types (`any` or untyped object literals).
- Let types serve as the contract. Avoid writing verbose docstrings that merely restate type signatures.

### 1.2 "Why-Only" Comment Standard
Code should be self-documenting through clear, intent-revealing identifier and function names.
- Do not write comments that merely describe syntax or what the code is doing (e.g. avoid comments like `// Increment counter` or `// Set active state`).
- Reserve comments strictly for explaining **why** a non-obvious choice was made:
  - Workarounds for browser or runtime quirks (e.g. mobile audio autoplay policies, pointer event handling).
  - Mathematical formulas or physical constraints (e.g. field of view clamping, audio filter frequency cutoffs).
  - Backward compatibility requirements (e.g. dual-reading legacy storage keys).
- Keep comments concise (1 to 2 lines) directly above the relevant code.

### 1.3 Minimal Dependencies (YAGNI)
- Rely on standard Web APIs (Web Audio, WebGL, DOM, Canvas) before introducing external packages.
- Keep the bundle lean and avoid speculative abstractions or unused utility layers.

### 1.4 Clean UI & Iconography
- Do not use emojis in source code, user interfaces, documentation, or commit messages.
- Use vector SVG icons (e.g. Lucide) and CSS styling matching the design tokens in `DESIGN_SYSTEM.md`.

---

## 2. Development Workflow

### Prerequisites
- Node.js 22 or higher
- npm 9 or higher

### Local Setup
```bash
git clone https://github.com/Uberkill/The-Cure-.git
cd The-Cure-
npm install
npm run dev
```

### Build & Verification
Always verify builds and run tests before committing changes:

```bash
# Typecheck
npm run typecheck

# Unit tests
npm run test:unit

# Full automated test suite (Unit + Typecheck + E2E Playwright suites)
npm run test:fast

# Production bundle build
npm run build
```

---

## 3. Git Commit Conventions

Use the imperative mood with standard conventional prefixes:
- `feat: add dual-mode touch controls in settings`
- `fix: clamp camera field of view on narrow viewports`
- `style: refine hospital cot footboard geometry and materials`
- `test: add unit tests for audio crossfader`
- `refactor: simplify event bus payload mapping`

Keep commit subject lines under 72 characters, concise, and focused on the change.
