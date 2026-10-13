// @vitest-environment jsdom
import { describe, it, expect, beforeEach, beforeAll, vi, afterEach } from 'vitest';
import { StaffRosterScreen, STAFF_DOSSIERS } from './StaffRosterScreen';
import { EventBus } from '../../core/EventBus';

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

describe('StaffRosterScreen', () => {
  let screen: StaffRosterScreen;
  let bus: EventBus;

  beforeEach(() => {
    bus = EventBus.getInstance();
    screen = StaffRosterScreen.getInstance();
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

  it('should initialize with rostova as baseline active dossier', () => {
    const state = screen.getState();
    expect(state.activeStaffId).toBe('rostova');
  });

  it('should create and mount diegetic DOM elements with 5 staff tabs', () => {
    screen.open();
    expect(screen.isOpen()).toBe(true);

    const modalEl = document.getElementById('screen-staff-roster');
    expect(modalEl).not.toBeNull();

    const tabs = ['rostova', 'thorne', 'vance', 'cross', 'vandermeer'];
    tabs.forEach((staffId) => {
      const tabBtn = document.getElementById(`tab-staff-${staffId}`);
      expect(tabBtn).not.toBeNull();
    });

    const activeTab = document.querySelector('.staff-tab-btn.active');
    expect(activeTab?.getAttribute('data-staff')).toBe('rostova');
  });

  it('should render roster details, shift logs, and personal journal for Rostova', () => {
    screen.open('rostova');
    const headerEl = document.getElementById('dossier-header');
    expect(headerEl?.textContent).toContain('ORDERLY K. ROSTOVA');
    expect(headerEl?.textContent).toContain('ORD-74-099');

    const logTbody = document.getElementById('duty-log-tbody');
    expect(logTbody?.textContent).toContain('Terrazzo floor polished');

    const journalEl = document.getElementById('personal-journal');
    expect(journalEl?.textContent).toContain('synchronous slave clock stuttered backwards');

    const stampEl = document.getElementById('stamp-badge-text');
    expect(stampEl?.textContent).toBe('DUTY CYCLE VERIFIED');
  });

  it('should deep-link directly to Dr. Thorne tab when specified in open()', () => {
    screen.open('thorne');
    expect(screen.getState().activeStaffId).toBe('thorne');

    const headerEl = document.getElementById('dossier-header');
    expect(headerEl?.textContent).toContain('DR. ARIS THORNE');
    expect(headerEl?.textContent).toContain('MED-71-402');

    const journalEl = document.getElementById('personal-journal');
    expect(journalEl?.textContent).toContain('WHO AM I');
    expect(journalEl?.textContent).toContain('mnemonic quartz crystal');
  });

  it('should respond to ui:open_staff_roster event with target staffId', () => {
    bus.emit('ui:open_staff_roster', { staffId: 'vance' });
    expect(screen.isOpen()).toBe(true);
    expect(screen.getState().activeStaffId).toBe('vance');

    const headerEl = document.getElementById('dossier-header');
    expect(headerEl?.textContent).toContain('SENIOR TECHNICIAN M. VANCE');

    const clueEl = document.getElementById('dossier-clue-summary');
    expect(clueEl?.textContent).toContain('600 Hz');
    expect(clueEl?.textContent).toContain('180 deg');
  });

  it('should switch tabs on tab button click', () => {
    screen.open();
    const crossBtn = document.getElementById('tab-staff-cross') as HTMLButtonElement;
    expect(crossBtn).not.toBeNull();

    crossBtn.click();
    expect(screen.getState().activeStaffId).toBe('cross');

    const headerEl = document.getElementById('dossier-header');
    expect(headerEl?.textContent).toContain('ARCHIVIST EVELYN CROSS');

    const journalEl = document.getElementById('personal-journal');
    expect(journalEl?.textContent).toContain('four "Evelyn Crosses"');
  });

  it('should cycle through staff dossiers using stepControl and keyboard navigation', () => {
    screen.open('rostova');

    screen.stepControl('tab', 1);
    expect(screen.getState().activeStaffId).toBe('thorne');

    screen.stepControl('tab', 1);
    expect(screen.getState().activeStaffId).toBe('vance');

    screen.stepControl('tab', -1);
    expect(screen.getState().activeStaffId).toBe('thorne');

    const eventRight = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    window.dispatchEvent(eventRight);
    expect(screen.getState().activeStaffId).toBe('vance');

    const eventLeft = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
    window.dispatchEvent(eventLeft);
    expect(screen.getState().activeStaffId).toBe('thorne');
  });

  it('should close cleanly when clicking close button', () => {
    screen.open();
    expect(screen.isOpen()).toBe(true);

    const closeBtn = document.getElementById('btn-close-roster') as HTMLButtonElement;
    expect(closeBtn).not.toBeNull();

    closeBtn.click();
    expect(screen.isOpen()).toBe(false);
  });

  it('should verify all 5 dossiers have required clinical and lore fields', () => {
    const keys = Object.keys(STAFF_DOSSIERS);
    expect(keys).toEqual(['rostova', 'thorne', 'vance', 'cross', 'vandermeer']);

    keys.forEach((key) => {
      const dossier = STAFF_DOSSIERS[key];
      expect(dossier.name).toBeTruthy();
      expect(dossier.role).toBeTruthy();
      expect(dossier.serialNumber).toBeTruthy();
      expect(dossier.clearance).toBeTruthy();
      expect(dossier.shiftHours).toBeTruthy();
      expect(dossier.dutyLogs.length).toBeGreaterThan(0);
      expect(dossier.clinicalNotes).toBeTruthy();
      expect(dossier.personalJournal).toBeTruthy();
      expect(dossier.puzzleClueSummary).toBeTruthy();
    });
  });
});
