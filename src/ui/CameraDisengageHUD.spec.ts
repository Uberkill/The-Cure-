// @vitest-environment jsdom
import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { EventBus } from '../core/EventBus';
import { UIManager } from './UIManager';

beforeAll(() => {
  class MockAudioContext {
    state = 'running';
    destination = {};
    currentTime = 0;
    sampleRate = 44100;
    createGain() {
      return {
        gain: {
          value: 1,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn()
        },
        connect: vi.fn(),
        disconnect: vi.fn()
      };
    }
    createOscillator() {
      return {
        type: 'sine',
        frequency: {
          value: 440,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn()
        },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn()
      };
    }
    createBuffer() {
      return {
        getChannelData: () => new Float32Array(100)
      };
    }
    createBufferSource() {
      return {
        buffer: null,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn()
      };
    }
    createBiquadFilter() {
      return {
        type: 'bandpass',
        frequency: { value: 1000, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        Q: { value: 1, setValueAtTime: vi.fn() },
        connect: vi.fn()
      };
    }
    createDynamicsCompressor() {
      const createParam = (val: number) => ({
        value: val,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn()
      });
      return {
        threshold: createParam(-24),
        knee: createParam(30),
        ratio: createParam(12),
        attack: createParam(0.003),
        release: createParam(0.25),
        connect: vi.fn()
      };
    }
  }

  (window as any).AudioContext = MockAudioContext;
  (window as any).webkitAudioContext = MockAudioContext;
});

describe('Camera Disengage & Overview Reset HUD', () => {
  let eventBus: EventBus;
  let uiManager: UIManager;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="observation-subtitle"></div>
      <div class="center-reticle-wrap"></div>
      <div id="reticle-prompt"></div>
      <div id="telemetry-status"></div>
      <div id="cinematic-header"></div>
      <div id="act-tag-text"></div>
      <div id="film-title-text"></div>
      <div id="film-subtitle-text"></div>

      <div style="position: absolute; top: 32px; left: 32px;">
        <button class="camera-disengage-btn hidden" id="btn-camera-disengage" title="Step Back [ESC]" aria-label="Return to room overview" aria-hidden="true">
          <span class="btn-disengage-icon">
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M9 14l-4-4 4-4"></path></svg>
          </span>
          <span class="key-badge">ESC</span>
          <span class="nav-label">STEP BACK</span>
          <span class="nav-target" id="nav-disengage-target">// OVERVIEW</span>
        </button>
      </div>

      <div class="overlay-screen hidden" id="modal-settings">
        <button id="btn-settings-toggle"></button>
        <button id="btn-close-settings"></button>
        <button id="btn-close-settings-x"></button>
        <input type="range" id="setting-volume" value="0.8">
        <input type="range" id="setting-sfx-volume" value="0.8">
        <input type="range" id="setting-ambient-volume" value="0.6">
        <input type="checkbox" id="setting-parallax" checked>
        <div id="volume-val"></div>
        <div id="sfx-val"></div>
        <div id="ambient-val"></div>
        <div id="save-room-name"></div>
        <div id="save-stage-name"></div>
        <div id="save-crystals-count"></div>
        <div id="save-timestamp-label"></div>
        <button id="btn-save-game"></button>
        <button id="btn-export-save"></button>
        <button id="btn-import-save"></button>
        <input type="file" id="input-import-save">
        <button id="btn-reset-save"></button>
        <button id="btn-recenter-camera"></button>
        <div id="settings-telemetry"></div>
      </div>
    `;

    eventBus = EventBus.getInstance();
    uiManager = new UIManager();
  });

  afterEach(() => {
    uiManager.destroy();
    eventBus.clear();
    vi.restoreAllMocks();
  });

  it('should initialize with dormant/hidden disengage button at room overview', () => {
    const btn = document.getElementById('btn-camera-disengage');
    expect(btn?.classList.contains('hidden')).toBe(true);
    expect(btn?.getAttribute('aria-hidden')).toBe('true');
    expect(uiManager.getCurrentHotspot()).toBe('overview');
  });

  it('should reveal disengage button when moving to focused camera hotspot', () => {
    const btn = document.getElementById('btn-camera-disengage');
    const targetLabel = document.getElementById('nav-disengage-target');

    eventBus.emit('camera:move_to_hotspot', { hotspotId: 'telephone' });

    expect(btn?.classList.contains('hidden')).toBe(false);
    expect(btn?.getAttribute('aria-hidden')).toBe('false');
    expect(targetLabel?.textContent).toBe('// TELEPHONE');
    expect(uiManager.getCurrentHotspot()).toBe('telephone');
  });

  it('should hide button when returning to overview', () => {
    const btn = document.getElementById('btn-camera-disengage');

    eventBus.emit('camera:move_to_hotspot', { hotspotId: 'vault' });
    expect(btn?.classList.contains('hidden')).toBe(false);

    eventBus.emit('camera:move_to_hotspot', { hotspotId: 'overview' });
    expect(btn?.classList.contains('hidden')).toBe(true);
    expect(btn?.getAttribute('aria-hidden')).toBe('true');
    expect(uiManager.getCurrentHotspot()).toBe('overview');
  });

  it('should emit camera:move_to_hotspot overview when clicking disengage button', () => {
    const btn = document.getElementById('btn-camera-disengage');
    eventBus.emit('camera:move_to_hotspot', { hotspotId: 'manifold' });

    let disengagedHotspot: string | null = null;
    eventBus.on('camera:move_to_hotspot', ({ hotspotId }) => {
      disengagedHotspot = hotspotId;
    });

    btn?.click();
    expect(disengagedHotspot).toBe('overview');
  });

  it('should trigger disengage on Escape keydown when no modal is active', () => {
    eventBus.emit('camera:move_to_hotspot', { hotspotId: 'microfiche' });

    let disengagedHotspot: string | null = null;
    eventBus.on('camera:move_to_hotspot', ({ hotspotId }) => {
      disengagedHotspot = hotspotId;
    });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(disengagedHotspot).toBe('overview');
  });

  it('should prioritize closing modal over disengaging camera on Escape', () => {
    eventBus.emit('camera:move_to_hotspot', { hotspotId: 'trolley' });

    const modalSettings = document.getElementById('modal-settings');
    modalSettings?.classList.remove('hidden');

    let disengagedCalled = false;
    eventBus.on('camera:move_to_hotspot', () => {
      disengagedCalled = true;
    });

    // First ESC: dismisses modal
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(modalSettings?.classList.contains('hidden')).toBe(true);
    expect(disengagedCalled).toBe(false);

    // Second ESC: now disengages camera
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(disengagedCalled).toBe(true);
  });

  it('should reset hotspot tracking and hide button on room transition', () => {
    const btn = document.getElementById('btn-camera-disengage');
    eventBus.emit('camera:move_to_hotspot', { hotspotId: 'switchboard' });
    expect(btn?.classList.contains('hidden')).toBe(false);

    eventBus.emit('scenario:switch_room', { targetRoomId: 'sleep_ward' });
    expect(btn?.classList.contains('hidden')).toBe(true);
    expect(uiManager.getCurrentHotspot()).toBe('overview');
  });
});
