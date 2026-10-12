/**
 * Reusable EEG / Polygraph Strip Chart Recorder Widget.
 * Simulates a continuous mechanical pen-plotter recording physiological
 * and limbic friction data on scrolling calibrated grid paper.
 * Implements idle-sleep when stopped and high-DPI retina scaling.
 */

export type PaperSpeed = 0 | 25 | 50;

export interface StripChartOptions {
  label?: string;
  initialSpeed?: PaperSpeed;
  frequencyHz?: number;
  amplitude?: number;
}

export class StripChartRecorder {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private statusEl: HTMLElement;

  private speed: PaperSpeed = 25;
  private frequencyHz: number = 2.4;
  private amplitude: number = 28;
  private timeOffset: number = 0;
  private scrollOffset: number = 0;

  private points: number[] = [];
  private maxPoints: number = 300;
  private animId: number | null = null;
  private isSleeping: boolean = false;
  private resizeObserver!: ResizeObserver;

  public get isIdle(): boolean {
    return this.isSleeping;
  }

  constructor(mountPoint: HTMLElement, options: StripChartOptions = {}) {
    this.speed = options.initialSpeed ?? 25;
    this.frequencyHz = options.frequencyHz ?? 2.4;
    this.amplitude = options.amplitude ?? 28;

    this.container = document.createElement('div');
    this.container.className = 'chart-recorder-widget';
    this.container.setAttribute('role', 'region');
    this.container.setAttribute('aria-label', options.label ?? 'EEG Limbic Friction Strip Chart');

    // Header bar
    const header = document.createElement('div');
    header.className = 'chart-header';

    const title = document.createElement('span');
    title.className = 'chart-title';
    title.textContent = options.label ?? 'POLYGRAPH RECORDER TYPE 12 // LIMBIC FREQUENCY';

    this.statusEl = document.createElement('span');
    this.statusEl.className = 'chart-status';
    this.statusEl.textContent = `SPEED: ${this.speed} MM/S`;

    header.appendChild(title);
    header.appendChild(this.statusEl);

    // Canvas viewport with mechanical roller bezel
    const viewport = document.createElement('div');
    viewport.className = 'chart-viewport';

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    viewport.appendChild(this.canvas);

    // Stylus shadow overlay
    const stylusShadow = document.createElement('div');
    stylusShadow.className = 'chart-stylus-line';
    viewport.appendChild(stylusShadow);

    // Speed controls
    const controls = document.createElement('div');
    controls.className = 'chart-controls';
    controls.setAttribute('role', 'radiogroup');
    controls.setAttribute('aria-label', 'Paper Feed Velocity');

    const speeds: PaperSpeed[] = [0, 25, 50];
    speeds.forEach((s) => {
      const btn = document.createElement('button');
      btn.className = `chart-btn-speed ${s === this.speed ? 'active' : ''}`;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', s === this.speed ? 'true' : 'false');
      btn.textContent = s === 0 ? 'STOP' : `${s} MM/S`;
      btn.addEventListener('click', () => this.setSpeed(s));
      controls.appendChild(btn);
    });

    this.container.appendChild(header);
    this.container.appendChild(viewport);
    this.container.appendChild(controls);
    mountPoint.appendChild(this.container);

    this.setupResizeObserver();
    this.setupVisibilityListener();

    if (this.speed > 0) {
      this.wakeAnimation();
    } else {
      this.isSleeping = true;
      this.render();
    }
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.resizeCanvas();
      this.render();
    });
    this.resizeObserver.observe(this.canvas);
  }

  private resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
    this.maxPoints = Math.round(rect.width / 2);
  }

  private setupVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAnimation();
      } else if (this.speed > 0) {
        this.wakeAnimation();
      }
    });
  }

  public setSpeed(speed: PaperSpeed): void {
    this.speed = speed;
    this.statusEl.textContent = speed === 0 ? 'STATUS: HALTED' : `SPEED: ${speed} MM/S`;

    const btns = this.container.querySelectorAll('.chart-btn-speed');
    btns.forEach((btn, idx) => {
      const s = [0, 25, 50][idx];
      if (s === speed) {
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-checked', 'false');
      }
    });

    if (this.speed === 0) {
      this.pauseAnimation();
      this.isSleeping = true;
    } else {
      this.wakeAnimation();
    }
  }

  public setFrequency(hz: number): void {
    this.frequencyHz = hz;
  }

  private wakeAnimation(): void {
    if (document.hidden || this.speed === 0) return;
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
    const dt = this.speed * 0.04;
    this.timeOffset += dt * 0.08;
    this.scrollOffset = (this.scrollOffset + dt) % 20;

    // Generate new limbic physiological wave point with micro-spikes
    const baseWave = Math.sin(this.timeOffset * this.frequencyHz) * this.amplitude;
    const harmonic = Math.sin(this.timeOffset * this.frequencyHz * 2.8) * (this.amplitude * 0.35);
    const jitter = (Math.random() - 0.5) * 4;
    const spike = Math.random() < 0.02 ? (Math.random() - 0.5) * 35 : 0;
    const newY = baseWave + harmonic + jitter + spike;

    this.points.push(newY);
    if (this.points.length > this.maxPoints) {
      this.points.shift();
    }

    this.render();
    this.animId = requestAnimationFrame(() => this.loop());
  }

  private render(): void {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w === 0 || h === 0) return;

    this.ctx.clearRect(0, 0, w, h);

    // Pale medical paper background
    this.ctx.fillStyle = '#E8ECE6';
    this.ctx.fillRect(0, 0, w, h);

    // Calibrated paper grid lines (Pale Sage green ink)
    this.ctx.strokeStyle = 'rgba(45, 74, 62, 0.15)';
    this.ctx.lineWidth = 1;

    // Vertical time grid lines (scrolling with paper feed)
    for (let x = -this.scrollOffset; x < w; x += 20) {
      if (x < 0) continue;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }

    // Horizontal voltage / limbic amplitude division lines
    for (let y = 0; y < h; y += 15) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.stroke();
    }

    // Baseline center axis (Darker division)
    this.ctx.strokeStyle = 'rgba(45, 74, 62, 0.35)';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(0, h / 2);
    this.ctx.lineTo(w, h / 2);
    this.ctx.stroke();

    // Recorded ink trace (Carbon black with subtle ink bleed)
    this.ctx.strokeStyle = '#141A21';
    this.ctx.lineWidth = 1.75;
    this.ctx.lineJoin = 'round';
    this.ctx.beginPath();

    const startX = w - this.points.length * 2;
    for (let i = 0; i < this.points.length; i++) {
      const px = startX + i * 2;
      const py = h / 2 - this.points[i];
      if (i === 0) this.ctx.moveTo(px, py);
      else this.ctx.lineTo(px, py);
    }
    this.ctx.stroke();

    // Stylus pen nib indicator at the current writing point
    if (this.points.length > 0) {
      const penY = h / 2 - this.points[this.points.length - 1];
      this.ctx.fillStyle = '#8B1E23';
      this.ctx.beginPath();
      this.ctx.arc(w - 2, penY, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  public destroy(): void {
    this.pauseAnimation();
    this.resizeObserver.disconnect();
    this.container.remove();
  }
}
