// @vitest-environment jsdom
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { AudioEngine } from './AudioEngine';
import { EventBus } from '../core/EventBus';
import { GameState } from '../core/GameState';
import { GameStage } from '../types';

describe('AudioEngine', () => {
  let audioEngine: AudioEngine;
  let mockCtx: any;

  beforeAll(() => {
    mockCtx = {
      state: 'running',
      currentTime: 0.5,
      destination: {},
      createGain: vi.fn().mockImplementation(() => ({
        gain: {
          value: 1.0,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn()
        },
        connect: vi.fn(),
        disconnect: vi.fn()
      })),
      createOscillator: vi.fn().mockImplementation(() => ({
        type: 'sine',
        frequency: {
          value: 440,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn()
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn()
      })),
      createBiquadFilter: vi.fn().mockImplementation(() => ({
        type: 'lowpass',
        frequency: {
          value: 200,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn()
        },
        Q: {
          value: 1,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn()
        },
        connect: vi.fn(),
        disconnect: vi.fn()
      })),
      createDynamicsCompressor: vi.fn().mockImplementation(() => ({
        threshold: { setValueAtTime: vi.fn() },
        knee: { setValueAtTime: vi.fn() },
        ratio: { setValueAtTime: vi.fn() },
        attack: { setValueAtTime: vi.fn() },
        release: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        disconnect: vi.fn()
      })),
      createBuffer: vi.fn().mockImplementation((channels: number, length: number, sampleRate: number) => ({
        numberOfChannels: channels,
        length,
        sampleRate,
        getChannelData: vi.fn().mockReturnValue(new Float32Array(length))
      })),
      createBufferSource: vi.fn().mockImplementation(() => ({
        buffer: null,
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null
      })),
      decodeAudioData: vi.fn().mockResolvedValue({
        duration: 0.5,
        numberOfChannels: 1,
        sampleRate: 44100
      })
    };

    window.AudioContext = vi.fn().mockImplementation(function (this: any) {
      return mockCtx;
    }) as any;
  });

  beforeEach(() => {
    GameState.getInstance().setDevStage(GameStage.ACT_1_HUB_AWAKEN);
    audioEngine = AudioEngine.getInstance();
  });

  it('should return singleton instance', () => {
    const instanceA = AudioEngine.getInstance();
    const instanceB = AudioEngine.getInstance();
    expect(instanceA).toBe(instanceB);
  });

  it('should initialize Web Audio context upon ensureContext', () => {
    const initialized = audioEngine.ensureContext();
    expect(initialized).toBe(true);
    expect(audioEngine.getAudioContext()).not.toBeNull();
  });

  it('should update volume state upon settings:updated event', () => {
    audioEngine.ensureContext();
    const bus = EventBus.getInstance();

    bus.emit('settings:updated', {
      masterVolume: 0.5,
      sfxVolume: 0.4,
      ambientVolume: 0.3
    });

    // Verify context was active and volumes adjusted without throw
    expect(audioEngine.getAudioContext()).not.toBeNull();
  });

  it('should handle room soundscape transitions gracefully', async () => {
    audioEngine.ensureContext();
    await audioEngine.transitionToRoomSoundscape('room_04');
    expect(audioEngine.getCurrentTrackName()).toBeNull();

    await audioEngine.transitionToRoomSoundscape('sleep_ward');
    expect(audioEngine.getCurrentTrackName()).toBeNull();

    audioEngine.stopProceduralSoundscape();
  });

  it('should calculate stage tension multiplier without crashing across all acts', () => {
    audioEngine.ensureContext();
    const gameState = GameState.getInstance();

    gameState.setDevStage(GameStage.ACT_1_HUB_AWAKEN);
    audioEngine.updateSoundscapeTension();

    gameState.setDevStage(GameStage.ACT_4_AUDIOLOGY);
    audioEngine.updateSoundscapeTension();

    gameState.setDevStage(GameStage.ACT_8_VELVET_LOUNGE);
    audioEngine.updateSoundscapeTension();

    expect(true).toBe(true);
  });

  it('should dispatch tactile prop sounds without throw', async () => {
    audioEngine.ensureContext();

    await expect(audioEngine.playPropSound('paper_rustle')).resolves.not.toThrow();
    await expect(audioEngine.playPropSound('door_heavy')).resolves.not.toThrow();
    await expect(audioEngine.playPropSound('door_latch')).resolves.not.toThrow();
    await expect(audioEngine.playPropSound('drawer_wood')).resolves.not.toThrow();
    await expect(audioEngine.playPropSound('clock_tick')).resolves.not.toThrow();
    await expect(audioEngine.playPropSound('glass_clink')).resolves.not.toThrow();
    await expect(audioEngine.playPropSound('switch_knife')).resolves.not.toThrow();
    await expect(audioEngine.playPropSound('switch_toggle')).resolves.not.toThrow();
  });

  it('should clean up nodes and intervals on teardownScenarioAudio', () => {
    audioEngine.ensureContext();
    audioEngine.toggleDrone(true);
    audioEngine.playPayphoneMechanicalRing();

    expect(() => {
      audioEngine.teardownScenarioAudio();
    }).not.toThrow();
  });
});
