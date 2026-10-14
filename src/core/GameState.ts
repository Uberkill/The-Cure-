import { EventBus } from './EventBus';
import { GameStage, CrystalId, AudioLogMetadata, SaveGameData } from '../types';
import { Telemetry } from './Telemetry';

export class GameState {
  private static instance: GameState;
  private currentStage: GameStage = GameStage.ACT_1_HUB_AWAKEN;
  private eventBus: EventBus;
  private telemetry: Telemetry;

  private inventory: string[] = [];
  private flavorIndices: Map<string, number> = new Map();
  private collectedCrystals: Set<CrystalId> = new Set();
  private patchedCrystals: Set<CrystalId> = new Set();
  private pendingCrystalToPatch: CrystalId | null = null;

  private calibratedFrequency: number = 440;
  private readonly targetFrequency: number = 528;
  private synthesisComplete: boolean = false;
  private visitedRooms: Set<string> = new Set(['room_04']);

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

  public getFlavorIndex(objectId: string): number {
    return this.flavorIndices.get(objectId) || 0;
  }

  public incrementFlavorIndex(objectId: string): void {
    const current = this.getFlavorIndex(objectId);
    this.flavorIndices.set(objectId, current + 1);
  }

  public getInventory(): string[] {
    return [...this.inventory];
  }

  public isSynthesisComplete(): boolean {
    return this.synthesisComplete;
  }

  public markRoomVisited(roomId: string): void {
    this.visitedRooms.add(roomId);
  }

  public hasVisitedRoom(roomId: string): boolean {
    return this.visitedRooms.has(roomId);
  }

  public getVisitedRooms(): string[] {
    return Array.from(this.visitedRooms);
  }

  private setupListeners(): void {
    // Scene object click handling delegated directly to scenario onObjectClick handlers

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
      this.transitionTo(GameStage.ACT_8_VELVET_LOUNGE);
    });

    this.eventBus.on('scenario:switch_room', ({ targetRoomId }) => {
      if (targetRoomId) {
        this.markRoomVisited(targetRoomId);
      }
    });
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
      this.visitedRooms = new Set(['room_04']);
      this.flavorIndices.clear();
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
      this.visitedRooms = new Set([
        'room_04',
        'sleep_ward',
        'hydrotherapy',
        'audiology',
        'archive',
        'directors_office',
        'synthesis_blackout',
        'velvet_lounge'
      ]);
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

  public getCollectedCrystals(): CrystalId[] {
    return Array.from(this.collectedCrystals);
  }

  public getPatchedCrystals(): CrystalId[] {
    return Array.from(this.patchedCrystals);
  }

  public getFlavorIndices(): Record<string, number> {
    return Object.fromEntries(this.flavorIndices.entries());
  }

  public loadFromSaveData(data: SaveGameData): void {
    const previousStage = this.currentStage;
    this.currentStage = data.currentStage;
    this.inventory = Array.isArray(data.inventory) ? [...data.inventory] : [];
    this.collectedCrystals = new Set(data.collectedCrystals || []);
    this.patchedCrystals = new Set(data.patchedCrystals || []);
    this.pendingCrystalToPatch = data.pendingCrystalToPatch || null;
    this.calibratedFrequency = typeof data.calibratedFrequency === 'number' ? data.calibratedFrequency : 440;
    this.synthesisComplete = Boolean(data.synthesisComplete);
    this.visitedRooms = new Set(data.visitedRooms || ['room_04']);
    this.flavorIndices = new Map(Object.entries(data.flavorIndices || {}));

    this.telemetry.record('info', `GameState hydrated from save: stage ${previousStage} -> ${this.currentStage}`);
    this.eventBus.emit('ui:inventory_updated', { inventory: [...this.inventory] });
    this.eventBus.emit('game:stage_transition', {
      from: previousStage,
      to: this.currentStage
    });
  }

  public resetToBaseline(): void {
    const previousStage = this.currentStage;
    this.currentStage = GameStage.ACT_1_HUB_AWAKEN;
    this.inventory = [];
    this.flavorIndices.clear();
    this.collectedCrystals.clear();
    this.patchedCrystals.clear();
    this.pendingCrystalToPatch = null;
    this.calibratedFrequency = 440;
    this.synthesisComplete = false;
    this.visitedRooms = new Set(['room_04']);

    this.telemetry.record('info', 'GameState reset to baseline ACT_1_HUB_AWAKEN');
    this.eventBus.emit('ui:inventory_updated', { inventory: [] });
    this.eventBus.emit('game:stage_transition', {
      from: previousStage,
      to: GameStage.ACT_1_HUB_AWAKEN
    });
  }
}
