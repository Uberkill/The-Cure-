export interface ChladniParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export class ChladniRenderer {
  private ctx: CanvasRenderingContext2D;
  private animFrameId: number | null = null;
  private particles: ChladniParticle[] = [];
  
  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.initParticles();
  }

  private initParticles(): void {
    this.particles = [];
    const count = 180;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * 0.9;
      this.particles.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        vx: 0,
        vy: 0
      });
    }
  }

  public start(getStateFn: () => { freqHz: number, isNull: boolean }): void {
    if (this.animFrameId) return;

    const render = () => {
      this.drawChladniPlate(getStateFn());
      this.animFrameId = requestAnimationFrame(render);
    };
    render();
  }

  public stop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private drawChladniPlate(state: { freqHz: number, isNull: boolean }): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = w * 0.45;

    // Dark background fade
    this.ctx.fillStyle = 'rgba(12, 16, 14, 0.3)';
    this.ctx.fillRect(0, 0, w, h);

    // Circular plate border
    this.ctx.strokeStyle = '#2d3830';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
    this.ctx.stroke();

    const freqFactor = (state.freqHz - 300) / 600;
    const m = 3 + Math.floor(freqFactor * 4);
    const n = 2 + Math.floor(freqFactor * 3);

    // Update and draw sand particles
    this.ctx.fillStyle = state.isNull ? '#a78bfa' : '#4ade80';

    for (const p of this.particles) {
      if (!state.isNull) {
        // High modal agitation
        const field = Math.sin(n * Math.PI * p.x) * Math.cos(m * Math.PI * p.y) -
                      Math.cos(m * Math.PI * p.x) * Math.sin(n * Math.PI * p.y);
        const jitter = (Math.random() - 0.5) * 0.04;
        p.vx += field * 0.005 + jitter * 0.1;
        p.vy += field * 0.005 + jitter * 0.1;
        p.vx *= 0.85;
        p.vy *= 0.85;
      } else {
        // Settled into clean nodal mandala
        const targetX = Math.round(p.x * 4) / 4;
        const targetY = Math.round(p.y * 4) / 4;
        p.vx = (targetX - p.x) * 0.08;
        p.vy = (targetY - p.y) * 0.08;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Keep within circular plate
      const dist = Math.sqrt(p.x * p.x + p.y * p.y);
      if (dist > 0.9) {
        p.x = (p.x / dist) * 0.88;
        p.y = (p.y / dist) * 0.88;
      }

      const screenX = cx + p.x * r;
      const screenY = cy + p.y * r;

      this.ctx.beginPath();
      this.ctx.arc(screenX, screenY, state.isNull ? 2.0 : 1.5, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}
