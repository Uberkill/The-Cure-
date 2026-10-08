import * as THREE from 'three';
import { Telemetry } from '../core/Telemetry';

export class SceneManager {
  public scene: THREE.Scene;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private telemetry: Telemetry;

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
    this.setupResizeObserver();
    this.setupContextLossHandler();
  }

  private setupLighting(): void {
    // 1. High-Key Clinical Ambient Fill (bright sterile daylight base)
    const ambientLight = new THREE.AmbientLight(0xd4ded6, 0.65);
    this.scene.add(ambientLight);

    // 2. Focused Surgical Task Spotlight aligned with ceiling luminaire diffuser
    const deskSpot = new THREE.SpotLight(0xfff7ee, 4.0, 14, Math.PI / 3.3, 0.45, 1.2);
    deskSpot.position.set(0.1, 5.36, 0.3);
    deskSpot.target.position.set(0, 0.8, 0);
    this.scene.add(deskSpot.target);

    deskSpot.castShadow = true;
    deskSpot.shadow.mapSize.width = 2048;
    deskSpot.shadow.mapSize.height = 2048;
    deskSpot.shadow.bias = -0.0001;
    deskSpot.shadow.normalBias = 0.02;
    this.scene.add(deskSpot);

    // 3. Directional Key Light from High Upper Angle (diffuse high-key fill, no shadow pass overhead)
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
    this.renderer.render(this.scene, camera);
  }
}
