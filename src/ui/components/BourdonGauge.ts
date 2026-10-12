/**
 * Reusable Bourdon Tube Hydrostatic Pressure Gauge Widget.
 * Features dual-needle display, interactive pressure release valve with pointer capture,
 * keyboard accessibility, high-DPI retina scaling, and an auto-sleeping animation loop.
 */

export interface BourdonGaugeOptions {
  minPressureKpa?: number;
  maxPressureKpa?: number;
  nominalPressureKpa?: number;
  targetPressureKpa?: number;
  diameterPx?: number;
  onPressureChange?: (kpa: number) => void;
}

export class BourdonGauge {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private valveKnob: HTMLElement;
  private readoutEl: HTMLElement;

  private minKpa: number;
  private maxKpa: number;
  private currentKpa: number;
  private targetKpa: number;
  private redLimitKpa: number;

  private currentAngle: number = 0;
  private targetAngle: number = 0;
  private velocity: number = 0;
  private animId: number | null = null;
  private isSleeping: boolean = true;
  private resizeObserver!: ResizeObserver;

  public get isIdle(): boolean {
    return this.isSleeping;
  }

  private isDraggingValve: boolean = false;
  private dragStartY: number = 0;
  private dragStartKpa: number = 0;
  private onPressureChange?: (kpa: number) => void;

  constructor(mountPoint: HTMLElement, options: BourdonGaugeOptions = {}) {
    this.minKpa = options.minPressureKpa ?? 0;
    this.maxKpa = options.maxPressureKpa ?? 200;
    this.currentKpa = options.nominalPressureKpa ?? 101.3;
    this.targetKpa = this.currentKpa;
    this.redLimitKpa = options.targetPressureKpa ?? 100.0;
    this.onPressureChange = options.onPressureChange;

    this.container = document.createElement('div');
    this.container.className = 'bourdon-gauge-widget';
    this.container.setAttribute('role', 'region');
    this.container.setAttribute('aria-label', 'Bourdon Tube Hydrostatic Pressure Gauge');

    const dialWrap = document.createElement('div');
    dialWrap.className = 'bourdon-dial-wrap';

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    dialWrap.appendChild(this.canvas);

    // Specular glass glare overlay
    const glare = document.createElement('div');
    glare.className = 'bourdon-dial-glare';
    dialWrap.appendChild(glare);

    // Readout and controls
    const controlsWrap = document.createElement('div');
    controlsWrap.className = 'bourdon-controls-wrap';

    this.readoutEl = document.createElement('div');
    this.readoutEl.className = 'bourdon-readout';
    this.readoutEl.setAttribute('aria-live', 'polite');
    this.updateReadout();

    // Interactive relief valve knob
    const valveGroup = document.createElement('div');
    valveGroup.className = 'bourdon-valve-group';

    const valveLabel = document.createElement('span');
    valveLabel.className = 'bourdon-valve-label';
    valveLabel.textContent = 'BLEEDER VALVE';

    this.valveKnob = document.createElement('div');
    this.valveKnob.className = 'bourdon-valve-knob';
    this.valveKnob.setAttribute('role', 'slider');
    this.valveKnob.setAttribute('tabindex', '0');
    this.valveKnob.setAttribute('aria-label', 'Hydrostatic Bleeder Valve');
    this.valveKnob.setAttribute('aria-valuemin', this.minKpa.toString());
    this.valveKnob.setAttribute('aria-valuemax', this.maxKpa.toString());
    this.valveKnob.setAttribute('aria-valuenow', this.currentKpa.toFixed(1));

    valveGroup.appendChild(valveLabel);
    valveGroup.appendChild(this.valveKnob);

    controlsWrap.appendChild(this.readoutEl);
    controlsWrap.appendChild(valveGroup);

    this.container.appendChild(dialWrap);
    this.container.appendChild(controlsWrap);
    mountPoint.appendChild(this.container);

    this.setupListeners();
    this.setupResizeObserver();
    this.calculateTargetAngle();
    this.currentAngle = this.targetAngle;
    this.render();
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
  }

  private setupListeners(): void {
    // Pointer capture on valve knob
    this.valveKnob.addEventListener('pointerdown', (e: PointerEvent) => {
      this.isDraggingValve = true;
      this.dragStartY = e.clientY;
      this.dragStartKpa = this.targetKpa;
      this.valveKnob.setPointerCapture(e.pointerId);
      this.valveKnob.classList.add('active');
    });

    this.valveKnob.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.isDraggingValve) return;
      const deltaY = this.dragStartY - e.clientY;
      const deltaKpa = deltaY * 0.4;
      this.setPressure(this.dragStartKpa + deltaKpa);
    });

    const endDrag = (e: PointerEvent) => {
      if (!this.isDraggingValve) return;
      this.isDraggingValve = false;
      this.valveKnob.classList.remove('active');
      try {
        this.valveKnob.releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback if pointerId is no longer active
      }
    };

    this.valveKnob.addEventListener('pointerup', endDrag);
    this.valveKnob.addEventListener('pointercancel', endDrag);

    // Keyboard accessibility
    this.valveKnob.addEventListener('keydown', (e: KeyboardEvent) => {
      let step = 0;
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') step = 1.0;
      else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') step = -1.0;
      else if (e.key === 'PageUp') step = 10.0;
      else if (e.key === 'PageDown') step = -10.0;
      else if (e.key === 'Home') this.setPressure(this.minKpa);
      else if (e.key === 'End') this.setPressure(this.maxKpa);

      if (step !== 0) {
        e.preventDefault();
        this.setPressure(this.targetKpa + step);
      }
    });

    // Visibility management
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAnimation();
      } else if (!this.isSleeping) {
        this.wakeAnimation();
      }
    });
  }

  public setPressure(kpa: number): void {
    const clamped = Math.max(this.minKpa, Math.min(this.maxKpa, kpa));
    if (Math.abs(clamped - this.targetKpa) < 0.05) return;
    this.targetKpa = clamped;
    this.valveKnob.setAttribute('aria-valuenow', clamped.toFixed(1));
    this.calculateTargetAngle();
    this.wakeAnimation();
    if (this.onPressureChange) this.onPressureChange(clamped);
  }

  public ventPressure(amountKpa: number = 25): void {
    this.setPressure(this.targetKpa - amountKpa);
  }

  private calculateTargetAngle(): void {
    const fraction = (this.targetKpa - this.minKpa) / (this.maxKpa - this.minKpa);
    // Span from -135 deg to +135 deg (270 deg total)
    const startRad = (-135 * Math.PI) / 180;
    const endRad = (135 * Math.PI) / 180;
    this.targetAngle = startRad + fraction * (endRad - startRad);
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
    // Spring physics simulation
    const k = 0.08;
    const damping = 0.86;
    const force = (this.targetAngle - this.currentAngle) * k;
    this.velocity = (this.velocity + force) * damping;
    this.currentAngle += this.velocity;

    // Convert current angle back to Kpa for readout display
    const startRad = (-135 * Math.PI) / 180;
    const endRad = (135 * Math.PI) / 180;
    const fraction = (this.currentAngle - startRad) / (endRad - startRad);
    this.currentKpa = this.minKpa + fraction * (this.maxKpa - this.minKpa);
    this.updateReadout();
    this.render();

    // Check if at rest (sleep threshold)
    if (Math.abs(this.velocity) < 0.0001 && Math.abs(this.targetAngle - this.currentAngle) < 0.0005) {
      this.currentAngle = this.targetAngle;
      this.velocity = 0;
      this.isSleeping = true;
      this.animId = null;
      this.render();
      return;
    }

    this.animId = requestAnimationFrame(() => this.loop());
  }

  private updateReadout(): void {
    this.readoutEl.textContent = `${this.currentKpa.toFixed(1)} kPa`;
  }

  private render(): void {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w === 0 || h === 0) return;

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) / 2 - 12;

    this.ctx.clearRect(0, 0, w, h);

    // Enamel dial face plate
    this.ctx.fillStyle = '#EDF0EB';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Inner brass bezel rim
    this.ctx.strokeStyle = '#C28833';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    // Radial calibration ticks
    const startRad = (-135 * Math.PI) / 180;
    const endRad = (135 * Math.PI) / 180;
    const totalTicks = 20;

    for (let i = 0; i <= totalTicks; i++) {
      const angle = startRad + (i / totalTicks) * (endRad - startRad);
      const isMajor = i % 5 === 0;
      const tickLength = isMajor ? 12 : 6;
      const x1 = cx + Math.cos(angle) * (radius - tickLength - 4);
      const y1 = cy + Math.sin(angle) * (radius - tickLength - 4);
      const x2 = cx + Math.cos(angle) * (radius - 4);
      const y2 = cy + Math.sin(angle) * (radius - 4);

      this.ctx.strokeStyle = isMajor ? '#141A21' : '#4A5568';
      this.ctx.lineWidth = isMajor ? 2 : 1;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();

      if (isMajor) {
        const val = this.minKpa + (i / totalTicks) * (this.maxKpa - this.minKpa);
        const textRadius = radius - 24;
        const tx = cx + Math.cos(angle) * textRadius;
        const ty = cy + Math.sin(angle) * textRadius + 3;
        this.ctx.fillStyle = '#141A21';
        this.ctx.font = '9px "JetBrains Mono", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(Math.round(val).toString(), tx, ty);
      }
    }

    // Dial center designation typography
    this.ctx.fillStyle = '#718096';
    this.ctx.font = '8px "JetBrains Mono", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('HYDROSTATIC DAMPING', cx, cy - 22);
    this.ctx.fillText('KILOPASCALS (kPa)', cx, cy - 12);

    // Target Limit Needle (Red Static Needle)
    const limitFraction = (this.redLimitKpa - this.minKpa) / (this.maxKpa - this.minKpa);
    const limitAngle = startRad + limitFraction * (endRad - startRad);
    this.ctx.strokeStyle = 'rgba(184, 40, 46, 0.7)';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy);
    this.ctx.lineTo(cx + Math.cos(limitAngle) * (radius - 14), cy + Math.sin(limitAngle) * (radius - 14));
    this.ctx.stroke();

    // Active Measurement Needle (Black Dynamic Needle with Counter-Balance)
    this.ctx.strokeStyle = '#141A21';
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    // Counter-balance tail
    this.ctx.moveTo(cx - Math.cos(this.currentAngle) * 12, cy - Math.sin(this.currentAngle) * 12);
    this.ctx.lineTo(cx + Math.cos(this.currentAngle) * (radius - 10), cy + Math.sin(this.currentAngle) * (radius - 10));
    this.ctx.stroke();

    // Center pivot cap (Brass and Steel)
    this.ctx.fillStyle = '#C28833';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#141A21';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  public destroy(): void {
    this.pauseAnimation();
    this.resizeObserver.disconnect();
    this.container.remove();
  }
}
