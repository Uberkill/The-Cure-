import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Telemetry } from '../core/Telemetry';

export class ModelLoader {
  private static instance: ModelLoader;
  private loader: GLTFLoader;
  private telemetry: Telemetry;

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

  public async loadProp(propName: string, fallbackBuilder: () => THREE.Object3D): Promise<THREE.Object3D> {
    const assetPath = `/assets/models/${propName}.glb`;

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
