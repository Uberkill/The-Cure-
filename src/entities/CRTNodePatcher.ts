import { EventBus } from '../core/EventBus';
import { CrystalId, AudioLogMetadata } from '../types';
import { AudioEngine } from '../audio/AudioEngine';

export class CRTNodePatcher {
  private static instance: CRTNodePatcher;
  private eventBus: EventBus;
  private modalEl: HTMLElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private currentCrystal: CrystalId | null = null;
  private currentLog: AudioLogMetadata | null = null;
  private isResolving: boolean = false;
  private resolveTimeoutId: number | null = null;

  private nodes: Array<{ x: number; y: number; id: number; connected: boolean; radius: number }> = [];
  private isDragging: boolean = false;
  private activeNodeIndex: number = -1;
  private mousePos: { x: number; y: number } = { x: 0, y: 0 };
  private animationFrameId: number | null = null;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.createDomModal();
    this.setupListeners();
  }

  public static getInstance(): CRTNodePatcher {
    if (!CRTNodePatcher.instance) {
      CRTNodePatcher.instance = new CRTNodePatcher();
    }
    return CRTNodePatcher.instance;
  }

  private createDomModal(): void {
    const existing = document.getElementById('modal-crt-patcher');
    if (existing) {
      this.modalEl = existing;
      this.canvasEl = document.getElementById('crt-patch-canvas') as HTMLCanvasElement;
      if (this.canvasEl) this.ctx = this.canvasEl.getContext('2d');
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'modal-crt-patcher';
    modal.className = 'overlay-screen hidden';
    modal.innerHTML = `
      <div class="crt-patch-housing">
        <div class="crt-housing-bezel">
          <div class="crt-screen-frame">
            <canvas id="crt-patch-canvas" width="640" height="400"></canvas>
            <div class="crt-scanline-mesh"></div>
          </div>
          <div class="crt-patch-footer">
            <div class="crt-patch-info">
              <span class="crt-status-indicator">STATIC INTERFERENCE DETECTED</span>
              <span class="crt-patch-instruction">CONNECT THE VECTOR NODES TO STABILIZE WAVEFORM</span>
            </div>
            <div style="display: flex; gap: 12px;">
              <button class="pill-btn" id="btn-crt-auto-patch">AUTO-STABILIZE</button>
              <button class="pill-btn" id="btn-crt-close">ABORT</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalEl = modal;
    this.canvasEl = document.getElementById('crt-patch-canvas') as HTMLCanvasElement;
    if (this.canvasEl) {
      this.ctx = this.canvasEl.getContext('2d');
      this.setupCanvasInteractions();
    }

    const btnClose = document.getElementById('btn-crt-close');
    btnClose?.addEventListener('click', () => this.close());

    const btnAuto = document.getElementById('btn-crt-auto-patch');
    btnAuto?.addEventListener('click', () => this.resolvePatch());
  }

  private setupListeners(): void {
    this.eventBus.on('puzzle:crt_patch_opened', ({ crystalId }) => {
      this.open(crystalId);
    });
  }

  private setupCanvasInteractions(): void {
    if (!this.canvasEl) return;

    this.canvasEl.style.touchAction = 'none';
    this.canvasEl.addEventListener('pointerdown', (e) => {
      const rect = this.canvasEl!.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 640;
      const y = ((e.clientY - rect.top) / rect.height) * 400;

      for (let i = 0; i < this.nodes.length; i++) {
        const node = this.nodes[i];
        const dist = Math.hypot(node.x - x, node.y - y);
        if (dist <= node.radius * 1.5) {
          this.isDragging = true;
          this.activeNodeIndex = i;
          this.mousePos = { x, y };
          return;
        }
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging || !this.canvasEl) return;
      const rect = this.canvasEl.getBoundingClientRect();
      this.mousePos.x = ((e.clientX - rect.left) / rect.width) * 640;
      this.mousePos.y = ((e.clientY - rect.top) / rect.height) * 400;

      // Check if near another node to snap
      for (let i = 0; i < this.nodes.length; i++) {
        if (i !== this.activeNodeIndex) {
          const target = this.nodes[i];
          const dist = Math.hypot(target.x - this.mousePos.x, target.y - this.mousePos.y);
          if (dist < 28) {
            AudioEngine.getInstance().playTumblerClick();
            this.nodes[this.activeNodeIndex].connected = true;
            target.connected = true;
            this.isDragging = false;
            this.checkCompletion();
            return;
          }
        }
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.activeNodeIndex = -1;
    });
  }

  public open(crystalId: CrystalId): void {
    this.currentCrystal = crystalId;
    this.currentLog = this.getMetadataForCrystal(crystalId);

    // Generate node layout based on crystal index
    this.generateNodes(crystalId);

    if (this.modalEl) {
      this.modalEl.classList.remove('hidden');
    }
    this.isResolving = false;
    this.eventBus.emit('ui:modal_opened', {});
    this.startRenderLoop();
  }

  public close(): void {
    AudioEngine.getInstance().playDoorLatch();
    if (this.modalEl) {
      this.modalEl.classList.add('hidden');
    }
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.resolveTimeoutId !== null) {
      window.clearTimeout(this.resolveTimeoutId);
      this.resolveTimeoutId = null;
    }
    this.isResolving = false;
    this.eventBus.emit('ui:modal_closed', {});
  }

  private generateNodes(crystalId: CrystalId): void {
    const count = crystalId === 'crystal_05_celadon' ? 5 : 3;
    this.nodes = [];

    const startX = 120;
    const spacingX = 400 / (count - 1);

    for (let i = 0; i < count; i++) {
      const yOffset = 200 + (Math.sin(i * 1.5) * 80) + (Math.random() * 20 - 10);
      this.nodes.push({
        x: startX + i * spacingX,
        y: yOffset,
        id: i,
        connected: false,
        radius: 12
      });
    }
  }

  private checkCompletion(): void {
    const allConnected = this.nodes.every((n) => n.connected);
    if (allConnected) {
      this.resolvePatch();
    }
  }

  private resolvePatch(): void {
    if (!this.currentCrystal || !this.currentLog || this.isResolving) return;
    this.isResolving = true;
    AudioEngine.getInstance().playGlassClink();
    this.nodes.forEach((n) => (n.connected = true));
    this.resolveTimeoutId = window.setTimeout(() => {
      this.eventBus.emit('puzzle:crt_patch_completed', {
        crystalId: this.currentCrystal!,
        log: this.currentLog!
      });
      this.close();
    }, 450);
  }

  private startRenderLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    const render = () => {
      this.drawCanvas();
      this.animationFrameId = requestAnimationFrame(render);
    };
    render();
  }

  private drawCanvas(): void {
    if (!this.ctx || !this.canvasEl) return;
    const ctx = this.ctx;
    const time = performance.now() * 0.002;

    // Dark Phosphor CRT Background
    ctx.fillStyle = '#08140e';
    ctx.fillRect(0, 0, 640, 400);

    // Phosphor Grid Lines
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 640; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 400);
      ctx.stroke();
    }
    for (let y = 0; y < 400; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(640, y);
      ctx.stroke();
    }

    // Oscilloscope Static Sine Wave
    const allConnected = this.nodes.every((n) => n.connected);
    ctx.strokeStyle = allConnected ? '#4ade80' : 'rgba(74, 222, 128, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let x = 0; x < 640; x += 4) {
      const noise = allConnected ? 0 : (Math.random() - 0.5) * 18;
      const y = 200 + Math.sin(x * 0.02 + time * 3) * (allConnected ? 50 : 25) + noise;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Node Connections
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 3;
    for (let i = 0; i < this.nodes.length - 1; i++) {
      if (this.nodes[i].connected && this.nodes[i + 1].connected) {
        ctx.beginPath();
        ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
        ctx.lineTo(this.nodes[i + 1].x, this.nodes[i + 1].y);
        ctx.stroke();
      }
    }

    // Dragging Connection Line
    if (this.isDragging && this.activeNodeIndex >= 0) {
      const activeNode = this.nodes[this.activeNodeIndex];
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(activeNode.x, activeNode.y);
      ctx.lineTo(this.mousePos.x, this.mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Vector Nodes
    for (const node of this.nodes) {
      ctx.fillStyle = node.connected ? '#4ade80' : '#234e38';
      ctx.strokeStyle = node.connected ? '#86efac' : '#719b84';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glowing Center
      ctx.fillStyle = node.connected ? '#ffffff' : '#4ade80';
      ctx.beginPath();
      ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private getMetadataForCrystal(crystalId: CrystalId): AudioLogMetadata {
    const logs: Record<CrystalId, AudioLogMetadata> = {
      crystal_01_quartz: {
        id: 'log_01',
        actTitle: 'ACT II: THE SLEEP WARD',
        dateStr: 'August 14, 1973',
        speaker: 'Dr. H. Vandermeer',
        transcript: 'Recording Date: August 14, 1973. Subject 104 is responding well to phase decoupling. The limbic friction has abated. The cure for human sorrow is within reach.'
      },
      crystal_02_bronze: {
        id: 'log_02',
        actTitle: 'ACT III: THE HYDROTHERAPY ROOM',
        dateStr: 'September 02, 1973',
        speaker: 'Dr. H. Vandermeer',
        transcript: 'Observation 44. Dr. Vandermeer recording. The hydrotherapy immersion protocols have failed because we continue to treat the symptom. Sorrow is not an infection. Flesh is the infection.'
      },
      crystal_03_amethyst: {
        id: 'log_03',
        actTitle: 'ACT IV: THE AUDIOLOGY VAULT',
        dateStr: 'October 19, 1973',
        speaker: 'The Directorate',
        transcript: 'Life is the disease. Death is the absolute alignment. We must synthesize the silence.'
      },
      crystal_04_obsidian: {
        id: 'log_04',
        actTitle: 'ACT V: THE ARCHIVE',
        dateStr: 'November 28, 1973',
        speaker: 'Automated Transmission',
        transcript: 'The ultimate silence is prepared. The carrier is ready.'
      },
      crystal_05_celadon: {
        id: 'log_05',
        actTitle: 'ACT VII: THE SYNTHESIS',
        dateStr: 'December 12, 1973',
        speaker: 'Subject 104 Recording',
        transcript: 'The exit is open. The cure is spreading. Thank you for your compliance.'
      }
    };
    return logs[crystalId];
  }
}
