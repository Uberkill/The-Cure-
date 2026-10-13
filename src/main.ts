import * as THREE from 'three';
import { Telemetry } from './core/Telemetry';
import { EventBus } from './core/EventBus';
import { GameState } from './core/GameState';
import { GameStage } from './types';
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
import { FacilityMapScreen } from './ui/screens/FacilityMapScreen';
import { StaffRosterScreen } from './ui/screens/StaffRosterScreen';
import { AssetManifestScreen } from './ui/screens/AssetManifestScreen';
import { SaveManager } from './core/SaveManager';
import { exportObjectToGLB, downloadGLB } from './utils/exportToGLB';
import { DevTransformGizmo } from './interaction/DevTransformGizmo';
import { Dev3DEditorPanel } from './ui/Dev3DEditorPanel';
import { EditorVisualizers } from './editor/EditorVisualizers';
import { AnimatorSystem } from './rendering/AnimatorSystem';

class VaultApp {
  public telemetry: Telemetry;
  public eventBus: EventBus;
  public gameState: GameState;
  public saveManager: SaveManager;
  public audioEngine: AudioEngine;
  public musicManager: MusicTrackManager;

  public sceneManager: SceneManager;
  public cameraDirector: CameraDirector;
  public raycastManager: RaycastManager;
  public inspectionManager: InspectionManager;
  public devGizmo: DevTransformGizmo;
  public devEditorPanel: Dev3DEditorPanel;
  public editorVisualizers?: EditorVisualizers;
  public animatorSystem: AnimatorSystem;

  public scenarioRegistry: ScenarioRegistry;
  public crtNodePatcher: CRTNodePatcher;
  public facilityMapScreen: FacilityMapScreen;
  public staffRosterScreen: StaffRosterScreen;
  public assetManifestScreen: AssetManifestScreen;

  public screenManager: ScreenManager;
  public uiManager!: UIManager;

  private lastTimestamp: number = performance.now();
  private isRunning: boolean = true;

  constructor() {
    this.telemetry = Telemetry.getInstance();
    this.eventBus = EventBus.getInstance();
    this.gameState = GameState.getInstance();
    this.saveManager = SaveManager.getInstance();
    this.audioEngine = AudioEngine.getInstance();
    this.musicManager = MusicTrackManager.getInstance();

    const canvasContainer = document.getElementById('canvas-container')!;
    this.sceneManager = new SceneManager(canvasContainer);
    this.cameraDirector = new CameraDirector(this.sceneManager.renderer.domElement);
    
    this.animatorSystem = AnimatorSystem.getInstance();
    this.animatorSystem.init(this.sceneManager.scene, this.cameraDirector.camera);

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
    this.devEditorPanel = new Dev3DEditorPanel(
      this.sceneManager.scene,
      this.cameraDirector,
      this.devGizmo,
      this.sceneManager.renderer
    );

    this.screenManager = new ScreenManager();
    this.uiManager = new UIManager();

    const devBtn = document.getElementById('btn-dev-3d-toggle');
    devBtn?.addEventListener('click', () => {
      if (this.uiManager.isDevAuthorized()) {
        this.devGizmo.toggle();
      }
    });

    this.devGizmo.setAuthorized(this.uiManager.isDevAuthorized());

    this.eventBus.on('dev:authorized', ({ authorized }: { authorized: boolean }) => {
      this.devGizmo.setAuthorized(authorized);
      if (!authorized) {
        this.devGizmo.disable();
        this.devEditorPanel.hide();
        if (this.editorVisualizers) this.editorVisualizers.disable();
        devBtn?.classList.remove('active');
      }
    });

    this.eventBus.on('dev:toggle_gizmo', () => {
      if (this.uiManager.isDevAuthorized()) {
        this.devGizmo.toggle();
      }
    });

    this.devGizmo.onToggle = (enabled) => {
      if (enabled) {
        this.devEditorPanel.show();
        if (!this.editorVisualizers) {
          this.editorVisualizers = new EditorVisualizers(this.sceneManager.scene);
        }
        this.editorVisualizers.enable();
      } else {
        this.devEditorPanel.hide();
        if (this.editorVisualizers) this.editorVisualizers.disable();
      }
      devBtn?.classList.toggle('active', enabled);
    };

    this.eventBus.on('editor:rebuild_visualizers', () => {
      if (this.editorVisualizers) {
        this.editorVisualizers.rebuild();
      }
    });

    this.eventBus.on('editor:toggle_visualizers', (payload) => {
      if (this.editorVisualizers) {
        this.editorVisualizers.setVisible(payload.visible);
      }
    });

    this.eventBus.on('editor:selection_changed', ({ selected }: { selected: THREE.Object3D[] }) => {
      if (this.editorVisualizers) {
        this.editorVisualizers.setSelectedObject(selected.length === 1 ? selected[0] : null);
      }
    });

    this.scenarioRegistry = ScenarioRegistry.getInstance();
    this.crtNodePatcher = CRTNodePatcher.getInstance();
    this.facilityMapScreen = FacilityMapScreen.getInstance();
    this.staffRosterScreen = StaffRosterScreen.getInstance();
    this.assetManifestScreen = AssetManifestScreen.getInstance();

    this.setupScenarioRouting();
    this.init();
  }

  private setupScenarioRouting(): void {
    this.eventBus.on('scenario:switch_room', async ({ targetRoomId, isDevJump }: { targetRoomId: string; doorThresholdId?: string; isDevJump?: boolean }) => {
      this.telemetry.record('info', `Switching scenario to: ${targetRoomId}`);

      if (isDevJump) {
        const stageMap: Record<string, GameStage> = {
          room_04: GameStage.ACT_1_HUB_AWAKEN,
          sleep_ward: GameStage.ACT_2_SLEEP_WARD,
          hydrotherapy: GameStage.ACT_3_HYDROTHERAPY,
          audiology: GameStage.ACT_4_AUDIOLOGY,
          archive: GameStage.ACT_5_ARCHIVE,
          directors_office: GameStage.ACT_6_DIRECTORS_OFFICE,
          synthesis_blackout: GameStage.ACT_7_SYNTHESIS_BLACKOUT,
          velvet_lounge: GameStage.ACT_8_VELVET_LOUNGE
        };
        const mappedStage = stageMap[targetRoomId];
        if (mappedStage) {
          GameState.getInstance().setDevStage(mappedStage);
        }
      }

      const nextScenario = this.scenarioRegistry.getScenario(targetRoomId);
      if (nextScenario) {
        const loadedGroup = await this.scenarioRegistry.loadScenario(nextScenario, this.sceneManager.scene);
        if (!loadedGroup) return;

        const arrivalPreset = nextScenario.hotspots[nextScenario.defaultHotspot]?.cameraPreset
          ?? nextScenario.hotspots['overview']?.cameraPreset;
        if (arrivalPreset) {
          this.cameraDirector.resetForScenario(arrivalPreset);
        }

        this.raycastManager.setExclusiveTarget(null);

        this.eventBus.emit('ui:chapter_display', {
          act: nextScenario.actTitle,
          title: nextScenario.title,
          roomCode: nextScenario.roomCode,
          durationMs: 30000
        });

        this.eventBus.emit('ui:subtitle_changed', {
          text: `Entered ${nextScenario.title}. ${nextScenario.roomCode}`
        });

        if (this.editorVisualizers) {
          this.editorVisualizers.rebuild();
        }
      }
    });

    this.eventBus.on('input:object_clicked', ({ objectId, flavorText }) => {
      const current = this.scenarioRegistry.getCurrentScenario();
      if (current && typeof current.onObjectClick === 'function') {
        const handled = current.onObjectClick(objectId);
        if (handled) return;
      }
      if (flavorText) {
          if (Array.isArray(flavorText)) {
            if (flavorText.length === 0) return;
            const idx = this.gameState.getFlavorIndex(objectId);
            const text = flavorText[Math.min(idx, flavorText.length - 1)];
            this.gameState.incrementFlavorIndex(objectId);
            this.eventBus.emit('ui:subtitle_changed', { text });
          } else {
            this.eventBus.emit('ui:subtitle_changed', { text: flavorText });
          }
        }
    });
  }

  private async init(): Promise<void> {
    try {
      this.telemetry.record('info', 'Bootstrapping The Vault: Room 04 Nexus');

      const isTest = new URLSearchParams(window.location.search).has('test');
      const savedData = this.saveManager.loadGame();
      let startingRoomId = 'room_04';

      if (savedData && !isTest) {
        this.saveManager.hydrateGame(savedData);
        startingRoomId = savedData.currentRoomId || 'room_04';
      }

      const startingScenario = this.scenarioRegistry.getScenario(startingRoomId) || this.scenarioRegistry.getScenario('room_04');
      if (startingScenario) {
        await this.scenarioRegistry.loadScenario(startingScenario, this.sceneManager.scene);
        const defaultPreset = startingScenario.hotspots[startingScenario.defaultHotspot]?.cameraPreset;
        if (defaultPreset) {
          this.cameraDirector.resetForScenario(defaultPreset);
        }
      }
      this.telemetry.record('info', `Initial Chamber '${startingRoomId}' mounted successfully`);

      this.musicManager.playRoomTrack(startingRoomId === 'room_04' ? 'room_04_theme.mp3' : 'chamber_exploration.mp3');
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
    this.animatorSystem.update(delta);
    this.devEditorPanel.update();

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
