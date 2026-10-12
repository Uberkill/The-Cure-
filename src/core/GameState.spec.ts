// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState } from './GameState';
import { EventBus } from './EventBus';
import { GameStage } from '../types';

describe('GameState', () => {
  let gameState: GameState;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = EventBus.getInstance();
    gameState = GameState.getInstance();
    gameState.setDevStage(GameStage.ACT_1_HUB_AWAKEN);
  });

  it('should be a singleton', () => {
    const instance1 = GameState.getInstance();
    const instance2 = GameState.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should handle inventory updates correctly', () => {
    expect(gameState.hasItem('test_item')).toBe(false);
    gameState.addItem('test_item');
    expect(gameState.hasItem('test_item')).toBe(true);
    expect(gameState.getInventory()).toContain('test_item');
  });

  it('should maintain independent inventory items without coupling', () => {
    expect(gameState.hasItem('prop_envelope')).toBe(false);
    expect(gameState.hasItem('prop_brass_shunt')).toBe(false);

    gameState.addItem('prop_envelope');
    expect(gameState.hasItem('prop_envelope')).toBe(true);
    expect(gameState.hasItem('prop_brass_shunt')).toBe(false);
  });

  it('should transition stages and emit events', () => {
    const spy = vi.fn();
    // @ts-ignore
    eventBus.on('game:stage_transition', spy);
    
    gameState.transitionTo(GameStage.ACT_1_HUB_CORRIDOR_OPEN);
    
    expect(gameState.getStage()).toBe(GameStage.ACT_1_HUB_CORRIDOR_OPEN);
    expect(spy).toHaveBeenCalledWith({
      from: GameStage.ACT_1_HUB_AWAKEN,
      to: GameStage.ACT_1_HUB_CORRIDOR_OPEN
    });
  });

  it('should process puzzle:crystal_collected events via EventBus', () => {
    // @ts-ignore
    eventBus.emit('puzzle:crystal_collected', { crystalId: 'crystal_01_quartz' });
    expect(gameState.hasCrystal('crystal_01_quartz' as any)).toBe(true);
    expect(gameState.getPendingCrystal()).toBe('crystal_01_quartz');
    expect(gameState.getStage()).toBe(GameStage.ACT_2_CRYSTAL_1_RECOVERED);
  });

  it('should track room visits and handle stage reset', () => {
    expect(gameState.hasVisitedRoom('room_04')).toBe(true);
    expect(gameState.hasVisitedRoom('sleep_ward')).toBe(false);

    gameState.markRoomVisited('sleep_ward');
    expect(gameState.hasVisitedRoom('sleep_ward')).toBe(true);
    expect(gameState.getVisitedRooms()).toContain('sleep_ward');

    // Test EventBus scenario:switch_room auto-tracking
    eventBus.emit('scenario:switch_room', { targetRoomId: 'hydrotherapy' });
    expect(gameState.hasVisitedRoom('hydrotherapy')).toBe(true);

    // Resetting stage resets visited rooms to room_04
    gameState.setDevStage(GameStage.ACT_1_HUB_AWAKEN);
    expect(gameState.hasVisitedRoom('room_04')).toBe(true);
    expect(gameState.hasVisitedRoom('sleep_ward')).toBe(false);
    expect(gameState.hasVisitedRoom('hydrotherapy')).toBe(false);
  });
});
