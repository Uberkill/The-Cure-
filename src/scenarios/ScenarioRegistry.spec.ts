// @vitest-environment jsdom
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import * as THREE from 'three';

beforeAll(() => {
  const mockCtx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 10 }),
    fillText: vi.fn(),
    createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(4) }),
    putImageData: vi.fn()
  };

  HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextId: string) => {
    if (contextId === '2d') return mockCtx;
    return null;
  });

  window.AudioContext = vi.fn().mockImplementation(() => ({
    state: 'running',
    createGain: vi.fn().mockReturnValue({
      gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn()
    }),
    createOscillator: vi.fn().mockReturnValue({
      frequency: { value: 440, setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    }),
    destination: {}
  })) as any;
});

import { ScenarioRegistry, disposeHierarchy } from './ScenarioRegistry';
import { RoomScenario } from '../types';

describe('ScenarioRegistry', () => {
  let registry: ScenarioRegistry;

  beforeEach(() => {
    registry = ScenarioRegistry.getInstance();
  });

  it('should be a singleton', () => {
    const instanceA = ScenarioRegistry.getInstance();
    const instanceB = ScenarioRegistry.getInstance();
    expect(instanceA).toBe(instanceB);
  });

  it('should retrieve registered default scenarios', () => {
    const hub = registry.getScenario('room_04');
    expect(hub).toBeDefined();
    expect(hub?.id).toBe('room_04');
    expect((hub as any)?.title).toBe('The Sterile Chamber');

    const sleepWard = registry.getScenario('sleep_ward');
    expect(sleepWard).toBeDefined();
    expect(sleepWard?.id).toBe('sleep_ward');

    const unknown = registry.getScenario('nonexistent_sector');
    expect(unknown).toBeUndefined();
  });

  it('should return null when loading non-existent scenario by id', async () => {
    const dummyScene = new THREE.Scene();
    const result = await registry.loadScenarioById('nonexistent_sector', dummyScene);
    expect(result).toBeNull();
  });

  it('should dispose geometry and materials via disposeHierarchy', () => {
    const parent = new THREE.Group();
    const geom = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshBasicMaterial();

    const geomDisposeSpy = vi.spyOn(geom, 'dispose');
    const matDisposeSpy = vi.spyOn(mat, 'dispose');

    const mesh = new THREE.Mesh(geom, mat);
    parent.add(mesh);

    disposeHierarchy(parent);

    expect(geomDisposeSpy).toHaveBeenCalled();
    expect(matDisposeSpy).toHaveBeenCalled();
  });

  it('should prevent concurrent scenario transitions when isSwitching is true', async () => {
    const dummyScene = new THREE.Scene();
    const mockGroup = new THREE.Group();

    let resolveBuild: (g: THREE.Group) => void = () => {};
    const hangingPromise = new Promise<THREE.Group>((resolve) => {
      resolveBuild = resolve;
    });

    const mockScenarioA: RoomScenario = {
      id: 'mock_a',
      title: 'Mock A',
      actTitle: 'Act A',
      roomCode: 'Room A',
      defaultHotspot: 'overview',
      hotspots: {},
      buildScene: vi.fn().mockReturnValue(hangingPromise),
      teardown: vi.fn(),
      update: vi.fn(),
      onObjectClick: vi.fn().mockReturnValue(false)
    };

    const mockScenarioB: RoomScenario = {
      id: 'mock_b',
      title: 'Mock B',
      actTitle: 'Act B',
      roomCode: 'Room B',
      defaultHotspot: 'overview',
      hotspots: {},
      buildScene: vi.fn().mockResolvedValue(new THREE.Group()),
      teardown: vi.fn(),
      update: vi.fn(),
      onObjectClick: vi.fn().mockReturnValue(false)
    };

    // Start loading scenario A (hanging)
    const loadPromiseA = registry.loadScenario(mockScenarioA, dummyScene);

    // Attempt to load scenario B while A is switching
    const resultB = await registry.loadScenario(mockScenarioB, dummyScene);
    expect(resultB).toBeNull();

    // Finish A
    resolveBuild(mockGroup);
    const resultA = await loadPromiseA;
    expect(resultA).toBe(mockGroup);
    expect(registry.getCurrentScenario()?.id).toBe('mock_a');
  });

  it('should propagate frame updates to current scenario', () => {
    const current = registry.getCurrentScenario();
    if (current) {
      const updateSpy = vi.spyOn(current, 'update');
      registry.update(0.016);
      expect(updateSpy).toHaveBeenCalledWith(0.016);
    }
  });
});
