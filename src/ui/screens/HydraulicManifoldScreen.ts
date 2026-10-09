import { DiegeticScreenBase } from './DiegeticScreenBase';
import { Act03HydrotherapyState } from '../../types/cure';

export class HydraulicManifoldScreen extends DiegeticScreenBase<Act03HydrotherapyState> {
  public readonly id: string = 'screen-hydraulic-manifold';

  private state: Act03HydrotherapyState = {
    tubWaterLevels: [4, 1, 0],
    submergedValveOpen: false,
    manifoldBalanced: false
  };

  protected createModalElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'overlay-screen diegetic-screen-overlay hidden';
    el.setAttribute('data-testid', 'screen-hydraulic-manifold');
    el.innerHTML = `
      <div class="diegetic-housing manifold-housing">
        <div class="diegetic-header">
          <span class="diegetic-model">HYDROSTATIC MANIFOLD // IMMERSION BASIN 03</span>
          <button class="diegetic-btn-close" id="btn-close-manifold" aria-label="Step back">DISENGAGE</button>
        </div>
        <div class="diegetic-body">
          <div class="pressure-gauge-display">
            <span id="label-pressure-psi">45.0 PSI</span>
          </div>
          <div class="valve-cluster">
            <button class="valve-wheel" id="valve-a" data-testid="valve-a">VALVE A</button>
            <button class="valve-wheel" id="valve-b" data-testid="valve-b">VALVE B</button>
            <button class="valve-wheel" id="valve-c" data-testid="valve-c">VALVE C</button>
          </div>
          <button class="emergency-dump-lever" id="btn-emergency-dump" data-testid="btn-emergency-dump">
            EMERGENCY SUMP BLOWOUT
          </button>
        </div>
      </div>
    `;
    const btnClose = el.querySelector('#btn-close-manifold');
    btnClose?.addEventListener('click', () => this.close());
    return el;
  }

  protected onOpened(): void {}
  protected onClosed(): void {}
  protected handleKeyDown(_e: KeyboardEvent): void {}

  public getState(): Act03HydrotherapyState {
    return { ...this.state };
  }

  public hydrate(state: Act03HydrotherapyState): void {
    this.state = { ...state };
  }

  public reset(): void {
    this.state = {
      tubWaterLevels: [4, 1, 0],
      submergedValveOpen: false,
      manifoldBalanced: false
    };
  }

  public stepControl(_controlId: string, _delta: number): void {}
}
