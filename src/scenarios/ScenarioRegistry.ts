import * as THREE from 'three';
import { RoomScenario } from '../types';
import { Telemetry } from '../core/Telemetry';
import { Room04_SterileChamber } from './Room04_SterileChamber';
import { Room02_SleepWard } from './Room02_SleepWard';
import { Room03_Hydrotherapy } from './Room03_Hydrotherapy';
import { Room04_AudiologyVault } from './Room04_AudiologyVault';
import { Room05_Archive } from './Room05_Archive';
import { Room06_DirectorsOffice } from './Room06_DirectorsOffice';
import { Room07_SynthesisChamber } from './Room07_SynthesisChamber';
import { Room08_VelvetLounge } from './Room08_VelvetLounge';
import { Room99_Sandbox } from './Room99_Sandbox';
import { AudioEngine } from '../audio/AudioEngine';

export function disposeHierarchy(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => disposeMaterial(mat));
        } else {
          disposeMaterial(child.material);
        }
      }
    }
  });
}

function disposeMaterial(mat: THREE.Material): void {
  const m = mat as unknown as Record<string, unknown>;
  for (const key of Object.keys(m)) {
    const val = m[key];
    if (val && typeof (val as { dispose?: unknown }).dispose === 'function') {
      (val as { dispose: () => void }).dispose();
    }
  }
  mat.dispose();
}

export class ScenarioRegistry {
  private static instance: ScenarioRegistry;
  private scenarios: Map<string, RoomScenario> = new Map();
  private currentScenario: RoomScenario | null = null;
  private currentGroup: THREE.Group | null = null;
  private telemetry: Telemetry;

  private constructor() {
    this.telemetry = Telemetry.getInstance();
    this.registerDefaults();
  }

  public static getInstance(): ScenarioRegistry {
    if (!ScenarioRegistry.instance) {
      ScenarioRegistry.instance = new ScenarioRegistry();
    }
    return ScenarioRegistry.instance;
  }

  private registerDefaults(): void {
    this.scenarios.set('room_04', new Room04_SterileChamber());
    this.scenarios.set('sleep_ward', new Room02_SleepWard());
    this.scenarios.set('hydrotherapy', new Room03_Hydrotherapy());
    this.scenarios.set('audiology', new Room04_AudiologyVault());
    this.scenarios.set('archive', new Room05_Archive());
    this.scenarios.set('directors_office', new Room06_DirectorsOffice());
    this.scenarios.set('synthesis_blackout', new Room07_SynthesisChamber());
    this.scenarios.set('velvet_lounge', new Room08_VelvetLounge());
    this.scenarios.set('sandbox', new Room99_Sandbox());
  }

  public getScenario(id: string): RoomScenario | undefined {
    return this.scenarios.get(id);
  }

  public async loadScenarioById(id: string, scene: THREE.Scene): Promise<THREE.Group | null> {
    const scenario = this.scenarios.get(id);
    if (!scenario) {
      this.telemetry.record('error', `Scenario not found: ${id}`);
      return null;
    }
    return this.loadScenario(scenario, scene);
  }

  public async loadScenario(scenario: RoomScenario, scene: THREE.Scene): Promise<THREE.Group> {
    if (this.currentScenario && this.currentGroup) {
      this.telemetry.record('info', `Tearing down previous scenario: ${this.currentScenario.id}`);
      this.currentScenario.teardown(scene);
      AudioEngine.getInstance().teardownScenarioAudio();
      scene.remove(this.currentGroup);
      disposeHierarchy(this.currentGroup);
      this.currentGroup = null;
    }

    this.currentScenario = scenario;
    this.telemetry.record('info', `Loading scenario: ${scenario.id}`);
    this.currentGroup = await scenario.buildScene(scene);
    scene.add(this.currentGroup);

    return this.currentGroup;
  }

  public getCurrentScenario(): RoomScenario | null {
    return this.currentScenario;
  }

  public update(delta: number): void {
    if (this.currentScenario && typeof this.currentScenario.update === 'function') {
      this.currentScenario.update(delta);
    }
  }
}

