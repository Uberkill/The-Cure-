import { DiegeticScreenBase } from './DiegeticScreenBase';
import { Act01SterileState } from '../../types/cure';

export class TektronixCrtScreen extends DiegeticScreenBase<Act01SterileState> {
  public readonly id: string = 'screen-tektronix-crt';

  private state: Act01SterileState = {
    telephoneAnswered: false,
    brassShuntInserted: false,
    frequencyHz: 440,
    phaseOffsetDeg: 0,
    harmonicLocked: false,
    knifeSwitchThrown: false
  };

  protected createModalElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'overlay-screen diegetic-screen-overlay hidden';
    el.setAttribute('data-testid', 'screen-tektronix-crt');
    el.innerHTML = `
      <div class="diegetic-housing tektronix-housing">
        <div class="diegetic-header">
          <span class="diegetic-model">TEKTRONIX TYPE 545B • HARMONIC MONITOR</span>
          <button class="diegetic-btn-close" id="btn-close-crt" aria-label="Step back">DISENGAGE</button>
        </div>
        <div class="diegetic-body">
          <div class="crt-viewport-container">
            <canvas id="tektronix-canvas" width="600" height="400"></canvas>
            <div class="crt-phosphor-glare"></div>
          </div>
          <div class="crt-controls-apron">
            <div class="fuse-socket" id="fuse-socket-shunt" data-testid="fuse-socket-shunt">
              <span class="socket-label">CERAMIC SHUNT RECEPTACLE</span>
              <div class="shunt-slot" id="slot-shunt">EMPTY</div>
            </div>
            <div class="dial-cluster">
              <label>FREQUENCY (HZ)</label>
              <input type="range" min="400" max="700" value="440" id="dial-frequency" data-testid="dial-frequency">
              <span id="label-frequency">440.0 HZ</span>
            </div>
            <div class="switch-cluster">
              <button class="knife-switch-handle" id="btn-knife-switch" disabled data-testid="btn-knife-switch">
                THROW PRIMARY RELAY
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    const btnClose = el.querySelector('#btn-close-crt');
    btnClose?.addEventListener('click', () => this.close());
    return el;
  }

  protected onOpened(): void {}
  protected onClosed(): void {}
  protected handleKeyDown(_e: KeyboardEvent): void {}

  public getState(): Act01SterileState {
    return { ...this.state };
  }

  public hydrate(state: Act01SterileState): void {
    this.state = { ...state };
  }

  public reset(): void {
    this.state = {
      telephoneAnswered: false,
      brassShuntInserted: false,
      frequencyHz: 440,
      phaseOffsetDeg: 0,
      harmonicLocked: false,
      knifeSwitchThrown: false
    };
  }

  public stepControl(controlId: string, delta: number): void {
    if (controlId === 'frequency') {
      this.state.frequencyHz = Math.max(400, Math.min(700, this.state.frequencyHz + delta));
    }
  }
}
