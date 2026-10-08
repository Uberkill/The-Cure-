import * as THREE from 'three';
import { DevTransformGizmo } from '../interaction/DevTransformGizmo';
import { CameraDirector } from '../rendering/CameraDirector';
import { EditorServerSync } from '../editor/EditorServerSync';
import { EditorPrefabs } from '../editor/EditorPrefabs';


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

  constructor(scene: THREE.Scene, cameraDirector: CameraDirector, devGizmo: DevTransformGizmo, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.cameraDirector = cameraDirector;
    this.devGizmo = devGizmo;
    this.renderer = renderer;

    this.initPanel();
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
      position: fixed; top: 24px; right: 24px; width: 320px; max-height: 90vh; overflow-y: auto;
      background: rgba(16, 22, 18, 0.94); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 6px; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45); font-family: 'JetBrains Mono', monospace;
      font-size: 11px; color: #e2e6e0; padding: 16px; z-index: 10000; display: none; box-sizing: border-box; user-select: none;
    `;

    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
        <span style="font-weight: 600; letter-spacing: 0.08em; color: #bad2c8; text-transform: uppercase;">Room 04 • 3D Editor</span>
        <button id="dev-btn-close" style="background: none; border: none; color: #88928b; cursor: pointer;">✕</button>
      </div>

      <!-- TABS -->
      <div style="display: flex; gap: 4px; margin-bottom: 12px; font-size: 11px;">
        <button class="editor-tab active" data-tab="transforms" style="flex:1; padding: 4px; background: #3b4c42; border: 1px solid #5a7566; color: #fff; cursor: pointer; border-radius: 3px;">Trans</button>
        <button class="editor-tab" data-tab="spawner" style="flex:1; padding: 4px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #88928b; cursor: pointer; border-radius: 3px;">Spawn</button>
        <button class="editor-tab" data-tab="scenarios" style="flex:1; padding: 4px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #88928b; cursor: pointer; border-radius: 3px;">Scen</button>
        <button class="editor-tab" data-tab="telemetry" style="flex:1; padding: 4px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #88928b; cursor: pointer; border-radius: 3px;">Telem</button>
      </div>

      <!-- TAB CONTENT: TRANSFORMS -->
      <div id="tab-transforms" class="editor-tab-content">
        <label style="display: block; margin-bottom: 6px; color: #88928b;">Selected Object(s)</label>
        <div id="dev-selected-object" style="padding: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 3px; margin-bottom: 12px; color: #4ade80;">None</div>

        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Position X</span> <input type="number" id="dev-pos-x" step="0.05" style="width:60px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 2px;"></div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Position Y</span> <input type="number" id="dev-pos-y" step="0.05" style="width:60px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 2px;"></div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Position Z</span> <input type="number" id="dev-pos-z" step="0.05" style="width:60px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 2px;"></div>
        </div>

        <button id="dev-btn-save-server" style="width: 100%; padding: 8px; background: #2f453a; color: #8fcead; border: 1px solid #4ade80; border-radius: 4px; cursor: pointer; margin-bottom: 8px;">Save to Server (room_layout.json)</button>
        <button id="dev-btn-export" style="width: 100%; padding: 8px; background: rgba(255,255,255,0.05); color: #bad2c8; border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; cursor: pointer;">Export Clipboard</button>
      </div>

      <!-- TAB CONTENT: SPAWNER -->
      <div id="tab-spawner" class="editor-tab-content" style="display: none;">
        <label style="display: block; margin-bottom: 6px; color: #88928b;">Spawn Prefab</label>
        <select id="dev-prefab-select" style="width: 100%; padding: 6px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff; margin-bottom: 12px; border-radius: 3px;">
          <option value="Painting">Painting</option>
          <option value="Plant">Potted Plant</option>
          <option value="Clock">Wall Clock</option>
        </select>
        <button id="dev-btn-spawn" style="width: 100%; padding: 8px; background: #3b4c42; color: #fff; border: 1px solid #5a7566; border-radius: 4px; cursor: pointer;">Spawn Prefab</button>
      </div>

      <!-- TAB CONTENT: SCENARIOS -->
      <div id="tab-scenarios" class="editor-tab-content" style="display: none;">
        <label style="display: block; margin-bottom: 6px; color: #88928b;">Jump Scenario</label>
        <button class="dev-btn-scenario" data-room="room_04" style="width: 100%; padding: 6px; background: rgba(0,0,0,0.5); color: #bad2c8; border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; margin-bottom: 6px; cursor: pointer;">Hub (Room 04)</button>
        <button class="dev-btn-scenario" data-room="sleep_ward" style="width: 100%; padding: 6px; background: rgba(0,0,0,0.5); color: #bad2c8; border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; margin-bottom: 6px; cursor: pointer;">Sleep Ward (Act II)</button>
        <button class="dev-btn-scenario" data-room="hydrotherapy" style="width: 100%; padding: 6px; background: rgba(0,0,0,0.5); color: #bad2c8; border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; margin-bottom: 6px; cursor: pointer;">Hydrotherapy (Act III)</button>
        <button class="dev-btn-scenario" data-room="audiology" style="width: 100%; padding: 6px; background: rgba(0,0,0,0.5); color: #bad2c8; border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; margin-bottom: 6px; cursor: pointer;">Audiology (Act IV)</button>
      </div>

      <!-- TAB CONTENT: TELEMETRY -->
      <div id="tab-telemetry" class="editor-tab-content" style="display: none; font-family: monospace; font-size: 11px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 8px;">
          <div style="background: rgba(0,0,0,0.3); padding: 4px; border: 1px solid rgba(255,255,255,0.1);">FPS <div id="dev-telem-fps" style="color: #4ade80; font-size: 14px;">0</div></div>
          <div style="background: rgba(0,0,0,0.3); padding: 4px; border: 1px solid rgba(255,255,255,0.1);">Draws <div id="dev-telem-draws" style="color: #60a5fa; font-size: 14px;">0</div></div>
          <div style="background: rgba(0,0,0,0.3); padding: 4px; border: 1px solid rgba(255,255,255,0.1);">Tris <div id="dev-telem-tris" style="color: #fbbf24; font-size: 14px;">0</div></div>
          <div style="background: rgba(0,0,0,0.3); padding: 4px; border: 1px solid rgba(255,255,255,0.1);">Geom <div id="dev-telem-geom" style="color: #a78bfa; font-size: 14px;">0</div></div>
        </div>
        <label style="display: block; margin-bottom: 4px; color: #88928b;">Recent Error Logs</label>
        <textarea id="dev-telem-logs" readonly style="width: 100%; height: 120px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #ef4444; font-size: 10px; resize: none;"></textarea>
      </div>
    `;

    document.body.appendChild(panel);
    this.panelContainer = panel;

    this.posXInput = document.getElementById('dev-pos-x') as HTMLInputElement;
    this.posYInput = document.getElementById('dev-pos-y') as HTMLInputElement;
    this.posZInput = document.getElementById('dev-pos-z') as HTMLInputElement;

    const applyTransform = () => {
      if (this.isUpdatingFromUI) return;
      const objs = this.devGizmo.getSelectedObjects();
      if (objs.length === 1 && this.posXInput && this.posYInput && this.posZInput) {
        objs[0].position.set(
          parseFloat(this.posXInput.value),
          parseFloat(this.posYInput.value),
          parseFloat(this.posZInput.value)
        );
        this.devGizmo.syncTransform();
      }
    };
    
    this.posXInput?.addEventListener('input', applyTransform);
    this.posYInput?.addEventListener('input', applyTransform);
    this.posZInput?.addEventListener('input', applyTransform);

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

    // Save to Server
    document.getElementById('dev-btn-save-server')?.addEventListener('click', async () => {
      const data: any = { prefabs: [] };
      // Gather transforms of selected object
      const objs = this.devGizmo.getSelectedObjects();
      if (objs.length === 1) {
        const obj = objs[0];
        if (obj.userData.isPrefab) {
          data.prefabs.push({
            id: obj.userData.prefabId,
            type: obj.userData.prefabType,
            transform: {
              x: obj.position.x, y: obj.position.y, z: obj.position.z,
              rx: obj.rotation.x, ry: obj.rotation.y, rz: obj.rotation.z,
              sx: obj.scale.x, sy: obj.scale.y, sz: obj.scale.z
            }
          });
        } else {
          data[obj.name] = {
            x: obj.position.x, y: obj.position.y, z: obj.position.z,
            rx: obj.rotation.x, ry: obj.rotation.y, rz: obj.rotation.z,
            sx: obj.scale.x, sy: obj.scale.y, sz: obj.scale.z
          };
        }
      }
      const success = await EditorServerSync.saveLayout(data);
      if (success) alert('Saved to room_layout.json');
    });

    // Spawn Prefab
    document.getElementById('dev-btn-spawn')?.addEventListener('click', () => {
      const select = document.getElementById('dev-prefab-select') as HTMLSelectElement;
      const type = select.value;
      const prefab = EditorPrefabs.spawn(type);
      
      // Place in front of camera
      const dir = new THREE.Vector3();
      this.cameraDirector.camera.getWorldDirection(dir);
      const pos = this.cameraDirector.camera.position.clone().add(dir.multiplyScalar(2));
      prefab.position.copy(pos);
      
      this.scene.add(prefab);
      this.devGizmo.attachMultiple([prefab]);
      
      import('../core/EventBus').then(({ EventBus }) => {
        EventBus.getInstance().emit('editor:rebuild_visualizers', {});
      });
    });

    // Scenario Jump
    document.querySelectorAll('.dev-btn-scenario').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const room = target.dataset.room;
        if (room) {
          this.devGizmo.detach();
          import('../core/EventBus').then(({ EventBus }) => {
            EventBus.getInstance().emit('scenario:switch_room', { targetRoomId: room });
          });
        }
      });
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

      if (objects.length === 1 && this.posXInput && this.posYInput && this.posZInput) {
        const obj = objects[0];
        this.posXInput.value = obj.position.x.toFixed(3);
        this.posYInput.value = obj.position.y.toFixed(3);
        this.posZInput.value = obj.position.z.toFixed(3);
      }
      this.isUpdatingFromUI = false;
    };

    this.devGizmo.onTransformChange = (objects: THREE.Object3D[]) => {
      if (this.isUpdatingFromUI) return;
      if (objects.length === 1 && this.posXInput && this.posYInput && this.posZInput) {
        this.isUpdatingFromUI = true;
        const obj = objects[0];
        this.posXInput.value = obj.position.x.toFixed(3);
        this.posYInput.value = obj.position.y.toFixed(3);
        this.posZInput.value = obj.position.z.toFixed(3);
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
      // Note: Telemetry DOM update is handled by the 5Hz setInterval to avoid re-render lag
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
      const fps = Math.round(this.fpsFrames / delta);
      this.fpsFrames = 0;
      this.fpsLastTime = now;

      // 2. Query Renderer Stats
      const draws = this.renderer.info.render.calls;
      const tris = this.renderer.info.render.triangles;
      const geom = this.renderer.info.memory.geometries;

      // 3. Update DOM
      const fpsEl = document.getElementById('dev-telem-fps');
      if (fpsEl) fpsEl.textContent = fps.toString();
      
      const drawsEl = document.getElementById('dev-telem-draws');
      if (drawsEl) drawsEl.textContent = draws.toString();
      
      const trisEl = document.getElementById('dev-telem-tris');
      if (trisEl) trisEl.textContent = tris.toString();
      
      const geomEl = document.getElementById('dev-telem-geom');
      if (geomEl) geomEl.textContent = geom.toString();

      // 4. Update Error Logs (Copyable)
      // We read from the Telemetry singleton's buffer
      const logsEl = document.getElementById('dev-telem-logs') as HTMLTextAreaElement;
      if (logsEl) {
        // @ts-ignore - reaching into Telemetry singleton safely
        const buffer = window.__telemetryHistory || [];
        logsEl.value = buffer
          .filter((l: any) => l.level === 'error' || l.level === 'warn')
          .slice(-10)
          .map((l: any) => `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.level.toUpperCase()}: ${l.message}`)
          .join('\n');
      }
    }, 200); // 5Hz
  }

  private stopTelemetryLoop(): void {
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
      this.telemetryInterval = null;
    }
  }
}
