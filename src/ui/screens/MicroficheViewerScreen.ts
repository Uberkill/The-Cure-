import { DiegeticScreenBase } from './DiegeticScreenBase';
import { Act05ArchiveState } from '../../types/cure';

export class MicroficheViewerScreen extends DiegeticScreenBase<Act05ArchiveState> {
  public readonly id: string = 'screen-microfiche-viewer';

  private state: Act05ArchiveState = {
    microfilmMounted: false,
    opticFocusLevel: 0.2,
    dispatchCoordinate: '',
    canisterDelivered: false
  };

  protected createModalElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'overlay-screen diegetic-screen-overlay hidden';
    el.setAttribute('data-testid', 'screen-microfiche-viewer');
    el.innerHTML = `
      <div class="diegetic-housing microfiche-housing">
        <div class="diegetic-header">
          <span class="diegetic-model">OPTICAL MICROFICHE READER // ARCHIVE WARD 05</span>
          <button class="diegetic-btn-close" id="btn-close-microfiche" aria-label="Step back">DISENGAGE</button>
        </div>
        <div class="diegetic-body">
          <div class="microfiche-display" id="microfiche-display">
            <div class="microfilm-document-view" id="microfilm-view"></div>
          </div>
          <div class="pneumatic-terminal">
            <input type="text" placeholder="SECTOR CODE" id="input-dispatch-sector" data-testid="input-dispatch-sector">
            <button id="btn-pneumatic-launch" data-testid="btn-pneumatic-launch">DISPATCH CANISTER</button>
          </div>
        </div>
      </div>
    `;
    const btnClose = el.querySelector('#btn-close-microfiche');
    btnClose?.addEventListener('click', () => this.close());
    return el;
  }

  protected onOpened(): void {}
  protected onClosed(): void {}
  protected handleKeyDown(_e: KeyboardEvent): void {}

  public getState(): Act05ArchiveState {
    return { ...this.state };
  }

  public hydrate(state: Act05ArchiveState): void {
    this.state = { ...state };
  }

  public reset(): void {
    this.state = {
      microfilmMounted: false,
      opticFocusLevel: 0.2,
      dispatchCoordinate: '',
      canisterDelivered: false
    };
  }

  public stepControl(_controlId: string, _delta: number): void {}
}
