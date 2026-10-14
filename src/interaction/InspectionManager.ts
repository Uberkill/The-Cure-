import * as THREE from 'three';
import { EventBus } from '../core/EventBus';
import { AudioEngine } from '../audio/AudioEngine';
import { GameState } from '../core/GameState';

export class InspectionManager {
  public inspectScene: THREE.Scene;
  public inspectCamera: THREE.PerspectiveCamera;
  private inspectGroup: THREE.Group;
  private keyPins: THREE.Mesh[] = [];
  private isPinsExtended: boolean = false;
  private isActive: boolean = false;
  private isDragging: boolean = false;
  private prevMouseX: number = 0;
  private prevMouseY: number = 0;
  private eventBus: EventBus;
  private audioEngine: AudioEngine;
  private raycaster: THREE.Raycaster;
  private mouseNorm: THREE.Vector2;

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.audioEngine = AudioEngine.getInstance();
    this.raycaster = new THREE.Raycaster();
    this.mouseNorm = new THREE.Vector2();

    this.inspectScene = new THREE.Scene();
    this.inspectCamera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 10);
    this.inspectCamera.position.set(0, 0, 1.8);

    // Subtle lighting for inspection
    const light1 = new THREE.DirectionalLight(0xfff6ea, 2.5);
    light1.position.set(1.5, 2, 2);
    this.inspectScene.add(light1);

    const light2 = new THREE.DirectionalLight(0xdbe6e0, 1.2);
    light2.position.set(-2, -1, 1);
    this.inspectScene.add(light2);

    const amb = new THREE.AmbientLight(0xd8dfd8, 0.8);
    this.inspectScene.add(amb);

    // Dark scrim backdrop plane to dim the background room without CSS blur
    const scrim = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.MeshBasicMaterial({
        color: 0xebefeb,
        transparent: false,
        opacity: 1.0
      })
    );
    scrim.position.z = -0.6;
    this.inspectScene.add(scrim);

    this.inspectGroup = new THREE.Group();
    this.inspectScene.add(this.inspectGroup);

    this.buildHighResKey();
    this.setupListeners();
    this.setupResize();
  }

  private buildHighResKey(): void {
    this.keyPins = [];
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xc28833,
      roughness: 0.22,
      metalness: 0.88
    });

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xd4d8db,
      roughness: 0.18,
      metalness: 0.92
    });

    // Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.6, 32), brassMat);
    barrel.rotation.z = Math.PI / 2;
    barrel.userData.isLocalClone = true;
    this.inspectGroup.add(barrel);

    // Ornate Bauhaus Handle Ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.032, 16, 48), brassMat);
    ring.position.x = -0.32;
    ring.userData.isLocalClone = true;
    this.inspectGroup.add(ring);

    // Tension Notch / Slider on barrel
    const slider = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.04), steelMat);
    slider.position.set(0.05, 0.065, 0);
    slider.name = 'slider_pin';
    slider.userData.isLocalClone = true;
    this.inspectGroup.add(slider);

    // Extendable Keypins
    const pinGeo = new THREE.BoxGeometry(0.035, 0.08, 0.035);
    const pin1 = new THREE.Mesh(pinGeo, brassMat);
    pin1.position.set(0.14, 0.05, 0);
    pin1.name = 'cipher_pin';
    pin1.userData.isLocalClone = true;
    this.inspectGroup.add(pin1);
    this.keyPins.push(pin1);

    const pin2 = new THREE.Mesh(pinGeo, brassMat);
    pin2.position.set(0.22, 0.06, 0);
    pin2.name = 'cipher_pin';
    pin2.userData.isLocalClone = true;
    this.inspectGroup.add(pin2);
    this.keyPins.push(pin2);

    const pin3 = new THREE.Mesh(pinGeo, brassMat);
    pin3.position.set(0.28, 0.04, 0);
    pin3.name = 'cipher_pin';
    pin3.userData.isLocalClone = true;
    this.inspectGroup.add(pin3);
    this.keyPins.push(pin3);
  }

  private setupListeners(): void {
    let downX = 0;
    let downY = 0;
    let downTime = 0;

    window.addEventListener('pointerdown', (e) => {
      if (!this.isActive || !e.isPrimary) return;
      this.isDragging = true;
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;
      downX = e.clientX;
      downY = e.clientY;
      downTime = performance.now();
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isActive || !this.isDragging || !e.isPrimary) return;
      const dx = e.clientX - this.prevMouseX;
      const dy = e.clientY - this.prevMouseY;

      this.inspectGroup.rotation.y += dx * 0.008;
      this.inspectGroup.rotation.x += dy * 0.008;

      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;
    });

    window.addEventListener('pointerup', (e) => {
      if (!this.isActive || !e.isPrimary) return;
      this.isDragging = false;

      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      const elapsed = performance.now() - downTime;
      const slopThreshold = e.pointerType === 'touch' ? 14 : 6;

      if (dist < slopThreshold && elapsed < 500) {
        this.mouseNorm.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouseNorm.y = -(e.clientY / window.innerHeight) * 2 + 1;
        this.checkPinClick();
      }
    });

    window.addEventListener('pointercancel', () => {
      this.isDragging = false;
    });

    this.eventBus.on('inspect:open', ({ targetMesh }) => {
      this.isActive = true;
      this.inspectGroup.rotation.set(0.2, -0.4, 0);
      
      // Clear previous inspect group children
      while (this.inspectGroup.children.length > 0) {
        const child = this.inspectGroup.children[0];
        this.inspectGroup.remove(child);
      }
      
      if (targetMesh && targetMesh.clone) {
        const cloned = targetMesh.clone();
        
        // Hide child meshes if they are already in the player's inventory
        const gs = GameState.getInstance();
        cloned.traverse((child) => {
          if (child.name && gs.hasItem(child.name)) {
            child.visible = false;
          }
        });
        // Center and scale to fit view
        const box = new THREE.Box3().setFromObject(cloned);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 0.5 / maxDim;
        cloned.scale.setScalar(scale);
        cloned.position.sub(center.multiplyScalar(scale));
        cloned.userData.isLocalClone = true;
    this.inspectGroup.add(cloned);
        this.keyPins = []; // Not applicable for generic meshes
      } else {
        this.buildHighResKey();
      }
    });

    this.eventBus.on('inspect:close', () => {
      this.isActive = false;
    });
  }

  private checkPinClick(): void {
    this.raycaster.setFromCamera(this.mouseNorm, this.inspectCamera);
    const hits = this.raycaster.intersectObjects(this.inspectGroup.children, true);

    if (hits.length > 0) {
      const hitName = hits[0].object.name;
      if (hitName === 'slider_pin' || hitName === 'cipher_pin') {
        this.togglePins();
      }
    }
  }

  public togglePins(): void {
    this.isPinsExtended = !this.isPinsExtended;

    for (const pin of this.keyPins) {
      if (pin.userData.baseY === undefined) {
        pin.userData.baseY = pin.position.y;
      }
      pin.position.y = pin.userData.baseY + (this.isPinsExtended ? 0.05 : 0);
    }

    this.audioEngine.playTumblerClick();

    if (this.isPinsExtended) {
      this.eventBus.emit('puzzle:key_aligned', { pinExtended: true });
      this.eventBus.emit('ui:subtitle_changed', {
        text: 'The cipher pins click outward. The key is now mechanically aligned.'
      });
    }
  }

  public getPinExtended(): boolean {
    return this.isPinsExtended;
  }

  public getPinCount(): number {
    return this.keyPins.length;
  }

  public getPinOffsets(): number[] {
    return this.keyPins.map((p) => p.position.y);
  }

  private setupResize(): void {
    window.addEventListener('resize', () => {
      this.inspectCamera.aspect = window.innerWidth / window.innerHeight;
      this.inspectCamera.updateProjectionMatrix();
    });
  }

  public render(renderer: THREE.WebGLRenderer): void {
    if (!this.isActive) return;

    if (!this.isDragging) {
      this.inspectGroup.rotation.y += 0.003;
      this.inspectGroup.position.y = Math.sin(performance.now() * 0.0015) * 0.02;
    }

    const prevAutoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(this.inspectScene, this.inspectCamera);
    renderer.autoClear = prevAutoClear;
  }

  public isInspectionActive(): boolean {
    return this.isActive;
  }
}
