import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RaycastManager } from './RaycastManager';

export class DevTransformGizmo {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private orbitControls: OrbitControls;
  private raycastManager: RaycastManager;

  private transformControls: TransformControls;
  private helper: THREE.Object3D;
  private isEnabled: boolean = false;
  private selectedObjects: THREE.Object3D[] = [];
  private dummyPivot: THREE.Group = new THREE.Group();
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();

  private pivotStartPos = new THREE.Vector3();
  private pivotStartQuat = new THREE.Quaternion();
  private pivotStartScale = new THREE.Vector3();
  private objectStartStates: Map<THREE.Object3D, { pos: THREE.Vector3, quat: THREE.Quaternion, scale: THREE.Vector3 }> = new Map();

  public onTransformChange?: (objects: THREE.Object3D[]) => void;
  public onSelectionChange?: (objects: THREE.Object3D[]) => void;
  public onToggle?: (enabled: boolean) => void;

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

    this.scene.add(this.dummyPivot);

    this.transformControls = new TransformControls(this.camera, this.domElement);
    this.transformControls.size = 0.75;
    this.transformControls.enabled = false;
    this.helper = this.transformControls.getHelper();
    this.helper.visible = false;
    this.scene.add(this.helper);

    // Apply delta transforms to all selected objects
    this.transformControls.addEventListener('objectChange', () => {
      if (this.selectedObjects.length > 0) {
        
        // Calculate deltas from the dummy pivot's movement
        const deltaQuat = this.dummyPivot.quaternion.clone().multiply(this.pivotStartQuat.clone().invert());
        const deltaScale = this.dummyPivot.scale.clone().divide(this.pivotStartScale);

        for (const obj of this.selectedObjects) {
          const state = this.objectStartStates.get(obj);
          if (state) {
            // Apply scale (assuming local)
            obj.scale.copy(state.scale).multiply(deltaScale);
            
            // Apply rotation
            obj.quaternion.copy(deltaQuat).multiply(state.quat);
            
            // Apply translation (orbiting around pivot)
            const offset = state.pos.clone().sub(this.pivotStartPos);
            offset.applyQuaternion(deltaQuat);
            obj.position.copy(this.dummyPivot.position).add(offset);
          }
        }
        
        if (this.onTransformChange) {
          this.onTransformChange(this.selectedObjects);
        }
      }
    });

    this.transformControls.addEventListener('dragging-changed', (event) => {
      const isDragging = !!event.value;
      this.orbitControls.enabled = !isDragging;
      this.raycastManager.setEnabled(!isDragging && !this.isEnabled);

      if (!isDragging && this.selectedObjects.length > 0) {
        if (this.onTransformChange) {
          this.onTransformChange(this.selectedObjects);
        }
        // Update start states for next drag
        this.cacheStartStates();
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

    this.raycastManager.setEnabled(!enabled);

    if (!enabled && this.selectedObjects.length > 0) {
      this.detach();
    }

    if (this.onToggle) {
      this.onToggle(enabled);
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.isEnabled);
    return this.isEnabled;
  }

  public attachMultiple(objects: THREE.Object3D[]): void {
    if (objects.length === 0) {
      this.detach();
      return;
    }

    this.selectedObjects = [...objects];
    
    // Calculate bounding box center of all selected objects
    const box = new THREE.Box3();
    for (const obj of objects) {
      box.expandByObject(obj);
    }
    
    const center = new THREE.Vector3();
    if (!box.isEmpty()) {
      box.getCenter(center);
    }
    
    this.dummyPivot.position.copy(center);
    this.dummyPivot.quaternion.identity();
    this.dummyPivot.scale.set(1, 1, 1);
    
    this.cacheStartStates();
    
    this.transformControls.attach(this.dummyPivot);

    if (this.onSelectionChange) {
      this.onSelectionChange(this.selectedObjects);
    }
  }

  private cacheStartStates(): void {
    this.pivotStartPos.copy(this.dummyPivot.position);
    this.pivotStartQuat.copy(this.dummyPivot.quaternion);
    this.pivotStartScale.copy(this.dummyPivot.scale);
    
    this.objectStartStates.clear();
    for (const obj of this.selectedObjects) {
      this.objectStartStates.set(obj, {
        pos: obj.position.clone(),
        quat: obj.quaternion.clone(),
        scale: obj.scale.clone()
      });
    }
  }

  public detach(): void {
    this.transformControls.detach();
    this.selectedObjects = [];
    this.objectStartStates.clear();
    if (this.onSelectionChange) {
      this.onSelectionChange([]);
    }
  }

  public setMode(mode: 'translate' | 'rotate' | 'scale'): void {
    this.transformControls.setMode(mode);
  }

  public getMode(): string {
    return this.transformControls.getMode();
  }

  public getSelectedObjects(): THREE.Object3D[] {
    return this.selectedObjects;
  }

  public syncTransform(): void {
    if (this.selectedObjects.length > 0) {
      this.selectedObjects[0].updateMatrixWorld(true);
    }
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
      this.setMode('translate');
      this.showToast('Gizmo Mode: Translate (Move)');
    } else if (e.key === 'e' || e.key === 'E') {
      this.setMode('rotate');
      this.showToast('Gizmo Mode: Rotate');
    } else if (e.key === 'r' || e.key === 'R') {
      this.setMode('scale');
      this.showToast('Gizmo Mode: Scale');
    } else if (e.key === 'Escape') {
      this.detach();
      this.showToast('Deselected object');
    }
  }

  private handlePointerDown(e: PointerEvent): void {
    if (!this.isEnabled) return;
    if (this.transformControls.dragging) return;

    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    for (const hit of intersects) {
      let target: THREE.Object3D | null = hit.object;
      
      // Ignore helpers
      if (target.name === 'Editor_Helpers_Group' || target.userData.isHelper) continue;

      while (target && target.parent && target.parent !== this.scene) {
        if (target.userData.isPrefab || target.name.startsWith('prop_') || target.name.startsWith('door_') || target.name === 'faceplate' || target.name === 'rotaryDial' || target.name === 'knifeSwitch') {
          break;
        }
        target = target.parent;
      }

      if (target && target.name && target.name !== 'Room04_Root') {
        if (e.shiftKey) {
          const current = [...this.selectedObjects];
          if (!current.includes(target)) {
            current.push(target);
            this.attachMultiple(current);
          } else {
            this.attachMultiple(current.filter(o => o !== target));
          }
        } else {
          this.attachMultiple([target]);
        }
        return;
      }
    }
    
    // If clicked empty space without shift, deselect
    if (!e.shiftKey) {
      this.detach();
    }
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
