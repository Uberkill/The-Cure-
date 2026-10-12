import { DiegeticScreenBase } from './DiegeticScreenBase';
import { Act02SleepWardState } from '../../types/cure';
import { AudioEngine } from '../../audio/AudioEngine';
import { CrystalId } from '../../types';

const CHEMICAL_OPTIONS = ['CHLORAL', 'NITROUS', 'BROMIDE', 'VALERIAN', 'SCOPOLAMINE'];

export class DispensaryCartScreen extends DiegeticScreenBase<Act02SleepWardState> {
  public readonly id: string = 'screen-dispensary-cart';

  private state: Act02SleepWardState = {
    uvLightActive: false,
    shutterUnlocked: false,
    shutterDigits: [0, 0, 0],
    ivDripBpm: 45,
    ivCalibrated: false,
    tumblerGlyphs: ['CHLORAL', 'CHLORAL', 'CHLORAL'],
    cartUnlocked: false
  };

  private audioEngine: AudioEngine;
  private shutterDialEls: HTMLButtonElement[] = [];
  private shutterStatusEl: HTMLElement | null = null;
  private infusionClusterEl: HTMLElement | null = null;
  private sliderEl: HTMLInputElement | null = null;
  private labelDripBpmEl: HTMLElement | null = null;
  private sightGlassFluidEl: HTMLElement | null = null;
  private tumblerEls: HTMLElement[] = [];
  private btnUnlockDrawerEl: HTMLElement | null = null;
  private pulseIntervalId: number | null = null;
  private solveTimeoutId: number | null = null;

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
          <div class="shutter-lock-cluster" data-testid="shutter-lock-cluster">
            <div class="shutter-header">
              <span class="shutter-title">STAGE 1: MECHANICAL SECURITY SHUTTER (INTAKE ID)</span>
              <span class="shutter-status" id="shutter-status" data-testid="shutter-status">SHUTTER ENGAGED • INTAKE ID REQUIRED</span>
            </div>
            <div class="shutter-dials" data-testid="shutter-dials">
              <button type="button" class="shutter-dial-btn" id="shutter-dial-0" data-testid="shutter-dial-0" aria-label="Rotate Shutter Tumbler 1">0</button>
              <button type="button" class="shutter-dial-btn" id="shutter-dial-1" data-testid="shutter-dial-1" aria-label="Rotate Shutter Tumbler 2">0</button>
              <button type="button" class="shutter-dial-btn" id="shutter-dial-2" data-testid="shutter-dial-2" aria-label="Rotate Shutter Tumbler 3">0</button>
            </div>
          </div>

          <div class="infusion-cluster shutter-locked" id="infusion-cluster" data-testid="infusion-cluster">
            <div class="infusion-header">
              <span class="infusion-title">STAGE 2: PERISTALTIC INFUSION & CHEMICAL TRIAD</span>
            </div>
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
                SECURITY SHUTTER LOCKED (INTAKE ID REQUIRED)
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const btnClose = el.querySelector('#btn-close-cart');
    btnClose?.addEventListener('click', () => this.close());

    this.shutterStatusEl = el.querySelector('#shutter-status') as HTMLElement;
    this.infusionClusterEl = el.querySelector('#infusion-cluster') as HTMLElement;
    this.shutterDialEls = [
      el.querySelector('#shutter-dial-0') as HTMLButtonElement,
      el.querySelector('#shutter-dial-1') as HTMLButtonElement,
      el.querySelector('#shutter-dial-2') as HTMLButtonElement
    ];

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
    this.shutterDialEls.forEach((btn, idx) => {
      btn?.addEventListener('click', () => {
        this.rotateShutterDial(idx);
      });
    });

    this.sliderEl?.addEventListener('input', () => {
      const bpm = parseInt(this.sliderEl!.value, 10);
      this.state.ivDripBpm = bpm;
      this.updatePeristalticRate();
    });

    this.tumblerEls.forEach((dialEl, idx) => {
      dialEl?.addEventListener('click', () => {
        this.rotateTumbler(idx);
      });
      dialEl?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.rotateTumbler(idx);
        }
      });
    });

    this.btnUnlockDrawerEl?.addEventListener('click', () => {
      this.handleUnlockDrawer();
    });
  }

  public rotateShutterDial(index: number): void {
    if (this.state.cartUnlocked) return;

    this.audioEngine.playTumblerClick();
    this.state.shutterDigits[index] = (this.state.shutterDigits[index] + 1) % 10;
    this.checkShutterCombination();

    this.eventBus.emit('puzzle:shutter_digits_changed', {
      digits: [...this.state.shutterDigits]
    });
  }

  public setShutterDigits(digits: [number, number, number]): void {
    this.state.shutterDigits = [...digits];
    this.checkShutterCombination();
  }

  private checkShutterCombination(): void {
    const isMatched =
      this.state.shutterDigits[0] === 1 &&
      this.state.shutterDigits[1] === 0 &&
      this.state.shutterDigits[2] === 4;

    this.state.shutterUnlocked = isMatched;

    this.shutterDialEls.forEach((btn, idx) => {
      if (btn) {
        btn.textContent = String(this.state.shutterDigits[idx]);
        if (isMatched) {
          btn.classList.add('unlocked');
        } else {
          btn.classList.remove('unlocked');
        }
      }
    });

    if (this.shutterStatusEl) {
      if (isMatched) {
        this.shutterStatusEl.textContent = 'SHUTTER RETRACTED [1-0-4] • CONSOLE READY';
        this.shutterStatusEl.classList.add('unlocked');
      } else {
        this.shutterStatusEl.textContent = 'SHUTTER ENGAGED • INTAKE ID REQUIRED [SEE CHARTS]';
        this.shutterStatusEl.classList.remove('unlocked');
      }
    }

    if (this.infusionClusterEl) {
      if (isMatched) {
        this.infusionClusterEl.classList.remove('shutter-locked');
      } else {
        this.infusionClusterEl.classList.add('shutter-locked');
      }
    }

    if (this.sliderEl) {
      this.sliderEl.disabled = this.state.cartUnlocked || !isMatched;
    }
    this.tumblerEls.forEach((el) => {
      if (el) {
        el.style.pointerEvents = this.state.cartUnlocked || !isMatched ? 'none' : 'auto';
      }
    });

    if (isMatched) {
      this.eventBus.emit('puzzle:shutter_unlocked', {});
    }

    this.checkUnlockConditions();
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

    const canUnlock = this.state.shutterUnlocked && this.state.ivCalibrated && isTriad;

    if (this.btnUnlockDrawerEl) {
      if (!this.state.shutterUnlocked) {
        this.btnUnlockDrawerEl.setAttribute('disabled', 'true');
        this.btnUnlockDrawerEl.textContent = 'SECURITY SHUTTER LOCKED (INTAKE ID REQUIRED)';
        this.btnUnlockDrawerEl.classList.remove('ready');
      } else if (canUnlock && !this.state.cartUnlocked) {
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
      if (this.state.tumblerGlyphs[idx] === correct && this.state.ivCalibrated && this.state.shutterUnlocked) {
        el.classList.add('unlocked');
      } else {
        el.classList.remove('unlocked');
      }
    });
  }

  private handleUnlockDrawer(): void {
    if (this.state.cartUnlocked || !this.state.shutterUnlocked) return;

    this.state.cartUnlocked = true;
    this.audioEngine.playPneumaticHiss();

    if (this.btnUnlockDrawerEl) {
      this.btnUnlockDrawerEl.setAttribute('disabled', 'true');
      this.btnUnlockDrawerEl.textContent = 'DRAWER UNSEALED • CRYSTAL RELEASED';
    }

    if (this.sliderEl) {
      this.sliderEl.disabled = true;
    }
    this.tumblerEls.forEach((el) => {
      if (el) el.style.pointerEvents = 'none';
    });

    this.eventBus.emit('puzzle:crystal_collected', {
      crystalId: 'crystal_01_quartz' as CrystalId,
      label: 'Prismatic Quartz'
    });

    this.eventBus.emit('ui:subtitle_changed', {
      text: 'The stainless dispensary drawer unlatches with an airlock hiss. Memory Crystal 01 (Prismatic Quartz) is secured.'
    });

    this.solveTimeoutId = window.setTimeout(() => {
      this.close();
      this.solveTimeoutId = null;
    }, 1200);
  }

  protected onOpened(): void {
    this.syncDom();
    this.startPulseAnimation(this.state.ivDripBpm);
  }

  protected onClosed(): void {
    if (this.solveTimeoutId !== null) {
      window.clearTimeout(this.solveTimeoutId);
      this.solveTimeoutId = null;
    }
    if (this.pulseIntervalId !== null) {
      window.clearInterval(this.pulseIntervalId);
      this.pulseIntervalId = null;
    }
  }

  protected handleKeyDown(_e: KeyboardEvent): void {}

  private syncDom(): void {
    this.shutterDialEls.forEach((btn, idx) => {
      if (btn) {
        btn.textContent = String(this.state.shutterDigits[idx]);
        if (this.state.shutterUnlocked) {
          btn.classList.add('unlocked');
        } else {
          btn.classList.remove('unlocked');
        }
      }
    });

    if (this.shutterStatusEl) {
      if (this.state.shutterUnlocked) {
        this.shutterStatusEl.textContent = 'SHUTTER RETRACTED [1-0-4] • CONSOLE READY';
        this.shutterStatusEl.classList.add('unlocked');
      } else {
        this.shutterStatusEl.textContent = 'SHUTTER ENGAGED • INTAKE ID REQUIRED [SEE CHARTS]';
        this.shutterStatusEl.classList.remove('unlocked');
      }
    }

    if (this.infusionClusterEl) {
      if (this.state.shutterUnlocked) {
        this.infusionClusterEl.classList.remove('shutter-locked');
      } else {
        this.infusionClusterEl.classList.add('shutter-locked');
      }
    }

    if (this.sliderEl) {
      this.sliderEl.value = String(this.state.ivDripBpm);
      this.sliderEl.disabled = this.state.cartUnlocked || !this.state.shutterUnlocked;
    }
    this.tumblerEls.forEach((el, idx) => {
      if (el) {
        el.textContent = this.state.tumblerGlyphs[idx];
        el.style.pointerEvents = this.state.cartUnlocked || !this.state.shutterUnlocked ? 'none' : 'auto';
      }
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
      shutterUnlocked: false,
      shutterDigits: [0, 0, 0],
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
