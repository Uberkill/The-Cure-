/**
 * Reusable Vintage Sight Glass Manometer Widget.
 * Simulates a borosilicate glass fluid manometer column used in 1970s
 * medical dispensary carts and hydraulic test rigs.
 * Features volume graduations, fluid meniscus physics, cardiac BPM pulse waves,
 * and brass fittings.
 */

export interface SightGlassOptions {
  minVal?: number;
  maxVal?: number;
  initialVal?: number;
  targetVal?: number;
  label?: string;
  unit?: string;
}

export class SightGlassManometer {
  private container: HTMLElement;
  private fluidEl: HTMLElement;
  private levelReadoutEl: HTMLElement;
  private statusBadgeEl: HTMLElement;
  private pulseIntervalId: number | null = null;
  private minVal: number;
  private maxVal: number;
  private currentVal: number;
  private targetVal: number;

  constructor(mountPoint: HTMLElement, options: SightGlassOptions = {}) {
    this.minVal = options.minVal ?? 30;
    this.maxVal = options.maxVal ?? 120;
    this.currentVal = options.initialVal ?? 45;
    this.targetVal = options.targetVal ?? 68;

    this.container = document.createElement('div');
    this.container.className = 'sight-glass-widget';
    this.container.setAttribute('role', 'meter');
    this.container.setAttribute('aria-label', options.label || 'Fluid Manometer Column');

    const bezel = document.createElement('div');
    bezel.className = 'manometer-bezel';

    // Top brass cap
    const topCap = document.createElement('div');
    topCap.className = 'manometer-cap top-cap';
    bezel.appendChild(topCap);

    // Glass tube body with ticks and fluid column
    const tube = document.createElement('div');
    tube.className = 'manometer-glass-tube';

    // Tick marks overlay
    const scale = document.createElement('div');
    scale.className = 'manometer-scale';
    const tickSteps = [120, 100, 80, 68, 50, 30];
    tickSteps.forEach(val => {
      const mark = document.createElement('div');
      mark.className = `scale-tick ${val === this.targetVal ? 'target-tick' : ''}`;
      const pct = ((val - this.minVal) / (this.maxVal - this.minVal)) * 100;
      mark.style.bottom = `${pct}%`;
      mark.innerHTML = `<span class="tick-line"></span><span class="tick-label">${val}</span>`;
      scale.appendChild(mark);
    });
    tube.appendChild(scale);

    // Fluid column
    this.fluidEl = document.createElement('div');
    this.fluidEl.className = 'manometer-fluid-column';
    const meniscus = document.createElement('div');
    meniscus.className = 'fluid-meniscus';
    this.fluidEl.appendChild(meniscus);
    tube.appendChild(this.fluidEl);

    bezel.appendChild(tube);

    // Bottom brass base
    const btmCap = document.createElement('div');
    btmCap.className = 'manometer-cap bottom-cap';
    bezel.appendChild(btmCap);

    this.container.appendChild(bezel);

    // Readout panel
    const readoutPanel = document.createElement('div');
    readoutPanel.className = 'manometer-readout-panel';

    this.levelReadoutEl = document.createElement('span');
    this.levelReadoutEl.className = 'manometer-level-value';
    this.statusBadgeEl = document.createElement('span');
    this.statusBadgeEl.className = 'manometer-status-badge';

    readoutPanel.appendChild(this.levelReadoutEl);
    readoutPanel.appendChild(this.statusBadgeEl);
    this.container.appendChild(readoutPanel);

    mountPoint.appendChild(this.container);

    this.setValue(this.currentVal);
  }

  public setValue(val: number): void {
    this.currentVal = Math.max(this.minVal, Math.min(this.maxVal, val));
    const pct = ((this.currentVal - this.minVal) / (this.maxVal - this.minVal)) * 100;
    this.fluidEl.style.height = `${pct}%`;

    const isCalibrated = Math.abs(this.currentVal - this.targetVal) <= 1;
    this.levelReadoutEl.textContent = `${this.currentVal} BPM`;

    if (isCalibrated) {
      this.statusBadgeEl.textContent = 'CARDIAC SYNC STABLE';
      this.statusBadgeEl.className = 'manometer-status-badge badge-stable';
      this.fluidEl.classList.add('fluid-calibrated');
    } else {
      this.statusBadgeEl.textContent = 'ARRHYTHMIC PRESSURE';
      this.statusBadgeEl.className = 'manometer-status-badge badge-arrhythmic';
      this.fluidEl.classList.remove('fluid-calibrated');
    }

    this.startPulse(this.currentVal);
  }

  private startPulse(bpm: number): void {
    if (this.pulseIntervalId !== null) {
      window.clearInterval(this.pulseIntervalId);
      this.pulseIntervalId = null;
    }

    const intervalMs = Math.max(300, (60 / Math.max(1, bpm)) * 1000);
    this.pulseIntervalId = window.setInterval(() => {
      const basePct = ((this.currentVal - this.minVal) / (this.maxVal - this.minVal)) * 100;
      this.fluidEl.style.height = `${Math.min(100, basePct + 5)}%`;
      window.setTimeout(() => {
        this.fluidEl.style.height = `${basePct}%`;
      }, intervalMs * 0.35);
    }, intervalMs);
  }

  public getValue(): number {
    return this.currentVal;
  }

  public destroy(): void {
    if (this.pulseIntervalId !== null) {
      window.clearInterval(this.pulseIntervalId);
      this.pulseIntervalId = null;
    }
    this.container.remove();
  }
}
