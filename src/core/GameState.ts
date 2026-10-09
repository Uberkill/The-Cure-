import { EventBus } from './EventBus';
import { GameStage, CrystalId, AudioLogMetadata } from '../types';
import { Telemetry } from './Telemetry';

export class GameState {
  private static instance: GameState;
  private currentStage: GameStage = GameStage.ACT_1_HUB_AWAKEN;
  private eventBus: EventBus;
  private telemetry: Telemetry;

  private inventory: string[] = [];
  private collectedCrystals: Set<CrystalId> = new Set();
  private patchedCrystals: Set<CrystalId> = new Set();
  private pendingCrystalToPatch: CrystalId | null = null;

  private calibratedFrequency: number = 440;
  private readonly targetFrequency: number = 528;
  private synthesisComplete: boolean = false;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.telemetry = Telemetry.getInstance();
    this.setupListeners();
  }

  public static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  public hasItem(itemId: string): boolean {
    return this.inventory.includes(itemId);
  }

  public addItem(itemId: string): void {
    if (!this.inventory.includes(itemId)) {
      this.inventory.push(itemId);
      this.eventBus.emit('ui:inventory_updated', { inventory: [...this.inventory] });
    }
  }

  public getInventory(): string[] {
    return [...this.inventory];
  }

  public isSynthesisComplete(): boolean {
    return this.synthesisComplete;
  }

  private setupListeners(): void {
    this.eventBus.on('input:object_clicked', ({ objectId }) => {
      this.handleObjectClick(objectId);
    });

    this.eventBus.on('puzzle:crystal_collected', ({ crystalId }) => {
      this.collectedCrystals.add(crystalId);
      this.pendingCrystalToPatch = crystalId;

      if (crystalId === 'crystal_01_quartz') {
        this.transitionTo(GameStage.ACT_2_CRYSTAL_1_RECOVERED);
      } else if (crystalId === 'crystal_02_bronze') {
        this.transitionTo(GameStage.ACT_3_CRYSTAL_2_RECOVERED);
      } else if (crystalId === 'crystal_03_amethyst') {
        this.transitionTo(GameStage.ACT_4_CRYSTAL_3_RECOVERED);
      } else if (crystalId === 'crystal_04_obsidian') {
        this.transitionTo(GameStage.ACT_5_CRYSTAL_4_RECOVERED);
      } else if (crystalId === 'crystal_05_celadon') {
        this.transitionTo(GameStage.ACT_6_CRYSTAL_5_RECOVERED);
      }
    });

    this.eventBus.on('puzzle:crt_patch_completed', ({ crystalId, log }) => {
      this.patchedCrystals.add(crystalId);
      this.pendingCrystalToPatch = null;
      this.handlePatchCompleted(crystalId, log);
    });

    this.eventBus.on('inventory:add', ({ itemId }) => { if (!this.inventory.includes(itemId)) { this.inventory.push(itemId); this.eventBus.emit('ui:inventory_updated', { inventory: [...this.inventory] }); } });

    this.eventBus.on('puzzle:frequency_changed', ({ frequency }) => {
      this.calibratedFrequency = frequency;
    });

    this.eventBus.on('puzzle:switch_thrown', () => {
      const isResonating = Math.abs(this.calibratedFrequency - this.targetFrequency) <= 2;
      if (isResonating && this.currentStage === GameStage.ACT_1_HUB_AWAKEN) {
        this.transitionTo(GameStage.ACT_1_HUB_CORRIDOR_OPEN);
        this.eventBus.emit('ui:subtitle_changed', {
          text: 'Primary relay thrown. 528 Hz verified. The forward observation corridor door unseals.'
        });
      }
    });

    this.eventBus.on('puzzle:synthesis_complete', () => {
      this.synthesisComplete = true;
    });
  }

  private handleObjectClick(objectId: string): void {
    switch (objectId) {
      case 'prop_envelope':
        this.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'envelope' });
        this.eventBus.emit('ui:view_changed', { view: 'dossier' });
        break;

      case 'prop_bell_jar':
      case 'prop_key':
        
        this.eventBus.emit('inspect:open', {
          itemId: 'prop_key',
          targetMesh: null as any,
          title: 'The Brass Tuning Key',
          subtitle: 'SPECIMEN ARTIFACT • RECOVERED FROM BELL JAR'
        });
        break;

      case 'prop_vault':
      case 'prop_oscilloscope':
      case 'vault_crt_screen':
        this.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'vault' });
        if (this.pendingCrystalToPatch) {
          this.eventBus.emit('puzzle:crt_patch_opened', { crystalId: this.pendingCrystalToPatch });
        } else if (this.currentStage === GameStage.ACT_1_HUB_AWAKEN) {
          this.eventBus.emit('ui:subtitle_changed', {
            text: 'Apparatus Core Unit 04: Harmonic frequency sweep required. Tune the rotary dial to 528 Hz.'
          });
        } else {
          this.eventBus.emit('ui:subtitle_changed', {
            text: 'The cathode-ray oscilloscope phosphor grid is steady. Retrieve the next memory fragment from the corridor.'
          });
        }
        break;

      case 'prop_telephone':
        this.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'telephone' });
        this.handleTelephoneAudio();
        break;
    }
  }

  private handlePatchCompleted(crystalId: CrystalId, log: AudioLogMetadata): void {
    this.eventBus.emit('ui:subtitle_changed', {
      text: `${log.actTitle} [LOGGED]: "${log.transcript}"`
    });

    if (crystalId === 'crystal_01_quartz') {
      this.transitionTo(GameStage.ACT_2_PATCH_1_COMPLETE);
    } else if (crystalId === 'crystal_02_bronze') {
      this.transitionTo(GameStage.ACT_3_PATCH_2_COMPLETE);
    } else if (crystalId === 'crystal_03_amethyst') {
      this.transitionTo(GameStage.ACT_4_PATCH_3_COMPLETE);
    } else if (crystalId === 'crystal_04_obsidian') {
      this.transitionTo(GameStage.ACT_5_PATCH_4_COMPLETE);
    } else if (crystalId === 'crystal_05_celadon') {
      this.transitionTo(GameStage.ACT_7_SYNTHESIS_BLACKOUT);
    }
  }

  private handleTelephoneAudio(): void {
    if (this.currentStage < GameStage.ACT_1_HUB_CORRIDOR_OPEN) {
      this.eventBus.emit('ui:subtitle_changed', {
        text: '"Subject 104. Consciousness recovery noted. Do not search for windows; Room 04 is below the waterline. Tune receiver to 528 Hz."'
      });
    } else if (this.currentStage <= GameStage.ACT_3_PATCH_2_COMPLETE) {
      this.eventBus.emit('ui:subtitle_changed', {
        text: '"Observation 44: Sorrow is not an infection. Flesh is the infection. Proceed into the deeper wards."'
      });
    } else if (this.currentStage <= GameStage.ACT_5_PATCH_4_COMPLETE) {
      this.eventBus.emit('ui:subtitle_changed', {
        text: '"The ultimate silence is prepared. The carrier is ready. Return to the core."'
      });
    } else {
      this.eventBus.emit('ui:subtitle_changed', {
        text: 'The receiver emits only faint, rhythmic wet breathing against the microphone.'
      });
    }
  }

  public transitionTo(nextStage: GameStage): boolean {
    const previousStage = this.currentStage;
    this.currentStage = nextStage;
    this.telemetry.record('info', `Stage transitioned: ${previousStage} -> ${nextStage}`);

    this.eventBus.emit('game:stage_transition', {
      from: previousStage,
      to: nextStage
    });

    return true;
  }

  public setDevStage(stage: GameStage): void {
    const previousStage = this.currentStage;
    this.currentStage = stage;
    this.telemetry.record('info', `Dev stage synchronized: ${previousStage} -> ${stage}`);

    if (stage === GameStage.ACT_1_HUB_AWAKEN) {
      this.collectedCrystals.clear();
      this.patchedCrystals.clear();
      this.pendingCrystalToPatch = null;
      this.synthesisComplete = false;
    } else if (stage === GameStage.ACT_7_SYNTHESIS_BLACKOUT || stage === GameStage.ACT_8_VELVET_LOUNGE) {
      this.patchedCrystals = new Set([
        'crystal_01_quartz',
        'crystal_02_bronze',
        'crystal_03_amethyst',
        'crystal_04_obsidian',
        'crystal_05_celadon'
      ]);
      this.pendingCrystalToPatch = null;
      if (stage === GameStage.ACT_8_VELVET_LOUNGE) {
        this.synthesisComplete = true;
      }
    }

    this.eventBus.emit('game:stage_transition', {
      from: previousStage,
      to: stage
    });
  }

  public getStage(): GameStage {
    return this.currentStage;
  }

  public hasCrystal(crystalId: CrystalId): boolean {
    return this.collectedCrystals.has(crystalId);
  }

  public isCrystalPatched(crystalId: CrystalId): boolean {
    return this.patchedCrystals.has(crystalId);
  }

  public getPendingCrystal(): CrystalId | null {
    return this.pendingCrystalToPatch;
  }

  public getCalibratedFrequency(): number {
    return this.calibratedFrequency;
  }
}
