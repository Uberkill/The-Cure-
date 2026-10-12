// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import * as THREE from 'three';
import { InspectionManager } from './InspectionManager';
import { RaycastManager } from './RaycastManager';
import { GameState } from '../core/GameState';
import { EventBus } from '../core/EventBus';
import { GameStage } from '../types';

beforeAll(() => {
  class MockAudioContext {
    state = 'running';
    destination = {};
    currentTime = 0;
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
  window.AudioContext = MockAudioContext as any;
});

describe('Interaction Pipelines', () => {
  let gameState: GameState;
  let eventBus: EventBus;

  beforeEach(() => {
    gameState = GameState.getInstance();
    eventBus = EventBus.getInstance();
    gameState.setDevStage(GameStage.ACT_1_HUB_AWAKEN);
  });

  afterEach(() => {
    gameState.setDevStage(GameStage.ACT_1_HUB_AWAKEN);
  });

  describe('InspectionManager Pin Alignment', () => {
    it('should initialize 3 key pins and toggle extensions without cumulative offset drift', () => {
      const inspectionManager = new InspectionManager();
      expect(inspectionManager.getPinCount()).toBe(3);
      expect(inspectionManager.getPinExtended()).toBe(false);

      const initialOffsets = inspectionManager.getPinOffsets();

      let keyAlignedEmitted = false;
      const unsub = eventBus.on('puzzle:key_aligned', ({ pinExtended }) => {
        keyAlignedEmitted = pinExtended;
      });

      // Toggle extend
      inspectionManager.togglePins();
      expect(inspectionManager.getPinExtended()).toBe(true);
      expect(keyAlignedEmitted).toBe(true);

      const extendedOffsets = inspectionManager.getPinOffsets();
      for (let i = 0; i < extendedOffsets.length; i++) {
        expect(extendedOffsets[i]).toBeCloseTo(initialOffsets[i] + 0.05, 4);
      }

      // Toggle retract
      inspectionManager.togglePins();
      expect(inspectionManager.getPinExtended()).toBe(false);

      const retractedOffsets = inspectionManager.getPinOffsets();
      for (let i = 0; i < retractedOffsets.length; i++) {
        expect(retractedOffsets[i]).toBeCloseTo(initialOffsets[i], 4);
      }

      unsub();
    });
  });

  describe('RaycastManager Hierarchy Resolution & Stage Interlocks', () => {
    it('should resolve interactive parent across nested child meshes', () => {
      const dummyCanvas = document.createElement('canvas');
      const dummyCamera = new THREE.PerspectiveCamera();
      const dummyScene = new THREE.Scene();
      const raycastManager = new RaycastManager(dummyScene, dummyCamera, dummyCanvas);

      // Create hierarchy: root prop -> arm -> sub-mesh
      const propRoot = new THREE.Group();
      propRoot.name = 'prop_oscilloscope';

      const childArm = new THREE.Group();
      childArm.name = 'arm_bracket';
      propRoot.add(childArm);

      const childMesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
      childMesh.name = 'oscilloscope_bezel';
      childArm.add(childMesh);

      // Resolve from deepest child
      const target = raycastManager.resolveInteractiveTarget(childMesh);
      expect(target).toBe(propRoot);

      // Non-interactive mesh
      const nonInteractive = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
      nonInteractive.name = 'static_concrete_wall';
      expect(raycastManager.resolveInteractiveTarget(nonInteractive)).toBeNull();
    });

    it('should enforce exclusive target isolation when configured', () => {
      const dummyCanvas = document.createElement('canvas');
      const dummyCamera = new THREE.PerspectiveCamera();
      const dummyScene = new THREE.Scene();
      const raycastManager = new RaycastManager(dummyScene, dummyCamera, dummyCanvas);

      const propA = new THREE.Group();
      propA.name = 'prop_oscilloscope';

      const propB = new THREE.Group();
      propB.name = 'prop_vault';

      // Unrestricted mode
      expect(raycastManager.resolveInteractiveTarget(propA)).toBe(propA);
      expect(raycastManager.resolveInteractiveTarget(propB)).toBe(propB);

      // Set exclusive focus to prop_vault
      raycastManager.setExclusiveTarget('prop_vault');
      expect(raycastManager.resolveInteractiveTarget(propA)).toBeNull();
      expect(raycastManager.resolveInteractiveTarget(propB)).toBe(propB);

      // Reset exclusive target
      raycastManager.setExclusiveTarget(null);
      expect(raycastManager.resolveInteractiveTarget(propA)).toBe(propA);
    });

    it('should dynamically switch exit blastdoor interaction label based on game stage', () => {
      const dummyCanvas = document.createElement('canvas');
      const dummyCamera = new THREE.PerspectiveCamera();
      const dummyScene = new THREE.Scene();
      const raycastManager = new RaycastManager(dummyScene, dummyCamera, dummyCanvas);

      gameState.setDevStage(GameStage.ACT_1_HUB_AWAKEN);
      expect(raycastManager.resolveInteractionLabel('prop_door')).toBe('[CLICK TO INSPECT EXIT BLASTDOOR]');

      gameState.setDevStage(GameStage.ACT_4_PATCH_3_COMPLETE);
      expect(raycastManager.resolveInteractionLabel('prop_door')).toBe('[CLICK TO INSPECT EXIT BLASTDOOR]');

      gameState.setDevStage(GameStage.ACT_7_SYNTHESIS_BLACKOUT);
      expect(raycastManager.resolveInteractionLabel('prop_door')).toBe('[ENTER: VELVET LOUNGE]');

      gameState.setDevStage(GameStage.ACT_8_VELVET_LOUNGE);
      expect(raycastManager.resolveInteractionLabel('prop_door')).toBe('[ENTER: VELVET LOUNGE]');
    });
  });
});
