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
    this.renderer.toneMappingExposure = 0.98;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.container.appendChild(this.renderer.domElement);
    this.setupLighting();
    this.setupResizeObserver();
    this.setupContextLossHandler();
  }

  private setupLighting(): void {
    // 1. Ambient Fill (low intensity allows deep shadows)
    const ambientLight = new THREE.AmbientLight(0xcfd8cf, 0.52);
    this.scene.add(ambientLight);

    // 2. Focused Surgical Task Spotlight over central desk
    const deskSpot = new THREE.SpotLight(0xfff6eb, 3.6, 14, Math.PI / 3.4, 0.45, 1.2);
    deskSpot.position.set(1.8, 5.8, 2.6);
    deskSpot.castShadow = true;
    deskSpot.shadow.mapSize.width = 2048;
    deskSpot.shadow.mapSize.height = 2048;
    deskSpot.shadow.bias = -0.00002;
    deskSpot.shadow.normalBias = 0.04;
    this.scene.add(deskSpot);

    // 3. Directional Key Light from Ceiling (diffuse fill, no grazing wall shadows)
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.4);
    keyLight.position.set(3.5, 6.0, 3.0);
    keyLight.castShadow = false;
    this.scene.add(keyLight);

    // 4. Cool Rim Light from Upper Left Cove
    const coolRimLight = new THREE.DirectionalLight(0xbad2c8, 0.85);
    coolRimLight.position.set(-4, 5, -2);
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
