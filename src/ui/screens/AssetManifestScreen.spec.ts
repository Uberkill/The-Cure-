// @vitest-environment jsdom
import { describe, it, expect, beforeEach, beforeAll, vi, afterEach } from 'vitest';
import { AssetManifestScreen, MANIFEST_CATALOG } from './AssetManifestScreen';
import { EventBus } from '../../core/EventBus';
import { GameState } from '../../core/GameState';

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
  window.AudioContext = MockAudioContext as any;
});

describe('AssetManifestScreen', () => {
  let screen: AssetManifestScreen;
  let bus: EventBus;
  let gs: GameState;

  beforeEach(() => {
    bus = EventBus.getInstance();
    gs = GameState.getInstance();
    gs.resetToBaseline();
    screen = AssetManifestScreen.getInstance();
    screen.reset();
    if (screen.isOpen()) {
      screen.close();
    }
  });

  afterEach(() => {
    if (screen.isOpen()) {
      screen.close();
    }
  });

  it('should initialize as singleton with default hardware tray', () => {
    expect(screen).toBeDefined();
    expect(screen.id).toBe('asset_manifest');
    expect(screen.getState().activeTray).toBe('hardware');
    expect(screen.isOpen()).toBe(false);
  });

  it('should emit ui:modal_opened on open and ui:modal_closed on close', () => {
    let openedFired = false;
    let closedFired = false;

    const unsubOpen = bus.on('ui:modal_opened', () => { openedFired = true; });
    const unsubClose = bus.on('ui:modal_closed', () => { closedFired = true; });

    screen.open();
    expect(screen.isOpen()).toBe(true);
    expect(openedFired).toBe(true);

    screen.close();
    expect(screen.isOpen()).toBe(false);
    expect(closedFired).toBe(true);

    unsubOpen();
    unsubClose();
  });

  it('should open automatically upon receiving ui:open_asset_manifest event', () => {
    expect(screen.isOpen()).toBe(false);
    bus.emit('ui:open_asset_manifest', { trayId: 'crystals' });
    expect(screen.isOpen()).toBe(true);
    expect(screen.getState().activeTray).toBe('crystals');
  });

  it('should close when Escape key is pressed', () => {
    screen.open();
    expect(screen.isOpen()).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(screen.isOpen()).toBe(false);
  });

  it('should update tray badges reactively when inventory items and crystals are collected', () => {
    screen.open();
    const modalEl = document.getElementById('modal-inventory');
    const badgeHw = modalEl?.querySelector('#badge-count-hardware');
    const badgeCrys = modalEl?.querySelector('#badge-count-crystals');
    const badgeRec = modalEl?.querySelector('#badge-count-records');

    expect(badgeHw?.textContent).toBe('0');
    expect(badgeCrys?.textContent).toBe('0/5');
    expect(badgeRec?.textContent).toBe('0');

    // Add hardware item
    gs.addItem('prop_key');
    expect(badgeHw?.textContent).toBe('1');

    // Add dossier record
    gs.addItem('prop_envelope');
    expect(badgeRec?.textContent).toBe('1');

    // Add crystal
    bus.emit('puzzle:crystal_collected', { crystalId: 'crystal_01_quartz', label: 'Prismatic Quartz' });
    expect(badgeCrys?.textContent).toBe('1/5');
  });

  it('should switch trays and update active tab and item display', () => {
    gs.addItem('prop_key');
    gs.addItem('prop_envelope');
    screen.open();

    const modalEl = document.getElementById('modal-inventory');

    // Default hardware tray
    expect(screen.getState().activeTray).toBe('hardware');
    const tabHw = modalEl?.querySelector('#tab-tray-hardware');
    expect(tabHw?.classList.contains('active')).toBe(true);

    // Switch to crystals tray
    screen.selectTray('crystals');
    expect(screen.getState().activeTray).toBe('crystals');
    const tabCrys = modalEl?.querySelector('#tab-tray-crystals');
    expect(tabCrys?.classList.contains('active')).toBe(true);
    expect(tabHw?.classList.contains('active')).toBe(false);

    // Switch to records tray
    screen.selectTray('records');
    expect(screen.getState().activeTray).toBe('records');
    const tabRec = modalEl?.querySelector('#tab-tray-records');
    expect(tabRec?.classList.contains('active')).toBe(true);
  });

  it('should render orthographic blueprint and clinical metadata for selected item', () => {
    gs.addItem('prop_key');
    screen.open();
    screen.selectItem('prop_key');

    const modalEl = document.getElementById('modal-inventory');
    const detailName = modalEl?.querySelector('#manifest-detail-name');
    const detailSerial = modalEl?.querySelector('#manifest-detail-serial');
    const detailSector = modalEl?.querySelector('#manifest-detail-sector');
    const bpSvg = modalEl?.querySelector('.blueprint-svg');

    expect(detailName?.textContent).toBe(MANIFEST_CATALOG.prop_key.name);
    expect(detailSerial?.textContent).toBe(MANIFEST_CATALOG.prop_key.serialNumber);
    expect(detailSector?.textContent).toBe(MANIFEST_CATALOG.prop_key.sector);
    expect(bpSvg).not.toBeNull();
  });

  it('should render crystal pod status progression (locked -> secured -> cradled)', () => {
    screen.open();
    screen.selectTray('crystals');

    const modalEl = document.getElementById('modal-inventory');
    let cardQz = modalEl?.querySelector('[data-item-id="crystal_01_quartz"]');
    expect(cardQz?.querySelector('.status-locked')?.textContent).toBe('LOCKED IN CHAMBER');

    // Collect crystal
    bus.emit('puzzle:crystal_collected', { crystalId: 'crystal_01_quartz', label: 'Prismatic Quartz' });
    cardQz = modalEl?.querySelector('[data-item-id="crystal_01_quartz"]');
    expect(cardQz?.querySelector('.status-secured')?.textContent).toBe('SECURED IN POD');

    // Patch crystal in CRT
    bus.emit('puzzle:crt_patch_completed', {
      crystalId: 'crystal_01_quartz',
      log: {
        id: 'log_1',
        actTitle: 'Log 1',
        dateStr: '1974-10-14',
        speaker: 'Dr. Thorne',
        transcript: 'Test'
      }
    });
    cardQz = modalEl?.querySelector('[data-item-id="crystal_01_quartz"]');
    expect(cardQz?.querySelector('.status-cradled')?.textContent).toBe('CRADLED IN CRT');
  });

  it('should trigger inspect:open when clicking 3D artifact action button', () => {
    gs.addItem('prop_key');
    screen.open();
    screen.selectItem('prop_key');

    let inspectOpened = false;
    const unsub = bus.on('inspect:open', (payload) => {
      if (payload.itemId === 'prop_key') inspectOpened = true;
    });

    const modalEl = document.getElementById('modal-inventory');
    const btnInspect = modalEl?.querySelector('#btn-manifest-inspect') as HTMLButtonElement;
    expect(btnInspect).not.toBeNull();

    btnInspect.click();
    expect(inspectOpened).toBe(true);
    expect(screen.isOpen()).toBe(false);

    unsub();
  });

  it('should trigger dossier view when clicking read dossier action button', () => {
    gs.addItem('prop_envelope');
    screen.open();
    screen.selectTray('records');
    screen.selectItem('prop_envelope');

    let dossierViewTriggered = false;
    const unsub = bus.on('ui:view_changed', (payload) => {
      if (payload.view === 'dossier') dossierViewTriggered = true;
    });

    const modalEl = document.getElementById('modal-inventory');
    const btnDossier = modalEl?.querySelector('#btn-manifest-read') as HTMLButtonElement;
    expect(btnDossier).not.toBeNull();

    btnDossier.click();
    expect(dossierViewTriggered).toBe(true);
    expect(screen.isOpen()).toBe(false);

    unsub();
  });

  it('should display vacant stencil when a tray has no collected items', () => {
    screen.open();
    screen.selectTray('records'); // No records collected initially

    const modalEl = document.getElementById('modal-inventory');
    const emptySlot = modalEl?.querySelector('.manifest-empty-slot');
    expect(emptySlot).not.toBeNull();
    expect(emptySlot?.textContent).toContain('SPECIMEN POD VACANT');
  });
});
