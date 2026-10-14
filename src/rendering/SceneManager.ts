import * as THREE from 'three';
import { Telemetry } from '../core/Telemetry';
import { EventBus } from '../core/EventBus';
import { EditorServerSync } from '../editor/EditorServerSync';

export class SceneManager {
  public scene: THREE.Scene;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private telemetry: Telemetry;

  public lastFrameCalls: number = 0;
  public lastFrameTriangles: number = 0;
  public lastFrameGeometries: number = 0;
  private fpsFrames: number = 0;
  private fpsLastSampleTime: number = performance.now();
  private lastDeltaMs: number = 16.6;
  private lastRenderTimestamp: number = performance.now();

  constructor(container: HTMLElement) {
    this.container = container;
    this.telemetry = Telemetry.getInstance();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xa2aea4);
    this.scene.fog = new THREE.FogExp2(0xa2aea4, 0.038);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.container.appendChild(this.renderer.domElement);
    this.setupLighting();
    this.applySavedEnvironment();
    
    EventBus.getInstance().on('editor:save_environment', (env: any) => {
      if (this.scene.fog) {
        (this.scene.fog as any).color.set(env.fogColor);
        (this.scene.fog as any).density = env.fogDensity;
      }
      this.scene.background = new THREE.Color(env.fogColor);
      let amb = this.scene.children.find(c => c.type === 'AmbientLight') as any;
      if (amb) {
        amb.color.set(env.ambColor);
        amb.intensity = env.ambIntensity;
      }
    });
    this.setupResizeObserver();
    this.setupContextLossHandler();
  }

  private async applySavedEnvironment() {
    try {
      
      const layout = await EditorServerSync.fetchLayout();
      if (layout && layout.environment) {
        if (this.scene.fog) {
          (this.scene.fog as any).color.set(layout.environment.fogColor);
          (this.scene.fog as any).density = layout.environment.fogDensity;
        }
        this.scene.background = new THREE.Color(layout.environment.fogColor);
        let amb = this.scene.children.find(c => c.type === 'AmbientLight') as any;
        if (amb) {
          amb.color.set(layout.environment.ambColor);
          amb.intensity = layout.environment.ambIntensity;
        }
      }
    } catch (e) {
      console.warn("No env layout found", e);
    }
  }

  private setupLighting(): void {
    // 1. Chiaroscuro Clinical Ambient Fill (deepens corner ambient occlusion & shadows)
    const ambientLight = new THREE.AmbientLight(0xd4ded6, 0.50);
    this.scene.add(ambientLight);

    // 2. Directional Key Light from High Upper Angle (diffuse high-key fill, no shadow pass overhead)
    const keyLight = new THREE.DirectionalLight(0xf2f7f2, 1.6);
    keyLight.position.set(-3.2, 7.0, 3.5);
    keyLight.castShadow = false;
    this.scene.add(keyLight);

    // 4. Cool Rim Light for Architectural Aperture Highlights
    const coolRimLight = new THREE.DirectionalLight(0xc0d8cc, 0.75);
    coolRimLight.position.set(-4.5, 4.8, -2.5);
    this.scene.add(coolRimLight);
  }

  private setupResizeObserver(): void {
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }

  private setupContextLossHandler(): void {
    this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.telemetry.record('error', 'WebGL context lost. Attempting recovery.');
    });

    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      this.telemetry.record('info', 'WebGL context restored.');
    });
  }

  public render(camera: THREE.Camera): void {
    const now = performance.now();
    this.lastDeltaMs = now - this.lastRenderTimestamp;
    this.lastRenderTimestamp = now;

    this.renderer.render(this.scene, camera);

    this.lastFrameCalls = this.renderer.info.render.calls;
    this.lastFrameTriangles = this.renderer.info.render.triangles;
    this.lastFrameGeometries = this.renderer.info.memory.geometries;

    this.fpsFrames++;
    const sampleElapsed = now - this.fpsLastSampleTime;
    if (sampleElapsed >= 400) {
      const currentFps = Math.round((this.fpsFrames / sampleElapsed) * 1000);
      this.fpsFrames = 0;
      this.fpsLastSampleTime = now;

      EventBus.getInstance().emit('perf:tick', {
        fps: currentFps,
        deltaMs: Math.round(this.lastDeltaMs * 10) / 10,
        calls: this.lastFrameCalls,
        triangles: this.lastFrameTriangles,
        geometries: this.lastFrameGeometries
      });
    }
  }

  public getRenderMetrics() {
    return {
      calls: this.lastFrameCalls,
      triangles: this.lastFrameTriangles,
      geometries: this.lastFrameGeometries,
      deltaMs: Math.round(this.lastDeltaMs * 10) / 10
    };
  }
}
