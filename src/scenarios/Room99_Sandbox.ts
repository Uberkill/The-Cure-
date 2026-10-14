import * as THREE from 'three';
import { RoomScenario, HotspotAnchor } from '../types';
import { createRoom04Materials, Room04MaterialPalette } from '../entities/room04/Room04Materials';
import { EditorPrefabs } from '../editor/EditorPrefabs';
import roomLayoutData from '../data/room_layout.json';

export class Room99_Sandbox implements RoomScenario {
  public id = 'sandbox';
  public title = 'Sandbox Mode';
  public actTitle = 'ACT 99';
  public roomCode = 'ROOM 99';
  public defaultHotspot = 'overview';
  public hotspots: Record<string, HotspotAnchor> = {
    overview: {
      id: 'overview',
      name: 'Sandbox Overview',
      position: new THREE.Vector3(0, 0, 0),
      interactionPrompt: 'Sandbox View',
      cameraPreset: {
        name: 'overview',
        position: new THREE.Vector3(0, 1.8, 5),
        target: new THREE.Vector3(0, 0, 0)
      }
    }
  };

  private group: THREE.Group = new THREE.Group();
  private materials: Room04MaterialPalette;
  
  constructor() {
    this.group.name = 'scenario_sandbox';
    const { materials } = createRoom04Materials();
    this.materials = materials;
  }

  public async buildScene(scene: THREE.Scene): Promise<THREE.Group> {
    // 1. Vast Infinite Concrete / Terrazzo Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      this.materials.terrazzoFloor
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'sandbox_floor';
    this.group.add(floor);

    // 2. Base ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    ambient.name = 'sandbox_ambient';
    this.group.add(ambient);
    
    // 3. Central Overhead Spotlight
    const spot = new THREE.SpotLight(0xffffff, 5);
    spot.position.set(0, 6, 0);
    spot.angle = Math.PI / 4;
    spot.penumbra = 0.5;
    spot.castShadow = true;
    spot.name = 'sandbox_spotlight';
    this.group.add(spot);

    // Provide a starting point / origin indicator
    const originMark = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.01, 32),
      this.materials.brassGold
    );
    originMark.name = 'sandbox_origin';
    this.group.add(originMark);

    try {
      let layout: any = roomLayoutData;
      if (typeof window !== 'undefined' && window.location && !window.location.protocol.startsWith('file')) {
        try {
          const resp = await fetch('/src/data/room_layout.json');
          if (resp.ok) {
            layout = await resp.json();
          }
        } catch {
          // Fall back to bundled roomLayoutData
        }
      }
      
      if (layout && layout.prefabs && Array.isArray(layout.prefabs)) {
        for (const p of layout.prefabs) {
          let prefab;
          if (p.type === 'CustomModel') {
            prefab = EditorPrefabs.spawnCustomModel(p.modelUrl, p.id);
          } else {
            prefab = EditorPrefabs.spawn(p.type);
          }
          prefab.userData.prefabId = p.id;
          prefab.position.set(p.transform.x, p.transform.y, p.transform.z);
          prefab.rotation.set(p.transform.rx, p.transform.ry, p.transform.rz);
          prefab.scale.set(p.transform.sx, p.transform.sy, p.transform.sz);
          if (p.lightColor !== undefined && prefab.userData.isLight) {
              const l = prefab.children.find((c: any) => c.isLight) as any;
              if (l) {
                l.color.setHex(p.lightColor);
                l.intensity = p.lightIntensity;
              }
            }
            if (p.paintingUrl) {
            prefab.userData.paintingUrl = p.paintingUrl;
            const canvasMesh = prefab.children[1] as any;
            if (canvasMesh && canvasMesh.material) {
              const loader = new THREE.TextureLoader();
              loader.load(p.paintingUrl, (tex) => {
                canvasMesh.material.map = tex;
                canvasMesh.material.color.setHex(0xffffff);
                canvasMesh.material.needsUpdate = true;
              });
            }
          }
          this.group.add(prefab);
        }
      }
    } catch (err) {
      console.warn('Could not load layout.json in sandbox', err);
    }

    scene.add(this.group);
    return this.group;
  }

  public teardown(scene: THREE.Scene): void {
    scene.remove(this.group);
  }

  public onObjectClick(_objectId: string): boolean {
    return false;
  }

  public update(delta: number): void {
    const origin = this.group.getObjectByName('sandbox_origin');
    if (origin) origin.rotation.y += delta * 0.2;
  }
}


