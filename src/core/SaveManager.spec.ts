// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager } from './SaveManager';
import { GameState } from './GameState';
import { GameStage, SaveGameData } from '../types';

describe('SaveManager', () => {
  let saveManager: SaveManager;
  let gameState: GameState;

  beforeEach(() => {
    if (typeof window !== 'undefined') {
      if (!window.localStorage) {
        const store: Record<string, string> = {};
        window.localStorage = {
          getItem: (key: string) => store[key] || null,
          setItem: (key: string, value: string) => { store[key] = value; },
          removeItem: (key: string) => { delete store[key]; },
          clear: () => { Object.keys(store).forEach(k => delete store[k]); },
          length: 0,
          key: (_index: number) => null
        };
      }
      window.localStorage.clear();
    }
    gameState = GameState.getInstance();
    gameState.resetToBaseline();
    saveManager = SaveManager.getInstance();
    saveManager.setLastKnownRoomId('room_04');
  });

  it('should generate valid schema v1 save data matching baseline state', () => {
    const data = saveManager.createSaveData();
    expect(data.version).toBe(1);
    expect(data.currentStage).toBe(GameStage.ACT_1_HUB_AWAKEN);
    expect(data.currentRoomId).toBe('room_04');
    expect(data.inventory).toEqual([]);
    expect(data.collectedCrystals).toEqual([]);
    expect(data.patchedCrystals).toEqual([]);
    expect(typeof data.timestamp).toBe('number');
  });

  it('should save game data to localStorage and read it back cleanly', () => {
    gameState.addItem('prop_key');
    saveManager.setLastKnownRoomId('sleep_ward');

    const saved = saveManager.saveGame();
    expect(saved.inventory).toContain('prop_key');
    expect(saved.currentRoomId).toBe('sleep_ward');

    const loaded = saveManager.loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded?.inventory).toContain('prop_key');
    expect(loaded?.currentRoomId).toBe('sleep_ward');
  });

  it('should reject malformed or corrupted save objects during schema validation', () => {
    expect(saveManager.validateSaveData(null)).toBe(false);
    expect(saveManager.validateSaveData({})).toBe(false);
    expect(saveManager.validateSaveData({ version: 'invalid' })).toBe(false);

    // Missing currentStage or invalid enum
    const badStage = {
      version: 1,
      timestamp: Date.now(),
      currentStage: 'NON_EXISTENT_STAGE',
      currentRoomId: 'room_04',
      inventory: [],
      collectedCrystals: [],
      patchedCrystals: [],
      visitedRooms: ['room_04'],
      calibratedFrequency: 440,
      synthesisComplete: false
    };
    expect(saveManager.validateSaveData(badStage)).toBe(false);

    // Non-array inventory
    const badInventory = {
      ...badStage,
      currentStage: GameStage.ACT_1_HUB_AWAKEN,
      inventory: 'not-an-array'
    };
    expect(saveManager.validateSaveData(badInventory)).toBe(false);
  });

  it('should hydrate GameState from imported save data', () => {
    const mockSave: SaveGameData = {
      version: 1,
      timestamp: Date.now(),
      currentStage: GameStage.ACT_3_PATCH_2_COMPLETE,
      currentRoomId: 'hydrotherapy',
      inventory: ['prop_key', 'prop_brass_shunt'],
      collectedCrystals: ['crystal_01_quartz', 'crystal_02_bronze'],
      patchedCrystals: ['crystal_01_quartz', 'crystal_02_bronze'],
      pendingCrystalToPatch: null,
      calibratedFrequency: 528,
      synthesisComplete: false,
      visitedRooms: ['room_04', 'sleep_ward', 'hydrotherapy'],
      flavorIndices: { prop_key: 2 },
      settings: { masterVolume: 0.65 }
    };

    const success = saveManager.hydrateGame(mockSave);
    expect(success).toBe(true);
    expect(gameState.getStage()).toBe(GameStage.ACT_3_PATCH_2_COMPLETE);
    expect(gameState.hasItem('prop_brass_shunt')).toBe(true);
    expect(gameState.hasCrystal('crystal_01_quartz')).toBe(true);
    expect(gameState.isCrystalPatched('crystal_02_bronze')).toBe(true);
    expect(gameState.getVisitedRooms()).toContain('hydrotherapy');
  });

  it('should handle corrupted JSON in localStorage gracefully without throwing', () => {
    localStorage.setItem('the_vault_save_record', 'MALFORMED_JSON{{{');
    const loaded = saveManager.loadGame();
    expect(loaded).toBeNull();
  });

  it('should purge save records, clear localStorage, and reset GameState to Act I', () => {
    gameState.addItem('prop_key');
    gameState.transitionTo(GameStage.ACT_2_SLEEP_WARD);
    saveManager.saveGame();

    expect(localStorage.getItem('the_vault_save_record')).not.toBeNull();

    saveManager.purgeSave();

    expect(localStorage.getItem('the_vault_save_record')).toBeNull();
    expect(gameState.getStage()).toBe(GameStage.ACT_1_HUB_AWAKEN);
    expect(gameState.getInventory()).toEqual([]);
    expect(saveManager.getLastKnownRoomId()).toBe('room_04');
  });
});
