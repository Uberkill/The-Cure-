/**
 * Reusable Vintage Rotary Telephone Dial Widget.
 * Features 10 finger holes, finger stop bracket, pointer-capture dragging,
 * spring-back return physics, and keyboard fallback (0-9 digits).
 */

export interface RotaryDialOptions {
  onDigitDialed?: (digit: number) => void;
  diameterPx?: number;
}

export class RotaryDial {
  private container: HTMLElement;
  private dialFaceEl: HTMLElement;
  private currentRotationDeg: number = 0;
  private isDialing: boolean = false;
  private activeDigit: number | null = null;
  private animId: number | null = null;
  private onDigitDialed?: (digit: number) => void;

  constructor(mountPoint: HTMLElement, options: RotaryDialOptions = {}) {
    this.onDigitDialed = options.onDigitDialed;

    this.container = document.createElement('div');
    this.container.className = 'rotary-dial-widget';
    this.container.setAttribute('role', 'region');
    this.container.setAttribute('aria-label', 'Rotary Telephone Dial Mechanism');

    // Escutcheon housing
    const escutcheon = document.createElement('div');
    escutcheon.className = 'rotary-escutcheon';

    // Stationary number backing ring
    const numberRing = document.createElement('div');
    numberRing.className = 'rotary-number-ring';

    // Rotating finger wheel
    this.dialFaceEl = document.createElement('div');
    this.dialFaceEl.className = 'rotary-wheel';

    // Finger holes (1 to 9, then 0)
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    const baseAngleDeg = 45;
    const spacingDeg = 26;

    digits.forEach((digit, idx) => {
      const angle = baseAngleDeg + idx * spacingDeg;
      const rad = (angle * Math.PI) / 180;
      const r = 58; // Radius in px
      const cx = 80 + Math.cos(rad) * r;
      const cy = 80 + Math.sin(rad) * r;

      // Background stationary number
      const numLabel = document.createElement('div');
      numLabel.className = 'rotary-digit-label';
      numLabel.textContent = digit.toString();
      numLabel.style.left = `${cx}px`;
      numLabel.style.top = `${cy}px`;
      numberRing.appendChild(numLabel);

      // Rotating finger hole
      const hole = document.createElement('div');
      hole.className = 'rotary-hole';
      hole.setAttribute('role', 'button');
      hole.setAttribute('aria-label', `Dial digit ${digit}`);
      hole.setAttribute('tabindex', '0');
      hole.style.left = `${cx}px`;
      hole.style.top = `${cy}px`;

      hole.addEventListener('pointerdown', (e: PointerEvent) => {
        this.startDialing(digit, angle, e);
      });

      hole.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.simulateDialDigit(digit);
        }
      });

      this.dialFaceEl.appendChild(hole);
    });

    // Metal finger stop bracket
    const fingerStop = document.createElement('div');
    fingerStop.className = 'rotary-finger-stop';

    escutcheon.appendChild(numberRing);
    escutcheon.appendChild(this.dialFaceEl);
    escutcheon.appendChild(fingerStop);
    this.container.appendChild(escutcheon);
    mountPoint.appendChild(this.container);

    this.setupKeyboardInput();
  }

  private startDialing(digit: number, digitAngleDeg: number, e: PointerEvent): void {
    if (this.isDialing) return;
    this.isDialing = true;
    this.activeDigit = digit;

    const stopAngleDeg = 310; // Angle of metal finger stop
    const targetTravelDeg = stopAngleDeg - digitAngleDeg;

    const hole = e.currentTarget as HTMLElement;
    hole.setPointerCapture(e.pointerId);

    // Animate to finger stop
    this.currentRotationDeg = targetTravelDeg;
    this.dialFaceEl.style.transform = `rotate(${this.currentRotationDeg}deg)`;

    const finishDial = () => {
      if (!this.isDialing) return;
      this.isDialing = false;
      try {
        hole.releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }

      if (this.onDigitDialed && this.activeDigit !== null) {
        this.onDigitDialed(this.activeDigit);
      }
      this.springReturn();
    };

    hole.addEventListener('pointerup', finishDial, { once: true });
    hole.addEventListener('pointercancel', finishDial, { once: true });
  }

  public simulateDialDigit(digit: number): void {
    if (this.isDialing) return;
    this.isDialing = true;
    this.activeDigit = digit;

    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    const idx = digits.indexOf(digit);
    const digitAngleDeg = 45 + idx * 26;
    const targetTravelDeg = 310 - digitAngleDeg;

    // Smooth forward rotation
    this.dialFaceEl.style.transition = 'transform 0.35s ease-out';
    this.dialFaceEl.style.transform = `rotate(${targetTravelDeg}deg)`;

    setTimeout(() => {
      this.dialFaceEl.style.transition = '';
      if (this.onDigitDialed) this.onDigitDialed(digit);
      this.currentRotationDeg = targetTravelDeg;
      this.isDialing = false;
      this.springReturn();
    }, 380);
  }

  private springReturn(): void {
    // Mechanical spring-back return loop
    const returnSpeed = 14; // deg per frame
    const step = () => {
      this.currentRotationDeg -= returnSpeed;
      if (this.currentRotationDeg <= 0) {
        this.currentRotationDeg = 0;
        this.dialFaceEl.style.transform = `rotate(0deg)`;
        this.animId = null;
        return;
      }
      this.dialFaceEl.style.transform = `rotate(${this.currentRotationDeg}deg)`;
      this.animId = requestAnimationFrame(step);
    };
    this.animId = requestAnimationFrame(step);
  }

  private setupKeyboardInput(): void {
    this.container.setAttribute('tabindex', '0');
    this.container.addEventListener('keydown', (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        this.simulateDialDigit(parseInt(e.key, 10));
      }
    });
  }

  public destroy(): void {
    if (this.animId !== null) cancelAnimationFrame(this.animId);
    this.container.remove();
  }
}
