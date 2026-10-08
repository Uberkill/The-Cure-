# The Vault: Room 04

An uncanny psychological thriller 3D simulation built with Three.js, Vite, and TypeScript.
Aesthetic direction: Bauhaus Modernist Psychological Horror (*A Cure for Wellness*, *Severance*, David Lynch).

For comprehensive technical onboarding, architecture breakdown, and MCP guide, see:
**[docs/ONBOARDING.md](docs/ONBOARDING.md)**

---

## Quickstart

### 1. Launch via Windows Batch Launcher
Double click `start.bat` to launch the local Vite development server and open the browser.
Double click `run.bat` to run automated verification checks.

### 2. Manual Commands
```powershell
# Install dependencies (if needed)
npm install

# Typecheck source code
npm run typecheck

# Production build bundle
npm run build

# Run 3D and audio stress test suite
npm test

# Run all test suites
npm run test:all

# Start live development server
npm run dev
```

---

## Automated Verification Suites

```powershell
# 1. 3D Bounds, Audio Burst Limiting, VRAM Leak Check, Aspect Ratio & Visibility
node tests/test_3d_and_audio_stress.js

# 2. Room 04 360 Enclosure, Persistent Header HUD & Audio Startup State Audit
node tests/test_room04_audit_and_360.js

# 3. Capture and verify visual 3D screenshots (WebGL Angle)
node tests/verify_room04_visuals.js

# 4. Audit modal overlays, close X buttons, 3D key turntable, and click/drag thresholds
node tests/test_interactions_and_overlays.js

# 5. Test full 8-Act narrative descent from Hub to Velvet Lounge
node tests/test_full_descent_e2e.js
```

---

## Knowledge Graph (Graphify)

The codebase has been indexed into a persistent, queryable knowledge graph in `graphify-out/`:
- `graphify-out/graph.json` - Unified graph (325 nodes, 671 edges)
- `graphify-out/GRAPH_REPORT.md` - Community detection architecture report
- `graphify-out/graph.html` - Interactive force-directed visualization
- `graphify-out/GRAPH_TREE.html` - Collapsible D3 hierarchy tree

Query the graph from CLI:
```powershell
python -m graphify query "How does GameState manage room transitions?"
```
Rebuild the graph after structural changes:
```powershell
python run_graphify_pipeline.py
```
