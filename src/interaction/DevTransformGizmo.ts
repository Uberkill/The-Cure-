import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RaycastManager } from './RaycastManager';
import { Telemetry } from '../core/Telemetry';

export class DevTransformGizmo {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private orbitControls: OrbitControls;
  private raycastManager: RaycastManager;
  private telemetry: Telemetry;

  private transformControls: TransformControls;
  private helper: THREE.Object3D;
  private isEnabled: boolean = false;
  private selectedObject: THREE.Object3D | null = null;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();

  private keyListener: (e: KeyboardEvent) => void;
  private pointerListener: (e: PointerEvent) => void;

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    domElement: HTMLElement,
    orbitControls: OrbitControls,
    raycastManager: RaycastManager
  ) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.orbitControls = orbitControls;
    this.raycastManager = raycastManager;
    this.telemetry = Telemetry.getInstance();

    this.transformControls = new TransformControls(this.camera, this.domElement);
    this.transformControls.size = 0.75;
    this.transformControls.enabled = false;
    this.helper = this.transformControls.getHelper();
    this.helper.visible = false;
    this.scene.add(this.helper);

    // Disables OrbitControls and Raycasting while dragging gizmo handles
    this.transformControls.addEventListener('dragging-changed', (event) => {
      const isDragging = !!event.value;
      this.orbitControls.enabled = !isDragging;
      this.raycastManager.setEnabled(!isDragging && !this.isEnabled);

      if (!isDragging && this.selectedObject) {
        this.logTransform(this.selectedObject);
      }
    });

    this.keyListener = this.handleKeyDown.bind(this);
    this.pointerListener = this.handlePointerDown.bind(this);

    window.addEventListener('keydown', this.keyListener);
    this.domElement.addEventListener('pointerdown', this.pointerListener);
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.transformControls.enabled = enabled;
    this.helper.visible = enabled;

    // Guard raycasting while Dev Transform mode is active
    this.raycastManager.setEnabled(!enabled);

    if (!enabled && this.selectedObject) {
      this.detach();
    }

    const statusText = enabled ? 'ENABLED (Press W: Move, E: Rotate, R: Scale, Esc: Deselect)' : 'DISABLED';
    this.telemetry.record('info', `[DevTransformGizmo] Mode ${statusText}`);
    this.showToast(`3D Dev Gizmo ${statusText}`);
  }

  public toggle(): boolean {
    this.setEnabled(!this.isEnabled);
    return this.isEnabled;
  }

  public attach(object: THREE.Object3D): void {
    this.selectedObject = object;
    this.transformControls.attach(object);
    this.telemetry.record('info', `[DevTransformGizmo] Attached to ${object.name || 'unnamed object'}`);
    this.logTransform(object);
  }

  public detach(): void {
    this.selectedObject = null;
    this.transformControls.detach();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Input guard: ignore hotkeys if typing in input, textarea, or contentEditable
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)) {
      return;
    }

    if (e.key === 'g' || e.key === 'G') {
      this.toggle();
      return;
    }

    if (!this.isEnabled) return;

    if (e.key === 'w' || e.key === 'W') {
      this.transformControls.setMode('translate');
      this.showToast('Gizmo Mode: Translate (Move)');
    } else if (e.key === 'e' || e.key === 'E') {
      this.transformControls.setMode('rotate');
      this.showToast('Gizmo Mode: Rotate');
    } else if (e.key === 'r' || e.key === 'R') {
      this.transformControls.setMode('scale');
      this.showToast('Gizmo Mode: Scale');
    } else if (e.key === 'Escape') {
      this.detach();
      this.showToast('Deselected object');
    }
  }

  private handlePointerDown(e: PointerEvent): void {
    if (!this.isEnabled) return;

    // If clicking directly on a gizmo handle, let TransformControls handle it
    if (this.transformControls.dragging) return;

    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    for (const hit of intersects) {
      let target: THREE.Object3D | null = hit.object;

      // Climb to top-level named prop group
      while (target && target.parent && target.parent !== this.scene) {
        if (target.name && target.name.startsWith('prop_')) {
          break;
        }
        target = target.parent;
      }

      if (target && target.name && target.name.startsWith('prop_')) {
        this.attach(target);
        return;
      }
    }
  }

  private logTransform(object: THREE.Object3D): void {
    const p = object.position;
    const r = object.rotation;
    const s = object.scale;
    const info = `[Transform] ${object.name}: pos=[${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)}] rot=[${r.x.toFixed(3)}, ${r.y.toFixed(3)}, ${r.z.toFixed(3)}] scale=[${s.x.toFixed(3)}, ${s.y.toFixed(3)}, ${s.z.toFixed(3)}]`;
    console.log(info);
    this.showToast(`${object.name}: [${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}]`);
  }

  private showToast(message: string): void {
    let toast = document.getElementById('gizmo-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'gizmo-toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.right = '24px';
      toast.style.background = 'rgba(20, 26, 33, 0.88)';
      toast.style.color = '#e2e6e0';
      toast.style.fontFamily = 'monospace';
      toast.style.fontSize = '12px';
      toast.style.padding = '8px 14px';
      toast.style.borderRadius = '4px';
      toast.style.border = '1px solid rgba(255, 255, 255, 0.15)';
      toast.style.zIndex = '99999';
      toast.style.pointerEvents = 'none';
      toast.style.transition = 'opacity 0.25s ease';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    window.clearTimeout((this as unknown as { _toastTimer?: number })._toastTimer);
    (this as unknown as { _toastTimer?: number })._toastTimer = window.setTimeout(() => {
      if (toast) toast.style.opacity = '0';
    }, 2800);
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.keyListener);
    this.domElement.removeEventListener('pointerdown', this.pointerListener);
    this.transformControls.dispose();
    this.scene.remove(this.helper);
  }
}
