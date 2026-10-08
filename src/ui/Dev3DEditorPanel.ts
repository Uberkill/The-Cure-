import * as THREE from 'three';
import { DevTransformGizmo } from '../interaction/DevTransformGizmo';
import { CameraDirector } from '../rendering/CameraDirector';
import { Telemetry } from '../core/Telemetry';

export interface PropTransformRecord {
  position: [number, number, number];
  rotationDeg: [number, number, number];
  scale: [number, number, number];
}

const STORAGE_KEY = 'the_vault_room04_transform_overrides';

export class Dev3DEditorPanel {
  private scene: THREE.Scene;
  private cameraDirector: CameraDirector;
  private devGizmo: DevTransformGizmo;
  private telemetry: Telemetry;

  private panelContainer: HTMLElement | null = null;
  private isVisible: boolean = false;
  private isUpdatingFromUI: boolean = false;

  private assetSelect: HTMLSelectElement | null = null;
  private posXInput: HTMLInputElement | null = null;
  private posYInput: HTMLInputElement | null = null;
  private posZInput: HTMLInputElement | null = null;

  private rotXInput: HTMLInputElement | null = null;
  private rotYInput: HTMLInputElement | null = null;
  private rotZInput: HTMLInputElement | null = null;

  private scaleXInput: HTMLInputElement | null = null;
  private scaleYInput: HTMLInputElement | null = null;
  private scaleZInput: HTMLInputElement | null = null;

  private initialTransforms: Map<string, PropTransformRecord> = new Map();

  private lastTelemetryTime: number = 0;
  private frameCount: number = 0;
  private fpsDisplay: number = 60;
  private lastFpsCalcTime: number = performance.now();

  constructor(scene: THREE.Scene, cameraDirector: CameraDirector, devGizmo: DevTransformGizmo) {
    this.scene = scene;
    this.cameraDirector = cameraDirector;
    this.devGizmo = devGizmo;
    this.telemetry = Telemetry.getInstance();

    this.initPanel();
    this.bindGizmoEvents();
    this.recordInitialTransforms();
    this.applyStoredOverrides();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('editor')) {
      this.show();
      this.devGizmo.setEnabled(true);
    }
  }

  private initPanel(): void {
    const existing = document.getElementById('dev-3d-editor-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'dev-3d-editor-panel';
    panel.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      width: 320px;
      max-height: 90vh;
      overflow-y: auto;
      background: rgba(16, 22, 18, 0.94);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 6px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #e2e6e0;
      padding: 16px;
      z-index: 10000;
      display: none;
      box-sizing: border-box;
      user-select: none;
    `;

    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
        <span style="font-weight: 600; letter-spacing: 0.08em; color: #bad2c8; text-transform: uppercase;">Room 04 • 3D Editor</span>
        <button id="dev-btn-close" style="background: none; border: none; color: #88928b; cursor: pointer; font-size: 14px; padding: 2px 6px;">✕</button>
      </div>

      <!-- Live Telemetry Diagnostic Box -->
      <div id="dev-telemetry-box" style="background: rgba(10, 14, 12, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 4px; padding: 8px; margin-bottom: 12px; font-size: 10px; line-height: 1.5; color: #a4b3a8;">
        <div style="display: flex; justify-content: space-between; color: #bad2c8; font-weight: 600; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 2px;">
          <span>LIVE TELEMETRY</span>
          <span id="dev-telem-fps" style="color: #4ade80;">60 FPS</span>
        </div>
        <div>CAM POS: <span id="dev-telem-cam-pos" style="color: #bad2c8;">0.00, 1.80, 4.50</span></div>
        <div>CAM TGT: <span id="dev-telem-cam-tgt" style="color: #bad2c8;">0.00, 0.90, 0.00</span></div>
        <div>ACTIVE: <span id="dev-telem-active" style="color: #f59e0b;">NONE</span></div>
        <div>SCENE: <span id="dev-telem-mesh-count" style="color: #bad2c8;">0 meshes</span></div>
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 10px; color: #88928b; text-transform: uppercase; margin-bottom: 4px;">Target Asset</label>
        <select id="dev-asset-select" style="width: 100%; background: #1f2823; color: #e2e6e0; border: 1px solid rgba(255,255,255,0.15); border-radius: 3px; padding: 6px; font-family: inherit; font-size: 11px;">
          <option value="">[None - Click object or select]</option>
        </select>
      </div>

      <div style="display: flex; gap: 6px; margin-bottom: 12px;">
        <button id="dev-btn-trans" style="flex: 1; background: #2d3b32; color: #bad2c8; border: 1px solid rgba(255,255,255,0.12); border-radius: 3px; padding: 6px 0; cursor: pointer; font-size: 10px; font-weight: 600;">[W] MOVE</button>
        <button id="dev-btn-rot" style="flex: 1; background: #1a241e; color: #88928b; border: 1px solid rgba(255,255,255,0.12); border-radius: 3px; padding: 6px 0; cursor: pointer; font-size: 10px; font-weight: 600;">[E] ROTATE</button>
        <button id="dev-btn-scale" style="flex: 1; background: #1a241e; color: #88928b; border: 1px solid rgba(255,255,255,0.12); border-radius: 3px; padding: 6px 0; cursor: pointer; font-size: 10px; font-weight: 600;">[R] SCALE</button>
      </div>

      <div style="margin-bottom: 10px;">
        <span style="display: block; font-size: 10px; color: #88928b; text-transform: uppercase; margin-bottom: 4px;">Position (X / Y / Z)</span>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
          <input id="dev-pos-x" type="number" step="0.05" style="background: #141c17; color: #bad2c8; border: 1px solid rgba(255,255,255,0.1); border-radius: 2px; padding: 4px; font-family: inherit; text-align: center;">
          <input id="dev-pos-y" type="number" step="0.05" style="background: #141c17; color: #bad2c8; border: 1px solid rgba(255,255,255,0.1); border-radius: 2px; padding: 4px; font-family: inherit; text-align: center;">
          <input id="dev-pos-z" type="number" step="0.05" style="background: #141c17; color: #bad2c8; border: 1px solid rgba(255,255,255,0.1); border-radius: 2px; padding: 4px; font-family: inherit; text-align: center;">
        </div>
      </div>

      <div style="margin-bottom: 10px;">
        <span style="display: block; font-size: 10px; color: #88928b; text-transform: uppercase; margin-bottom: 4px;">Rotation Degrees (X / Y / Z)</span>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
          <input id="dev-rot-x" type="number" step="5" style="background: #141c17; color: #bad2c8; border: 1px solid rgba(255,255,255,0.1); border-radius: 2px; padding: 4px; font-family: inherit; text-align: center;">
          <input id="dev-rot-y" type="number" step="5" style="background: #141c17; color: #bad2c8; border: 1px solid rgba(255,255,255,0.1); border-radius: 2px; padding: 4px; font-family: inherit; text-align: center;">
          <input id="dev-rot-z" type="number" step="5" style="background: #141c17; color: #bad2c8; border: 1px solid rgba(255,255,255,0.1); border-radius: 2px; padding: 4px; font-family: inherit; text-align: center;">
        </div>
      </div>

      <div style="margin-bottom: 14px;">
        <span style="display: block; font-size: 10px; color: #88928b; text-transform: uppercase; margin-bottom: 4px;">Scale (X / Y / Z)</span>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
          <input id="dev-scale-x" type="number" step="0.1" style="background: #141c17; color: #bad2c8; border: 1px solid rgba(255,255,255,0.1); border-radius: 2px; padding: 4px; font-family: inherit; text-align: center;">
          <input id="dev-scale-y" type="number" step="0.1" style="background: #141c17; color: #bad2c8; border: 1px solid rgba(255,255,255,0.1); border-radius: 2px; padding: 4px; font-family: inherit; text-align: center;">
          <input id="dev-scale-z" type="number" step="0.1" style="background: #141c17; color: #bad2c8; border: 1px solid rgba(255,255,255,0.1); border-radius: 2px; padding: 4px; font-family: inherit; text-align: center;">
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
        <button id="dev-btn-copy" style="background: #25382e; color: #e2e6e0; border: 1px solid #3d5e50; border-radius: 3px; padding: 7px; cursor: pointer; font-size: 10px; font-weight: 600; text-transform: uppercase;">Copy TypeScript Code</button>
        <button id="dev-btn-save" style="background: #1e2a22; color: #bad2c8; border: 1px solid rgba(255,255,255,0.12); border-radius: 3px; padding: 6px; cursor: pointer; font-size: 10px;">Save to LocalStorage</button>
        <button id="dev-btn-reset" style="background: #261b1d; color: #e09699; border: 1px solid rgba(139,30,35,0.3); border-radius: 3px; padding: 6px; cursor: pointer; font-size: 10px;">Reset Defaults</button>
        <button id="dev-btn-export-json" style="background: #18221b; color: #88928b; border: 1px solid rgba(255,255,255,0.08); border-radius: 3px; padding: 6px; cursor: pointer; font-size: 10px;">Export All Layout JSON</button>
      </div>
    `;

    document.body.appendChild(panel);
    this.panelContainer = panel;

    // Cache elements
    this.assetSelect = panel.querySelector('#dev-asset-select');
    this.posXInput = panel.querySelector('#dev-pos-x');
    this.posYInput = panel.querySelector('#dev-pos-y');
    this.posZInput = panel.querySelector('#dev-pos-z');

    this.rotXInput = panel.querySelector('#dev-rot-x');
    this.rotYInput = panel.querySelector('#dev-rot-y');
    this.rotZInput = panel.querySelector('#dev-rot-z');

    this.scaleXInput = panel.querySelector('#dev-scale-x');
    this.scaleYInput = panel.querySelector('#dev-scale-y');
    this.scaleZInput = panel.querySelector('#dev-scale-z');

    this.setupPanelEvents(panel);
    this.populateAssetDropdown();
  }

  private setupPanelEvents(panel: HTMLElement): void {
    panel.querySelector('#dev-btn-close')?.addEventListener('click', () => {
      this.hide();
      this.devGizmo.setEnabled(false);
    });

    panel.querySelector('#dev-btn-trans')?.addEventListener('click', () => {
      this.devGizmo.setMode('translate');
      this.highlightModeButton('dev-btn-trans');
    });

    panel.querySelector('#dev-btn-rot')?.addEventListener('click', () => {
      this.devGizmo.setMode('rotate');
      this.highlightModeButton('dev-btn-rot');
    });

    panel.querySelector('#dev-btn-scale')?.addEventListener('click', () => {
      this.devGizmo.setMode('scale');
      this.highlightModeButton('dev-btn-scale');
    });

    this.assetSelect?.addEventListener('change', () => {
      const selectedName = this.assetSelect?.value;
      if (!selectedName) {
        this.devGizmo.detach();
        return;
      }
      const targetObj = this.scene.getObjectByName(selectedName);
      if (targetObj) {
        this.devGizmo.attach(targetObj);
        this.focusCameraOnObject(targetObj);
      }
    });

    // Bi-directional input bindings with loop guard
    const bindInput = (input: HTMLInputElement | null, handler: (val: number) => void) => {
      input?.addEventListener('input', () => {
        if (this.isUpdatingFromUI) return;
        const val = parseFloat(input.value);
        if (!isNaN(val)) handler(val);
      });
    };

    bindInput(this.posXInput, (val) => {
      const obj = this.devGizmo.getSelectedObject();
      if (obj) { obj.position.x = val; this.devGizmo.syncTransform(); }
    });
    bindInput(this.posYInput, (val) => {
      const obj = this.devGizmo.getSelectedObject();
      if (obj) { obj.position.y = val; this.devGizmo.syncTransform(); }
    });
    bindInput(this.posZInput, (val) => {
      const obj = this.devGizmo.getSelectedObject();
      if (obj) { obj.position.z = val; this.devGizmo.syncTransform(); }
    });

    bindInput(this.rotXInput, (valDeg) => {
      const obj = this.devGizmo.getSelectedObject();
      if (obj) { obj.rotation.x = valDeg * (Math.PI / 180); this.devGizmo.syncTransform(); }
    });
    bindInput(this.rotYInput, (valDeg) => {
      const obj = this.devGizmo.getSelectedObject();
      if (obj) { obj.rotation.y = valDeg * (Math.PI / 180); this.devGizmo.syncTransform(); }
    });
    bindInput(this.rotZInput, (valDeg) => {
      const obj = this.devGizmo.getSelectedObject();
      if (obj) { obj.rotation.z = valDeg * (Math.PI / 180); this.devGizmo.syncTransform(); }
    });

    bindInput(this.scaleXInput, (val) => {
      const obj = this.devGizmo.getSelectedObject();
      if (obj) { obj.scale.x = val; this.devGizmo.syncTransform(); }
    });
    bindInput(this.scaleYInput, (val) => {
      const obj = this.devGizmo.getSelectedObject();
      if (obj) { obj.scale.y = val; this.devGizmo.syncTransform(); }
    });
    bindInput(this.scaleZInput, (val) => {
      const obj = this.devGizmo.getSelectedObject();
      if (obj) { obj.scale.z = val; this.devGizmo.syncTransform(); }
    });

    panel.querySelector('#dev-btn-copy')?.addEventListener('click', () => this.copyTypeScriptSnippet());
    panel.querySelector('#dev-btn-save')?.addEventListener('click', () => this.saveOverridesToLocalStorage());
    panel.querySelector('#dev-btn-reset')?.addEventListener('click', () => this.resetToDefaults());
    panel.querySelector('#dev-btn-export-json')?.addEventListener('click', () => this.exportAllLayoutJSON());
  }

  private highlightModeButton(btnId: string): void {
    ['dev-btn-trans', 'dev-btn-rot', 'dev-btn-scale'].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        if (id === btnId) {
          btn.style.background = '#2d3b32';
          btn.style.color = '#bad2c8';
        } else {
          btn.style.background = '#1a241e';
          btn.style.color = '#88928b';
        }
      }
    });
  }

  private bindGizmoEvents(): void {
    this.devGizmo.onTransformChange = (object) => {
      this.updateFieldsFromObject(object);
    };

    this.devGizmo.onSelectionChange = (object) => {
      if (object) {
        if (this.assetSelect) this.assetSelect.value = object.name;
        this.updateFieldsFromObject(object);
        if (!this.isVisible) this.show();
      } else {
        if (this.assetSelect) this.assetSelect.value = '';
        this.clearFields();
      }
    };
  }

  public populateAssetDropdown(): void {
    if (!this.assetSelect) return;
    this.assetSelect.innerHTML = '<option value="">[None - Click object or select]</option>';

    // 1. Composite Assemblies (Parent Groups)
    const assemblies: Array<{ name: string; label: string }> = [
      { name: 'Room04_Root', label: '[Assembly] Room 04 Whole Scene (Room04_Root)' },
      { name: 'prop_desk', label: '[Assembly] Desk & Workspace (prop_desk)' },
      { name: 'prop_chair', label: '[Assembly] Breuer Chair (prop_chair)' },
      { name: 'prop_vault', label: '[Assembly] Vault Apparatus (prop_vault)' },
      { name: 'group_wall_back', label: '[Assembly] Back Wall & Corridor Portal (group_wall_back)' },
      { name: 'group_wall_left', label: '[Assembly] Left Wall & Exit Blastdoor (group_wall_left)' },
      { name: 'group_wall_right', label: '[Assembly] Right Wall & Vent (group_wall_right)' },
      { name: 'group_wall_front', label: '[Assembly] Front Observation Wall (group_wall_front)' },
      { name: 'group_ceiling', label: '[Assembly] Ceiling & Cove (group_ceiling)' }
    ];

    const optgroupAssemblies = document.createElement('optgroup');
    optgroupAssemblies.label = 'Composite Assemblies (Move Together)';
    for (const asm of assemblies) {
      if (this.scene.getObjectByName(asm.name)) {
        const opt = document.createElement('option');
        opt.value = asm.name;
        opt.textContent = asm.label;
        optgroupAssemblies.appendChild(opt);
      }
    }
    this.assetSelect.appendChild(optgroupAssemblies);

    // 2. Interactive Props & Hero Elements
    const heroProps: Array<{ name: string; label: string }> = [
      { name: 'prop_desk', label: 'prop_desk (Desk Assembly)' },
      { name: 'prop_chair', label: 'prop_chair (Chair Assembly)' },
      { name: 'prop_vault', label: 'prop_vault (Vault Chassis)' },
      { name: 'prop_telephone', label: 'prop_telephone (Rotary Telephone)' },
      { name: 'prop_key', label: 'prop_key (Cipher Key)' },
      { name: 'prop_envelope', label: 'prop_envelope (Crimson Envelope)' },
      { name: 'prop_belljar', label: 'prop_belljar (Containment Jar)' },
      { name: 'prop_painting', label: 'prop_painting (Blueprint Frame)' },
      { name: 'prop_planter', label: 'prop_planter (Monstera Plant)' },
      { name: 'prop_door', label: 'prop_door (Exit Blastdoor)' },
      { name: 'door_corridor', label: 'door_corridor (Corridor Door)' },
      { name: 'faceplate', label: 'faceplate (Apparatus Panel)' },
      { name: 'rotaryDial', label: 'rotaryDial (Tuning Dial)' },
      { name: 'knifeSwitch', label: 'knifeSwitch (Power Throw)' }
    ];

    const optgroupHero = document.createElement('optgroup');
    optgroupHero.label = 'Interactive Props & Hero Elements';
    const heroNamesAdded = new Set<string>();

    for (const hero of heroProps) {
      if (this.scene.getObjectByName(hero.name)) {
        const opt = document.createElement('option');
        opt.value = hero.name;
        opt.textContent = hero.label;
        optgroupHero.appendChild(opt);
        heroNamesAdded.add(hero.name);
      }
    }
    this.assetSelect.appendChild(optgroupHero);

    // 3. Structural & Architectural Individual Meshes
    const structuralNames = new Set<string>();
    let totalMeshes = 0;
    this.scene.traverse((node) => {
      if (node instanceof THREE.Mesh) totalMeshes++;
      if (node.name && !heroNamesAdded.has(node.name) && !assemblies.some(a => a.name === node.name)) {
        structuralNames.add(node.name);
      }
    });

    const optgroupStructural = document.createElement('optgroup');
    optgroupStructural.label = 'Scene Meshes & Architecture';
    Array.from(structuralNames).sort().forEach((name) => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      optgroupStructural.appendChild(opt);
    });
    this.assetSelect.appendChild(optgroupStructural);

    // Update telemetry mesh count
    const meshCountEl = document.getElementById('dev-telem-mesh-count');
    if (meshCountEl) meshCountEl.textContent = `${totalMeshes} meshes`;
  }

  private recordInitialTransforms(): void {
    this.scene.traverse((node) => {
      if (node.name) {
        this.initialTransforms.set(node.name, {
          position: [node.position.x, node.position.y, node.position.z],
          rotationDeg: [
            node.rotation.x * (180 / Math.PI),
            node.rotation.y * (180 / Math.PI),
            node.rotation.z * (180 / Math.PI)
          ],
          scale: [node.scale.x, node.scale.y, node.scale.z]
        });
      }
    });
  }

  private applyStoredOverrides(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const overrides: Record<string, PropTransformRecord> = JSON.parse(stored);
      for (const [name, rec] of Object.entries(overrides)) {
        const obj = this.scene.getObjectByName(name);
        if (obj) {
          obj.position.set(rec.position[0], rec.position[1], rec.position[2]);
          obj.rotation.set(
            rec.rotationDeg[0] * (Math.PI / 180),
            rec.rotationDeg[1] * (Math.PI / 180),
            rec.rotationDeg[2] * (Math.PI / 180)
          );
          obj.scale.set(rec.scale[0], rec.scale[1], rec.scale[2]);
        }
      }
      this.telemetry.record('info', `[Dev3DEditor] Applied transform overrides from LocalStorage for ${Object.keys(overrides).length} props`);
    } catch {
      // Ignore corrupted stored data
    }
  }

  public updateFieldsFromObject(object: THREE.Object3D): void {
    this.isUpdatingFromUI = true;
    try {
      const p = object.position;
      const r = object.rotation;
      const s = object.scale;

      if (this.posXInput) this.posXInput.value = p.x.toFixed(3);
      if (this.posYInput) this.posYInput.value = p.y.toFixed(3);
      if (this.posZInput) this.posZInput.value = p.z.toFixed(3);

      if (this.rotXInput) this.rotXInput.value = (r.x * (180 / Math.PI)).toFixed(1);
      if (this.rotYInput) this.rotYInput.value = (r.y * (180 / Math.PI)).toFixed(1);
      if (this.rotZInput) this.rotZInput.value = (r.z * (180 / Math.PI)).toFixed(1);

      if (this.scaleXInput) this.scaleXInput.value = s.x.toFixed(3);
      if (this.scaleYInput) this.scaleYInput.value = s.y.toFixed(3);
      if (this.scaleZInput) this.scaleZInput.value = s.z.toFixed(3);
    } finally {
      this.isUpdatingFromUI = false;
    }
  }

  private clearFields(): void {
    [this.posXInput, this.posYInput, this.posZInput, this.rotXInput, this.rotYInput, this.rotZInput, this.scaleXInput, this.scaleYInput, this.scaleZInput].forEach((input) => {
      if (input) input.value = '';
    });
  }

  private focusCameraOnObject(object: THREE.Object3D): void {
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    this.cameraDirector.controls.target.copy(center);
  }

  public show(): void {
    this.isVisible = true;
    if (this.panelContainer) this.panelContainer.style.display = 'block';
    this.populateAssetDropdown();
    const telemStatus = document.getElementById('telemetry-status');
    if (telemStatus) telemStatus.textContent = 'DEVELOPER MODE: GIZMO ARMED';
    const devBtn = document.getElementById('btn-dev-3d-toggle');
    if (devBtn) devBtn.classList.add('active');
  }

  public hide(): void {
    this.isVisible = false;
    if (this.panelContainer) this.panelContainer.style.display = 'none';
    const telemStatus = document.getElementById('telemetry-status');
    if (telemStatus) telemStatus.textContent = 'DIAGNOSTIC: ALL SYSTEMS NOMINAL';
    const devBtn = document.getElementById('btn-dev-3d-toggle');
    if (devBtn) devBtn.classList.remove('active');
  }

  public toggle(): boolean {
    if (this.isVisible) this.hide();
    else this.show();
    return this.isVisible;
  }

  public updateTelemetry(): void {
    if (!this.isVisible) return;
    const now = performance.now();
    this.frameCount++;
    if (now - this.lastFpsCalcTime >= 1000) {
      this.fpsDisplay = Math.round((this.frameCount * 1000) / (now - this.lastFpsCalcTime));
      this.frameCount = 0;
      this.lastFpsCalcTime = now;
    }

    // Throttle DOM text updates to 10 FPS (100ms) to avoid layout thrashing
    if (now - this.lastTelemetryTime < 100) return;
    this.lastTelemetryTime = now;

    const cam = this.cameraDirector.camera;
    const tgt = this.cameraDirector.controls.target;
    const sel = this.devGizmo.getSelectedObject();

    const fpsEl = document.getElementById('dev-telem-fps');
    if (fpsEl) fpsEl.textContent = `${this.fpsDisplay} FPS`;

    const camPosEl = document.getElementById('dev-telem-cam-pos');
    if (camPosEl) camPosEl.textContent = `${cam.position.x.toFixed(2)}, ${cam.position.y.toFixed(2)}, ${cam.position.z.toFixed(2)}`;

    const camTgtEl = document.getElementById('dev-telem-cam-tgt');
    if (camTgtEl) camTgtEl.textContent = `${tgt.x.toFixed(2)}, ${tgt.y.toFixed(2)}, ${tgt.z.toFixed(2)}`;

    const activeEl = document.getElementById('dev-telem-active');
    if (activeEl) activeEl.textContent = sel ? sel.name || '[Unnamed Object]' : 'NONE';
  }

  private copyTypeScriptSnippet(): void {
    const obj = this.devGizmo.getSelectedObject();
    if (!obj) {
      alert('Select an object first.');
      return;
    }

    const p = obj.position;
    const r = obj.rotation;
    const snippet = `${obj.name}.position.set(${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)});\n${obj.name}.rotation.set(${r.x.toFixed(3)}, ${r.y.toFixed(3)}, ${r.z.toFixed(3)});`;

    navigator.clipboard?.writeText(snippet).then(() => {
      alert(`Copied TypeScript snippet for ${obj.name}:\n\n${snippet}`);
    }).catch(() => {
      prompt('Copy snippet:', snippet);
    });
  }

  private saveOverridesToLocalStorage(): void {
    const overrides: Record<string, PropTransformRecord> = {};
    this.scene.traverse((node) => {
      if (node.name && this.initialTransforms.has(node.name)) {
        overrides[node.name] = {
          position: [node.position.x, node.position.y, node.position.z],
          rotationDeg: [
            node.rotation.x * (180 / Math.PI),
            node.rotation.y * (180 / Math.PI),
            node.rotation.z * (180 / Math.PI)
          ],
          scale: [node.scale.x, node.scale.y, node.scale.z]
        };
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides, null, 2));
    alert(`Saved coordinates for ${Object.keys(overrides).length} assets into LocalStorage!`);
  }

  private resetToDefaults(): void {
    localStorage.removeItem(STORAGE_KEY);
    for (const [name, rec] of this.initialTransforms.entries()) {
      const obj = this.scene.getObjectByName(name);
      if (obj) {
        obj.position.set(rec.position[0], rec.position[1], rec.position[2]);
        obj.rotation.set(
          rec.rotationDeg[0] * (Math.PI / 180),
          rec.rotationDeg[1] * (Math.PI / 180),
          rec.rotationDeg[2] * (Math.PI / 180)
        );
        obj.scale.set(rec.scale[0], rec.scale[1], rec.scale[2]);
      }
    }

    const cur = this.devGizmo.getSelectedObject();
    if (cur) this.updateFieldsFromObject(cur);
    alert('Reset all prop transforms to baseline defaults.');
  }

  private exportAllLayoutJSON(): void {
    const data: Record<string, PropTransformRecord> = {};
    this.scene.traverse((node) => {
      if (node.name && this.initialTransforms.has(node.name)) {
        data[node.name] = {
          position: [
            parseFloat(node.position.x.toFixed(3)),
            parseFloat(node.position.y.toFixed(3)),
            parseFloat(node.position.z.toFixed(3))
          ],
          rotationDeg: [
            parseFloat((node.rotation.x * (180 / Math.PI)).toFixed(1)),
            parseFloat((node.rotation.y * (180 / Math.PI)).toFixed(1)),
            parseFloat((node.rotation.z * (180 / Math.PI)).toFixed(1))
          ],
          scale: [
            parseFloat(node.scale.x.toFixed(3)),
            parseFloat(node.scale.y.toFixed(3)),
            parseFloat(node.scale.z.toFixed(3))
          ]
        };
      }
    });

    const json = JSON.stringify(data, null, 2);
    console.log('[Dev3DEditor Layout JSON]', json);

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'room_04_layout_overrides.json';
    link.click();
    URL.revokeObjectURL(url);
  }
}
