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
  private dossierModal!: HTMLElement;
  private debriefModal: HTMLElement | null = null;
  private inspectModal!: HTMLElement;
  private blackoutScreen: HTMLElement | null = null;

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.audioEngine = AudioEngine.getInstance();

    this.cacheDomElements();
    this.setupListeners();

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
    this.dossierModal = document.getElementById('modal-dossier')!;
    this.debriefModal = document.getElementById('modal-debrief');
    this.inspectModal = document.getElementById('modal-inspect')!;
    this.blackoutScreen = document.getElementById('view-terminal-blackout');
  }

    private setupMainMenu(): void {
    const btnStart = document.getElementById('btn-menu-start')!;
    const btnSettings = document.getElementById('btn-menu-settings')!;
    const btnExit = document.getElementById('btn-menu-exit')!;
    
    const isTest = new URLSearchParams(window.location.search).has('test');

    // Set initial canvas blur
    document.querySelector('canvas')?.classList.add('canvas-blur');

    btnSettings?.addEventListener('click', () => {
      document.getElementById('modal-settings')?.classList.remove('hidden');
    });

    btnExit?.addEventListener('click', () => {
      window.location.reload();
    });

    let isStarting = false;

    const initiateStart = () => {
      if (isStarting) return;
      isStarting = true;

      if (btnStart instanceof HTMLButtonElement) {
        btnStart.disabled = true;
        btnStart.blur();
      }

      this.audioEngine.ensureContext();
      this.audioEngine.playPneumaticHiss();

      if (isTest) {
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

      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.classList.remove('canvas-blur');
        canvas.classList.add('canvas-focus');
      }

      this.cinematicTimeouts.push(setTimeout(() => {
        this.mainMenuEl.classList.add('hidden');
        this.switchView('chamber');
        this.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'overview', durationMs: 1200 });
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
      this.audioEngine.playTumblerClick();
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
          this.eventBus.emit('inventory:add', { itemId });
          // Optional: sound effect here via EventBus or direct AudioEngine call
          handleCloseInspect();
        }
      });
    }
  }

  public switchView(nextView: ViewState): void {
    const prevView = this.currentView;
    this.currentView = nextView;

    if (nextView === 'dossier') {
      this.eventBus.emit('ui:modal_opened', {});
    } else if (prevView === 'dossier' && nextView === 'chamber') {
      this.eventBus.emit('ui:modal_closed', {});
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
