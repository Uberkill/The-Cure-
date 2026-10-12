// @vitest-environment jsdom
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { FacilityMapScreen } from './FacilityMapScreen';
import { GameState } from '../../core/GameState';
import { GameStage } from '../../types';

beforeAll(() => {
  window.AudioContext = vi.fn().mockImplementation(() => ({
    state: 'running',
    createGain: vi.fn().mockReturnValue({
      gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn()
    }),
    destination: {}
  })) as any;
});

describe('FacilityMapScreen', () => {
  let screen: FacilityMapScreen;
  let gameState: GameState;

  beforeEach(() => {
    gameState = GameState.getInstance();
    gameState.setDevStage(GameStage.ACT_1_HUB_AWAKEN);
    screen = new FacilityMapScreen();
  });

  it('should initialize with room_04 as current and selected sector', () => {
    const state = screen.getState();
    expect(state.currentRoomId).toBe('room_04');
    expect(state.selectedSectorId).toBe('room_04');
  });

  it('should unlock room_04 baseline and lock all spokes in ACT_1_HUB_AWAKEN', () => {
    expect(screen.isSectorUnlocked('room_04')).toBe(true);
    expect(screen.isSectorUnlocked('sleep_ward')).toBe(false);
    expect(screen.isSectorUnlocked('hydrotherapy')).toBe(false);
    expect(screen.isSectorUnlocked('audiology')).toBe(false);
    expect(screen.isSectorUnlocked('archive')).toBe(false);
    expect(screen.isSectorUnlocked('directors_office')).toBe(false);
    expect(screen.isSectorUnlocked('synthesis_blackout')).toBe(false);
    expect(screen.isSectorUnlocked('velvet_lounge')).toBe(false);
  });

  it('should unlock sleep_ward when corridor opens in ACT_1_HUB_CORRIDOR_OPEN', () => {
    gameState.setDevStage(GameStage.ACT_1_HUB_CORRIDOR_OPEN);
    expect(screen.isSectorUnlocked('sleep_ward')).toBe(true);
    expect(screen.isSectorUnlocked('hydrotherapy')).toBe(false);
  });

  it('should progressively unlock sectors as crystals are patched', () => {
    gameState.setDevStage(GameStage.ACT_2_PATCH_1_COMPLETE);
    expect(screen.isSectorUnlocked('hydrotherapy')).toBe(true);
    expect(screen.isSectorUnlocked('audiology')).toBe(false);

    gameState.setDevStage(GameStage.ACT_3_PATCH_2_COMPLETE);
    expect(screen.isSectorUnlocked('audiology')).toBe(true);
    expect(screen.isSectorUnlocked('archive')).toBe(false);

    gameState.setDevStage(GameStage.ACT_4_PATCH_3_COMPLETE);
    expect(screen.isSectorUnlocked('archive')).toBe(true);
    expect(screen.isSectorUnlocked('directors_office')).toBe(false);

    gameState.setDevStage(GameStage.ACT_5_PATCH_4_COMPLETE);
    expect(screen.isSectorUnlocked('directors_office')).toBe(true);
    expect(screen.isSectorUnlocked('synthesis_blackout')).toBe(false);

    gameState.setDevStage(GameStage.ACT_7_SYNTHESIS_BLACKOUT);
    expect(screen.isSectorUnlocked('synthesis_blackout')).toBe(true);
    expect(screen.isSectorUnlocked('velvet_lounge')).toBe(false);

    gameState.setDevStage(GameStage.ACT_8_VELVET_LOUNGE);
    expect(screen.isSectorUnlocked('velvet_lounge')).toBe(true);
  });

  it('should update current room and selected sector via scenario:switch_room event', () => {
    const eventBus = (screen as any).eventBus;
    eventBus.emit('scenario:switch_room', { targetRoomId: 'hydrotherapy' });
    const state = screen.getState();
    expect(state.currentRoomId).toBe('hydrotherapy');
    expect(state.selectedSectorId).toBe('hydrotherapy');
  });

  it('should correctly report sector cleared status when crystals are patched', () => {
    expect(screen.isSectorCleared('sleep_ward')).toBe(false);
    const eventBus = (screen as any).eventBus;
    eventBus.emit('puzzle:crt_patch_completed', {
      crystalId: 'crystal_01_quartz',
      log: { id: 'log_1', actTitle: 'Log 1', transcript: 'Test' }
    });
    expect(screen.isSectorCleared('sleep_ward')).toBe(true);
  });

  it('should track sector discovery (fog of war) based on visits and crystal clears', () => {
    // room_04 is baseline discovered
    expect(screen.isSectorDiscovered('room_04')).toBe(true);
    expect(screen.isSectorDiscovered('sleep_ward')).toBe(false);

    // Visiting unseals sector discovery
    gameState.markRoomVisited('sleep_ward');
    expect(screen.isSectorDiscovered('sleep_ward')).toBe(true);

    // Cleared sectors are considered discovered
    expect(screen.isSectorDiscovered('hydrotherapy')).toBe(false);
    gameState.addItem('crystal_02_bronze');
    const eventBus = (screen as any).eventBus;
    eventBus.emit('puzzle:crt_patch_completed', {
      crystalId: 'crystal_02_bronze',
      log: { id: 'log_2', actTitle: 'Log 2', transcript: 'Test' }
    });
    expect(screen.isSectorDiscovered('hydrotherapy')).toBe(true);
  });
});
