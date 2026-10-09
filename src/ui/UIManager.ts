import { EventBus } from '../core/EventBus';
import { GameStage } from '../types';
import { GameState } from '../core/GameState';

export class UIManager {
  private eventBus: EventBus;

  private subtitleEl!: HTMLElement;
  private reticleWrapEl!: HTMLElement;
  private reticlePromptEl!: HTMLElement;
  private telemetryEl!: HTMLElement;
  private freqConsoleEl!: HTMLElement;
  private freqSlider!: HTMLInputElement;
  private freqValueEl!: HTMLElement;
  private btnSwitch!: HTMLButtonElement;

  private cinematicHeaderEl!: HTMLElement;
  private actTagTextEl!: HTMLElement;
  private filmTitleTextEl!: HTMLElement;
  private filmSubtitleTextEl!: HTMLElement;
  private chapterFadeTimeout: number | null = null;

  private modalSettingsEl!: HTMLElement;
  private settingVolume!: HTMLInputElement;
  private settingParallax!: HTMLInputElement;
  private settingScanlines!: HTMLInputElement;

  constructor() {
    this.eventBus = EventBus.getInstance();

    this.cacheDomElements();
    this.setupListeners();
    this.setupSettingsModal();
    this.setupAudioButtons();
    this.setupFrequencyControls();
  }

  private cacheDomElements(): void {
    this.subtitleEl = document.getElementById('observation-subtitle')!;
    this.reticleWrapEl = document.querySelector('.center-reticle-wrap') as HTMLElement;
    this.reticlePromptEl = document.getElementById('reticle-prompt')!;
    this.telemetryEl = document.getElementById('telemetry-status')!;
    this.freqConsoleEl = document.getElementById('freq-console')!;
    this.freqSlider = document.getElementById('slider-freq') as HTMLInputElement;
    this.freqValueEl = document.getElementById('freq-val')!;
    this.btnSwitch = document.getElementById('btn-throw-switch') as HTMLButtonElement;

    this.cinematicHeaderEl = document.getElementById('cinematic-header')!;
    this.actTagTextEl = document.getElementById('act-tag-text')!;
    this.filmTitleTextEl = document.getElementById('film-title-text')!;
    this.filmSubtitleTextEl = document.getElementById('film-subtitle-text')!;

    this.modalSettingsEl = document.getElementById('modal-settings')!;
    this.settingVolume = document.getElementById('setting-volume') as HTMLInputElement;
    this.settingParallax = document.getElementById('setting-parallax') as HTMLInputElement;
    this.settingScanlines = document.getElementById('setting-scanlines') as HTMLInputElement;
  }

  private setupListeners(): void {
    window.addEventListener('mousemove', (e) => {
      if (this.reticleWrapEl) {
        this.reticleWrapEl.style.left = `${e.clientX}px`;
        this.reticleWrapEl.style.top = `${e.clientY}px`;
      }
    });

    this.eventBus.on('ui:subtitle_changed', ({ text }) => {
      this.subtitleEl.textContent = text;
      this.subtitleEl.style.opacity = '1';
    });

    this.eventBus.on('input:object_hovered', ({ label }) => {
      if (label) {
        this.reticlePromptEl.textContent = label;
        this.reticlePromptEl.style.opacity = '1';
      } else {
        this.reticlePromptEl.style.opacity = '0';
      }
    });

    this.eventBus.on('ui:chapter_display', ({ act, title }) => {
      this.displayChapterCard(act, title);
    });

    this.eventBus.on('telemetry:log', ({ level, message }) => {
      if (this.telemetryEl) {
        this.telemetryEl.textContent = `DIAGNOSTIC: ${message.slice(0, 40)}`;
        if (level === 'error') {
          this.telemetryEl.style.color = 'var(--color-crimson-wax)';
        } else {
          this.telemetryEl.style.color = 'var(--ink-muted)';
        }
      }
    });

    this.eventBus.on('camera:move_to_hotspot', ({ hotspotId }) => {
      const stage = GameState.getInstance().getStage();
      if (hotspotId === 'vault' && stage === GameStage.ACT_1_HUB_AWAKEN) {
        this.freqConsoleEl.classList.remove('hidden');
      } else {
        this.freqConsoleEl.classList.add('hidden');
      }
    });

    this.eventBus.on('scenario:switch_room', () => {
      this.freqConsoleEl.classList.add('hidden');
    });

    this.eventBus.on('inspect:open', () => {
      this.freqConsoleEl.classList.add('hidden');
    });

    this.eventBus.on('ui:modal_opened', () => {
      this.freqConsoleEl.classList.add('hidden');
    });

    this.eventBus.on('game:stage_transition', ({ to }) => {
      if (to !== GameStage.ACT_1_HUB_AWAKEN) {
        this.freqConsoleEl.classList.add('hidden');
      }
    });

    // Initial persistent chapter display
    this.displayChapterCard('ACT I • THE RECEPTION', 'The Sterile Chamber');
  }

  private displayChapterCard(act: string, title: string): void {
    if (!this.cinematicHeaderEl) return;

    if (this.chapterFadeTimeout !== null) {
      window.clearTimeout(this.chapterFadeTimeout);
      this.chapterFadeTimeout = null;
    }

    this.actTagTextEl.textContent = act;
    this.filmTitleTextEl.textContent = title;
    this.filmSubtitleTextEl.textContent = 'Sanatorium of Cognitive Alignment';
    this.cinematicHeaderEl.classList.remove('faded');
    this.cinematicHeaderEl.style.opacity = '1';
  }

  private setupSettingsModal(): void {
    const btnToggle = document.getElementById('btn-settings-toggle');
    const btnClose = document.getElementById('btn-close-settings');
    const btnCloseX = document.getElementById('btn-close-settings-x');

    const openSettings = () => {
      this.modalSettingsEl.classList.remove('hidden');
      this.eventBus.emit('ui:modal_opened', {});
    };

    const closeSettings = () => {
      this.modalSettingsEl.classList.add('hidden');
      this.eventBus.emit('ui:modal_closed', {});
    };

    btnToggle?.addEventListener('click', openSettings);
    btnClose?.addEventListener('click', closeSettings);
    btnCloseX?.addEventListener('click', closeSettings);

    this.modalSettingsEl.addEventListener('click', (e) => {
      if (e.target === this.modalSettingsEl) {
        closeSettings();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        let handled = false;
        if (!this.modalSettingsEl.classList.contains('hidden')) {
          closeSettings();
          handled = true;
        }
        
        const dossierEl = document.getElementById('modal-dossier');
        if (dossierEl && !dossierEl.classList.contains('hidden')) {
          dossierEl.classList.add('hidden');
          this.eventBus.emit('ui:modal_closed', {});
          handled = true;
        }

        const inspectEl = document.getElementById('modal-inspect');
        if (inspectEl && !inspectEl.classList.contains('hidden')) {
          inspectEl.classList.add('hidden');
          this.eventBus.emit('inspect:close', {});
          handled = true;
        }

        if (!handled) {
          // If no modal was open, back out of cinematic views
          this.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'overview' });
        }
      }
    });

    this.settingVolume?.addEventListener('input', () => {
      const vol = parseFloat(this.settingVolume.value);
      this.eventBus.emit('settings:updated', { masterVolume: vol });
    });

    this.settingParallax?.addEventListener('change', () => {
      this.eventBus.emit('settings:updated', { mouseParallax: this.settingParallax.checked });
    });

    this.settingScanlines?.addEventListener('change', () => {
      const scanlines = document.querySelector('.crt-scanline-mesh') as HTMLElement;
      if (scanlines) {
        scanlines.style.display = this.settingScanlines.checked ? 'block' : 'none';
      }
    });
  }

  private setupAudioButtons(): void {
    const btnDrone = document.getElementById('btn-drone');
    btnDrone?.addEventListener('click', () => {
      btnDrone.classList.toggle('active');
      this.eventBus.emit('audio:toggle_synth', {
        type: 'drone',
        active: btnDrone.classList.contains('active')
      });
    });

    const btnBallast = document.getElementById('btn-flicker');
    btnBallast?.addEventListener('click', () => {
      btnBallast.classList.toggle('active');
      this.eventBus.emit('audio:toggle_synth', {
        type: 'ballast',
        active: btnBallast.classList.contains('active')
      });
    });

    const btnPhone = document.getElementById('btn-phone');
    btnPhone?.addEventListener('click', () => {
      btnPhone.classList.toggle('active');
      this.eventBus.emit('audio:toggle_synth', {
        type: 'phone',
        active: btnPhone.classList.contains('active')
      });
    });
  }

  private setupFrequencyControls(): void {
    this.freqSlider?.addEventListener('input', () => {
      const freq = parseInt(this.freqSlider.value, 10);
      this.freqValueEl.textContent = `${freq} Hz`;

      const isResonating = Math.abs(freq - 528) <= 2;
      this.eventBus.emit('puzzle:frequency_changed', {
        frequency: freq,
        isResonating
      });

      if (isResonating) {
        this.freqValueEl.style.color = 'var(--color-crt-amber)';
        this.btnSwitch.disabled = false;
        this.btnSwitch.classList.add('ready');
      } else {
        this.freqValueEl.style.color = 'var(--color-crt-phosphor)';
        this.btnSwitch.disabled = true;
        this.btnSwitch.classList.remove('ready');
      }
    });

    this.btnSwitch?.addEventListener('click', () => {
      this.eventBus.emit('puzzle:switch_thrown', {});
      this.btnSwitch.disabled = true;
      this.freqConsoleEl.classList.add('hidden');
    });
  }
}
