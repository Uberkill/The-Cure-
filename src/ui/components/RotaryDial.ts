/**
 * Reusable Vintage Rotary Telephone Dial Widget.
 * Features 10 finger holes, Bakelite center boss, metal finger stop,
 * pointer-capture drag physics, click-to-dial auto-stroke,
 * mechanical governor spring-back return loop, and keyboard fallback (0-9 digits).
 */

export interface RotaryDialOptions {
  onDigitDialed?: (digit: number) => void;
  diameterPx?: number;
}

export class RotaryDial {
  public static readonly DIAL_DIAMETER = 180;
  public static readonly CENTER = 90;
  public static readonly HOLE_ORBIT_RADIUS = 56;
  public static readonly HOLE_SIZE = 28;
  public static readonly STOP_ANGLE_DEG = 310;
  public static readonly BASE_ANGLE_DEG = 45;
  public static readonly SPACING_DEG = 26;

  private container: HTMLElement;
  private dialFaceEl: HTMLElement;
  private currentRotationDeg: number = 0;
  private isDialing: boolean = false;
  private isReturning: boolean = false;
  private activeDigit: number | null = null;
  private animId: number | null = null;
  private dialTimeoutId: number | null = null;
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
    escutcheon.style.width = `${RotaryDial.DIAL_DIAMETER}px`;
    escutcheon.style.height = `${RotaryDial.DIAL_DIAMETER}px`;

    // Stationary number backing ring
    const numberRing = document.createElement('div');
    numberRing.className = 'rotary-number-ring';

    // Central stationary Bakelite hub cap
    const centerBoss = document.createElement('div');
    centerBoss.className = 'rotary-center-boss';
    centerBoss.innerHTML = '<span class="boss-text">FACILITY<br>1974</span>';

    // Rotating clear finger wheel
    this.dialFaceEl = document.createElement('div');
    this.dialFaceEl.className = 'rotary-wheel';
    this.dialFaceEl.style.transformOrigin = `${RotaryDial.CENTER}px ${RotaryDial.CENTER}px`;

    // Finger holes (1 to 9, then 0)
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

    digits.forEach((digit, idx) => {
      const angle = RotaryDial.BASE_ANGLE_DEG + idx * RotaryDial.SPACING_DEG;
      const rad = (angle * Math.PI) / 180;
      const cx = RotaryDial.CENTER + Math.cos(rad) * RotaryDial.HOLE_ORBIT_RADIUS;
      const cy = RotaryDial.CENTER + Math.sin(rad) * RotaryDial.HOLE_ORBIT_RADIUS;

      // Background stationary number
      const numLabel = document.createElement('div');
      numLabel.className = 'rotary-digit-label';
      numLabel.textContent = digit.toString();
      numLabel.style.left = `${cx}px`;
      numLabel.style.top = `${cy}px`;
      numLabel.style.marginLeft = `-${RotaryDial.HOLE_SIZE / 2}px`;
      numLabel.style.marginTop = `-${RotaryDial.HOLE_SIZE / 2}px`;
      numLabel.style.width = `${RotaryDial.HOLE_SIZE}px`;
      numLabel.style.height = `${RotaryDial.HOLE_SIZE}px`;
      numberRing.appendChild(numLabel);

      // Rotating finger hole
      const hole = document.createElement('div');
      hole.className = 'rotary-hole';
      hole.id = `btn-dial-${digit}`;
      hole.setAttribute('data-testid', `btn-dial-${digit}`);
      hole.setAttribute('data-digit', digit.toString());
      hole.setAttribute('role', 'button');
      hole.setAttribute('aria-label', `Dial digit ${digit}`);
      hole.setAttribute('tabindex', '0');
      hole.style.left = `${cx}px`;
      hole.style.top = `${cy}px`;
      hole.style.marginLeft = `-${RotaryDial.HOLE_SIZE / 2}px`;
      hole.style.marginTop = `-${RotaryDial.HOLE_SIZE / 2}px`;
      hole.style.width = `${RotaryDial.HOLE_SIZE}px`;
      hole.style.height = `${RotaryDial.HOLE_SIZE}px`;

      this.bindHoleEvents(hole, digit, angle);
      this.dialFaceEl.appendChild(hole);
    });

    // Metal finger stop bracket positioned near 310 deg
    const fingerStop = document.createElement('div');
    fingerStop.className = 'rotary-finger-stop';
    const stopRad = (RotaryDial.STOP_ANGLE_DEG * Math.PI) / 180;
    const stopX = RotaryDial.CENTER + Math.cos(stopRad) * (RotaryDial.HOLE_ORBIT_RADIUS + 4);
    const stopY = RotaryDial.CENTER + Math.sin(stopRad) * (RotaryDial.HOLE_ORBIT_RADIUS + 4);
    fingerStop.style.left = `${stopX}px`;
    fingerStop.style.top = `${stopY}px`;

    escutcheon.appendChild(numberRing);
    escutcheon.appendChild(this.dialFaceEl);
    escutcheon.appendChild(centerBoss);
    escutcheon.appendChild(fingerStop);
    this.container.appendChild(escutcheon);
    mountPoint.appendChild(this.container);

    this.setupKeyboardInput();
  }

  private bindHoleEvents(hole: HTMLElement, digit: number, digitAngleDeg: number): void {
    const targetTravelDeg = RotaryDial.STOP_ANGLE_DEG - digitAngleDeg;

    let startPointerAngle: number | null = null;
    let hasDragged = false;

    const onPointerDown = (e: PointerEvent) => {
      if (this.isDialing || this.isReturning) return;
      this.isDialing = true;
      this.activeDigit = digit;
      hasDragged = false;

      try {
        hole.setPointerCapture(e.pointerId);
      } catch {
        // Fallback for mock environments
      }

      const rect = this.dialFaceEl.getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;
      startPointerAngle = (Math.atan2(e.clientY - originY, e.clientX - originX) * 180) / Math.PI;
      if (startPointerAngle < 0) startPointerAngle += 360;

      const onPointerMove = (me: PointerEvent) => {
        if (!this.isDialing || startPointerAngle === null) return;
        const currX = me.clientX - originX;
        const currY = me.clientY - originY;
        let currAngle = (Math.atan2(currY, currX) * 180) / Math.PI;
        if (currAngle < 0) currAngle += 360;

        let delta = currAngle - startPointerAngle;
        if (delta < -180) delta += 360;
        if (delta > 180) delta -= 360;

        if (Math.abs(delta) > 3) hasDragged = true;

        if (delta > 0) {
          this.currentRotationDeg = Math.min(targetTravelDeg, delta);
          this.dialFaceEl.style.transform = `rotate(${this.currentRotationDeg}deg)`;
        }
      };

      const onPointerUp = (ue: PointerEvent) => {
        try {
          hole.releasePointerCapture(ue.pointerId);
        } catch {
          // Safe fallback
        }
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);

        if (hasDragged) {
          const reachedTarget = this.currentRotationDeg >= targetTravelDeg * 0.7;
          if (reachedTarget && this.onDigitDialed && this.activeDigit !== null) {
            this.onDigitDialed(this.activeDigit);
          }
          this.isDialing = false;
          this.springReturn();
        } else {
          this.isDialing = false;
        }
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    };

    hole.addEventListener('pointerdown', onPointerDown);

    hole.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      if (hasDragged) {
        hasDragged = false;
        return;
      }
      this.simulateDialDigit(digit);
    });

    hole.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.simulateDialDigit(digit);
      }
    });
  }

  public simulateDialDigit(digit: number): void {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.dialTimeoutId !== null) {
      clearTimeout(this.dialTimeoutId);
      this.dialTimeoutId = null;
    }

    this.isDialing = true;
    this.isReturning = false;
    this.activeDigit = digit;

    if (this.onDigitDialed) {
      this.onDigitDialed(digit);
    }

    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    const idx = digits.indexOf(digit);
    const digitAngleDeg = RotaryDial.BASE_ANGLE_DEG + idx * RotaryDial.SPACING_DEG;
    const targetTravelDeg = RotaryDial.STOP_ANGLE_DEG - digitAngleDeg;

    this.dialFaceEl.style.transition = 'transform 0.28s cubic-bezier(0.2, 0.8, 0.4, 1)';
    this.dialFaceEl.style.transform = `rotate(${targetTravelDeg}deg)`;
    this.currentRotationDeg = targetTravelDeg;

    this.dialTimeoutId = window.setTimeout(() => {
      this.dialFaceEl.style.transition = '';
      this.dialTimeoutId = null;
      this.isDialing = false;
      this.springReturn();
    }, 300);
  }

  private springReturn(): void {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.isReturning = true;

    // Mechanical governor return velocity (degrees per tick)
    const returnSpeed = 16;
    const step = () => {
      this.currentRotationDeg -= returnSpeed;
      if (this.currentRotationDeg <= 0) {
        this.currentRotationDeg = 0;
        this.dialFaceEl.style.transform = 'rotate(0deg)';
        this.isReturning = false;
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
    if (this.dialTimeoutId !== null) clearTimeout(this.dialTimeoutId);
    this.container.remove();
  }
}
