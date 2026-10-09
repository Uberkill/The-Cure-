import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EventBus } from '../core/EventBus';
import { CameraPreset } from '../types';

export class CameraDirector {
  public camera: THREE.PerspectiveCamera;
  public controls: OrbitControls;
  private eventBus: EventBus;

  private isTransitioning: boolean = false;
  private isUserOrbiting: boolean = false;
  private mouseNorm: THREE.Vector2 = new THREE.Vector2(0, 0);



  private parallaxEnabled: boolean = true;
  private parallaxSensitivity: number = 0.18;

  constructor(domElement: HTMLElement) {
    this.eventBus = EventBus.getInstance();

    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(4.2, 2.6, 4.4);

    this.controls = new OrbitControls(this.camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 0.85, 0);

    this.controls.minPolarAngle = 0.1; // Loosened from Math.PI/6 to prevent twisting on steep presets (e.g. envelope)
    this.controls.maxPolarAngle = Math.PI / 2.08;
    this.controls.minDistance = 0.5; // Loosened from 1.2 to prevent bounding-back on closeups (e.g. telephone)
    this.controls.maxDistance = 8.0;

    this.controls.addEventListener('start', () => {
      this.isUserOrbiting = true;
    });

    this.controls.addEventListener('end', () => {
      this.isUserOrbiting = false;


    });

    this.setupListeners();
    this.setupMouseParallax();
    this.setupResizeListener();
  }

  private setupListeners(): void {
    this.eventBus.on('camera:move_to_hotspot', (payload: any) => {
      this.moveToHotspot(payload.hotspotId, payload.durationMs);
    });

    this.eventBus.on('inspect:open', () => {
      this.controls.enabled = false;
    });

    this.eventBus.on('inspect:close', () => {
      this.controls.enabled = true;


    });

    this.eventBus.on('ui:modal_opened', () => {
      this.controls.enabled = false;
    });

    this.eventBus.on('ui:modal_closed', () => {
      this.controls.enabled = true;


    });

    this.eventBus.on('settings:updated', (settings) => {
      if (settings.mouseParallax !== undefined) {
        this.parallaxEnabled = settings.mouseParallax;
      }
      if (settings.parallaxSensitivity !== undefined) {
        this.parallaxSensitivity = settings.parallaxSensitivity;
      }
    });
  }

  private setupMouseParallax(): void {
    window.addEventListener('mousemove', (e) => {
      this.mouseNorm.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseNorm.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
  }

  private setupResizeListener(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  public resetForScenario(preset: CameraPreset): void {
    this.isTransitioning = false;
    this.controls.enabled = true;


    this.camera.position.copy(preset.position);
    this.controls.target.copy(preset.target);
    this.controls.update();
  }

  public moveToPreset(preset: CameraPreset, durationMs: number = 1000): void {
    if (this.isTransitioning) return;
    
    const startPos = this.camera.position.clone();
    const endPos = preset.position.clone();
    const startTarget = this.controls.target.clone();
    const endTarget = preset.target.clone();

    // Skip transition if already at the preset
    if (startPos.distanceTo(endPos) < 0.05 && startTarget.distanceTo(endTarget) < 0.05) {
      this.isTransitioning = false;
      return;
    }

    this.isTransitioning = true;
    this.controls.enabled = false;
    this.eventBus.emit('camera:transition_start', {});




    if (durationMs === 0) {
      this.camera.position.copy(endPos);
      this.controls.target.copy(endTarget);
      this.controls.enabled = true;
      this.controls.update();
      this.isTransitioning = false;
      this.eventBus.emit('camera:transition_end', {});
      return;
    }

    const startTime = performance.now();

    const step = () => {
      const now = performance.now();
      const progress = Math.min(1, (now - startTime) / durationMs);
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      this.camera.position.lerpVectors(startPos, endPos, ease);
      this.controls.target.lerpVectors(startTarget, endTarget, ease);
      this.camera.lookAt(this.controls.target);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        this.camera.position.copy(endPos);
        this.controls.target.copy(endTarget);
        this.controls.enabled = true; // Must be true BEFORE update() so it doesn't return early!
        this.controls.update(); // Sync OrbitControls internal spherical state to prevent jerking
        this.isTransitioning = false;
        this.eventBus.emit('camera:transition_end', {});
      }
    };

    requestAnimationFrame(step);
  }

  public moveToHotspot(hotspotId: string, durationMs?: number): void {
    const presets: Record<string, CameraPreset> = {
      overview: {
        name: 'overview',
        position: new THREE.Vector3(4.2, 2.6, 4.4),
        target: new THREE.Vector3(0, 0.85, 0)
      },
      ceiling: {
        name: 'ceiling',
        position: new THREE.Vector3(1.0, 1.8, 1.0),
        target: new THREE.Vector3(1.0, 5.0, 1.0)
      },
      dossier_intro: {
        name: 'dossier_intro',
        position: new THREE.Vector3(1.0, 1.8, 1.0),
        target: new THREE.Vector3(1.2, 0.9, 0.2)
      },
      vault: {
        name: 'vault',
        position: new THREE.Vector3(0, 1.45, 2.1),
        target: new THREE.Vector3(0, 1.4, 0)
      },
      telephone: {
        name: 'telephone',
        position: new THREE.Vector3(1.1, 1.6, 1.3),
        target: new THREE.Vector3(1.1, 1.05, 0.48)
      },
      envelope: {
        name: 'envelope',
        position: new THREE.Vector3(-1.1, 2.1, 0.4),
        target: new THREE.Vector3(-1.1, 1.0, 0.2)
      },
      door: {
        name: 'door',
        position: new THREE.Vector3(-3.2, 1.8, -3.0),
        target: new THREE.Vector3(-6.75, 1.8, -3.0)
      },
      corridor: {
        name: 'corridor',
        position: new THREE.Vector3(0, 1.8, -4.0),
        target: new THREE.Vector3(0, 1.8, -6.75)
      }
    };

    const targetPreset = presets[hotspotId] || presets.overview;
    this.moveToPreset(targetPreset, durationMs);
  }

  private currentParallax: THREE.Vector2 = new THREE.Vector2(0, 0);

  public update(delta: number): void {
    this.controls.update();

    if (this.parallaxEnabled && !this.isUserOrbiting && !this.isTransitioning) {
      // Use setViewOffset for parallax to avoid fighting OrbitControls camera.position
      const targetX = this.mouseNorm.x * (window.innerWidth * (this.parallaxSensitivity * 0.08));
      const targetY = -this.mouseNorm.y * (window.innerHeight * (this.parallaxSensitivity * 0.08));
      this.currentParallax.x = THREE.MathUtils.lerp(this.currentParallax.x, targetX, delta * 3);
      this.currentParallax.y = THREE.MathUtils.lerp(this.currentParallax.y, targetY, delta * 3);
    } else {
      this.currentParallax.x = THREE.MathUtils.lerp(this.currentParallax.x, 0, delta * 5);
      this.currentParallax.y = THREE.MathUtils.lerp(this.currentParallax.y, 0, delta * 5);
    }

    if (Math.abs(this.currentParallax.x) > 0.1 || Math.abs(this.currentParallax.y) > 0.1) {
      this.camera.setViewOffset(
        window.innerWidth, window.innerHeight,
        this.currentParallax.x, this.currentParallax.y,
        window.innerWidth, window.innerHeight
      );
    } else {
      this.camera.clearViewOffset();
    }
  }

  public disable(): void {
    this.controls.enabled = false;
  }

  public enable(): void {
    this.controls.enabled = true;
  }
}
