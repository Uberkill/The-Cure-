import { DiegeticScreenBase } from './DiegeticScreenBase';
import { Act04AudiologyState } from '../../types/cure';
import { AudioEngine } from '../../audio/AudioEngine';
import { CrystalId } from '../../types';
import { BINAURAL_HTML_TEMPLATE } from './binaural/BinauralTemplate';
import { BinauralAudio } from './binaural/BinauralAudio';
import { ChladniRenderer } from './binaural/ChladniRenderer';

export class BinauralSynthesizerScreen extends DiegeticScreenBase<Act04AudiologyState> {
  public readonly id: string = 'screen-binaural-synthesizer';

  private state: Act04AudiologyState = {
    leftHornAngleDeg: 0,
    rightHornAngleDeg: 180,
    phaseInverted: false,
    carrierFreqHz: 600,
    acousticNullAchieved: false
  };

  private audioEngine: AudioEngine;
  private binauralAudio: BinauralAudio;
  private renderer: ChladniRenderer | null = null;
  private solveTimeoutId: number | null = null;

  // DOM Elements
  private sliderHornLeftEl: HTMLInputElement | null = null;
  private sliderHornRightEl: HTMLInputElement | null = null;
  private sliderFreqEl: HTMLInputElement | null = null;
  private btnPhaseEl: HTMLButtonElement | null = null;
  private labelHornLeftEl: HTMLElement | null = null;
  private labelHornRightEl: HTMLElement | null = null;
  private labelFreqEl: HTMLElement | null = null;
  private btnUnsealMonolithEl: HTMLButtonElement | null = null;

  public constructor() {
    super();
    this.audioEngine = AudioEngine.getInstance();
    this.binauralAudio = new BinauralAudio();
  }

  protected createModalElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'overlay-screen diegetic-screen-overlay hidden';
    el.setAttribute('data-testid', 'screen-binaural-synthesizer');
    el.innerHTML = BINAURAL_HTML_TEMPLATE;

    const btnClose = el.querySelector('#btn-close-binaural');
    btnClose?.addEventListener('click', () => this.close());

    const canvas = el.querySelector('#chladni-canvas') as HTMLCanvasElement;
    if (canvas) {
      this.renderer = new ChladniRenderer(canvas);
    }

    this.bindDomElements(el);
    return el;
  }

  private bindDomElements(el: HTMLElement): void {
    this.sliderHornLeftEl = el.querySelector('#slider-horn-left');
    this.sliderHornRightEl = el.querySelector('#slider-horn-right');
    this.sliderFreqEl = el.querySelector('#slider-carrier-freq');
    this.btnPhaseEl = el.querySelector('#btn-toggle-phase');

    this.labelHornLeftEl = el.querySelector('#label-horn-left');
    this.labelHornRightEl = el.querySelector('#label-horn-right');
    this.labelFreqEl = el.querySelector('#label-carrier-freq');
    this.btnUnsealMonolithEl = el.querySelector('#btn-unseal-monolith');

    this.sliderHornLeftEl?.addEventListener('input', (e) => {
      this.state.leftHornAngleDeg = parseInt((e.target as HTMLInputElement).value, 10);
      this.updateResonance();
    });

    this.sliderHornRightEl?.addEventListener('input', (e) => {
      this.state.rightHornAngleDeg = parseInt((e.target as HTMLInputElement).value, 10);
      this.updateResonance();
    });

    this.sliderFreqEl?.addEventListener('input', (e) => {
      this.state.carrierFreqHz = parseInt((e.target as HTMLInputElement).value, 10);
      this.updateResonance();
    });

    this.btnPhaseEl?.addEventListener('click', () => {
      if (this.state.acousticNullAchieved) return;
      this.state.phaseInverted = !this.state.phaseInverted;
      this.audioEngine.playTumblerClick();
      this.updateResonance();
    });

    this.btnUnsealMonolithEl?.addEventListener('click', () => {
      if (!this.checkNullCondition()) return;
      this.handleSolveTrigger();
    });
  }

  private checkNullCondition(): boolean {
    const leftOk = Math.abs(this.state.leftHornAngleDeg - 45) <= 5;
    const rightOk = Math.abs(this.state.rightHornAngleDeg - 135) <= 5;
    const phaseOk = this.state.phaseInverted;
    const freqOk = Math.abs(this.state.carrierFreqHz - 741) <= 5;
    return leftOk && rightOk && phaseOk && freqOk;
  }

  private updateResonance(): void {
    this.binauralAudio.ensureAudio(this.state.carrierFreqHz);
    const isNull = this.checkNullCondition();
    this.binauralAudio.updateResonance(this.state.carrierFreqHz, isNull);
    if (isNull && !this.state.acousticNullAchieved) {
      this.handleSolveTrigger();
    }
  }

  private handleSolveTrigger(): void {
    if (this.state.acousticNullAchieved) return;
    this.state.acousticNullAchieved = true;

    this.audioEngine.playTumblerClick();
    this.syncDom();

    this.eventBus.emit('puzzle:crystal_collected', {
      crystalId: 'crystal_03_amethyst' as CrystalId,
      label: 'Amethyst Core'
    });

    this.eventBus.emit('ui:subtitle_changed', {
      text: 'Destructive acoustic cancellation confirmed [ 45° | 135° | 180° | 741 Hz ]. Absolute room silence achieved. Amethyst Core crystal unlatched.'
    });

    this.solveTimeoutId = window.setTimeout(() => {
      this.close();
      this.solveTimeoutId = null;
    }, 1200);
  }

  protected onOpened(): void {
    this.syncDom();
    this.binauralAudio.ensureAudio(this.state.carrierFreqHz);
    if (this.renderer) {
      this.renderer.start(() => ({
        freqHz: this.state.carrierFreqHz,
        isNull: this.checkNullCondition()
      }));
    }
  }

  protected onClosed(): void {
    if (this.solveTimeoutId !== null) {
      window.clearTimeout(this.solveTimeoutId);
      this.solveTimeoutId = null;
    }
    if (this.renderer) this.renderer.stop();
    this.binauralAudio.teardownAudio();
  }

  protected handleKeyDown(e: KeyboardEvent): void {
    if (this.state.acousticNullAchieved) return;

    if (e.key === ' ') {
      e.preventDefault();
      this.state.phaseInverted = !this.state.phaseInverted;
      this.updateResonance();
    } else if (e.key === 'ArrowUp') {
      this.state.carrierFreqHz = Math.min(900, this.state.carrierFreqHz + 10);
      this.updateResonance();
    } else if (e.key === 'ArrowDown') {
      this.state.carrierFreqHz = Math.max(300, this.state.carrierFreqHz - 10);
      this.updateResonance();
    }
  }

  private syncDom(): void {
    const isLocked = this.state.acousticNullAchieved;

    if (this.sliderHornLeftEl) {
      this.sliderHornLeftEl.value = String(this.state.leftHornAngleDeg);
      this.sliderHornLeftEl.disabled = isLocked;
    }
    if (this.sliderHornRightEl) {
      this.sliderHornRightEl.value = String(this.state.rightHornAngleDeg);
      this.sliderHornRightEl.disabled = isLocked;
    }
    if (this.sliderFreqEl) {
      this.sliderFreqEl.value = String(this.state.carrierFreqHz);
      this.sliderFreqEl.disabled = isLocked;
    }

    if (this.labelHornLeftEl) this.labelHornLeftEl.textContent = `${this.state.leftHornAngleDeg}°`;
    if (this.labelHornRightEl) this.labelHornRightEl.textContent = `${this.state.rightHornAngleDeg}°`;
    if (this.labelFreqEl) this.labelFreqEl.textContent = `${this.state.carrierFreqHz} HZ`;

    if (this.btnPhaseEl) {
      this.btnPhaseEl.disabled = isLocked;
      if (this.state.phaseInverted) {
        this.btnPhaseEl.textContent = 'PHASE: 180° [INVERTED]';
        this.btnPhaseEl.classList.add('inverted');
      } else {
        this.btnPhaseEl.textContent = 'PHASE: 0° [IN-PHASE]';
        this.btnPhaseEl.classList.remove('inverted');
      }
    }

    if (this.btnUnsealMonolithEl) {
      if (isLocked) {
        this.btnUnsealMonolithEl.disabled = true;
        this.btnUnsealMonolithEl.textContent = 'ACOUSTIC NULL ACHIEVED • AMETHYST CORE RELEASED';
        this.btnUnsealMonolithEl.classList.add('unlocked');
      } else if (this.checkNullCondition()) {
        this.btnUnsealMonolithEl.disabled = false;
        this.btnUnsealMonolithEl.textContent = 'INTERFERENCE CANCELED • UNSEAL CORE';
        this.btnUnsealMonolithEl.classList.add('ready');
      } else {
        this.btnUnsealMonolithEl.disabled = true;
        this.btnUnsealMonolithEl.textContent = 'ACOUSTIC DISSONANCE ACTIVE • DESTRUCTIVE NULL REQUIRED';
        this.btnUnsealMonolithEl.classList.remove('ready', 'unlocked');
      }
    }
  }

  public getState(): Act04AudiologyState {
    return { ...this.state };
  }

  public hydrate(state: Act04AudiologyState): void {
    this.state = { ...state };
    this.syncDom();
  }

  public reset(): void {
    this.state = {
      leftHornAngleDeg: 0,
      rightHornAngleDeg: 180,
      phaseInverted: false,
      carrierFreqHz: 600,
      acousticNullAchieved: false
    };
    this.syncDom();
  }

  public stepControl(controlId: string, delta: number): void {
    if (controlId === 'horn_left') {
      this.state.leftHornAngleDeg = Math.max(0, Math.min(180, this.state.leftHornAngleDeg + delta));
      this.updateResonance();
    } else if (controlId === 'horn_right') {
      this.state.rightHornAngleDeg = Math.max(0, Math.min(180, this.state.rightHornAngleDeg + delta));
      this.updateResonance();
    } else if (controlId === 'phase_toggle') {
      this.state.phaseInverted = !this.state.phaseInverted;
      this.updateResonance();
    } else if (controlId === 'frequency') {
      this.state.carrierFreqHz = Math.max(300, Math.min(900, this.state.carrierFreqHz + delta));
      this.updateResonance();
    }
  }
}
