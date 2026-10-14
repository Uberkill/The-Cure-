import { EventBus } from '../core/EventBus';
import { ViewState } from '../types';
import { AudioEngine } from '../audio/AudioEngine';
import { GameState } from '../core/GameState';

export class ScreenManager {
  private cinematicTimeouts: ReturnType<typeof setTimeout>[] = [];

  public clearCinematicTimers() {
    this.cinematicTimeouts.forEach(clearTimeout);
    this.cinematicTimeouts = [];
  }

  private currentView: ViewState = 'boot';
  private eventBus: EventBus;
  private audioEngine: AudioEngine;

  private mainMenuEl!: HTMLElement;
  private orientationModal!: HTMLElement;
  private dossierModal!: HTMLElement;
  private debriefModal: HTMLElement | null = null;
  private inspectModal!: HTMLElement;
  private blackoutScreen: HTMLElement | null = null;

  private orientationStep: number = 1;
  private readonly TOTAL_ORIENTATION_STEPS: number = 3;
  private orientationOpenedFromSettings: boolean = false;
  private isStartingGame: boolean = false;

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.audioEngine = AudioEngine.getInstance();

    this.cacheDomElements();
    this.setupListeners();
    this.setupOrientationListeners();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('editor')) {
      this.mainMenuEl.classList.add('hidden');
      this.switchView('chamber');
    } else {
      this.setupMainMenu();
    }
  }

  private cacheDomElements(): void {
    this.mainMenuEl = document.getElementById('view-main-menu')!;
    this.orientationModal = document.getElementById('view-orientation')!;
    this.dossierModal = document.getElementById('modal-dossier')!;
    this.debriefModal = document.getElementById('modal-debrief');
    this.inspectModal = document.getElementById('modal-inspect')!;
    this.blackoutScreen = document.getElementById('view-terminal-blackout');
  }

  private setupMainMenu(): void {
    const btnStart = document.getElementById('btn-menu-start')!;
    const btnSettings = document.getElementById('btn-menu-settings')!;
    const btnExit = document.getElementById('btn-menu-exit')!;
    
    const isTest = new URLSearchParams(window.location.search).has('test') ||
                   new URLSearchParams(window.location.search).has('editor');

    // Set initial canvas blur
    document.querySelector('canvas')?.classList.add('canvas-blur');

    btnSettings?.addEventListener('click', () => {
      document.getElementById('modal-settings')?.classList.remove('hidden');
    });

    btnExit?.addEventListener('click', () => {
      window.location.reload();
    });

    const initiateStart = () => {
      if (this.isStartingGame) return;
      this.isStartingGame = true;

      if (btnStart instanceof HTMLButtonElement) {
        btnStart.disabled = true;
        btnStart.blur();
      }

      this.audioEngine.ensureContext();

      if (isTest) {
        this.audioEngine.playPneumaticHiss();
        this.mainMenuEl.classList.add('hidden');
        document.querySelector('canvas')?.classList.remove('canvas-blur');
        this.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'overview', durationMs: 0 });
        this.switchView('chamber');
        return;
      }

      this.mainMenuEl.style.pointerEvents = 'none';
      this.mainMenuEl.classList.add('fade-out-children');
      this.mainMenuEl.style.transition = 'opacity 0.4s ease-out';
      this.mainMenuEl.style.opacity = '0';

      this.cinematicTimeouts.push(setTimeout(() => {
        this.mainMenuEl.classList.add('hidden');
        this.openOrientationFlow(false);
      }, 400));
    };

    btnStart?.addEventListener('click', initiateStart);
  }

  private setupListeners(): void {
    const btnCloseDossier = document.getElementById('btn-close-dossier');
    const btnCloseDossierX = document.getElementById('btn-close-dossier-x');
    const handleCloseDossier = () => {
      this.switchView('chamber');
    };
    btnCloseDossier?.addEventListener('click', handleCloseDossier);
    btnCloseDossierX?.addEventListener('click', handleCloseDossier);

    
    // Dossier 3D Drag and Zoom Logic
    const dossierPaper = document.getElementById('dossier-paper-3d');
    if (dossierPaper) {
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let rotX = 0;
      let rotY = 0;
      let scaleZ = 1;

      const updateTransform = () => {
        dossierPaper.style.setProperty('--rot-x', rotX.toString());
        dossierPaper.style.setProperty('--rot-y', rotY.toString());
        dossierPaper.style.setProperty('--scale-z', scaleZ.toString());
      };

      this.dossierModal.addEventListener('mousedown', (e) => {
        if (e.target === btnCloseDossier || e.target === btnTakeDossier) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
      });

      window.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        startX = e.clientX;
        startY = e.clientY;

        rotY += deltaX * 0.5;
        rotX -= deltaY * 0.5;
        
        // Clamp X rotation to prevent flipping entirely upside down awkwardly
        rotX = Math.max(-80, Math.min(80, rotX));

        updateTransform();
      });

      window.addEventListener('pointerup', () => {
        isDragging = false;
      });

      this.dossierModal.addEventListener('wheel', (e) => {
        const target = e.target as HTMLElement;
        if (target && target.closest('.dossier-paper')) {
          return;
        }
        e.preventDefault();
        scaleZ -= e.deltaY * 0.001;
        scaleZ = Math.max(0.5, Math.min(2.5, scaleZ));
        updateTransform();
      }, { passive: false });
      
      // Reset on open
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class' && !this.dossierModal.classList.contains('hidden')) {
            rotX = 0; rotY = 0; scaleZ = 1; updateTransform();
          }
        });
      });
      observer.observe(this.dossierModal, { attributes: true });
    }

    const btnTakeDossier = document.getElementById('btn-take-dossier');
    btnTakeDossier?.addEventListener('click', () => {
      this.audioEngine.playPaperRustle();
      const gs = GameState.getInstance();
      if (!gs.hasItem('prop_envelope')) {
        gs.addItem('prop_envelope');
        this.eventBus.emit('inventory:add', { itemId: 'prop_envelope' });
        this.eventBus.emit('ui:subtitle_changed', { text: 'Intake protocol added to Asset Manifest.' });
      }
      handleCloseDossier();
    });

    // Close dossier on backdrop click outside paper
    this.dossierModal.addEventListener('click', (e) => {
      if (e.target === this.dossierModal) {
        handleCloseDossier();
      }
    });

    const btnCloseInspect = document.getElementById('btn-close-inspect');
    const btnCloseInspectX = document.getElementById('btn-close-inspect-x');
    const handleCloseInspect = () => {
      this.audioEngine.playDoorLatch();
      this.eventBus.emit('inspect:close', {});
      this.eventBus.emit('ui:modal_closed', {});
      this.inspectModal.classList.add('hidden');
      document.querySelector('.ui-layer')?.classList.remove('hidden');
      document.getElementById('inventory-bar')?.classList.remove('hidden');
    };
    btnCloseInspect?.addEventListener('click', handleCloseInspect);
    btnCloseInspectX?.addEventListener('click', handleCloseInspect);

    const btnRestart = document.getElementById('btn-terminal-restart');
    btnRestart?.addEventListener('click', () => {
      window.location.reload();
    });

    this.eventBus.on('ui:view_changed', ({ view }) => {
      this.switchView(view);
    });

    this.eventBus.on('inspect:open', ({ itemId, title, subtitle }) => {
      if (itemId) {
        if (itemId.startsWith('CR-') || itemId.startsWith('crystal')) {
          this.audioEngine.playGlassClink();
        } else if (itemId.includes('envelope') || itemId.includes('dossier') || itemId.includes('paper') || itemId.includes('ledger') || itemId.includes('slip')) {
          this.audioEngine.playPaperRustle();
        } else {
          this.audioEngine.playTumblerClick();
        }
      }
      this.eventBus.emit('ui:modal_opened', {});
      this.inspectModal.classList.remove('hidden');
      document.querySelector('.ui-layer')?.classList.add('hidden');
      document.getElementById('inventory-bar')?.classList.add('hidden');

      const titleEl = document.getElementById('inspect-title');
      if (titleEl && title) titleEl.textContent = title;

      const subtitleEl = document.getElementById('inspect-subtitle');
      if (subtitleEl && subtitle) subtitleEl.textContent = subtitle;

      const btnTake = document.getElementById('btn-take-item');
      if (btnTake) {
        if (itemId) {
          // Check if already in inventory
          const gameState = GameState.getInstance();
          if (gameState.hasItem(itemId)) {
             btnTake.classList.add('hidden');
          } else {
             btnTake.classList.remove('hidden');
             // Assign item ID so the button knows what to take
             btnTake.dataset.itemId = itemId;
          }
        } else {
          btnTake.classList.add('hidden');
        }
      }
    });

    // Add Take Item button listener
    const btnTake = document.getElementById('btn-take-item');
    if (btnTake) {
      btnTake.addEventListener('click', () => {
        const itemId = btnTake.dataset.itemId;
        if (itemId) {
          if (itemId.startsWith('CR-') || itemId.startsWith('crystal')) {
            this.audioEngine.playGlassClink();
          } else if (itemId.includes('envelope') || itemId.includes('dossier') || itemId.includes('paper') || itemId.includes('ledger') || itemId.includes('slip')) {
            this.audioEngine.playPaperRustle();
          } else {
            this.audioEngine.playTumblerClick();
          }
          this.eventBus.emit('inventory:add', { itemId });
          handleCloseInspect();
        }
      });
    }
  }

  public openOrientationFlow(fromSettings: boolean = false): void {
    this.orientationOpenedFromSettings = fromSettings;
    this.setOrientationStep(1);
    this.switchView('orientation');
  }

  private setOrientationStep(stepNum: number): void {
    if (stepNum < 1 || stepNum > this.TOTAL_ORIENTATION_STEPS) return;
    this.orientationStep = stepNum;

    for (let i = 1; i <= this.TOTAL_ORIENTATION_STEPS; i++) {
      const slide = document.getElementById(`slide-step-${i}`);
      const tab = document.getElementById(`tab-step-${i}`);
      const pip = document.getElementById(`orientation-pip-${i}`);

      if (i === this.orientationStep) {
        slide?.classList.add('active');
        tab?.classList.add('active');
        pip?.classList.add('active');
      } else {
        slide?.classList.remove('active');
        tab?.classList.remove('active');
        pip?.classList.remove('active');
      }
    }

    const pipText = document.getElementById('orientation-pip-text');
    if (pipText) {
      pipText.textContent = `STEP ${this.orientationStep} OF ${this.TOTAL_ORIENTATION_STEPS}`;
    }

    const btnPrev = document.getElementById('btn-orientation-prev') as HTMLButtonElement | null;
    const btnNext = document.getElementById('btn-orientation-next') as HTMLButtonElement | null;

    if (btnPrev) {
      btnPrev.disabled = (this.orientationStep === 1);
    }

    if (btnNext) {
      if (this.orientationStep === this.TOTAL_ORIENTATION_STEPS) {
        btnNext.textContent = this.orientationOpenedFromSettings ? 'Close Protocol' : 'Acknowledge & Awaken';
      } else {
        btnNext.textContent = 'Next Phase';
      }
    }

    this.audioEngine.playPaperRustle(0.65);
  }

  private setupOrientationListeners(): void {
    for (let i = 1; i <= this.TOTAL_ORIENTATION_STEPS; i++) {
      const tab = document.getElementById(`tab-step-${i}`);
      tab?.addEventListener('click', () => {
        this.setOrientationStep(i);
      });
    }

    const btnPrev = document.getElementById('btn-orientation-prev');
    btnPrev?.addEventListener('click', () => {
      if (this.orientationStep > 1) {
        this.setOrientationStep(this.orientationStep - 1);
      }
    });

    const btnNext = document.getElementById('btn-orientation-next');
    btnNext?.addEventListener('click', () => {
      if (this.orientationStep < this.TOTAL_ORIENTATION_STEPS) {
        this.setOrientationStep(this.orientationStep + 1);
      } else {
        this.handleCompleteOrientation();
      }
    });

    // Handle Escape and Arrow keys while orientation is open
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.currentView === 'orientation') {
        if (e.key === 'Escape') {
          e.stopImmediatePropagation();
          this.handleDismissOrientation();
        } else if (e.key === 'ArrowRight' && this.orientationStep < this.TOTAL_ORIENTATION_STEPS) {
          this.setOrientationStep(this.orientationStep + 1);
        } else if (e.key === 'ArrowLeft' && this.orientationStep > 1) {
          this.setOrientationStep(this.orientationStep - 1);
        }
      }
    }, true);

    this.eventBus.on('ui:open_orientation', () => {
      this.openOrientationFlow(true);
    });
  }

  private handleDismissOrientation(): void {
    this.audioEngine.playDoorLatch();
    if (this.orientationOpenedFromSettings) {
      this.switchView('chamber');
      document.getElementById('modal-settings')?.classList.remove('hidden');
    } else {
      // Revert to Main Menu safely without locking out start
      this.isStartingGame = false;
      const btnStart = document.getElementById('btn-menu-start') as HTMLButtonElement | null;
      if (btnStart) btnStart.disabled = false;

      this.mainMenuEl.classList.remove('hidden');
      this.mainMenuEl.classList.remove('fade-out-children');
      this.mainMenuEl.style.opacity = '1';
      this.mainMenuEl.style.pointerEvents = 'auto';

      const canvas = document.querySelector('canvas');
      canvas?.classList.remove('canvas-focus');
      canvas?.classList.add('canvas-blur');

      this.switchView('boot');
    }
  }

  private handleCompleteOrientation(): void {
    if (this.orientationOpenedFromSettings) {
      this.audioEngine.playDoorLatch();
      this.switchView('chamber');
      document.getElementById('modal-settings')?.classList.remove('hidden');
    } else {
      this.audioEngine.playPneumaticHiss();
      this.switchView('chamber');

      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.classList.remove('canvas-blur');
        canvas.classList.add('canvas-focus');
      }

      this.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'overview', durationMs: 1200 });
    }
  }

  public switchView(nextView: ViewState): void {
    const prevView = this.currentView;
    this.currentView = nextView;

    if (nextView === 'dossier') {
      this.audioEngine.playPaperRustle();
      this.eventBus.emit('ui:modal_opened', {});
    } else if (prevView === 'dossier' && nextView === 'chamber') {
      this.audioEngine.playDoorLatch();
      this.eventBus.emit('ui:modal_closed', {});
    }

    if (nextView === 'orientation') {
      this.orientationModal?.classList.remove('hidden');
      this.eventBus.emit('ui:modal_opened', {});
    } else {
      this.orientationModal?.classList.add('hidden');
      if (prevView === 'orientation') {
        this.eventBus.emit('ui:modal_closed', {});
      }
    }

    if (nextView === 'dossier') {
      this.dossierModal.classList.remove('hidden');
      const btnTake = document.getElementById('btn-take-dossier');
      if (btnTake) {
        if (GameState.getInstance().hasItem('prop_envelope')) {
          btnTake.classList.add('hidden');
        } else {
          btnTake.classList.remove('hidden');
        }
      }
    } else {
      this.dossierModal.classList.add('hidden');
    }

    // Debrief modal
    if (this.debriefModal) {
      if (nextView === 'debrief') {
        this.debriefModal.classList.remove('hidden');
      } else {
        this.debriefModal.classList.add('hidden');
      }
    }

    // Terminal Blackout screen
    if (this.blackoutScreen) {
      if (nextView === 'terminal_blackout') {
        this.blackoutScreen.classList.remove('hidden');
      } else {
        this.blackoutScreen.classList.add('hidden');
      }
    }
  }

  public getCurrentView(): ViewState {
    return this.currentView;
  }
}

