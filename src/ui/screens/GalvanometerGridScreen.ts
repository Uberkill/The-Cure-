import { DiegeticScreenBase } from './DiegeticScreenBase';
import { Act07SynthesisState } from '../../types/cure';

export class GalvanometerGridScreen extends DiegeticScreenBase<Act07SynthesisState> {
  public readonly id: string = 'screen-galvanometer-grid';

  private state: Act07SynthesisState = {
    insertedCrystals: [],
    shuntResistances: [50, 150, 20, 180, 100],
    gridBalanced: false
  };

  protected createModalElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'overlay-screen diegetic-screen-overlay hidden';
    el.setAttribute('data-testid', 'screen-galvanometer-grid');
    el.innerHTML = `
      <div class="diegetic-housing galvanometer-housing">
        <div class="diegetic-header">
          <span class="diegetic-model">PRIMARY POWER DISTRIBUTION BUS // AIRLOCK INTERLOCK</span>
          <button class="diegetic-btn-close" id="btn-close-galvanometer" aria-label="Step back">DISENGAGE</button>
        </div>
        <div class="diegetic-body">
          <div class="meter-bank">
            <div class="meter-needle" id="meter-0">CH 1</div>
            <div class="meter-needle" id="meter-1">CH 2</div>
            <div class="meter-needle" id="meter-2">CH 3</div>
            <div class="meter-needle" id="meter-3">CH 4</div>
            <div class="meter-needle" id="meter-4">CH 5</div>
          </div>
          <button class="main-bus-lever" id="btn-bus-lever" data-testid="btn-bus-lever">
            DISENGAGE HYDRAULIC BLAST CLAMPS
          </button>
        </div>
      </div>
    `;
    const btnClose = el.querySelector('#btn-close-galvanometer');
    btnClose?.addEventListener('click', () => this.close());
    return el;
  }

  protected onOpened(): void {}
  protected onClosed(): void {}
  protected handleKeyDown(_e: KeyboardEvent): void {}

  public getState(): Act07SynthesisState {
    return { ...this.state };
  }

  public hydrate(state: Act07SynthesisState): void {
    this.state = { ...state };
  }

  public reset(): void {
    this.state = {
      insertedCrystals: [],
      shuntResistances: [50, 150, 20, 180, 100],
      gridBalanced: false
    };
  }

  public stepControl(_controlId: string, _delta: number): void {}
}
