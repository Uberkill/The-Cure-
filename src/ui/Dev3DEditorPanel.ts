import * as THREE from 'three';
import { DevTransformGizmo } from '../interaction/DevTransformGizmo';
import { CameraDirector } from '../rendering/CameraDirector';
import { EditorServerSync } from '../editor/EditorServerSync';
import { EditorPrefabs } from '../editor/EditorPrefabs';
import { EventBus } from '../core/EventBus';
import { EditorVisualizers } from '../editor/EditorVisualizers';
import { Telemetry } from '../core/Telemetry';


export class Dev3DEditorPanel {
  private scene: THREE.Scene;
  private cameraDirector: CameraDirector;
  private devGizmo: DevTransformGizmo;

  private panelContainer: HTMLElement | null = null;
  private isVisible: boolean = false;
  private isUpdatingFromUI: boolean = false;

  private posXInput: HTMLInputElement | null = null;
  private posYInput: HTMLInputElement | null = null;
  private posZInput: HTMLInputElement | null = null;

  private renderer: THREE.WebGLRenderer;
  private telemetryInterval: number | null = null;
  private fpsFrames: number = 0;
  private fpsLastTime: number = performance.now();
  private lastFrameDeltaMs: number = 16.6;
  private fpsLastFrameTime: number = performance.now();
  private activeLogFilter: 'all' | 'error' | 'warn' | 'info' = 'all';

  private readonly prefabCatalog = [
    { id: 'BauhausDesk', name: 'Bauhaus Desk', dims: '2.5m x 0.8m x 1.3m' },
    { id: 'OfficeChair', name: 'Office Chair', dims: '0.55m x 0.85m' },
    { id: 'FilingCabinet', name: 'Filing Cabinet', dims: '0.6m x 1.4m' },
    { id: 'RotaryPhone', name: 'Rotary Phone', dims: '0.2m x 0.1m' },
    { id: 'SurgicalLight', name: 'Surgical Light', dims: '0.3m x 1.0m' },
    { id: 'MedicalCart', name: 'Medical Cart', dims: '0.7m x 0.9m' },
    { id: 'Typewriter', name: 'Typewriter', dims: '0.36m x 0.2m' },
    { id: 'PointLight', name: 'Point Light', dims: 'Omni Source' },
    { id: 'SpotLight', name: 'Spot Light', dims: 'Conical Directed' },
    { id: 'Painting', name: 'Wall Painting', dims: '1.2m x 0.8m' },
    { id: 'Plant', name: 'Potted Plant', dims: '0.4m x 1.0m' },
    { id: 'Clock', name: 'Wall Clock', dims: '0.5m x 0.5m' },
    { id: 'Rug', name: 'Crimson Rug', dims: '3.0m x 2.0m' },
  ];

  constructor(scene: THREE.Scene, cameraDirector: CameraDirector, devGizmo: DevTransformGizmo, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.cameraDirector = cameraDirector;
    this.devGizmo = devGizmo;
    this.renderer = renderer;

    this.initPanel();
    this.setupDragAndDrop();
    this.bindGizmoEvents();

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
      position: fixed; top: 80px; right: 80px; width: 460px; max-height: calc(100vh - 120px); overflow-y: auto;
      background: rgba(16, 22, 18, 0.94); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 6px; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55); font-family: 'JetBrains Mono', monospace;
      font-size: 11px; color: #e2e6e0; padding: 16px; z-index: 10000; display: none; box-sizing: border-box; user-select: none;
    `;

    panel.innerHTML = `
      <div id="dev-panel-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; cursor: grab;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #4ade80;"></span>
          <span style="font-weight: 600; letter-spacing: 0.08em; color: #bad2c8; text-transform: uppercase;">The Vault • Developer Telemetry</span>
        </div>
        <button id="dev-btn-close" style="background: none; border: none; color: #88928b; cursor: pointer; font-family: monospace; font-size: 11px;">[X]</button>
      </div>
      <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
        <input type="checkbox" id="dev-chk-visualizers" checked style="accent-color: var(--color-crt-phosphor, #4ade80); cursor: pointer;">
        <label for="dev-chk-visualizers" style="cursor: pointer;">Show Bounding Boxes</label>
      </div>

      <!-- TABS -->
      <div style="display: flex; gap: 4px; margin-bottom: 12px; font-size: 11px;">
        <button class="editor-tab active" data-tab="transforms" style="flex:1; padding: 4px; background: #3b4c42; border: 1px solid #5a7566; color: #fff; cursor: pointer; border-radius: 3px;">Trans</button>
        <button class="editor-tab" data-tab="anim" style="flex:1; padding: 4px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #88928b; cursor: pointer; border-radius: 3px;">Anim</button>
        <button class="editor-tab" data-tab="spawner" style="flex:1; padding: 4px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #88928b; cursor: pointer; border-radius: 3px;">Spawn</button>
        <button class="editor-tab" data-tab="lore" style="flex:1; padding: 4px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #88928b; cursor: pointer; border-radius: 3px;">Lore</button>
        <button class="editor-tab" data-tab="env" style="flex:1; padding: 4px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #88928b; cursor: pointer; border-radius: 3px;">Env</button>
        <button class="editor-tab" data-tab="scenarios" style="flex:1; padding: 4px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #88928b; cursor: pointer; border-radius: 3px;">Scen</button>
        <button class="editor-tab" data-tab="telemetry" style="flex:1; padding: 4px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #88928b; cursor: pointer; border-radius: 3px;">Telem</button>
      </div>

      <!-- TAB CONTENT: TRANSFORMS -->
      <div id="tab-transforms" class="editor-tab-content">
        <label style="display: block; margin-bottom: 6px; color: #88928b;">Selected Object(s)</label>
        <div id="dev-selected-object" style="padding: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 3px; margin-bottom: 12px; color: #4ade80;">None</div>

        <div style="margin-bottom: 12px; display: flex; gap: 4px;">
            <button id="dev-btn-mode-t" style="flex:1; padding: 4px; background: rgba(0,0,0,0.5); color: #fff; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; border-radius: 3px;">Move (W)</button>
            <button id="dev-btn-mode-r" style="flex:1; padding: 4px; background: rgba(0,0,0,0.5); color: #fff; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; border-radius: 3px;">Rotate (E)</button>
            <button id="dev-btn-mode-s" style="flex:1; padding: 4px; background: rgba(0,0,0,0.5); color: #fff; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; border-radius: 3px;">Scale (R)</button>
          </div>
          <div id="dev-painting-props" style="display: none; margin-bottom: 12px; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 3px;">
            <label style="display: block; margin-bottom: 6px; color: #88928b; font-size: 10px; text-transform: uppercase;">Painting Customization</label>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; align-items: center;">
              <span>Image URL</span>
              <input type="text" id="dev-painting-url" placeholder="https://..." style="width:120px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 2px;">
            </div>
            <button id="dev-btn-painting-apply" style="width: 100%; padding: 4px; margin-top: 4px; background: #2f453a; color: #8fcead; border: 1px solid #4ade80; border-radius: 3px; cursor: pointer;">Apply Image</button>
          </div>
          <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Position X</span> <input type="number" id="dev-pos-x" step="0.05" style="width:60px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 2px;"></div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Position Y</span> <input type="number" id="dev-pos-y" step="0.05" style="width:60px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 2px;"></div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Position Z</span> <input type="number" id="dev-pos-z" step="0.05" style="width:60px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 2px;"></div>
        </div>
        <div style="margin-bottom: 12px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Scale X</span> <input type="number" id="dev-scl-x" step="0.05" style="width:60px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 2px;"></div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Scale Y</span> <input type="number" id="dev-scl-y" step="0.05" style="width:60px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 2px;"></div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Scale Z</span> <input type="number" id="dev-scl-z" step="0.05" style="width:60px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 2px;"></div>
          </div>
          <div style="margin-bottom: 12px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
            <label style="display: block; margin-bottom: 6px; color: #88928b;">Rotation (Degrees)</label>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="width: 20px;">X</span>
            <input type="range" id="dev-rot-x" min="-180" max="180" value="0" style="flex:1; accent-color: #00ff88; margin: 0 8px;">
            <span id="dev-rot-x-val" style="width: 35px; text-align: right;">0°</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="width: 20px;">Y</span>
            <input type="range" id="dev-rot-y" min="-180" max="180" value="0" style="flex:1; accent-color: #00ff88; margin: 0 8px;">
            <span id="dev-rot-y-val" style="width: 35px; text-align: right;">0°</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="width: 20px;">Z</span>
            <input type="range" id="dev-rot-z" min="-180" max="180" value="0" style="flex:1; accent-color: #00ff88; margin: 0 8px;">
            <span id="dev-rot-z-val" style="width: 35px; text-align: right;">0°</span>
          </div>
        </div>
        <button id="dev-btn-save-server" style="width: 100%; padding: 8px; background: #2f453a; color: #8fcead; border: 1px solid #4ade80; border-radius: 4px; cursor: pointer; margin-bottom: 8px;">Save to Server (room_layout.json)</button>
        <button id="dev-btn-export" style="width: 100%; padding: 8px; background: rgba(255,255,255,0.05); color: #bad2c8; border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; cursor: pointer;">Export Clipboard</button>
        <button id="dev-btn-delete" style="width: 100%; padding: 8px; background: rgba(220,50,50,0.1); color: #ff8888; border: 1px solid rgba(220,50,50,0.3); border-radius: 4px; cursor: pointer; margin-top: 8px;">Delete Selected</button>
        <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
          <input type="checkbox" id="dev-chk-snap" style="accent-color: #00ff88;">
          <label for="dev-chk-snap" style="font-size: 11px; color: #bad2c8; cursor: pointer;">Grid Snap (0.5m / 15°)</label>
        </div>
      </div>

      <!-- TAB CONTENT: ANIMATION -->
      <div id="tab-anim" class="editor-tab-content" style="display: none;">
        <label style="display: block; margin-bottom: 6px; color: #88928b;">Animation Definition</label>
        <div id="dev-anim-controls" style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Property</span>
            <select id="dev-anim-type" style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 2px; width: 100px;">
              <option value="rotation">Rotation</option>
              <option value="position">Position</option>
            </select>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Axis</span>
            <select id="dev-anim-axis" style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 2px; width: 100px;">
              <option value="x">X</option>
              <option value="y">Y</option>
              <option value="z">Z</option>
            </select>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span>Start Value</span>
            <div style="display: flex; gap: 4px;">
              <button id="dev-anim-set-start" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #bad2c8; cursor: pointer; padding: 2px 6px; border-radius: 2px;">Set from Gizmo</button>
              <input type="number" id="dev-anim-start" step="0.05" value="0" style="width:60px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 2px;">
            </div>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span>End Value</span>
            <div style="display: flex; gap: 4px;">
              <button id="dev-anim-set-end" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #bad2c8; cursor: pointer; padding: 2px 6px; border-radius: 2px;">Set from Gizmo</button>
              <input type="number" id="dev-anim-end" step="0.05" value="0" style="width:60px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 2px;">
            </div>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Trigger</span>
            <select id="dev-anim-trigger" style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 2px; width: 120px;">
              <option value="none">Manual / Script</option>
              <option value="click">On Click (Toggle)</option>
              <option value="proximity">On Proximity</option>
            </select>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span>Duration (ms)</span>
            <input type="number" id="dev-anim-duration" step="100" value="800" style="width:80px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 2px;">
          </div>
          
          <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px; margin-bottom: 12px;">
            <label style="display: block; margin-bottom: 6px; color: #00ff88; font-weight: bold;">Scrub Animation Time</label>
            <input type="range" id="dev-anim-scrub" min="0" max="100" value="0" style="width:100%; accent-color: #00ff88;">
            <div style="display: flex; justify-content: space-between; font-size: 9px; color: #88928b;">
              <span>0% (Start)</span>
              <span>100% (End)</span>
            </div>
          </div>
          
          <button id="dev-btn-anim-save" style="width: 100%; padding: 8px; background: #2f453a; color: #8fcead; border: 1px solid #4ade80; border-radius: 4px; cursor: pointer;">Save Animation to Server</button>
        </div>
      </div>

      <!-- TAB CONTENT: SPAWNER -->
      <div id="tab-spawner" class="editor-tab-content" style="display: none;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <label style="color: #88928b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Prefab Component Library</label>
          <span style="color: #64748b; font-size: 9px;">13 System Components</span>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 12px;">
          ${this.prefabCatalog.map(p => `
            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 4px; padding: 6px; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="font-weight: 600; color: #bad2c8; font-size: 11px;">${p.name}</div>
                <div style="color: #64748b; font-size: 9px; margin-top: 2px;">${p.dims}</div>
              </div>
              <button class="dev-btn-spawn-card" data-prefab="${p.id}" style="margin-top: 6px; padding: 4px; background: #2f453a; color: #8fcead; border: 1px solid #4ade80; border-radius: 3px; font-size: 10px; cursor: pointer; width: 100%;">+ SPAWN</button>
            </div>
          `).join('')}
        </div>

        <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-top: 8px;">
          <label style="display: block; margin-bottom: 6px; color: #88928b; font-size: 10px; text-transform: uppercase;">Standard Spawner Dropdown</label>
          <div style="display: flex; gap: 6px;">
            <select id="dev-prefab-select" style="flex: 1; padding: 6px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 3px;">
              <optgroup label="Main Props">
                <option value="BauhausDesk">Bauhaus Desk</option>
                <option value="OfficeChair">Office Chair</option>
                <option value="FilingCabinet">Filing Cabinet</option>
                <option value="RotaryPhone">Rotary Phone</option>
                <option value="SurgicalLight">Surgical Light</option>
                <option value="MedicalCart">Medical Cart</option>
                <option value="Typewriter">Typewriter</option>
              </optgroup>
              <optgroup label="Lighting">
                <option value="PointLight">Point Light</option>
                <option value="SpotLight">Spot Light</option>
              </optgroup>
              <optgroup label="General Prefabs">
                <option value="Painting">Painting</option>
                <option value="Plant">Potted Plant</option>
                <option value="Clock">Wall Clock</option>
                <option value="Rug">Crimson Rug</option>
              </optgroup>
            </select>
            <button id="dev-btn-spawn" style="padding: 6px 12px; background: #3b4c42; color: #fff; border: 1px solid #5a7566; border-radius: 3px; cursor: pointer;">Spawn</button>
          </div>
        </div>
      </div>

      <!-- TAB CONTENT: LORE -->
      <div id="tab-lore" class="editor-tab-content" style="display: none;">
        <label style="display: block; margin-bottom: 6px; color: #88928b;">Interaction Properties</label>
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Prompt (Hover)</span>
            <input type="text" id="dev-lore-prompt" placeholder="[EXAMINE DESK]" style="width:180px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 2px;">
          </div>
          <div style="display: flex; flex-direction: column; margin-bottom: 4px;">
            <span style="margin-bottom: 4px;">Flavor Text (Click)</span>
            <textarea id="dev-lore-flavor" rows="4" placeholder="An institutional heavy metal desk..." style="width:100%; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 4px; resize: vertical;"></textarea>
          </div>
        </div>
        <button id="dev-btn-lore-save" style="width: 100%; padding: 8px; background: #2f453a; color: #8fcead; border: 1px solid #4ade80; border-radius: 4px; cursor: pointer; margin-bottom: 8px;">Apply & Save Lore</button>
      </div>

      <!-- TAB CONTENT: ENVIRONMENT -->
      <div id="tab-env" class="editor-tab-content" style="display: none;">
        <div style="margin-bottom: 12px; background: rgba(0,0,0,0.3); padding: 8px; border: 1px solid rgba(255,255,255,0.06); border-radius: 3px;">
          <label style="display: block; margin-bottom: 6px; color: #88928b; font-size: 10px; text-transform: uppercase;">Atmosphere (Fog)</label>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span>Color</span>
            <input type="color" id="dev-env-fog-color" value="#000000" style="background:none; border:none; width: 40px; height: 24px; cursor: pointer;">
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>Density</span>
            <input type="range" id="dev-env-fog-density" min="0" max="0.1" step="0.001" value="0.02" style="flex:1; margin-left:8px; accent-color: #00ff88;">
          </div>
        </div>
        
        <div style="margin-bottom: 12px; background: rgba(0,0,0,0.3); padding: 8px; border: 1px solid rgba(255,255,255,0.06); border-radius: 3px;">
          <label style="display: block; margin-bottom: 6px; color: #88928b; font-size: 10px; text-transform: uppercase;">Ambient Light</label>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span>Color</span>
            <input type="color" id="dev-env-amb-color" value="#ffffff" style="background:none; border:none; width: 40px; height: 24px; cursor: pointer;">
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>Intensity</span>
            <input type="range" id="dev-env-amb-intensity" min="0" max="2" step="0.5" value="0.5" style="flex:1; margin-left:8px; accent-color: #00ff88;">
          </div>
        </div>
        <button id="dev-btn-env-save" style="width: 100%; padding: 6px; background: #2f453a; color: #8fcead; border: 1px solid #4ade80; border-radius: 3px; cursor: pointer;">Apply & Save Environment</button>
      </div>

      <!-- TAB CONTENT: SCENARIOS -->
      <div id="tab-scenarios" class="editor-tab-content" style="display: none;">
        <label style="display: block; margin-bottom: 8px; color: #88928b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Narrative Acts (1 - 8)</label>
        <button class="dev-btn-scenario" data-room="room_04" style="width: 100%; padding: 6px; background: rgba(0,0,0,0.5); color: #bad2c8; border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; margin-bottom: 4px; text-align: left; cursor: pointer;">[Act I] Room 01: The Sterile Chamber</button>
        <button class="dev-btn-scenario" data-room="sleep_ward" style="width: 100%; padding: 6px; background: rgba(0,0,0,0.5); color: #bad2c8; border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; margin-bottom: 4px; text-align: left; cursor: pointer;">[Act II] Room 02: The Sleep Ward</button>
        <button class="dev-btn-scenario" data-room="hydrotherapy" style="width: 100%; padding: 6px; background: rgba(0,0,0,0.5); color: #bad2c8; border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; margin-bottom: 4px; text-align: left; cursor: pointer;">[Act III] Room 03: The Hydrotherapy Room</button>
        <button class="dev-btn-scenario" data-room="audiology" style="width: 100%; padding: 6px; background: rgba(0,0,0,0.5); color: #bad2c8; border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; margin-bottom: 4px; text-align: left; cursor: pointer;">[Act IV] Room 04: The Audiology Vault</button>
        <button class="dev-btn-scenario" data-room="archive" style="width: 100%; padding: 6px; background: rgba(0,0,0,0.5); color: #bad2c8; border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; margin-bottom: 4px; text-align: left; cursor: pointer;">[Act V] Room 05: The Archive</button>
        <button class="dev-btn-scenario" data-room="directors_office" style="width: 100%; padding: 6px; background: rgba(0,0,0,0.5); color: #bad2c8; border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; margin-bottom: 4px; text-align: left; cursor: pointer;">[Act VI] Room 06: The Director's Office</button>
        <button class="dev-btn-scenario" data-room="synthesis_blackout" style="width: 100%; padding: 6px; background: rgba(0,0,0,0.5); color: #bad2c8; border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; margin-bottom: 4px; text-align: left; cursor: pointer;">[Act VII] Room 07: The Synthesis Chamber</button>
        <button class="dev-btn-scenario" data-room="velvet_lounge" style="width: 100%; padding: 6px; background: rgba(0,0,0,0.5); color: #bad2c8; border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; margin-bottom: 4px; text-align: left; cursor: pointer;">[Act VIII] Room 08: The Velvet Lounge</button>

        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
          <label style="display: block; margin-bottom: 6px; color: #88928b; font-size: 10px; text-transform: uppercase;">Auxiliary Workspace</label>
          <button class="dev-btn-scenario" data-room="sandbox" style="width: 100%; padding: 8px; background: #3b4c42; color: #fff; border: 1px solid #5a7566; border-radius: 4px; font-weight: bold; cursor: pointer;">[Sandbox] Freeform 3D Workspace</button>
        </div>
      </div>

      <!-- TAB CONTENT: TELEMETRY -->
      <div id="tab-telemetry" class="editor-tab-content" style="display: none; font-family: monospace; font-size: 11px;">
        <label style="display: block; margin-bottom: 6px; color: #88928b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Engine Telemetry & GPU Budgets</label>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 10px;">
          <div style="background: rgba(0,0,0,0.3); padding: 6px; border: 1px solid rgba(255,255,255,0.08); border-radius: 3px;">
            <div style="color: #88928b; font-size: 9px; text-transform: uppercase;">Framerate</div>
            <div style="display: flex; align-items: baseline; gap: 4px; margin-top: 2px;">
              <span id="dev-telem-fps" style="color: #4ade80; font-size: 16px; font-weight: bold;">0</span>
              <span style="color: #64748b; font-size: 9px;">FPS</span>
            </div>
            <div id="dev-telem-fps-badge" style="font-size: 9px; color: #4ade80; margin-top: 2px;">TARGET: 60 FPS</div>
          </div>
          <div style="background: rgba(0,0,0,0.3); padding: 6px; border: 1px solid rgba(255,255,255,0.08); border-radius: 3px;">
            <div style="color: #88928b; font-size: 9px; text-transform: uppercase;">Frame Delta</div>
            <div style="display: flex; align-items: baseline; gap: 4px; margin-top: 2px;">
              <span id="dev-telem-delta" style="color: #60a5fa; font-size: 16px; font-weight: bold;">0.0</span>
              <span style="color: #64748b; font-size: 9px;">ms</span>
            </div>
            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">BUDGET: 16.6ms</div>
          </div>
          <div style="background: rgba(0,0,0,0.3); padding: 6px; border: 1px solid rgba(255,255,255,0.08); border-radius: 3px;">
            <div style="color: #88928b; font-size: 9px; text-transform: uppercase;">Draw Calls</div>
            <div style="display: flex; align-items: baseline; gap: 4px; margin-top: 2px;">
              <span id="dev-telem-draws" style="color: #fbbf24; font-size: 16px; font-weight: bold;">0</span>
              <span style="color: #64748b; font-size: 9px;">/ 60</span>
            </div>
            <div id="dev-telem-draws-status" style="font-size: 9px; color: #4ade80; margin-top: 2px;">BUDGET OK</div>
          </div>
          <div style="background: rgba(0,0,0,0.3); padding: 6px; border: 1px solid rgba(255,255,255,0.08); border-radius: 3px;">
            <div style="color: #88928b; font-size: 9px; text-transform: uppercase;">Triangles</div>
            <div style="display: flex; align-items: baseline; gap: 4px; margin-top: 2px;">
              <span id="dev-telem-tris" style="color: #a78bfa; font-size: 15px; font-weight: bold;">0</span>
            </div>
            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">BUDGET: 120k</div>
          </div>
          <div style="background: rgba(0,0,0,0.3); padding: 6px; border: 1px solid rgba(255,255,255,0.08); border-radius: 3px;">
            <div style="color: #88928b; font-size: 9px; text-transform: uppercase;">Geometries</div>
            <div id="dev-telem-geom" style="color: #38bdf8; font-size: 15px; font-weight: bold; margin-top: 2px;">0</div>
            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">ACTIVE BUFFERS</div>
          </div>
          <div style="background: rgba(0,0,0,0.3); padding: 6px; border: 1px solid rgba(255,255,255,0.08); border-radius: 3px;">
            <div style="color: #88928b; font-size: 9px; text-transform: uppercase;">Textures / Shd</div>
            <div style="display: flex; align-items: baseline; gap: 4px; margin-top: 2px;">
              <span id="dev-telem-tex" style="color: #f472b6; font-size: 15px; font-weight: bold;">0</span>
              <span style="color: #64748b; font-size: 9px;">/</span>
              <span id="dev-telem-prog" style="color: #e2e6e0; font-size: 13px;">0</span>
            </div>
            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">GPU ALLOCATED</div>
          </div>
        </div>

        <!-- SELECTED OBJECT SPATIAL TELEMETRY -->
        <div id="dev-telem-spatial-card" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 8px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 4px;">
            <span style="font-weight: 600; color: #bad2c8; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">Active Spatial Matrix</span>
            <span id="dev-spatial-name" style="color: #4ade80; font-size: 10px;">[No Selection]</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 10px;">
            <div>
              <div style="color: #88928b;">BOUNDS (WxHxD)</div>
              <div id="dev-spatial-bounds" style="color: #fbbf24; margin-top: 2px;">--</div>
            </div>
            <div>
              <div style="color: #88928b;">WORLD POS</div>
              <div id="dev-spatial-pos" style="color: #60a5fa; margin-top: 2px;">--</div>
            </div>
            <div>
              <div style="color: #88928b;">PIVOT OFFSET</div>
              <div id="dev-spatial-pivot" style="color: #a78bfa; margin-top: 2px;">--</div>
            </div>
            <div>
              <div style="color: #88928b;">GROUND STATUS</div>
              <div id="dev-spatial-ground" style="color: #e2e6e0; margin-top: 2px;">--</div>
            </div>
          </div>
          <div style="display: flex; gap: 4px; margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 6px;">
            <button id="dev-btn-snap-floor" style="flex: 1; padding: 4px; background: rgba(74, 222, 128, 0.15); border: 1px solid #4ade80; color: #4ade80; border-radius: 3px; font-size: 10px; cursor: pointer;">SNAP FLOOR (Y=0)</button>
            <button id="dev-btn-reset-rot" style="flex: 1; padding: 4px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #bad2c8; border-radius: 3px; font-size: 10px; cursor: pointer;">RESET ROTATION</button>
            <button id="dev-btn-duplicate" style="flex: 1; padding: 4px; background: rgba(96, 165, 250, 0.15); border: 1px solid #60a5fa; color: #93c5fd; border-radius: 3px; font-size: 10px; cursor: pointer;">DUPLICATE</button>
          </div>
        </div>

        <!-- RECENT LOGS / OPERATIONAL CONSOLE -->
        <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="display: flex; gap: 3px;">
              <button class="dev-log-filter active" data-filter="all" style="padding: 2px 6px; background: #3b4c42; border: 1px solid #5a7566; color: #fff; border-radius: 2px; font-size: 9px; cursor: pointer;">ALL</button>
              <button class="dev-log-filter" data-filter="error" style="padding: 2px 6px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #ef4444; border-radius: 2px; font-size: 9px; cursor: pointer;">ERR</button>
              <button class="dev-log-filter" data-filter="warn" style="padding: 2px 6px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #fbbf24; border-radius: 2px; font-size: 9px; cursor: pointer;">WRN</button>
              <button class="dev-log-filter" data-filter="info" style="padding: 2px 6px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #38bdf8; border-radius: 2px; font-size: 9px; cursor: pointer;">INF</button>
            </div>
            <div style="display: flex; gap: 4px;">
              <button id="dev-btn-log-copy" style="padding: 2px 6px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #bad2c8; border-radius: 2px; font-size: 9px; cursor: pointer;">COPY</button>
              <button id="dev-btn-log-clear" style="padding: 2px 6px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #88928b; border-radius: 2px; font-size: 9px; cursor: pointer;">CLEAR</button>
            </div>
          </div>
          <div id="dev-telem-logs" style="width: 100%; height: 130px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.08); border-radius: 2px; padding: 6px; font-size: 10px; font-family: monospace; overflow-y: auto; white-space: pre-wrap; word-break: break-all; box-sizing: border-box; line-height: 1.4;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    this.panelContainer = panel;

    this.posXInput = document.getElementById('dev-pos-x') as HTMLInputElement;
    this.posYInput = document.getElementById('dev-pos-y') as HTMLInputElement;
    this.posZInput = document.getElementById('dev-pos-z') as HTMLInputElement;
    
    const rotXInput = document.getElementById('dev-rot-x') as HTMLInputElement;
    const rotYInput = document.getElementById('dev-rot-y') as HTMLInputElement;
    const rotZInput = document.getElementById('dev-rot-z') as HTMLInputElement;

    const applyTransform = () => {
      if (this.isUpdatingFromUI) return;
      const objs = this.devGizmo.getSelectedObjects();
      if (objs.length === 1 && this.posXInput && this.posYInput && this.posZInput) {
        const px = parseFloat(this.posXInput.value);
        const py = parseFloat(this.posYInput.value);
        const pz = parseFloat(this.posZInput.value);
        
        if (!isNaN(px) && !isNaN(py) && !isNaN(pz)) {
          objs[0].position.set(px, py, pz);
            const sx = parseFloat((document.getElementById('dev-scl-x') as HTMLInputElement).value);
            const sy = parseFloat((document.getElementById('dev-scl-y') as HTMLInputElement).value);
            const sz = parseFloat((document.getElementById('dev-scl-z') as HTMLInputElement).value);
            if (!isNaN(sx) && !isNaN(sy) && !isNaN(sz)) {
              objs[0].scale.set(sx, sy, sz);
            }
          }
        
        if (rotXInput && rotYInput && rotZInput) {
          const rxRaw = parseFloat(rotXInput.value);
          const ryRaw = parseFloat(rotYInput.value);
          const rzRaw = parseFloat(rotZInput.value);
          
          if (!isNaN(rxRaw) && !isNaN(ryRaw) && !isNaN(rzRaw)) {
            const rx = rxRaw * (Math.PI / 180);
            const ry = ryRaw * (Math.PI / 180);
            const rz = rzRaw * (Math.PI / 180);
            objs[0].rotation.set(rx, ry, rz);
          }
          
          document.getElementById('dev-rot-x-val')!.innerText = `${rotXInput.value}°`;
          document.getElementById('dev-rot-y-val')!.innerText = `${rotYInput.value}°`;
          document.getElementById('dev-rot-z-val')!.innerText = `${rotZInput.value}°`;
        }
        this.devGizmo.syncTransform();
      }
    };
    
    this.posXInput?.addEventListener('input', applyTransform);
    this.posYInput?.addEventListener('input', applyTransform);
    this.posZInput?.addEventListener('input', applyTransform);
    const sclXInput = document.getElementById('dev-scl-x') as HTMLInputElement;
    const sclYInput = document.getElementById('dev-scl-y') as HTMLInputElement;
    const sclZInput = document.getElementById('dev-scl-z') as HTMLInputElement;
    sclXInput?.addEventListener('input', applyTransform);
    sclYInput?.addEventListener('input', applyTransform);
    sclZInput?.addEventListener('input', applyTransform);

    document.getElementById('dev-btn-mode-t')?.addEventListener('click', () => this.devGizmo.setMode('translate'));
    document.getElementById('dev-btn-mode-r')?.addEventListener('click', () => this.devGizmo.setMode('rotate'));
    document.getElementById('dev-btn-mode-s')?.addEventListener('click', () => this.devGizmo.setMode('scale'));

    document.getElementById('dev-btn-painting-apply')?.addEventListener('click', () => {
      const objs = this.devGizmo.getSelectedObjects();
      if (objs.length === 1 && objs[0].userData && objs[0].userData.prefabType === 'Painting') {
        const urlInput = document.getElementById('dev-painting-url') as HTMLInputElement;
        const url = urlInput.value.trim();
        objs[0].userData.paintingUrl = url;
        
        // Find the canvas mesh inside the Painting group (child index 1 based on EditorPrefabs)
        const canvasMesh = objs[0].children[1] as any;
        if (canvasMesh && canvasMesh.material) {
          if (url) {
            const loader = new THREE.TextureLoader();
              loader.load(url, (texture) => {
                canvasMesh.material.map = texture;
                canvasMesh.material.color.setHex(0xffffff);
                canvasMesh.material.needsUpdate = true;
              });
            } else {
            canvasMesh.material.map = null;
            canvasMesh.material.color.setHex(0xedf0eb); // chalkUpperWall default
            canvasMesh.material.needsUpdate = true;
          }
        }
        document.getElementById('dev-btn-save-server')?.click();
      }
    });
    rotXInput?.addEventListener('input', applyTransform);
    rotYInput?.addEventListener('input', applyTransform);
    rotZInput?.addEventListener('input', applyTransform);

    document.getElementById('dev-btn-close')?.addEventListener('click', () => this.hide());
    
    // Tab Switching
    document.querySelectorAll('.editor-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.editor-tab').forEach(b => {
          (b as HTMLElement).style.background = 'transparent';
          (b as HTMLElement).style.color = '#88928b';
        });
        const target = e.currentTarget as HTMLElement;
        target.style.background = '#3b4c42';
        target.style.color = '#fff';
        
        document.querySelectorAll('.editor-tab-content').forEach(c => (c as HTMLElement).style.display = 'none');
        document.getElementById(`tab-${target.dataset.tab}`)!.style.display = 'block';
      });
    });

    // Animation Designer
    const typeSelect = document.getElementById('dev-anim-type') as HTMLSelectElement;
    const axisSelect = document.getElementById('dev-anim-axis') as HTMLSelectElement;
    const startInput = document.getElementById('dev-anim-start') as HTMLInputElement;
    const endInput = document.getElementById('dev-anim-end') as HTMLInputElement;
    const scrubInput = document.getElementById('dev-anim-scrub') as HTMLInputElement;

    const applyAnimScrub = () => {
      const objs = this.devGizmo.getSelectedObjects();
      if (objs.length !== 1) return;
      const obj = objs[0];
      
      const start = parseFloat(startInput.value);
      const end = parseFloat(endInput.value);
      const progress = parseFloat(scrubInput.value) / 100;
      
      if (isNaN(start) || isNaN(end) || isNaN(progress)) return;
      
      const current = start + (end - start) * progress;
      
      const type = typeSelect.value;
      const axis = axisSelect.value as 'x'|'y'|'z';
      
      if (type === 'rotation') {
        obj.rotation[axis] = current;
      } else {
        obj.position[axis] = current;
      }
      
      obj.userData.animType = type;
      obj.userData.animAxis = axis;
      obj.userData.animStart = start;
      obj.userData.animEnd = end;
      
      const triggerSelect = document.getElementById('dev-anim-trigger') as HTMLSelectElement;
      const durationInput = document.getElementById('dev-anim-duration') as HTMLInputElement;
      if (triggerSelect && durationInput) {
        obj.userData.animTrigger = triggerSelect.value;
        obj.userData.animDuration = parseFloat(durationInput.value) || 800;
      }
      
      this.devGizmo.syncTransform();
    };

    scrubInput?.addEventListener('input', applyAnimScrub);
    typeSelect?.addEventListener('change', applyAnimScrub);
    axisSelect?.addEventListener('change', applyAnimScrub);
    startInput?.addEventListener('change', applyAnimScrub);
    endInput?.addEventListener('change', applyAnimScrub);
    document.getElementById('dev-anim-trigger')?.addEventListener('change', applyAnimScrub);
    document.getElementById('dev-anim-duration')?.addEventListener('change', applyAnimScrub);

    document.getElementById('dev-anim-set-start')?.addEventListener('click', () => {
      const objs = this.devGizmo.getSelectedObjects();
      if (objs.length !== 1) return;
      const type = typeSelect.value;
      const axis = axisSelect.value as 'x'|'y'|'z';
      startInput.value = type === 'rotation' ? String(objs[0].rotation[axis]) : String(objs[0].position[axis]);
      applyAnimScrub();
    });

    document.getElementById('dev-anim-set-end')?.addEventListener('click', () => {
      const objs = this.devGizmo.getSelectedObjects();
      if (objs.length !== 1) return;
      const type = typeSelect.value;
      const axis = axisSelect.value as 'x'|'y'|'z';
      endInput.value = type === 'rotation' ? String(objs[0].rotation[axis]) : String(objs[0].position[axis]);
      applyAnimScrub();
    });

    document.getElementById('dev-btn-anim-save')?.addEventListener('click', () => {
      document.getElementById('dev-btn-save-server')?.click(); // trigger the main save logic
    });

    // Lore / Flavor Text
    document.getElementById('dev-btn-lore-save')?.addEventListener('click', () => {
      const objs = this.devGizmo.getSelectedObjects();
      if (objs.length === 1) {
        const obj = objs[0];
        obj.userData.interactionPrompt = (document.getElementById('dev-lore-prompt') as HTMLInputElement).value;
        obj.userData.flavorText = (document.getElementById('dev-lore-flavor') as HTMLTextAreaElement).value;
        obj.userData.isModified = true;
        document.getElementById('dev-btn-save-server')?.click();
      }
    });

    // Save to Server
    document.getElementById('dev-btn-save-server')?.addEventListener('click', async () => {
      const data: any = { 
          prefabs: [],
          overrides: {},
          environment: {
            fogColor: (document.getElementById('dev-env-fog-color') as HTMLInputElement)?.value || '#000000',
            fogDensity: parseFloat((document.getElementById('dev-env-fog-density') as HTMLInputElement)?.value || '0.02'),
            ambColor: (document.getElementById('dev-env-amb-color') as HTMLInputElement)?.value || '#ffffff',
            ambIntensity: parseFloat((document.getElementById('dev-env-amb-intensity') as HTMLInputElement)?.value || '0.5')
          }
        };
      // Gather all prefabs currently in the scene to prevent wiping others
      this.scene.traverse(child => {
        if (child.userData) {
          if (child.userData.isPrefab) {
            const pEntry: any = {
              id: child.userData.prefabId,
              type: child.userData.prefabType,
              transform: {
                x: child.position.x, y: child.position.y, z: child.position.z,
                rx: child.rotation.x, ry: child.rotation.y, rz: child.rotation.z,
                sx: child.scale.x, sy: child.scale.y, sz: child.scale.z
              }
            };
            if (child.userData.modelUrl) pEntry.modelUrl = child.userData.modelUrl;
            if (child.userData.paintingUrl) pEntry.paintingUrl = child.userData.paintingUrl;
            if (child.userData.animStart !== undefined) pEntry.animStart = child.userData.animStart;
            if (child.userData.animEnd !== undefined) pEntry.animEnd = child.userData.animEnd;
            if (child.userData.animTrigger) pEntry.animTrigger = child.userData.animTrigger;
            if (child.userData.animDuration) pEntry.animDuration = child.userData.animDuration;
            if (child.userData.interactionPrompt !== undefined) pEntry.interactionPrompt = child.userData.interactionPrompt;
            if (child.userData.flavorText !== undefined) pEntry.flavorText = child.userData.flavorText;
            
            // Serialize light properties if it's a light prefab
            if (child.userData.isLight) {
              const l = child.children.find((c: any) => c.isLight) as any;
              if (l) {
                pEntry.lightColor = l.color.getHex();
                pEntry.lightIntensity = l.intensity;
              }
            }
            
            data.prefabs.push(pEntry);
          } else if (child.name && child.name.startsWith('prop_')) {
             data.overrides[child.name] = {
                x: child.position.x, y: child.position.y, z: child.position.z,
                rx: child.rotation.x, ry: child.rotation.y, rz: child.rotation.z,
                sx: child.scale.x, sy: child.scale.y, sz: child.scale.z
             };
             if (child.userData.interactionPrompt !== undefined) data.overrides[child.name].interactionPrompt = child.userData.interactionPrompt;
             if (child.userData.flavorText !== undefined) data.overrides[child.name].flavorText = child.userData.flavorText;
          }
        }
        // Dummy if block to satisfy old regex target end
        if (false) {
          const pEntry: any = {
            id: child.userData.prefabId,
            type: child.userData.prefabType,
            transform: {
              x: child.position.x, y: child.position.y, z: child.position.z,
              rx: child.rotation.x, ry: child.rotation.y, rz: child.rotation.z,
              sx: child.scale.x, sy: child.scale.y, sz: child.scale.z
              }
            };
            if (child.userData.modelUrl) {
              pEntry.modelUrl = child.userData.modelUrl;
            }
            if (child.userData.paintingUrl) {
              pEntry.paintingUrl = child.userData.paintingUrl;
            }
          if (child.userData.animType) {
            pEntry.transform.animation = {
              type: child.userData.animType,
              axis: child.userData.animAxis,
              start: child.userData.animStart,
              end: child.userData.animEnd,
              trigger: child.userData.animTrigger,
              duration: child.userData.animDuration
            };
          }
          data.prefabs.push(pEntry);
        }
      });

      // Gather transforms of selected standard objects
      const objs = this.devGizmo.getSelectedObjects();
      if (objs.length === 1 && !objs[0].userData.isPrefab) {
        const obj = objs[0];
        const layoutEntry: any = {
          x: obj.position.x, y: obj.position.y, z: obj.position.z,
          rx: obj.rotation.x, ry: obj.rotation.y, rz: obj.rotation.z,
          sx: obj.scale.x, sy: obj.scale.y, sz: obj.scale.z
        };
        if (obj.userData.animType) {
          layoutEntry.animation = {
            type: obj.userData.animType,
            axis: obj.userData.animAxis,
            start: obj.userData.animStart,
            end: obj.userData.animEnd,
            trigger: obj.userData.animTrigger,
            duration: obj.userData.animDuration
          };
        }
        data[obj.name] = layoutEntry;
      }
      
      const success = await EditorServerSync.saveLayout(data);
      if (success) alert('Saved to room_layout.json');
    });

    // Spawn Prefab (Cards & Dropdown)
    document.querySelectorAll('.dev-btn-spawn-card').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = (e.currentTarget as HTMLElement).dataset.prefab;
        if (type) {
          this.spawnPrefab(type);
        }
      });
    });

    document.getElementById('dev-btn-spawn')?.addEventListener('click', () => {
      const select = document.getElementById('dev-prefab-select') as HTMLSelectElement;
      if (select) {
        this.spawnPrefab(select.value);
      }
    });

    // Delete Selected
    document.getElementById('dev-btn-delete')?.addEventListener('click', () => {
      const objs = this.devGizmo.getSelectedObjects();
      if (objs.length === 0) return;
      
      // Detach gizmo first to prevent errors
      this.devGizmo.detach();
      
      objs.forEach(obj => {
          if (obj.parent) {
            obj.parent.remove(obj);
          }
          // Recursively dispose geometry, materials, and textures
          obj.traverse((child: any) => {
            if (child.isMesh) {
              if (child.geometry) child.geometry.dispose();
              if (child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach((mat: any) => {
                  for (const key in mat) {
                    const value = mat[key];
                    if (value && value.isTexture) {
                      value.dispose();
                    }
                  }
                  mat.dispose();
                });
              }
            }
          });
        });
      
      // Force save to server to persist deletion
      document.getElementById('dev-btn-save-server')?.click();
      
      EventBus.getInstance().emit('editor:rebuild_visualizers', {});
    });

    // Scenario Jump
    document.querySelectorAll('.dev-btn-scenario').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const room = target.dataset.room;
        if (room) {
          this.devGizmo.detach();
          EventBus.getInstance().emit('scenario:switch_room', { targetRoomId: room, isDevJump: true });
        }
      });
    });

    // Visualizer Toggle
    document.getElementById('dev-chk-visualizers')?.addEventListener('change', (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      EventBus.getInstance().emit('editor:toggle_visualizers', { visible: checked });
      });

      document.getElementById('dev-btn-env-save')?.addEventListener('click', () => {
        const fogColor = (document.getElementById('dev-env-fog-color') as HTMLInputElement).value;
        const fogDensity = parseFloat((document.getElementById('dev-env-fog-density') as HTMLInputElement).value);
        const ambColor = (document.getElementById('dev-env-amb-color') as HTMLInputElement).value;
        const ambIntensity = parseFloat((document.getElementById('dev-env-amb-intensity') as HTMLInputElement).value);
        
        // Apply instantly to current scene
        if (this.scene.fog) {
          (this.scene.fog as any).color.set(fogColor);
          (this.scene.fog as any).density = fogDensity;
        }
        
        let ambientLight = this.scene.children.find(c => c.type === 'AmbientLight') as any;
        if (ambientLight) {
          ambientLight.color.set(ambColor);
          ambientLight.intensity = ambIntensity;
        }

        // Save to server
        EventBus.getInstance().emit('editor:save_environment', {
          fogColor, fogDensity, ambColor, ambIntensity
        });
        document.getElementById('dev-btn-save-server')?.click();
        
        this.showToast('Environment updated', 'success');
      });

      document.getElementById('dev-btn-export')?.addEventListener('click', () => {
        const objs = this.devGizmo.getSelectedObjects();
        const obj = objs.length > 0 ? objs[0] : null;
        if (!obj) {
          this.showToast('No object selected to export', 'error');
          return;
        }
        const data = {
          name: obj.name,
          position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
          rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
          scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z }
        };
        const text = JSON.stringify(data, null, 2);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text)
            .then(() => this.showToast('Transform copied to clipboard', 'success'))
            .catch(() => this.showToast('Clipboard access denied', 'error'));
        } else {
          this.showToast('Clipboard API unavailable', 'error');
        }
      });

      document.getElementById('dev-chk-snap')?.addEventListener('change', (e) => {
        const checked = (e.target as HTMLInputElement).checked;
        this.devGizmo.setSnapping(checked);
      });

      // Header Draggable Handle
      const header = document.getElementById('dev-panel-header');
      if (header && this.panelContainer) {
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialLeft = 0;
        let initialTop = 0;
        const panelEl = this.panelContainer;

        header.addEventListener('pointerdown', (e: PointerEvent) => {
          if ((e.target as HTMLElement).id === 'dev-btn-close') return;
          isDragging = true;
          header.style.cursor = 'grabbing';
          const rect = panelEl.getBoundingClientRect();
          startX = e.clientX;
          startY = e.clientY;
          initialLeft = rect.left;
          initialTop = rect.top;
          panelEl.style.right = 'auto';
          panelEl.style.left = `${initialLeft}px`;
          panelEl.style.top = `${initialTop}px`;
          header.setPointerCapture(e.pointerId);
        });

        header.addEventListener('pointermove', (e: PointerEvent) => {
          if (!isDragging) return;
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          const newLeft = Math.max(10, Math.min(window.innerWidth - 480, initialLeft + dx));
          const newTop = Math.max(10, Math.min(window.innerHeight - 100, initialTop + dy));
          panelEl.style.left = `${newLeft}px`;
          panelEl.style.top = `${newTop}px`;
        });

        const stopDrag = (e: PointerEvent) => {
          if (isDragging) {
            isDragging = false;
            header.style.cursor = 'grab';
            try {
              header.releasePointerCapture(e.pointerId);
            } catch (_) {}
          }
        };
        header.addEventListener('pointerup', stopDrag);
        header.addEventListener('pointercancel', stopDrag);
      }

      // Spatial Actions
      document.getElementById('dev-btn-snap-floor')?.addEventListener('click', () => {
        const objs = this.devGizmo.getSelectedObjects();
        if (objs.length === 0) {
          this.showToast('No object selected to snap', 'error');
          return;
        }
        for (const obj of objs) {
          this.snapObjectToFloor(obj);
        }
        this.showToast('Snapped selection to floor (Y=0)', 'success');
      });

      document.getElementById('dev-btn-reset-rot')?.addEventListener('click', () => {
        this.resetSelectedRotation();
      });

      document.getElementById('dev-btn-duplicate')?.addEventListener('click', () => {
        this.duplicateSelected();
      });

      // Telemetry Log Controls
      document.querySelectorAll('.dev-log-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('.dev-log-filter').forEach(b => {
            (b as HTMLElement).style.background = 'transparent';
            (b as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
          });
          const target = e.currentTarget as HTMLElement;
          target.style.background = '#3b4c42';
          target.style.borderColor = '#5a7566';
          this.activeLogFilter = (target.dataset.filter as any) || 'all';
          this.refreshTelemetryLogs();
        });
      });

      document.getElementById('dev-btn-log-copy')?.addEventListener('click', () => {
        const history = Telemetry.getInstance().getHistory();
        const filtered = history.filter(record => {
          if (this.activeLogFilter === 'all') return true;
          return record.level === this.activeLogFilter;
        });
        const text = filtered
          .map(r => `[${new Date(r.timestamp).toLocaleTimeString()}] ${r.level.toUpperCase()}: ${r.message}${r.context ? ` (${r.context})` : ''}`)
          .join('\n');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text)
            .then(() => this.showToast('Logs copied to clipboard', 'success'))
            .catch(() => this.showToast('Failed to copy logs', 'error'));
        }
      });

      document.getElementById('dev-btn-log-clear')?.addEventListener('click', () => {
        const logsEl = document.getElementById('dev-telem-logs');
        if (logsEl) logsEl.innerHTML = '<div style="color: #64748b; font-style: italic;">Log view cleared.</div>';
        this.showToast('Log view cleared', 'info');
      });
  }

  public showToast(msg: string, type: 'success' | 'error' | 'info' = 'info') {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.padding = '8px 16px';
    toast.style.borderRadius = '24px';
    toast.style.fontFamily = 'monospace';
    toast.style.fontSize = '12px';
    toast.style.zIndex = '99999';
    toast.style.color = '#fff';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
    toast.style.transition = 'opacity 0.3s ease';
    toast.innerText = msg;
    
    if (type === 'success') toast.style.background = '#059669';
    if (type === 'error') toast.style.background = '#dc2626';
    if (type === 'info') toast.style.background = '#2563eb';
    
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  private setupDragAndDrop(): void {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (this.panelContainer && this.panelContainer.style.display !== 'none') {
        e.dataTransfer!.dropEffect = 'copy';
      }
    });

    canvas.addEventListener('drop', async (e) => {
      e.preventDefault();
      if (!this.panelContainer || this.panelContainer.style.display === 'none') return;
      
      const file = e.dataTransfer?.files[0];
      if (!file) return;

      const rect = canvas.getBoundingClientRect();
      const mouse = {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1
      };

      const rc = new THREE.Raycaster();
        rc.setFromCamera(mouse as any, this.cameraDirector.camera);
        const intersects = rc.intersectObjects(this.scene.children, true);
        
        let targetPainting = null;
        let dropPoint = intersects.length > 0 ? intersects[0].point : new THREE.Vector3(0,0,0);

        for (const hit of intersects) {
          let curr = hit.object;
          while (curr && curr.parent && curr.name !== 'scene') {
            if (curr.userData && curr.userData.prefabType === 'Painting') {
              targetPainting = curr;
              break;
            }
            curr = curr.parent;
          }
          if (targetPainting) break;
        }

        const isImage = file.type.startsWith('image/');
        const isModel = file.name.endsWith('.glb') || file.name.endsWith('.gltf');
        const type = isModel ? 'models' : 'textures';

        try {
          const res = await fetch(`/api/upload-asset?filename=${encodeURIComponent(file.name)}&type=${type}`, {
            method: 'POST',
            body: file
          });
          const data = await res.json();
          
          if (data.success) {
            this.showToast(`Uploaded: ${file.name}`, 'success');
            
            if (isImage && targetPainting) {
              targetPainting.userData.paintingUrl = data.path;
              const canvasMesh = targetPainting.children[1] as any;
              if (canvasMesh && canvasMesh.material) {
                const loader = new THREE.TextureLoader();
                loader.load(data.path, (texture) => {
                  canvasMesh.material.map = texture;
                  canvasMesh.material.color.setHex(0xffffff);
                  canvasMesh.material.needsUpdate = true;
                });
              }
            } else if (isModel) {
              const newMesh = EditorPrefabs.spawnCustomModel ? EditorPrefabs.spawnCustomModel(data.path, file.name) : EditorPrefabs.spawn('Painting');
              newMesh.position.copy(dropPoint);
              this.scene.add(newMesh);
              this.showToast(`Spawned custom model: ${file.name}`, 'success');
            } else if (isImage && !targetPainting) {
              const newMesh = EditorPrefabs.spawn('Painting');
                  newMesh.position.copy(dropPoint);
                  newMesh.userData.paintingUrl = data.path;
                  const canvasMesh = newMesh.children[1] as any;
                  if (canvasMesh && canvasMesh.material) {
                    const loader = new THREE.TextureLoader();
                    loader.load(data.path, (texture) => {
                      canvasMesh.material.map = texture;
                      canvasMesh.material.color.setHex(0xffffff);
                      canvasMesh.material.needsUpdate = true;
                    });
                  }
                  this.scene.add(newMesh);
            }
            
            document.getElementById('dev-btn-save-server')?.click();
          }
        } catch (err) {
          console.error(err);
          this.showToast('Upload failed', 'error');
        }
    });
  }

  private bindGizmoEvents(): void {
    this.devGizmo.onSelectionChange = (objects: THREE.Object3D[]) => {
      this.isUpdatingFromUI = true;
      const display = document.getElementById('dev-selected-object');
      if (display) {
        if (objects.length === 0) display.innerText = 'None';
        else if (objects.length === 1) display.innerText = objects[0].name || 'Object';
        else display.innerText = `[Multiple: ${objects.length}]`;
      }

      const paintingProps = document.getElementById('dev-painting-props');
        if (paintingProps) {
          if (objects.length === 1 && objects[0].userData && objects[0].userData.prefabType === 'Painting') {
            paintingProps.style.display = 'block';
            const urlInput = document.getElementById('dev-painting-url') as HTMLInputElement;
            urlInput.value = objects[0].userData.paintingUrl || '';
          } else {
            paintingProps.style.display = 'none';
          }
        }

        if (objects.length === 1 && this.posXInput && this.posYInput && this.posZInput) {
          const obj = objects[0];
        this.posXInput.value = obj.position.x.toFixed(3);
        this.posYInput.value = obj.position.y.toFixed(3);
        this.posZInput.value = obj.position.z.toFixed(3);
          const sclXInput = document.getElementById('dev-scl-x') as HTMLInputElement;
          const sclYInput = document.getElementById('dev-scl-y') as HTMLInputElement;
          const sclZInput = document.getElementById('dev-scl-z') as HTMLInputElement;
          if (sclXInput && sclYInput && sclZInput) {
            sclXInput.value = obj.scale.x.toFixed(3);
            sclYInput.value = obj.scale.y.toFixed(3);
            sclZInput.value = obj.scale.z.toFixed(3);
          }

        const rotXInput = document.getElementById('dev-rot-x') as HTMLInputElement;
        const rotYInput = document.getElementById('dev-rot-y') as HTMLInputElement;
        const rotZInput = document.getElementById('dev-rot-z') as HTMLInputElement;
        if (rotXInput && rotYInput && rotZInput) {
          rotXInput.value = (obj.rotation.x * (180 / Math.PI)).toFixed(1);
          rotYInput.value = (obj.rotation.y * (180 / Math.PI)).toFixed(1);
          rotZInput.value = (obj.rotation.z * (180 / Math.PI)).toFixed(1);
          document.getElementById('dev-rot-x-val')!.innerText = `${rotXInput.value}°`;
          document.getElementById('dev-rot-y-val')!.innerText = `${rotYInput.value}°`;
          document.getElementById('dev-rot-z-val')!.innerText = `${rotZInput.value}°`;
        }

        const lorePromptInput = document.getElementById('dev-lore-prompt') as HTMLInputElement;
        const loreFlavorInput = document.getElementById('dev-lore-flavor') as HTMLTextAreaElement;
        if (lorePromptInput) lorePromptInput.value = obj.userData.interactionPrompt || '';
        if (loreFlavorInput) loreFlavorInput.value = obj.userData.flavorText || '';

        const typeSelect = document.getElementById('dev-anim-type') as HTMLSelectElement;
        const axisSelect = document.getElementById('dev-anim-axis') as HTMLSelectElement;
        const startInput = document.getElementById('dev-anim-start') as HTMLInputElement;
        const endInput = document.getElementById('dev-anim-end') as HTMLInputElement;
        const scrubInput = document.getElementById('dev-anim-scrub') as HTMLInputElement;
        const triggerSelect = document.getElementById('dev-anim-trigger') as HTMLSelectElement;
        const durationInput = document.getElementById('dev-anim-duration') as HTMLInputElement;
        
        if (typeSelect && axisSelect && startInput && endInput && scrubInput) {
          if (obj.userData.animType) {
            typeSelect.value = obj.userData.animType;
            axisSelect.value = obj.userData.animAxis || 'y';
            startInput.value = obj.userData.animStart !== undefined ? obj.userData.animStart : 0;
            endInput.value = obj.userData.animEnd !== undefined ? obj.userData.animEnd : 0;
            scrubInput.value = '0';
            if (triggerSelect) triggerSelect.value = obj.userData.animTrigger || 'none';
            if (durationInput) durationInput.value = obj.userData.animDuration || '800';
          } else {
            typeSelect.value = 'rotation';
            axisSelect.value = 'y';
            startInput.value = '0';
            endInput.value = '0';
            scrubInput.value = '0';
            if (triggerSelect) triggerSelect.value = 'none';
            if (durationInput) durationInput.value = '800';
          }
        }
      }
      this.updateSpatialTelemetry(objects.length === 1 ? objects[0] : null);
      this.isUpdatingFromUI = false;
    };

    this.devGizmo.onTransformChange = (objects: THREE.Object3D[]) => {
      objects.forEach(obj => {
        if (!obj.userData) obj.userData = {};
        obj.userData.isModified = true;
      });
      if (this.isUpdatingFromUI) return;
      if (objects.length === 1 && this.posXInput && this.posYInput && this.posZInput) {
        this.isUpdatingFromUI = true;
        const obj = objects[0];
        this.posXInput.value = obj.position.x.toFixed(3);
        this.posYInput.value = obj.position.y.toFixed(3);
        this.posZInput.value = obj.position.z.toFixed(3);
          const sclXInput = document.getElementById('dev-scl-x') as HTMLInputElement;
          const sclYInput = document.getElementById('dev-scl-y') as HTMLInputElement;
          const sclZInput = document.getElementById('dev-scl-z') as HTMLInputElement;
          if (sclXInput && sclYInput && sclZInput) {
            sclXInput.value = obj.scale.x.toFixed(3);
            sclYInput.value = obj.scale.y.toFixed(3);
            sclZInput.value = obj.scale.z.toFixed(3);
          }
        
        const rotXInput = document.getElementById('dev-rot-x') as HTMLInputElement;
        const rotYInput = document.getElementById('dev-rot-y') as HTMLInputElement;
        const rotZInput = document.getElementById('dev-rot-z') as HTMLInputElement;
        if (rotXInput && rotYInput && rotZInput) {
          rotXInput.value = (obj.rotation.x * (180 / Math.PI)).toFixed(1);
          rotYInput.value = (obj.rotation.y * (180 / Math.PI)).toFixed(1);
          rotZInput.value = (obj.rotation.z * (180 / Math.PI)).toFixed(1);
          document.getElementById('dev-rot-x-val')!.innerText = `${rotXInput.value}°`;
          document.getElementById('dev-rot-y-val')!.innerText = `${rotYInput.value}°`;
          document.getElementById('dev-rot-z-val')!.innerText = `${rotZInput.value}°`;
        }
        this.updateSpatialTelemetry(obj);
        this.isUpdatingFromUI = false;
      }
    };
  }

  public show(): void {
    if (!this.panelContainer) return;
    this.panelContainer.style.display = 'block';
    this.isVisible = true;
    this.startTelemetryLoop();
  }

  public hide(): void {
    if (!this.panelContainer || !this.isVisible) return;
    this.panelContainer.style.display = 'none';
    this.isVisible = false;
    this.devGizmo.setEnabled(false);
    this.stopTelemetryLoop();
  }

  public toggle(): void {
    if (this.isVisible) this.hide();
    else this.show();
  }

  public update(): void {
    if (this.isVisible) {
      this.fpsFrames++;
      const now = performance.now();
      if (this.fpsLastFrameTime) {
        this.lastFrameDeltaMs = now - this.fpsLastFrameTime;
      }
      this.fpsLastFrameTime = now;
    }
  }

  private startTelemetryLoop(): void {
    if (this.telemetryInterval) return;
    this.fpsFrames = 0;
    this.fpsLastTime = performance.now();
    
    this.telemetryInterval = window.setInterval(() => {
      // 1. Calculate FPS
      const now = performance.now();
      const delta = (now - this.fpsLastTime) / 1000;
      const fps = delta > 0 ? Math.round(this.fpsFrames / delta) : 0;
      this.fpsFrames = 0;
      this.fpsLastTime = now;

      // 2. Query Renderer Stats
      const draws = this.renderer.info.render.calls;
      const tris = this.renderer.info.render.triangles;
      const geom = this.renderer.info.memory.geometries;
      const tex = this.renderer.info.memory.textures;
      const prog = (this.renderer.info as any).programs?.length ?? 0;

      // 3. Update DOM Metrics
      const fpsEl = document.getElementById('dev-telem-fps');
      if (fpsEl) {
        fpsEl.textContent = fps.toString();
        fpsEl.style.color = fps >= 55 ? '#4ade80' : fps >= 30 ? '#fbbf24' : '#ef4444';
      }
      const fpsBadge = document.getElementById('dev-telem-fps-badge');
      if (fpsBadge) {
        fpsBadge.textContent = fps >= 55 ? 'TARGET: 60 FPS' : fps >= 30 ? 'DEGRADED: 30-54 FPS' : 'CRITICAL: <30 FPS';
        fpsBadge.style.color = fps >= 55 ? '#4ade80' : fps >= 30 ? '#fbbf24' : '#ef4444';
      }

      const deltaEl = document.getElementById('dev-telem-delta');
      if (deltaEl) deltaEl.textContent = this.lastFrameDeltaMs.toFixed(1);

      const drawsEl = document.getElementById('dev-telem-draws');
      if (drawsEl) {
        drawsEl.textContent = draws.toString();
        drawsEl.style.color = draws <= 60 ? '#fbbf24' : '#ef4444';
      }
      const drawsStatus = document.getElementById('dev-telem-draws-status');
      if (drawsStatus) {
        drawsStatus.textContent = draws <= 60 ? 'BUDGET OK' : 'OVER BUDGET';
        drawsStatus.style.color = draws <= 60 ? '#4ade80' : '#ef4444';
      }

      const trisEl = document.getElementById('dev-telem-tris');
      if (trisEl) {
        trisEl.textContent = `${(tris / 1000).toFixed(1)}k`;
        trisEl.style.color = tris <= 120000 ? '#a78bfa' : '#ef4444';
      }

      const geomEl = document.getElementById('dev-telem-geom');
      if (geomEl) geomEl.textContent = geom.toString();

      const texEl = document.getElementById('dev-telem-tex');
      if (texEl) texEl.textContent = tex.toString();

      const progEl = document.getElementById('dev-telem-prog');
      if (progEl) progEl.textContent = prog.toString();

      // 4. Update Error / Diagnostic Logs
      this.refreshTelemetryLogs();
    }, 200); // 5Hz
  }

  public refreshTelemetryLogs(): void {
    const logsEl = document.getElementById('dev-telem-logs');
    if (!logsEl) return;
    const history = Telemetry.getInstance().getHistory();
    const filtered = history.filter(record => {
      if (this.activeLogFilter === 'all') return true;
      return record.level === this.activeLogFilter;
    });
    const recent = filtered.slice(-15);
    if (recent.length === 0) {
      logsEl.innerHTML = '<div style="color: #64748b; font-style: italic;">No log records matching filter.</div>';
    } else {
      logsEl.innerHTML = recent.map(r => {
        const color = r.level === 'error' ? '#f87171' : r.level === 'warn' ? '#fbbf24' : '#38bdf8';
        const time = new Date(r.timestamp).toLocaleTimeString();
        const tag = r.level.toUpperCase();
        return `<div style="color: ${color}; margin-bottom: 2px;">[${time}] ${tag}: ${r.message}${r.context ? ` (${r.context})` : ''}</div>`;
      }).join('');
    }
  }

  public spawnPrefab(type: string): THREE.Group {
    const prefab = EditorPrefabs.spawn(type);
    const dir = new THREE.Vector3();
    this.cameraDirector.camera.getWorldDirection(dir);
    dir.y = 0;
    if (dir.lengthSq() < 0.001) dir.set(0, 0, -1);
    dir.normalize();

    const pos = this.cameraDirector.camera.position.clone().add(dir.multiplyScalar(2.2));
    prefab.position.copy(pos);
    this.scene.add(prefab);

    this.snapObjectToFloor(prefab);
    this.devGizmo.attachMultiple([prefab]);
    EventBus.getInstance().emit('editor:rebuild_visualizers', {});
    this.showToast(`Spawned: ${type}`, 'success');
    return prefab;
  }

  public snapObjectToFloor(obj: THREE.Object3D): void {
    obj.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(obj);
    if (!box.isEmpty()) {
      const deltaY = -box.min.y;
      obj.position.y += deltaY;
      obj.updateWorldMatrix(true, true);
      this.devGizmo.syncTransform();
      this.updateSpatialTelemetry(obj);
      EventBus.getInstance().emit('editor:rebuild_visualizers', {});
    }
  }

  public resetSelectedRotation(): void {
    const objs = this.devGizmo.getSelectedObjects();
    if (objs.length === 0) {
      this.showToast('No object selected to reset rotation', 'error');
      return;
    }
    for (const obj of objs) {
      obj.rotation.set(0, 0, 0);
    }
    this.devGizmo.syncTransform();
    this.updateSpatialTelemetry(objs.length === 1 ? objs[0] : null);
    this.showToast('Rotation reset to (0, 0, 0)', 'info');
  }

  public duplicateSelected(): void {
    const objs = this.devGizmo.getSelectedObjects();
    if (objs.length === 0) {
      this.showToast('No object selected to duplicate', 'error');
      return;
    }
    const clones: THREE.Object3D[] = [];
    for (const obj of objs) {
      const clone = obj.clone(true);
      clone.name = `${obj.name}_copy`;
      clone.position.x += 0.3;
      clone.position.z += 0.3;
      if (obj.parent) {
        obj.parent.add(clone);
      } else {
        this.scene.add(clone);
      }
      clones.push(clone);
    }
    this.devGizmo.attachMultiple(clones);
    EventBus.getInstance().emit('editor:rebuild_visualizers', {});
    this.showToast(`Duplicated ${clones.length} object(s)`, 'success');
  }

  private updateSpatialTelemetry(obj: THREE.Object3D | null): void {
    const nameEl = document.getElementById('dev-spatial-name');
    const boundsEl = document.getElementById('dev-spatial-bounds');
    const posEl = document.getElementById('dev-spatial-pos');
    const pivotEl = document.getElementById('dev-spatial-pivot');
    const groundEl = document.getElementById('dev-spatial-ground');

    if (!obj) {
      if (nameEl) nameEl.textContent = '[No Selection]';
      if (boundsEl) boundsEl.textContent = '--';
      if (posEl) posEl.textContent = '--';
      if (pivotEl) pivotEl.textContent = '--';
      if (groundEl) groundEl.textContent = '--';
      return;
    }

    if (nameEl) nameEl.textContent = obj.name || 'Object';
    if (posEl) posEl.textContent = `${obj.position.x.toFixed(2)}, ${obj.position.y.toFixed(2)}, ${obj.position.z.toFixed(2)}`;

    const localBox = EditorVisualizers.computeObjectLocalBox(obj);
    if (!localBox.isEmpty()) {
      const size = new THREE.Vector3();
      localBox.getSize(size);
      const center = new THREE.Vector3();
      localBox.getCenter(center);

      if (boundsEl) boundsEl.textContent = `${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}m`;
      if (pivotEl) pivotEl.textContent = `dX:${center.x.toFixed(2)} dY:${center.y.toFixed(2)} dZ:${center.z.toFixed(2)}`;

      const worldBox = new THREE.Box3().setFromObject(obj);
      if (groundEl) {
        const minY = worldBox.min.y;
        if (Math.abs(minY) < 0.02) {
          groundEl.innerHTML = `<span style="color: #4ade80;">ON FLOOR (0.00m)</span>`;
        } else if (minY < 0) {
          groundEl.innerHTML = `<span style="color: #f87171;">BELOW FLOOR (${minY.toFixed(2)}m)</span>`;
        } else {
          groundEl.innerHTML = `<span style="color: #fbbf24;">ABOVE FLOOR (+${minY.toFixed(2)}m)</span>`;
        }
      }
    } else {
      if (boundsEl) boundsEl.textContent = 'Empty / Assembly';
      if (pivotEl) pivotEl.textContent = '0.00, 0.00, 0.00';
      if (groundEl) groundEl.textContent = '--';
    }
  }

  private stopTelemetryLoop(): void {
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
      this.telemetryInterval = null;
    }
  }
}







