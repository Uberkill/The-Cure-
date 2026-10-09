import { EventBus } from '../core/EventBus';
import { ViewState } from '../types';
import { AudioEngine } from '../audio/AudioEngine';

export class ScreenManager {
  private currentView: ViewState = 'boot';
  private eventBus: EventBus;
  private audioEngine: AudioEngine;

  private terminalBoot!: HTMLElement;
  private introOverlay!: HTMLElement;
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
      this.terminalBoot.classList.add('hidden');
      this.switchView('chamber');
    } else {
      this.playTerminalBootSequence();
    }
  }

  private cacheDomElements(): void {
    this.terminalBoot = document.getElementById('view-terminal-boot')!;
    this.introOverlay = document.getElementById('view-intro')!;
    this.dossierModal = document.getElementById('modal-dossier')!;
    this.debriefModal = document.getElementById('modal-debrief');
    this.inspectModal = document.getElementById('modal-inspect')!;
    this.blackoutScreen = document.getElementById('view-terminal-blackout');
  }

  private playTerminalBootSequence(): void {
    const textContainer = document.getElementById('terminal-text-container')!;
    const btnInitiate = document.getElementById('btn-initiate-recovery')!;
    
    // Set initial canvas blur
    document.querySelector('canvas')?.classList.add('canvas-blur');

    const message = "SYNDICATE EMERGENCY DECREE 12\nCOGNITIVE INTAKE TERMINAL ONLINE\nINITIALIZING LIMBIC DE-COUPLING...\nSUBJECT 104 DETECTED.";
    let charIndex = 0;
    
    const typeInterval = setInterval(() => {
      textContainer.textContent = message.slice(0, charIndex) + "█";
      charIndex++;
      if (charIndex > message.length) {
        clearInterval(typeInterval);
        textContainer.textContent = message;
        btnInitiate.classList.remove('hidden');
      }
    }, 40);

    btnInitiate.addEventListener('click', () => {
      this.audioEngine.ensureContext();
      this.audioEngine.playPneumaticHiss();
      
      // Flash white
      this.terminalBoot.style.backgroundColor = '#ffffff';
      textContainer.style.opacity = '0';
      btnInitiate.style.opacity = '0';
      
      setTimeout(() => {
        this.terminalBoot.classList.add('hidden');
        
        // Start fading in 3D canvas
        document.querySelector('canvas')?.classList.remove('canvas-blur');
        document.querySelector('canvas')?.classList.add('canvas-focus');
        
        // Point camera up at ceiling immediately
        this.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'ceiling', durationMs: 0 });
        
        // Then pan down slowly
        setTimeout(() => {
          this.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'dossier_intro', durationMs: 4000 });
        }, 100);
        
        // Show dossier after pan
        setTimeout(() => {
          this.switchView('intro');
        }, 4000);
      }, 200);
    });
  }

  private setupListeners(): void {
    const btnBegin = document.getElementById('btn-begin-intake');
    btnBegin?.addEventListener('click', () => {
      this.switchView('chamber');
      // Return to overview
      this.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'overview' });
    });

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

    this.eventBus.on('inspect:open', () => {
      this.eventBus.emit('ui:modal_opened', {});
      this.inspectModal.classList.remove('hidden');
    });
  }

  public switchView(nextView: ViewState): void {
    const prevView = this.currentView;
    this.currentView = nextView;

    if (nextView === 'dossier') {
      this.eventBus.emit('ui:modal_opened', {});
    } else if (prevView === 'dossier' && nextView === 'chamber') {
      this.eventBus.emit('ui:modal_closed', {});
    }

    // Intro overlay
    if (nextView === 'intro') {
      this.introOverlay.classList.remove('hidden');
    } else {
      this.introOverlay.classList.add('hidden');
    }

    // Dossier modal
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
