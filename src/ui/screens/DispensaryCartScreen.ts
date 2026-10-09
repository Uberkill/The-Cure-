import { DiegeticScreenBase } from './DiegeticScreenBase';
import { Act02SleepWardState } from '../../types/cure';
import { AudioEngine } from '../../audio/AudioEngine';
import { CrystalId } from '../../types';

const CHEMICAL_OPTIONS = ['CHLORAL', 'NITROUS', 'BROMIDE', 'VALERIAN', 'SCOPOLAMINE'];

export class DispensaryCartScreen extends DiegeticScreenBase<Act02SleepWardState> {
  public readonly id: string = 'screen-dispensary-cart';

  private state: Act02SleepWardState = {
    uvLightActive: false,
    ivDripBpm: 45,
    ivCalibrated: false,
    tumblerGlyphs: ['CHLORAL', 'CHLORAL', 'CHLORAL'],
    cartUnlocked: false
  };

  private audioEngine: AudioEngine;
  private sliderEl: HTMLInputElement | null = null;
  private labelDripBpmEl: HTMLElement | null = null;
  private sightGlassFluidEl: HTMLElement | null = null;
  private tumblerEls: HTMLElement[] = [];
  private btnUnlockDrawerEl: HTMLElement | null = null;
  private pulseIntervalId: number | null = null;

  public constructor() {
    super();
    this.audioEngine = AudioEngine.getInstance();
  }

  protected createModalElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'overlay-screen diegetic-screen-overlay hidden';
    el.setAttribute('data-testid', 'screen-dispensary-cart');
    el.innerHTML = `
      <div class="diegetic-housing dispensary-housing">
        <div class="diegetic-header">
          <span class="diegetic-model">MOBILE DISPENSARY CART // WARD 02 • SEDATIVE CALIBRATION</span>
          <button class="diegetic-btn-close" id="btn-close-cart" aria-label="Step back">DISENGAGE</button>
        </div>
        <div class="diegetic-body">
          <div class="drip-manometer-panel">
            <div class="sight-glass" id="cart-sight-glass">
              <div class="sight-glass-fluid" id="sight-glass-fluid"></div>
            </div>
            <div class="drip-controls">
              <label for="slider-drip-rate">PERISTALTIC INFUSION RATE (BPM)</label>
              <input type="range" min="30" max="120" value="45" id="slider-drip-rate" data-testid="slider-drip-rate">
              <span id="label-drip-bpm" data-testid="label-drip-bpm">45 BPM (ARRHYTHMIC)</span>
            </div>
          </div>
          <div class="tumbler-bank" data-testid="tumbler-bank">
            <div class="tumbler-dial" id="tumbler-0" data-testid="tumbler-0" role="button" tabindex="0">CHLORAL</div>
            <div class="tumbler-dial" id="tumbler-1" data-testid="tumbler-1" role="button" tabindex="0">CHLORAL</div>
            <div class="tumbler-dial" id="tumbler-2" data-testid="tumbler-2" role="button" tabindex="0">CHLORAL</div>
          </div>
          <div class="switch-cluster">
            <button class="knife-switch-handle" id="btn-unlock-drawer" disabled data-testid="btn-unlock-drawer">
              DISPENSARY DRAWER LOCKED
            </button>
          </div>
        </div>
      </div>
    `;

    const btnClose = el.querySelector('#btn-close-cart');
    btnClose?.addEventListener('click', () => this.close());

    this.sliderEl = el.querySelector('#slider-drip-rate') as HTMLInputElement;
    this.labelDripBpmEl = el.querySelector('#label-drip-bpm') as HTMLElement;
    this.sightGlassFluidEl = el.querySelector('#sight-glass-fluid') as HTMLElement;
    this.btnUnlockDrawerEl = el.querySelector('#btn-unlock-drawer') as HTMLElement;

    this.tumblerEls = [
      el.querySelector('#tumbler-0') as HTMLElement,
      el.querySelector('#tumbler-1') as HTMLElement,
      el.querySelector('#tumbler-2') as HTMLElement
    ];

    this.bindControlEvents();

    return el;
  }

  private bindControlEvents(): void {
    this.sliderEl?.addEventListener('input', () => {
      const bpm = parseInt(this.sliderEl!.value, 10);
      this.state.ivDripBpm = bpm;
      this.updatePeristalticRate();
    });

    this.tumblerEls.forEach((dialEl, idx) => {
      dialEl?.addEventListener('click', () => {
        this.rotateTumbler(idx);
      });
    });

    this.btnUnlockDrawerEl?.addEventListener('click', () => {
      this.handleUnlockDrawer();
    });
  }

  private rotateTumbler(index: number): void {
    if (this.state.cartUnlocked) return;

    this.audioEngine.playTumblerClick();
    const current = this.state.tumblerGlyphs[index];
    const currIdx = CHEMICAL_OPTIONS.indexOf(current);
    const nextIdx = (currIdx + 1) % CHEMICAL_OPTIONS.length;
    this.state.tumblerGlyphs[index] = CHEMICAL_OPTIONS[nextIdx];

    if (this.tumblerEls[index]) {
      this.tumblerEls[index].textContent = this.state.tumblerGlyphs[index];
    }

    this.checkUnlockConditions();
  }

  private updatePeristalticRate(): void {
    const bpm = this.state.ivDripBpm;
    // Calibrated target: 68 BPM (resting cardiac synchronization)
    const isCalibrated = Math.abs(bpm - 68) <= 1;
    this.state.ivCalibrated = isCalibrated;

    if (this.labelDripBpmEl) {
      if (isCalibrated) {
        this.labelDripBpmEl.textContent = '68 BPM • CARDIAC REST SYNC ACHIEVED';
        this.labelDripBpmEl.style.color = 'var(--color-crt-phosphor)';
      } else {
        this.labelDripBpmEl.textContent = `${bpm} BPM (ARRHYTHMIC)`;
        this.labelDripBpmEl.style.color = '#7d8c83';
      }
    }

    this.startPulseAnimation(bpm);
    this.checkUnlockConditions();
  }

  private startPulseAnimation(bpm: number): void {
    if (this.pulseIntervalId !== null) {
      window.clearInterval(this.pulseIntervalId);
      this.pulseIntervalId = null;
    }

    const intervalMs = Math.max(300, (60 / bpm) * 1000);
    this.pulseIntervalId = window.setInterval(() => {
      if (this.sightGlassFluidEl) {
        this.sightGlassFluidEl.style.height = '75%';
        window.setTimeout(() => {
          if (this.sightGlassFluidEl) {
            this.sightGlassFluidEl.style.height = '45%';
          }
        }, intervalMs * 0.35);
      }
    }, intervalMs);
  }

  private checkUnlockConditions(): void {
    const isTriad =
      this.state.tumblerGlyphs[0] === 'NITROUS' &&
      this.state.tumblerGlyphs[1] === 'BROMIDE' &&
      this.state.tumblerGlyphs[2] === 'VALERIAN';

    const canUnlock = this.state.ivCalibrated && isTriad;

    if (this.btnUnlockDrawerEl) {
      if (canUnlock && !this.state.cartUnlocked) {
        this.btnUnlockDrawerEl.removeAttribute('disabled');
        this.btnUnlockDrawerEl.textContent = 'RELEASE DISPENSARY DRAWER';
        this.btnUnlockDrawerEl.classList.add('ready');
      } else if (!this.state.cartUnlocked) {
        this.btnUnlockDrawerEl.setAttribute('disabled', 'true');
        this.btnUnlockDrawerEl.textContent = 'DISPENSARY DRAWER LOCKED';
        this.btnUnlockDrawerEl.classList.remove('ready');
      }
    }

    this.tumblerEls.forEach((el, idx) => {
      const correct = ['NITROUS', 'BROMIDE', 'VALERIAN'][idx];
      if (this.state.tumblerGlyphs[idx] === correct && this.state.ivCalibrated) {
        el.classList.add('unlocked');
      } else {
        el.classList.remove('unlocked');
      }
    });
  }

  private handleUnlockDrawer(): void {
    if (this.state.cartUnlocked) return;

    this.state.cartUnlocked = true;
    this.audioEngine.playPneumaticHiss();

    if (this.btnUnlockDrawerEl) {
      this.btnUnlockDrawerEl.setAttribute('disabled', 'true');
      this.btnUnlockDrawerEl.textContent = 'DRAWER UNSEALED • CRYSTAL RELEASED';
    }

    this.eventBus.emit('puzzle:crystal_collected', {
      crystalId: 'crystal_01_quartz' as CrystalId,
      label: 'Prismatic Quartz'
    });

    this.eventBus.emit('ui:subtitle_changed', {
      text: 'The stainless dispensary drawer unlatches with an airlock hiss. Memory Crystal 01 (Prismatic Quartz) is secured.'
    });

    window.setTimeout(() => {
      this.close();
    }, 1200);
  }

  protected onOpened(): void {
    this.syncDom();
    this.startPulseAnimation(this.state.ivDripBpm);
  }

  protected onClosed(): void {
    if (this.pulseIntervalId !== null) {
      window.clearInterval(this.pulseIntervalId);
      this.pulseIntervalId = null;
    }
  }

  protected handleKeyDown(_e: KeyboardEvent): void {}

  private syncDom(): void {
    if (this.sliderEl) {
      this.sliderEl.value = String(this.state.ivDripBpm);
    }
    this.tumblerEls.forEach((el, idx) => {
      if (el) el.textContent = this.state.tumblerGlyphs[idx];
    });
    this.updatePeristalticRate();
  }

  public getState(): Act02SleepWardState {
    return { ...this.state };
  }

  public hydrate(state: Act02SleepWardState): void {
    this.state = { ...state };
    this.syncDom();
  }

  public reset(): void {
    this.state = {
      uvLightActive: false,
      ivDripBpm: 45,
      ivCalibrated: false,
      tumblerGlyphs: ['CHLORAL', 'CHLORAL', 'CHLORAL'],
      cartUnlocked: false
    };
    this.syncDom();
  }

  public stepControl(controlId: string, delta: number): void {
    if (controlId === 'drip') {
      this.state.ivDripBpm = Math.max(30, Math.min(120, this.state.ivDripBpm + delta));
      this.syncDom();
    }
  }
}
