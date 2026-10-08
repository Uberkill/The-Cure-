import * as THREE from 'three';
import { Telemetry } from './core/Telemetry';
import { EventBus } from './core/EventBus';
import { GameState } from './core/GameState';
import { AudioEngine } from './audio/AudioEngine';
import { MusicTrackManager } from './audio/MusicTrackManager';
import { SceneManager } from './rendering/SceneManager';
import { CameraDirector } from './rendering/CameraDirector';
import { RaycastManager } from './interaction/RaycastManager';
import { InspectionManager } from './interaction/InspectionManager';
import { ScenarioRegistry } from './scenarios/ScenarioRegistry';
import { ScreenManager } from './ui/ScreenManager';
import { UIManager } from './ui/UIManager';
import { CRTNodePatcher } from './entities/CRTNodePatcher';
import { exportObjectToGLB, downloadGLB } from './utils/exportToGLB';
import { DevTransformGizmo } from './interaction/DevTransformGizmo';

class VaultApp {
  public telemetry: Telemetry;
  public eventBus: EventBus;
  public gameState: GameState;
  public audioEngine: AudioEngine;
  public musicManager: MusicTrackManager;

  public sceneManager: SceneManager;
  public cameraDirector: CameraDirector;
  public raycastManager: RaycastManager;
  public inspectionManager: InspectionManager;
  public devGizmo: DevTransformGizmo;

  public scenarioRegistry: ScenarioRegistry;
  public crtNodePatcher: CRTNodePatcher;

  public screenManager: ScreenManager;
  public uiManager: UIManager;

  private lastTimestamp: number = performance.now();
  private isRunning: boolean = true;

  constructor() {
    this.telemetry = Telemetry.getInstance();
    this.eventBus = EventBus.getInstance();
    this.gameState = GameState.getInstance();
    this.audioEngine = AudioEngine.getInstance();
    this.musicManager = MusicTrackManager.getInstance();

    const canvasContainer = document.getElementById('canvas-container')!;
    this.sceneManager = new SceneManager(canvasContainer);
    this.cameraDirector = new CameraDirector(this.sceneManager.renderer.domElement);
    this.raycastManager = new RaycastManager(
      this.sceneManager.scene,
      this.cameraDirector.camera,
      this.sceneManager.renderer.domElement
    );
    this.inspectionManager = new InspectionManager();
    this.devGizmo = new DevTransformGizmo(
      this.sceneManager.scene,
      this.cameraDirector.camera,
      this.sceneManager.renderer.domElement,
      this.cameraDirector.controls,
      this.raycastManager
    );

    this.scenarioRegistry = ScenarioRegistry.getInstance();
    this.crtNodePatcher = CRTNodePatcher.getInstance();

    this.screenManager = new ScreenManager();
    this.uiManager = new UIManager();

    this.setupScenarioRouting();
    this.init();
  }

  private setupScenarioRouting(): void {
    this.eventBus.on('scenario:switch_room', async ({ targetRoomId }) => {
      this.telemetry.record('info', `Switching scenario to: ${targetRoomId}`);

      const nextScenario = this.scenarioRegistry.getScenario(targetRoomId);
      if (nextScenario) {
        // Teardown scenario audio nodes
        this.audioEngine.teardownScenarioAudio();

        // Load new room meshes into scene
        await this.scenarioRegistry.loadScenario(nextScenario, this.sceneManager.scene);

        // Reset camera anchor
        const defaultPreset = nextScenario.hotspots[nextScenario.defaultHotspot]?.cameraPreset;
        if (defaultPreset) {
          this.cameraDirector.resetForScenario(defaultPreset);
        }

        // Exclusive target lock for Velvet Lounge payphone
        if (targetRoomId === 'velvet_lounge') {
          this.raycastManager.setExclusiveTarget('prop_lounge_payphone');
        } else {
          this.raycastManager.setExclusiveTarget(null);
        }

        // Display chapter title card (4 seconds duration)
        this.eventBus.emit('ui:chapter_display', {
          act: nextScenario.actTitle,
          title: nextScenario.title,
          durationMs: 4000
        });

        this.eventBus.emit('ui:subtitle_changed', {
          text: `Entered ${nextScenario.title}. ${nextScenario.roomCode}`
        });
      }
    });

    this.eventBus.on('input:object_clicked', ({ objectId }) => {
      const current = this.scenarioRegistry.getCurrentScenario();
      if (current && typeof current.onObjectClick === 'function') {
        const handled = current.onObjectClick(objectId);
        if (handled) return;
      }
    });
  }

  private async init(): Promise<void> {
    try {
      this.telemetry.record('info', 'Bootstrapping The Vault: Room 04 Nexus');
      const hubScenario = this.scenarioRegistry.getScenario('room_04');
      if (hubScenario) {
        await this.scenarioRegistry.loadScenario(hubScenario, this.sceneManager.scene);
      }
      this.telemetry.record('info', 'Central Hub loaded successfully');

      this.musicManager.playRoomTrack('room_04_theme.mp3');
      this.animate();
    } catch (err) {
      this.telemetry.record('error', `Initialization failure: ${String(err)}`);
    }
  }

  private animate = (): void => {
    if (!this.isRunning) return;
    requestAnimationFrame(this.animate);

    const now = performance.now();
    const rawDelta = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;
    const delta = Math.min(0.1, rawDelta);

    this.cameraDirector.update(delta);
    this.scenarioRegistry.update(delta);

    // Primary 3D render pass
    this.sceneManager.render(this.cameraDirector.camera);

    // Secondary 3D inspection render pass (Single WebGL context)
    if (this.inspectionManager.isInspectionActive()) {
      this.inspectionManager.render(this.sceneManager.renderer);
    }
  };
}

// Bootstrap application on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  const app = new VaultApp();
  (window as unknown as { __VAULT_APP__: VaultApp; THREE: typeof THREE }).__VAULT_APP__ = app;
  (window as unknown as { THREE: typeof THREE }).THREE = THREE;
  (window as unknown as Record<string, unknown>).exportObjectToGLB = exportObjectToGLB;
  (window as unknown as Record<string, unknown>).downloadGLB = downloadGLB;
});
