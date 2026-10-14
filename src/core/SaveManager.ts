import { EventBus } from './EventBus';
import { GameState } from './GameState';
import { Telemetry } from './Telemetry';
import { SaveGameData, GameStage, GameSettings } from '../types';

export class SaveManager {
  private static instance: SaveManager;
  private static readonly PRIMARY_STORAGE_KEY = 'the_cure_save_record';
  private static readonly LEGACY_STORAGE_KEY = 'the_vault_save_record';
  public static readonly STORAGE_KEY = 'the_cure_save_record';
  private static readonly SCHEMA_VERSION = 1;

  private eventBus: EventBus;
  private telemetry: Telemetry;
  private gameState: GameState;
  private lastKnownRoomId: string = 'room_04';
  private currentSettings: Partial<GameSettings> = {};
  private autoSaveDebounceTimer: number | null = null;
  private inMemoryFallback: SaveGameData | null = null;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.telemetry = Telemetry.getInstance();
    this.gameState = GameState.getInstance();
    this.setupListeners();
  }

  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  private setupListeners(): void {
    this.eventBus.on('scenario:switch_room', ({ targetRoomId }) => {
      if (targetRoomId) {
        this.lastKnownRoomId = targetRoomId;
        this.scheduleAutoSave();
      }
    });

    this.eventBus.on('game:stage_transition', () => {
      this.scheduleAutoSave();
    });

    this.eventBus.on('puzzle:crystal_collected', () => {
      this.scheduleAutoSave();
    });

    this.eventBus.on('puzzle:crt_patch_completed', () => {
      this.scheduleAutoSave();
    });

    this.eventBus.on('inventory:add', () => {
      this.scheduleAutoSave();
    });

    this.eventBus.on('ui:inventory_updated', () => {
      this.scheduleAutoSave();
    });

    this.eventBus.on('settings:updated', (settings) => {
      this.currentSettings = { ...this.currentSettings, ...settings };
      this.scheduleAutoSave();
    });
  }

  private scheduleAutoSave(): void {
    if (this.autoSaveDebounceTimer !== null) {
      window.clearTimeout(this.autoSaveDebounceTimer);
    }
    this.autoSaveDebounceTimer = window.setTimeout(() => {
      this.autoSaveDebounceTimer = null;
      this.saveGame();
    }, 500);
  }

  public setLastKnownRoomId(roomId: string): void {
    this.lastKnownRoomId = roomId;
  }

  public getLastKnownRoomId(): string {
    return this.lastKnownRoomId;
  }

  public getSettings(): Partial<GameSettings> {
    if (Object.keys(this.currentSettings).length === 0) {
      const saved = this.loadGame();
      if (saved && saved.settings) {
        this.currentSettings = { ...saved.settings };
      }
    }
    return { ...this.currentSettings };
  }

  public createSaveData(): SaveGameData {
    return {
      version: SaveManager.SCHEMA_VERSION,
      timestamp: Date.now(),
      currentStage: this.gameState.getStage(),
      currentRoomId: this.lastKnownRoomId,
      inventory: this.gameState.getInventory(),
      collectedCrystals: this.gameState.getCollectedCrystals(),
      patchedCrystals: this.gameState.getPatchedCrystals(),
      pendingCrystalToPatch: this.gameState.getPendingCrystal(),
      calibratedFrequency: this.gameState.getCalibratedFrequency(),
      synthesisComplete: this.gameState.isSynthesisComplete(),
      visitedRooms: this.gameState.getVisitedRooms(),
      flavorIndices: this.gameState.getFlavorIndices(),
      settings: { ...this.currentSettings }
    };
  }

  private getStorage(): Storage | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
      }
    } catch {
      // Storage access blocked or restricted
    }
    return null;
  }

  public saveGame(): SaveGameData {
    const data = this.createSaveData();
    const storage = this.getStorage();
    if (storage) {
      try {
        const json = JSON.stringify(data);
        storage.setItem(SaveManager.PRIMARY_STORAGE_KEY, json);
        try {
          storage.setItem(SaveManager.LEGACY_STORAGE_KEY, json);
        } catch {
          // Dual-write legacy mirror is non-fatal if storage quota is constrained
        }
        this.telemetry.record('info', `Game saved successfully: Stage ${data.currentStage}, Room ${data.currentRoomId}`);
      } catch (err) {
        this.telemetry.record('warn', `LocalStorage quota or write failed: ${String(err)}`);
        this.inMemoryFallback = data;
      }
    } else {
      this.inMemoryFallback = data;
    }

    this.eventBus.emit('save:updated', { save: data });
    return data;
  }

  public loadGame(): SaveGameData | null {
    const storage = this.getStorage();
    let raw: string | null = null;
    if (storage) {
      try {
        raw = storage.getItem(SaveManager.PRIMARY_STORAGE_KEY);
        if (!raw) {
          raw = storage.getItem(SaveManager.LEGACY_STORAGE_KEY);
        }
      } catch (err) {
        this.telemetry.record('warn', `LocalStorage read failed: ${String(err)}`);
      }
    }

    if (!raw && this.inMemoryFallback) {
      return this.inMemoryFallback;
    }

    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw);
      if (this.validateSaveData(parsed)) {
        this.lastKnownRoomId = parsed.currentRoomId;
        if (parsed.settings) {
          this.currentSettings = { ...parsed.settings };
        }
        return parsed;
      } else {
        this.telemetry.record('error', 'Persisted save data failed schema validation.');
        return null;
      }
    } catch (err) {
      this.telemetry.record('error', `Failed to parse persisted save data: ${String(err)}`);
      return null;
    }
  }

  public validateSaveData(data: unknown): data is SaveGameData {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;

    if (typeof d.version !== 'number' || d.version <= 0) return false;
    if (typeof d.timestamp !== 'number') return false;
    if (typeof d.currentStage !== 'string' || !Object.values(GameStage).includes(d.currentStage as GameStage)) return false;
    if (typeof d.currentRoomId !== 'string' || !d.currentRoomId.trim()) return false;
    if (!Array.isArray(d.inventory) || !d.inventory.every(item => typeof item === 'string')) return false;
    if (!Array.isArray(d.collectedCrystals) || !Array.isArray(d.patchedCrystals)) return false;
    if (!Array.isArray(d.visitedRooms) || !d.visitedRooms.every(r => typeof r === 'string')) return false;
    if (typeof d.calibratedFrequency !== 'number') return false;
    if (typeof d.synthesisComplete !== 'boolean') return false;

    return true;
  }

  public hydrateGame(data: SaveGameData): boolean {
    if (!this.validateSaveData(data)) {
      this.telemetry.record('error', 'Cannot hydrate GameState: invalid SaveGameData structure.');
      return false;
    }

    this.lastKnownRoomId = data.currentRoomId;
    if (data.settings) {
      this.currentSettings = { ...data.settings, subtitlesEnabled: true };
      this.eventBus.emit('settings:updated', this.currentSettings);
    }

    this.gameState.loadFromSaveData(data);
    this.saveGame();
    return true;
  }

  public exportSaveFile(): void {
    const data = this.saveGame();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `subject_104_case_record_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.telemetry.record('info', 'Case record exported to local file system.');
  }

  public async importSaveFile(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!this.validateSaveData(parsed)) {
        throw new Error('Case file structure does not conform to Sanatorium archival schema.');
      }
      const success = this.hydrateGame(parsed);
      if (success) {
        this.eventBus.emit('ui:subtitle_changed', {
          text: `Case record imported successfully. Protocol restored to ${parsed.currentStage}.`
        });
      }
      return success;
    } catch (err) {
      this.telemetry.record('error', `Failed to import case file: ${String(err)}`);
      this.eventBus.emit('ui:subtitle_changed', {
        text: 'Import failed: Damaged or invalid patient dossier file.'
      });
      return false;
    }
  }

  public purgeSave(): void {
    if (this.autoSaveDebounceTimer !== null) {
      window.clearTimeout(this.autoSaveDebounceTimer);
      this.autoSaveDebounceTimer = null;
    }

    const storage = this.getStorage();
    if (storage) {
      try {
        storage.removeItem(SaveManager.PRIMARY_STORAGE_KEY);
        storage.removeItem(SaveManager.LEGACY_STORAGE_KEY);
      } catch (err) {
        this.telemetry.record('warn', `LocalStorage removal failed: ${String(err)}`);
      }
    }

    this.inMemoryFallback = null;
    this.lastKnownRoomId = 'room_04';
    this.currentSettings = {};
    this.gameState.resetToBaseline();

    this.eventBus.emit('save:cleared', {});
    this.telemetry.record('info', 'Patient record purged. System reset to baseline.');
  }
}
