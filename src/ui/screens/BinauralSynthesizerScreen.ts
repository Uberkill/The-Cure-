import { DiegeticScreenBase } from './DiegeticScreenBase';
import { Act04AudiologyState } from '../../types/cure';

export class BinauralSynthesizerScreen extends DiegeticScreenBase<Act04AudiologyState> {
  public readonly id: string = 'screen-binaural-synthesizer';

  private state: Act04AudiologyState = {
    leftHornAngleDeg: 0,
    rightHornAngleDeg: 180,
    phaseInverted: false,
    carrierFreqHz: 440,
    acousticNullAchieved: false
  };

  protected createModalElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'overlay-screen diegetic-screen-overlay hidden';
    el.setAttribute('data-testid', 'screen-binaural-synthesizer');
    el.innerHTML = `
      <div class="diegetic-housing binaural-housing">
        <div class="diegetic-header">
          <span class="diegetic-model">ACOUSTIC ATTENUATION BRIDGE // VAULT 04</span>
          <button class="diegetic-btn-close" id="btn-close-binaural" aria-label="Step back">DISENGAGE</button>
        </div>
        <div class="diegetic-body">
          <canvas id="chladni-canvas" width="400" height="400"></canvas>
          <div class="acoustic-controls">
            <button id="btn-toggle-phase" data-testid="btn-toggle-phase">PHASE INVERSION [0 DEG]</button>
            <input type="range" min="300" max="900" value="440" id="slider-carrier-freq" data-testid="slider-carrier-freq">
          </div>
        </div>
      </div>
    `;
    const btnClose = el.querySelector('#btn-close-binaural');
    btnClose?.addEventListener('click', () => this.close());
    return el;
  }

  protected onOpened(): void {}
  protected onClosed(): void {}
  protected handleKeyDown(_e: KeyboardEvent): void {}

  public getState(): Act04AudiologyState {
    return { ...this.state };
  }

  public hydrate(state: Act04AudiologyState): void {
    this.state = { ...state };
  }

  public reset(): void {
    this.state = {
      leftHornAngleDeg: 0,
      rightHornAngleDeg: 180,
      phaseInverted: false,
      carrierFreqHz: 440,
      acousticNullAchieved: false
    };
  }

  public stepControl(_controlId: string, _delta: number): void {}
}
