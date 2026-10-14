import * as THREE from 'three';
import { EventBus } from '../core/EventBus';

export interface LightRigFixture {
  id: string;
  name: string;
  room: string;
  type: 'spot' | 'point' | 'directional';
  light: THREE.Light;
  target?: THREE.Object3D;
  fixtureGroup?: THREE.Group;
  initialPosition: THREE.Vector3;
  initialTarget?: THREE.Vector3;
  helper?: THREE.SpotLightHelper | THREE.PointLightHelper;
}

export class LightRigManager {
  private static instance: LightRigManager | null = null;
  private fixtures: Map<string, LightRigFixture> = new Map();

  private constructor() {}

  public static getInstance(): LightRigManager {
    if (!LightRigManager.instance) {
      LightRigManager.instance = new LightRigManager();
    }
    return LightRigManager.instance;
  }

  public register(fixture: LightRigFixture): void {
    this.fixtures.set(fixture.id, fixture);
    EventBus.getInstance().emit('light_rig:registered', { id: fixture.id, fixture });
  }

  public unregister(id: string): void {
    const fixture = this.fixtures.get(id);
    if (fixture?.helper) {
      if (fixture.helper.parent) fixture.helper.parent.remove(fixture.helper);
      fixture.helper.dispose();
    }
    this.fixtures.delete(id);
    EventBus.getInstance().emit('light_rig:unregistered', { id });
  }

  public get(id: string): LightRigFixture | undefined {
    return this.fixtures.get(id);
  }

  public getAll(room?: string): LightRigFixture[] {
    const all = Array.from(this.fixtures.values());
    if (room) {
      return all.filter((f) => f.room === room);
    }
    return all;
  }

  public shiftLight(id: string, x: number, y: number, z: number, syncTarget: boolean = true): void {
    const fixture = this.fixtures.get(id);
    if (!fixture) return;

    const deltaX = x - fixture.light.position.x;
    const deltaY = y - fixture.light.position.y;
    const deltaZ = z - fixture.light.position.z;

    fixture.light.position.set(x, y, z);

    if (fixture.fixtureGroup) {
      fixture.fixtureGroup.position.set(x, y, z);
    }

    if (syncTarget && fixture.target && fixture.light instanceof THREE.SpotLight) {
      fixture.target.position.x += deltaX;
      fixture.target.position.y += deltaY;
      fixture.target.position.z += deltaZ;
    }

    if (fixture.helper) {
      fixture.helper.update();
    }

    EventBus.getInstance().emit('light_rig:updated', { id, fixture });
  }

  public setTarget(id: string, x: number, y: number, z: number): void {
    const fixture = this.fixtures.get(id);
    if (!fixture || !fixture.target) return;

    fixture.target.position.set(x, y, z);
    if (fixture.helper) {
      fixture.helper.update();
    }
    EventBus.getInstance().emit('light_rig:updated', { id, fixture });
  }

  public setColor(id: string, colorHex: number | string): void {
    const fixture = this.fixtures.get(id);
    if (!fixture) return;

    if (typeof colorHex === 'string') {
      fixture.light.color.set(colorHex);
    } else {
      fixture.light.color.setHex(colorHex);
    }

    if (fixture.helper) {
      fixture.helper.update();
    }
    EventBus.getInstance().emit('light_rig:updated', { id, fixture });
  }

  public setIntensity(id: string, intensity: number): void {
    const fixture = this.fixtures.get(id);
    if (!fixture) return;

    fixture.light.intensity = Math.max(0, intensity);
    EventBus.getInstance().emit('light_rig:updated', { id, fixture });
  }

  public setDistance(id: string, distance: number): void {
    const fixture = this.fixtures.get(id);
    if (!fixture) return;

    if (fixture.light instanceof THREE.PointLight || fixture.light instanceof THREE.SpotLight) {
      fixture.light.distance = Math.max(0, distance);
    }
    if (fixture.helper) {
      fixture.helper.update();
    }
    EventBus.getInstance().emit('light_rig:updated', { id, fixture });
  }

  public setAngle(id: string, angle: number): void {
    const fixture = this.fixtures.get(id);
    if (!fixture) return;

    if (fixture.light instanceof THREE.SpotLight) {
      fixture.light.angle = Math.max(0, Math.min(Math.PI / 2, angle));
    }
    if (fixture.helper) {
      fixture.helper.update();
    }
    EventBus.getInstance().emit('light_rig:updated', { id, fixture });
  }

  public setPenumbra(id: string, penumbra: number): void {
    const fixture = this.fixtures.get(id);
    if (!fixture) return;

    if (fixture.light instanceof THREE.SpotLight) {
      fixture.light.penumbra = Math.max(0, Math.min(1.0, penumbra));
    }
    EventBus.getInstance().emit('light_rig:updated', { id, fixture });
  }

  public clear(room?: string): void {
    if (room) {
      const roomFixtures = this.getAll(room);
      roomFixtures.forEach((f) => this.unregister(f.id));
    } else {
      this.fixtures.forEach((f) => {
        if (f.helper) {
          if (f.helper.parent) f.helper.parent.remove(f.helper);
          f.helper.dispose();
        }
      });
      this.fixtures.clear();
      EventBus.getInstance().emit('light_rig:cleared', {});
    }
  }

  public exportJson(room?: string): string {
    const items = this.getAll(room);
    const serialized = items.map((f) => {
      const pos = f.light.position;
      const targetPos = f.target ? f.target.position : undefined;
      const spot = f.light instanceof THREE.SpotLight ? f.light : null;
      const pt = f.light instanceof THREE.PointLight ? f.light : null;

      return {
        id: f.id,
        name: f.name,
        room: f.room,
        type: f.type,
        position: [parseFloat(pos.x.toFixed(3)), parseFloat(pos.y.toFixed(3)), parseFloat(pos.z.toFixed(3))],
        target: targetPos
          ? [parseFloat(targetPos.x.toFixed(3)), parseFloat(targetPos.y.toFixed(3)), parseFloat(targetPos.z.toFixed(3))]
          : undefined,
        color: `#${f.light.color.getHexString()}`,
        intensity: parseFloat(f.light.intensity.toFixed(2)),
        distance: spot ? spot.distance : pt ? pt.distance : undefined,
        angle: spot ? parseFloat(spot.angle.toFixed(3)) : undefined,
        penumbra: spot ? parseFloat(spot.penumbra.toFixed(2)) : undefined
      };
    });

    return JSON.stringify(serialized, null, 2);
  }
}
