import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Telemetry } from '../core/Telemetry';

export class ModelLoader {
  private static instance: ModelLoader;
  private loader: GLTFLoader;
  private telemetry: Telemetry;
  private manifest: { models: string[]; music: string[] } | null = null;
  private manifestLoaded: boolean = false;

  private constructor() {
    this.loader = new GLTFLoader();
    this.telemetry = Telemetry.getInstance();
  }

  public static getInstance(): ModelLoader {
    if (!ModelLoader.instance) {
      ModelLoader.instance = new ModelLoader();
    }
    return ModelLoader.instance;
  }

  private async getManifest(): Promise<{ models: string[]; music: string[] }> {
    if (this.manifestLoaded) return this.manifest || { models: [], music: [] };
    try {
      const res = await fetch('/assets/manifest.json');
      if (res.ok) {
        this.manifest = await res.json();
      }
    } catch {
      // Manifest not found, default to empty
    }
    this.manifestLoaded = true;
    return this.manifest || { models: [], music: [] };
  }

  public async loadProp(propName: string, fallbackBuilder: () => THREE.Object3D): Promise<THREE.Object3D> {
    const manifest = await this.getManifest();
    const assetPath = `/assets/models/${propName}.glb`;

    if (!manifest.models.includes(propName) && !manifest.models.includes(`${propName}.glb`)) {
      this.telemetry.record(
        'info',
        `Custom Blender model '${assetPath}' not in asset manifest. Using procedural 3D geometry fallback.`
      );
      return fallbackBuilder();
    }

    return new Promise((resolve) => {
      this.loader.load(
        assetPath,
        (gltf) => {
          this.telemetry.record('info', `Successfully loaded custom Blender model: ${assetPath}`);
          const scene = gltf.scene;
          scene.traverse((node) => {
            if (node instanceof THREE.Mesh) {
              node.castShadow = true;
              node.receiveShadow = true;
            }
          });
          resolve(scene);
        },
        undefined,
        (err) => {
          this.telemetry.record(
            'info',
            `Custom Blender model '${assetPath}' not present (${String(err)}). Using procedural 3D geometry fallback.`
          );
          resolve(fallbackBuilder());
        }
      );
    });
  }
}
