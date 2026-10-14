// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { Dev3DEditorPanel } from './Dev3DEditorPanel';

describe('Dev3DEditorPanel - Lore & Multi-Stage Flavor Text', () => {
  let panel: Dev3DEditorPanel;
  let mockScene: THREE.Scene;
  let mockCameraDirector: any;
  let mockGizmo: any;
  let mockRenderer: any;
  let selectedObjects: THREE.Object3D[] = [];

  beforeEach(() => {
    document.body.innerHTML = '';

    mockScene = new THREE.Scene();
    mockCameraDirector = {
      orbitControls: {},
      snapToPreset: vi.fn(),
      currentPreset: 'MAIN'
    };

    mockGizmo = {
      onSelectionChange: null,
      onTransformChange: null,
      getSelectedObjects: () => selectedObjects,
      attachMultiple: vi.fn(),
      syncTransform: vi.fn(),
      setEnabled: vi.fn(),
      setMode: vi.fn(),
      setSnap: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn()
    };

    mockRenderer = {
      info: {
        render: { calls: 10, triangles: 1000 },
        memory: { geometries: 5, textures: 2 },
        programs: []
      },
      domElement: document.createElement('canvas')
    };

    panel = new Dev3DEditorPanel(
      mockScene,
      mockCameraDirector as any,
      mockGizmo as any,
      mockRenderer as any
    );
  });

  afterEach(() => {
    selectedObjects = [];
    const panelEl = document.getElementById('dev-3d-editor-panel');
    if (panelEl) panelEl.remove();
  });

  it('should disable inputs and show notice when no object is selected', () => {
    expect(panel).toBeDefined();
    const promptInput = document.getElementById('dev-lore-prompt') as HTMLInputElement;
    const addBtn = document.getElementById('dev-btn-lore-add-flavor') as HTMLButtonElement;
    const saveBtn = document.getElementById('dev-btn-lore-save') as HTMLButtonElement;
    const list = document.getElementById('dev-lore-flavor-list') as HTMLElement;

    expect(promptInput.disabled).toBe(true);
    expect(addBtn.disabled).toBe(true);
    expect(saveBtn.disabled).toBe(true);
    expect(list.textContent).toContain('Select a single interactive prop to inspect and edit lore.');
  });

  it('should populate single empty stage for prop without prior flavor text', () => {
    const prop = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    prop.name = 'prop_exam_table';
    prop.userData = { interactionPrompt: '[EXAMINE TABLE]' };
    selectedObjects = [prop];

    // Trigger selection
    if (mockGizmo.onSelectionChange) {
      mockGizmo.onSelectionChange([prop]);
    }

    const promptInput = document.getElementById('dev-lore-prompt') as HTMLInputElement;
    const list = document.getElementById('dev-lore-flavor-list') as HTMLElement;
    const cards = list.querySelectorAll('.dev-lore-stage-card');

    expect(promptInput.disabled).toBe(false);
    expect(promptInput.value).toBe('[EXAMINE TABLE]');
    expect(cards.length).toBe(1);

    const badge = cards[0].querySelector('.dev-lore-stage-badge');
    expect(badge?.textContent).toBe('STAGE 1 (CLICK #1)');
  });

  it('should populate multiple stage cards when prop has flavorText array', () => {
    const prop = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    prop.name = 'prop_somnology_cot';
    prop.userData = {
      interactionPrompt: '[EXAMINE COT]',
      flavorText: [
        'Observation 1: Stained linen mattress.',
        'Observation 2: Deep fingernail gouges under frame.',
        'Observation 3: Sedative canister mounting clip.'
      ]
    };
    selectedObjects = [prop];

    if (mockGizmo.onSelectionChange) {
      mockGizmo.onSelectionChange([prop]);
    }

    const list = document.getElementById('dev-lore-flavor-list') as HTMLElement;
    const cards = list.querySelectorAll('.dev-lore-stage-card');
    expect(cards.length).toBe(3);

    const inputs = list.querySelectorAll<HTMLTextAreaElement>('.dev-lore-stage-input');
    expect(inputs[0].value).toBe('Observation 1: Stained linen mattress.');
    expect(inputs[1].value).toBe('Observation 2: Deep fingernail gouges under frame.');
    expect(inputs[2].value).toBe('Observation 3: Sedative canister mounting clip.');
  });

  it('should dynamically append a new stage when clicking + ADD STAGE', () => {
    const prop = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    prop.name = 'prop_desk';
    prop.userData = {
      interactionPrompt: '[EXAMINE DESK]',
      flavorText: ['Initial note.']
    };
    selectedObjects = [prop];

    if (mockGizmo.onSelectionChange) {
      mockGizmo.onSelectionChange([prop]);
    }

    const addBtn = document.getElementById('dev-btn-lore-add-flavor') as HTMLButtonElement;
    addBtn.click();

    const list = document.getElementById('dev-lore-flavor-list') as HTMLElement;
    const cards = list.querySelectorAll('.dev-lore-stage-card');
    expect(cards.length).toBe(2);

    const badge2 = cards[1].querySelector('.dev-lore-stage-badge');
    expect(badge2?.textContent).toBe('STAGE 2 (CLICK #2)');
  });

  it('should remove stage card and re-index remaining badges upon clicking DEL', () => {
    const prop = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    prop.name = 'prop_filing_cabinet';
    prop.userData = {
      interactionPrompt: '[EXAMINE CABINET]',
      flavorText: ['Stage A', 'Stage B', 'Stage C']
    };
    selectedObjects = [prop];

    if (mockGizmo.onSelectionChange) {
      mockGizmo.onSelectionChange([prop]);
    }

    const list = document.getElementById('dev-lore-flavor-list') as HTMLElement;
    let cards = list.querySelectorAll('.dev-lore-stage-card');
    expect(cards.length).toBe(3);

    // Delete stage 2 ('Stage B')
    const delBtnStage2 = cards[1].querySelector<HTMLButtonElement>('.dev-btn-lore-del-stage');
    delBtnStage2?.click();

    cards = list.querySelectorAll('.dev-lore-stage-card');
    expect(cards.length).toBe(2);

    const inputs = list.querySelectorAll<HTMLTextAreaElement>('.dev-lore-stage-input');
    expect(inputs[0].value).toBe('Stage A');
    expect(inputs[1].value).toBe('Stage C');

    const badges = list.querySelectorAll('.dev-lore-stage-badge');
    expect(badges[0].textContent).toBe('STAGE 1 (CLICK #1)');
    expect(badges[1].textContent).toBe('STAGE 2 (CLICK #2)');
  });

  it('should harvest and serialize stages to string[] on Apply & Save Lore', () => {
    const prop = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    prop.name = 'prop_credenza';
    prop.userData = {
      interactionPrompt: '[OLD PROMPT]',
      flavorText: ['Old note']
    };
    selectedObjects = [prop];

    if (mockGizmo.onSelectionChange) {
      mockGizmo.onSelectionChange([prop]);
    }

    const promptInput = document.getElementById('dev-lore-prompt') as HTMLInputElement;
    promptInput.value = '[INSPECT CREDENZA]';

    const addBtn = document.getElementById('dev-btn-lore-add-flavor') as HTMLButtonElement;
    addBtn.click(); // Now has 2 stages

    const list = document.getElementById('dev-lore-flavor-list') as HTMLElement;
    const inputs = list.querySelectorAll<HTMLTextAreaElement>('.dev-lore-stage-input');
    inputs[0].value = 'Polished mahogany surface.';
    inputs[1].value = 'Lower drawer contains acoustic wax cylinders.';

    const saveBtn = document.getElementById('dev-btn-lore-save') as HTMLButtonElement;
    saveBtn.click();

    expect(prop.userData.interactionPrompt).toBe('[INSPECT CREDENZA]');
    expect(Array.isArray(prop.userData.flavorText)).toBe(true);
    expect(prop.userData.flavorText).toEqual([
      'Polished mahogany surface.',
      'Lower drawer contains acoustic wax cylinders.'
    ]);
    expect(prop.userData.isModified).toBe(true);
  });
});
