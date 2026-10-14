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

  describe('Multi-Click Sequential Flavor Cycling & Scenario Interlocks', () => {
    it('should track and advance object flavor indices independently', () => {
      expect(gameState.getFlavorIndex('prop_chair')).toBe(0);
      expect(gameState.getFlavorIndex('prop_desk')).toBe(0);

      gameState.incrementFlavorIndex('prop_chair');
      expect(gameState.getFlavorIndex('prop_chair')).toBe(1);
      expect(gameState.getFlavorIndex('prop_desk')).toBe(0);

      gameState.incrementFlavorIndex('prop_chair');
      gameState.incrementFlavorIndex('prop_desk');
      expect(gameState.getFlavorIndex('prop_chair')).toBe(2);
      expect(gameState.getFlavorIndex('prop_desk')).toBe(1);

      const indices = gameState.getFlavorIndices();
      expect(indices['prop_chair']).toBe(2);
      expect(indices['prop_desk']).toBe(1);
    });

    it('should hydrate flavor indices across save game cycles', () => {
      gameState.incrementFlavorIndex('prop_chair');
      gameState.incrementFlavorIndex('prop_chair');
      gameState.incrementFlavorIndex('prop_desk');

      const savedIndices = gameState.getFlavorIndices();

      gameState.loadFromSaveData({
        version: 1,
        timestamp: Date.now(),
        currentStage: GameStage.ACT_1_HUB_AWAKEN,
        currentRoomId: 'room_04',
        inventory: [],
        collectedCrystals: [],
        patchedCrystals: [],
        pendingCrystalToPatch: null,
        calibratedFrequency: 440,
        synthesisComplete: false,
        visitedRooms: ['room_04'],
        flavorIndices: savedIndices,
        settings: {}
      });

      expect(gameState.getFlavorIndex('prop_chair')).toBe(2);
      expect(gameState.getFlavorIndex('prop_desk')).toBe(1);
      expect(gameState.getFlavorIndex('prop_planter')).toBe(0);
    });

    it('should cycle through multi-stage flavor text sequentially and wrap around', () => {
      const stages = [
        'STAGE 1: Steel frame bolted into bedrock.',
        'STAGE 2: Scratches near the baseplate suggest repeated restraint.',
        'STAGE 3: The vinyl covering is cold and non-porous.'
      ];

      const emittedSubtitles: string[] = [];
      const unsub = eventBus.on('ui:subtitle_changed', ({ text }) => {
        emittedSubtitles.push(text);
      });

      const handleObjectClick = (objectId: string, flavorText?: string | string[]) => {
        if (flavorText) {
          if (Array.isArray(flavorText)) {
            if (flavorText.length === 0) return;
            const idx = gameState.getFlavorIndex(objectId);
            const text = flavorText[idx % flavorText.length];
            gameState.incrementFlavorIndex(objectId);
            eventBus.emit('ui:subtitle_changed', { text });
          } else {
            eventBus.emit('ui:subtitle_changed', { text: flavorText });
          }
        }
      };

      // Click 1 -> Stage 1
      handleObjectClick('prop_chair_test', stages);
      expect(emittedSubtitles[0]).toBe(stages[0]);

      // Click 2 -> Stage 2
      handleObjectClick('prop_chair_test', stages);
      expect(emittedSubtitles[1]).toBe(stages[1]);

      // Click 3 -> Stage 3
      handleObjectClick('prop_chair_test', stages);
      expect(emittedSubtitles[2]).toBe(stages[2]);

      // Click 4 -> Wraps back to Stage 1
      handleObjectClick('prop_chair_test', stages);
      expect(emittedSubtitles[3]).toBe(stages[0]);

      // Click 5 -> Stage 2
      handleObjectClick('prop_chair_test', stages);
      expect(emittedSubtitles[4]).toBe(stages[1]);

      unsub();
    });

    it('should handle single-string and empty flavor text safely', () => {
      const emittedSubtitles: string[] = [];
      const unsub = eventBus.on('ui:subtitle_changed', ({ text }) => {
        emittedSubtitles.push(text);
      });

      const handleObjectClick = (objectId: string, flavorText?: string | string[]) => {
        if (flavorText) {
          if (Array.isArray(flavorText)) {
            if (flavorText.length === 0) return;
            const idx = gameState.getFlavorIndex(objectId);
            const text = flavorText[idx % flavorText.length];
            gameState.incrementFlavorIndex(objectId);
            eventBus.emit('ui:subtitle_changed', { text });
          } else {
            eventBus.emit('ui:subtitle_changed', { text: flavorText });
          }
        }
      };

      // Single string
      handleObjectClick('prop_single', 'Single observation.');
      expect(emittedSubtitles).toContain('Single observation.');

      // Empty array should be safely ignored
      handleObjectClick('prop_empty', []);
      expect(emittedSubtitles.length).toBe(1);

      unsub();
    });

    it('should respect scenario interception and delegation logic', () => {
      const emittedSubtitles: string[] = [];
      const unsub = eventBus.on('ui:subtitle_changed', ({ text }) => {
        emittedSubtitles.push(text);
      });

      let scenarioHandled = false;
      const mockScenario = {
        onObjectClick: (id: string) => {
          if (id === 'prop_puzzle_terminal') {
            scenarioHandled = true;
            return true; // Intercepted
          }
          if (id === 'prop_chair_delegated') {
            return false; // Delegated
          }
          return false;
        }
      };

      const dispatchClick = (objectId: string, flavorText?: string | string[]) => {
        if (typeof mockScenario.onObjectClick === 'function') {
          const handled = mockScenario.onObjectClick(objectId);
          if (handled) return;
        }
        if (flavorText) {
          if (Array.isArray(flavorText)) {
            if (flavorText.length === 0) return;
            const idx = gameState.getFlavorIndex(objectId);
            const text = flavorText[idx % flavorText.length];
            gameState.incrementFlavorIndex(objectId);
            eventBus.emit('ui:subtitle_changed', { text });
          } else {
            eventBus.emit('ui:subtitle_changed', { text: flavorText });
          }
        }
      };

      // Intercepted prop: scenario handles, no subtitle emitted
      dispatchClick('prop_puzzle_terminal', ['Stage A', 'Stage B']);
      expect(scenarioHandled).toBe(true);
      expect(emittedSubtitles.length).toBe(0);

      // Delegated prop: scenario returns false, subtitle emitted and cycles
      dispatchClick('prop_chair_delegated', ['Stage A', 'Stage B']);
      expect(emittedSubtitles.length).toBe(1);
      expect(emittedSubtitles[0]).toBe('Stage A');

      dispatchClick('prop_chair_delegated', ['Stage A', 'Stage B']);
      expect(emittedSubtitles.length).toBe(2);
      expect(emittedSubtitles[1]).toBe('Stage B');

      unsub();
    });
  });
});
