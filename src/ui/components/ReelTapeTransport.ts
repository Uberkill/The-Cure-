/**
 * Reusable Nagra SN Style Reel-to-Reel Wiretap Transport Component.
 * Features dual spinning aluminium reels, 4-digit mechanical odometer counter,
 * backlit analogue VU meter with damped needle physics, and an auto-sleeping animation loop.
 */

export type TransportState = 'stop' | 'play' | 'rewind';

export interface ReelTapeOptions {
  label?: string;
  speedMultiplier?: number;
  initialCounter?: number;
  onStateChange?: (state: TransportState) => void;
}

export class ReelTapeTransport {
  private container: HTMLElement;
  private supplyReelEl: HTMLElement;
  private takeUpReelEl: HTMLElement;
  private counterEl: HTMLElement;
  private vuNeedleEl: HTMLElement;
  private statusBadgeEl: HTMLElement;

  private state: TransportState = 'stop';
  private speedMultiplier: number = 1.0;
  private counter: number = 0;
  private reelRotationDeg: number = 0;

  private vuCurrentAngle: number = -35;
  private vuTargetAngle: number = -35;
  private vuVelocity: number = 0;

  private animId: number | null = null;
  private isSleeping: boolean = true;
  private onStateChange?: (state: TransportState) => void;

  public get isIdle(): boolean {
    return this.isSleeping;
  }

  constructor(mountPoint: HTMLElement, options: ReelTapeOptions = {}) {
    this.speedMultiplier = options.speedMultiplier ?? 1.0;
    this.counter = options.initialCounter ?? 104;
    this.onStateChange = options.onStateChange;

    this.container = document.createElement('div');
    this.container.className = 'tape-transport-widget';
    this.container.setAttribute('role', 'region');
    this.container.setAttribute('aria-label', options.label ?? 'Nagra SN Reel-to-Reel Deck');

    // Header bar
    const header = document.createElement('div');
    header.className = 'tape-transport-header';

    const title = document.createElement('span');
    title.className = 'tape-transport-title';
    title.textContent = options.label ?? 'NAGRA SN // WIRETAP SURVEILLANCE RECORDER';

    this.statusBadgeEl = document.createElement('span');
    this.statusBadgeEl.className = 'tape-status-badge';
    this.statusBadgeEl.textContent = 'STANDBY';

    header.appendChild(title);
    header.appendChild(this.statusBadgeEl);

    // Tape Bay with Dual Reels
    const bay = document.createElement('div');
    bay.className = 'tape-bay';

    this.supplyReelEl = this.createReelElement('SUPPLY');
    this.takeUpReelEl = this.createReelElement('TAKE-UP');

    // Center Tape Bridge & VU meter
    const centerBridge = document.createElement('div');
    centerBridge.className = 'tape-center-bridge';

    // 4-digit mechanical counter
    const counterWrap = document.createElement('div');
    counterWrap.className = 'tape-odometer-wrap';
    const counterLabel = document.createElement('span');
    counterLabel.className = 'tape-odometer-label';
    counterLabel.textContent = 'INDEX';

    this.counterEl = document.createElement('div');
    this.counterEl.className = 'tape-odometer-digits';
    this.updateCounterDisplay();

    counterWrap.appendChild(counterLabel);
    counterWrap.appendChild(this.counterEl);

    // Backlit analogue VU meter
    const vuMeter = document.createElement('div');
    vuMeter.className = 'tape-vu-meter';
    vuMeter.setAttribute('aria-label', 'Audio VU Meter');

    const vuFace = document.createElement('div');
    vuFace.className = 'tape-vu-face';

    this.vuNeedleEl = document.createElement('div');
    this.vuNeedleEl.className = 'tape-vu-needle';
    vuFace.appendChild(this.vuNeedleEl);
    vuMeter.appendChild(vuFace);

    centerBridge.appendChild(counterWrap);
    centerBridge.appendChild(vuMeter);

    bay.appendChild(this.supplyReelEl);
    bay.appendChild(centerBridge);
    bay.appendChild(this.takeUpReelEl);

    // Transport buttons
    const controls = document.createElement('div');
    controls.className = 'tape-transport-controls';

    const btnPlay = this.createTransportButton('PLAY', () => this.setState('play'));
    const btnStop = this.createTransportButton('STOP', () => this.setState('stop'));
    const btnRewind = this.createTransportButton('REW', () => this.setState('rewind'));
    const btnHalfSpeed = this.createTransportButton('0.5x', () => this.toggleHalfSpeed());

    controls.appendChild(btnPlay);
    controls.appendChild(btnStop);
    controls.appendChild(btnRewind);
    controls.appendChild(btnHalfSpeed);

    this.container.appendChild(header);
    this.container.appendChild(bay);
    this.container.appendChild(controls);
    mountPoint.appendChild(this.container);

    this.setupKeyboardListeners();
    this.setupVisibilityListener();
  }

  private createReelElement(label: string): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'tape-reel-wrap';
    wrap.setAttribute('aria-label', `${label} Reel`);

    const reel = document.createElement('div');
    reel.className = 'tape-reel';

    // 3-spoke aluminium cutout
    reel.innerHTML = `
      <svg viewBox="0 0 100 100" class="tape-reel-spokes" width="100%" height="100%">
        <circle cx="50" cy="50" r="46" fill="none" stroke="#3D4642" stroke-width="2"/>
        <circle cx="50" cy="50" r="16" fill="#141816" stroke="#C28833" stroke-width="2"/>
        <line x1="50" y1="16" x2="50" y2="4" stroke="#8B9991" stroke-width="3"/>
        <line x1="20" y1="67" x2="10" y2="73" stroke="#8B9991" stroke-width="3"/>
        <line x1="80" y1="67" x2="90" y2="73" stroke="#8B9991" stroke-width="3"/>
      </svg>
    `;

    const caption = document.createElement('span');
    caption.className = 'tape-reel-caption';
    caption.textContent = label;

    wrap.appendChild(reel);
    wrap.appendChild(caption);
    return wrap;
  }

  private createTransportButton(text: string, action: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'tape-btn';
    btn.textContent = text;
    btn.addEventListener('click', action);
    return btn;
  }

  private setupKeyboardListeners(): void {
    this.container.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        this.setState(this.state === 'play' ? 'stop' : 'play');
      } else if (e.key === 'r' || e.key === 'R') {
        this.setState('rewind');
      } else if (e.key === 's' || e.key === 'S') {
        this.setState('stop');
      }
    });
  }

  private setupVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAnimation();
      } else if (this.state !== 'stop') {
        this.wakeAnimation();
      }
    });
  }

  public setState(state: TransportState): void {
    if (this.state === state) return;
    this.state = state;
    this.statusBadgeEl.textContent = state.toUpperCase();

    if (state === 'stop') {
      this.statusBadgeEl.className = 'tape-status-badge';
      this.vuTargetAngle = -35;
      // Let VU needle settle back to rest before full sleep
      this.wakeAnimation();
    } else if (state === 'play') {
      this.statusBadgeEl.className = 'tape-status-badge active';
      this.wakeAnimation();
    } else if (state === 'rewind') {
      this.statusBadgeEl.className = 'tape-status-badge rewind';
      this.wakeAnimation();
    }

    if (this.onStateChange) this.onStateChange(state);
  }

  public toggleHalfSpeed(): void {
    this.speedMultiplier = this.speedMultiplier === 1.0 ? 0.5 : 1.0;
    const halfBtn = this.container.querySelectorAll('.tape-btn')[3];
    if (halfBtn) {
      halfBtn.classList.toggle('active', this.speedMultiplier === 0.5);
    }
  }

  private wakeAnimation(): void {
    if (document.hidden) return;
    this.isSleeping = false;
    if (this.animId === null) {
      this.animId = requestAnimationFrame(() => this.loop());
    }
  }

  private pauseAnimation(): void {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  private loop(): void {
    const rate = this.speedMultiplier;

    if (this.state === 'play') {
      this.reelRotationDeg = (this.reelRotationDeg + 2.5 * rate) % 360;
      this.counter += 0.05 * rate;
      this.updateCounterDisplay();
      // Jitter VU meter around nominal +2 dB
      this.vuTargetAngle = -5 + (Math.random() - 0.5) * 18;
    } else if (this.state === 'rewind') {
      this.reelRotationDeg = (this.reelRotationDeg - 8.0) % 360;
      this.counter = Math.max(0, this.counter - 0.25);
      this.updateCounterDisplay();
      this.vuTargetAngle = -30;
    } else if (this.state === 'stop') {
      this.vuTargetAngle = -35;
    }

    // Apply reel rotation
    const supplyReel = this.supplyReelEl.querySelector('.tape-reel') as HTMLElement;
    const takeUpReel = this.takeUpReelEl.querySelector('.tape-reel') as HTMLElement;
    if (supplyReel) supplyReel.style.transform = `rotate(${this.reelRotationDeg}deg)`;
    if (takeUpReel) takeUpReel.style.transform = `rotate(${this.reelRotationDeg}deg)`;

    // VU needle damped spring physics
    const k = 0.12;
    const damping = 0.82;
    const force = (this.vuTargetAngle - this.vuCurrentAngle) * k;
    this.vuVelocity = (this.vuVelocity + force) * damping;
    this.vuCurrentAngle += this.vuVelocity;
    this.vuNeedleEl.style.transform = `rotate(${this.vuCurrentAngle}deg)`;

    // Check if entered resting sleep state
    if (this.state === 'stop' && Math.abs(this.vuVelocity) < 0.001 && Math.abs(this.vuTargetAngle - this.vuCurrentAngle) < 0.01) {
      this.isSleeping = true;
      this.animId = null;
      return;
    }

    this.animId = requestAnimationFrame(() => this.loop());
  }

  private updateCounterDisplay(): void {
    const formatted = Math.floor(this.counter).toString().padStart(4, '0');
    this.counterEl.textContent = formatted;
  }

  public destroy(): void {
    this.pauseAnimation();
    this.container.remove();
  }
}
