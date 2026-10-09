import { EventBus } from '../core/EventBus';
import { ViewState } from '../types';
import { AudioEngine } from '../audio/AudioEngine';
import { GameState } from '../core/GameState';

export class ScreenManager {
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
       window.close();
    });

    btnStart?.addEventListener('click', () => {
      this.audioEngine.ensureContext();
      this.audioEngine.playPneumaticHiss();
      
      if (isTest) {
        this.mainMenuEl.classList.add('hidden');
        document.querySelector('canvas')?.classList.remove('canvas-blur');
        this.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'overview', durationMs: 0 });
        this.switchView('chamber');
        return;
      }

      // Smooth white flash transition to wake up in room
      this.mainMenuEl.style.transition = 'background-color 2s ease-out, opacity 3s ease-out 2s';
      this.mainMenuEl.style.backgroundColor = '#ffffff';
      
      // Hide the menu content elements during the flash
      Array.from(this.mainMenuEl.children).forEach((child) => {
        (child as HTMLElement).style.transition = 'opacity 1s ease-out';
        (child as HTMLElement).style.opacity = '0';
      });
      
      setTimeout(() => {
        this.mainMenuEl.style.opacity = '0';
        
        setTimeout(() => {
          this.mainMenuEl.classList.add('hidden');
        }, 3000); // Wait for the 3s opacity transition to finish
        
        // Start fading in 3D canvas
        document.querySelector('canvas')?.classList.remove('canvas-blur');
        document.querySelector('canvas')?.classList.add('canvas-focus');
        
        // Wake up looking at ceiling, then pan down slowly
        this.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'ceiling', durationMs: 0 });
        
        setTimeout(() => {
          this.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'overview', durationMs: 7000 });
        }, 100);
        
        setTimeout(() => {
          this.switchView('chamber');
        }, 7000);
      }, 2000);
    });
  }

  private setupListeners(): void {
    const btnCloseDossier = document.getElementById('btn-close-dossier');
    const btnCloseDossierX = document.getElementById('btn-close-dossier-x');
    const handleCloseDossier = () => {
      this.switchView('chamber');
    };
    btnCloseDossier?.addEventListener('click', handleCloseDossier);
    btnCloseDossierX?.addEventListener('click', handleCloseDossier);

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

    // Global ESC key listener to dismiss modals or return camera to overview
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!this.inspectModal.classList.contains('hidden')) {
          handleCloseInspect();
        } else if (this.currentView === 'dossier') {
          handleCloseDossier();
        } else if (this.currentView === 'chamber') {
          this.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'overview' });
        }
      }
    });

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
