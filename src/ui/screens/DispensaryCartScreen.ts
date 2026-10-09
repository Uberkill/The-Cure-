import { DiegeticScreenBase } from './DiegeticScreenBase';
import { Act02SleepWardState } from '../../types/cure';

export class DispensaryCartScreen extends DiegeticScreenBase<Act02SleepWardState> {
  public readonly id: string = 'screen-dispensary-cart';

  private state: Act02SleepWardState = {
    uvLightActive: false,
    ivDripBpm: 45,
    ivCalibrated: false,
    tumblerGlyphs: ['ALPHA', 'ALPHA', 'ALPHA'],
    cartUnlocked: false
  };

  protected createModalElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'overlay-screen diegetic-screen-overlay hidden';
    el.setAttribute('data-testid', 'screen-dispensary-cart');
    el.innerHTML = `
      <div class="diegetic-housing dispensary-housing">
        <div class="diegetic-header">
          <span class="diegetic-model">MOBILE DISPENSARY CART // WARD 02</span>
          <button class="diegetic-btn-close" id="btn-close-cart" aria-label="Step back">DISENGAGE</button>
        </div>
        <div class="diegetic-body">
          <div class="drip-manometer-panel">
            <div class="sight-glass" id="cart-sight-glass"></div>
            <div class="drip-controls">
              <label>PERISTALTIC FLOW (BPM)</label>
              <input type="range" min="30" max="120" value="45" id="slider-drip-rate" data-testid="slider-drip-rate">
              <span id="label-drip-bpm">45 BPM</span>
            </div>
          </div>
          <div class="tumbler-bank" data-testid="tumbler-bank">
            <div class="tumbler-dial" id="tumbler-0">NITROUS</div>
            <div class="tumbler-dial" id="tumbler-1">BROMIDE</div>
            <div class="tumbler-dial" id="tumbler-2">VALERIAN</div>
          </div>
        </div>
      </div>
    `;
    const btnClose = el.querySelector('#btn-close-cart');
    btnClose?.addEventListener('click', () => this.close());
    return el;
  }

  protected onOpened(): void {}
  protected onClosed(): void {}
  protected handleKeyDown(_e: KeyboardEvent): void {}

  public getState(): Act02SleepWardState {
    return { ...this.state };
  }

  public hydrate(state: Act02SleepWardState): void {
    this.state = { ...state };
  }

  public reset(): void {
    this.state = {
      uvLightActive: false,
      ivDripBpm: 45,
      ivCalibrated: false,
      tumblerGlyphs: ['ALPHA', 'ALPHA', 'ALPHA'],
      cartUnlocked: false
    };
  }

  public stepControl(controlId: string, delta: number): void {
    if (controlId === 'drip') {
      this.state.ivDripBpm = Math.max(30, Math.min(120, this.state.ivDripBpm + delta));
    }
  }
}
