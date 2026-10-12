/**
 * Reusable Switchboard Jack Matrix Component.
 * Simulates 1950s/1970s telephone switchboard patch sockets with
 * dynamic SVG catenary Bezier cables, contact LEDs, and ResizeObserver support.
 */

export interface PatchSocket {
  id: string;
  label: string;
  roomCode: string;
}

export interface PatchMatrixOptions {
  sockets?: PatchSocket[];
  onConnect?: (fromId: string, toId: string) => void;
  onDisconnect?: (fromId: string, toId: string) => void;
}

export class PatchMatrix {
  private container: HTMLElement;
  private socketWrapEl: HTMLElement;
  private svgEl: SVGSVGElement;
  private statusEl: HTMLElement;

  private sockets: PatchSocket[];
  private selectedSocketId: string | null = null;
  private connections: Array<[string, string]> = [];

  private resizeObserver!: ResizeObserver;
  private onConnect?: (fromId: string, toId: string) => void;
  private onDisconnect?: (fromId: string, toId: string) => void;

  constructor(mountPoint: HTMLElement, options: PatchMatrixOptions = {}) {
    this.sockets = options.sockets ?? [
      { id: 'jack_hub', label: 'HUB 04', roomCode: 'RECEPTION' },
      { id: 'jack_slp', label: 'SLP 02', roomCode: 'SLEEP WARD' },
      { id: 'jack_hyd', label: 'HYD 03', roomCode: 'HYDROTHERAPY' },
      { id: 'jack_aud', label: 'AUD 04', roomCode: 'AUDIOLOGY' },
      { id: 'jack_arc', label: 'ARC 05', roomCode: 'ARCHIVE' },
      { id: 'jack_dir', label: 'DIR 06', roomCode: 'DIRECTOR' }
    ];
    this.onConnect = options.onConnect;
    this.onDisconnect = options.onDisconnect;

    this.container = document.createElement('div');
    this.container.className = 'patch-matrix-widget';
    this.container.setAttribute('role', 'region');
    this.container.setAttribute('aria-label', 'Telephone Switchboard Patch Matrix');

    // Header
    const header = document.createElement('div');
    header.className = 'patch-header';
    const title = document.createElement('span');
    title.className = 'patch-title';
    title.textContent = 'TELEPHONE SWITCHBOARD // JACK MATRIX';

    this.statusEl = document.createElement('span');
    this.statusEl.className = 'patch-status';
    this.statusEl.textContent = 'PATCH CORDS: 0 ACTIVE';

    header.appendChild(title);
    header.appendChild(this.statusEl);

    // Board area with relative layout
    const boardArea = document.createElement('div');
    boardArea.className = 'patch-board-area';

    // SVG layer for patch cables
    this.svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgEl.setAttribute('class', 'patch-svg-layer');
    boardArea.appendChild(this.svgEl);

    // Sockets grid
    this.socketWrapEl = document.createElement('div');
    this.socketWrapEl.className = 'patch-sockets-grid';

    this.sockets.forEach((s) => {
      const socketBox = document.createElement('div');
      socketBox.className = 'patch-socket-box';
      socketBox.setAttribute('data-socket-id', s.id);
      socketBox.setAttribute('role', 'button');
      socketBox.setAttribute('tabindex', '0');
      socketBox.setAttribute('aria-label', `Patch Socket ${s.label}`);
      socketBox.setAttribute('aria-pressed', 'false');

      const led = document.createElement('div');
      led.className = 'patch-led';

      const jackHole = document.createElement('div');
      jackHole.className = 'patch-jack-hole';

      const label = document.createElement('span');
      label.className = 'patch-socket-label';
      label.textContent = s.label;

      socketBox.appendChild(led);
      socketBox.appendChild(jackHole);
      socketBox.appendChild(label);

      socketBox.addEventListener('click', () => this.handleSocketClick(s.id));
      socketBox.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleSocketClick(s.id);
        }
      });

      this.socketWrapEl.appendChild(socketBox);
    });

    boardArea.appendChild(this.socketWrapEl);

    // Footer with Disconnect All button
    const footer = document.createElement('div');
    footer.className = 'patch-footer';
    const btnClear = document.createElement('button');
    btnClear.className = 'pill-btn';
    btnClear.style.padding = '4px 12px';
    btnClear.style.fontSize = '10px';
    btnClear.textContent = 'CLEAR ALL CORDS';
    btnClear.addEventListener('click', () => this.clearConnections());
    footer.appendChild(btnClear);

    this.container.appendChild(header);
    this.container.appendChild(boardArea);
    this.container.appendChild(footer);
    mountPoint.appendChild(this.container);

    this.setupResizeObserver();
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.renderCables();
    });
    this.resizeObserver.observe(this.container);
  }

  private handleSocketClick(socketId: string): void {
    if (this.selectedSocketId === null) {
      // First socket selected
      this.selectedSocketId = socketId;
      this.updateSocketVisuals();
      this.statusEl.textContent = `ROUTE: ${socketId} -> SELECT TARGET`;
    } else if (this.selectedSocketId === socketId) {
      // Deselect if clicked same
      this.selectedSocketId = null;
      this.updateSocketVisuals();
      this.statusEl.textContent = `PATCH CORDS: ${this.connections.length} ACTIVE`;
    } else {
      // Check if already connected
      const existingIdx = this.connections.findIndex(
        ([a, b]) => (a === this.selectedSocketId && b === socketId) || (a === socketId && b === this.selectedSocketId)
      );

      if (existingIdx !== -1) {
        // Disconnect
        const [a, b] = this.connections.splice(existingIdx, 1)[0];
        if (this.onDisconnect) this.onDisconnect(a, b);
      } else {
        // Connect
        this.connections.push([this.selectedSocketId, socketId]);
        if (this.onConnect) this.onConnect(this.selectedSocketId, socketId);
      }

      this.selectedSocketId = null;
      this.updateSocketVisuals();
      this.renderCables();
      this.statusEl.textContent = `PATCH CORDS: ${this.connections.length} ACTIVE`;
    }
  }

  public clearConnections(): void {
    this.connections = [];
    this.selectedSocketId = null;
    this.updateSocketVisuals();
    this.renderCables();
    this.statusEl.textContent = 'PATCH CORDS: 0 ACTIVE';
  }

  private updateSocketVisuals(): void {
    const boxes = this.container.querySelectorAll('.patch-socket-box');
    boxes.forEach((box) => {
      const id = box.getAttribute('data-socket-id');
      const isSelected = id === this.selectedSocketId;
      const isConnected = this.connections.some(([a, b]) => a === id || b === id);

      box.classList.toggle('selected', isSelected);
      box.classList.toggle('connected', isConnected);
      box.setAttribute('aria-pressed', isConnected || isSelected ? 'true' : 'false');

      const led = box.querySelector('.patch-led') as HTMLElement;
      if (led) {
        led.classList.toggle('active', isConnected);
        led.classList.toggle('pending', isSelected);
      }
    });
  }

  private renderCables(): void {
    // Clear SVG paths
    while (this.svgEl.firstChild) {
      this.svgEl.removeChild(this.svgEl.firstChild);
    }

    const boardRect = this.container.querySelector('.patch-board-area')!.getBoundingClientRect();
    if (boardRect.width === 0 || boardRect.height === 0) return;

    this.svgEl.setAttribute('viewBox', `0 0 ${boardRect.width} ${boardRect.height}`);

    this.connections.forEach(([idA, idB], idx) => {
      const elA = this.container.querySelector(`[data-socket-id="${idA}"] .patch-jack-hole`) as HTMLElement;
      const elB = this.container.querySelector(`[data-socket-id="${idB}"] .patch-jack-hole`) as HTMLElement;
      if (!elA || !elB) return;

      const rectA = elA.getBoundingClientRect();
      const rectB = elB.getBoundingClientRect();

      const x1 = rectA.left + rectA.width / 2 - boardRect.left;
      const y1 = rectA.top + rectA.height / 2 - boardRect.top;
      const x2 = rectB.left + rectB.width / 2 - boardRect.left;
      const y2 = rectB.top + rectB.height / 2 - boardRect.top;

      // Realistic catenary curve sag
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const sag = Math.min(60, dist * 0.35 + 15);
      const cx = (x1 + x2) / 2;
      const cy = Math.max(y1, y2) + sag;

      // Path
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);

      // Varying cord colors (Mid-century fabric covered braided cords)
      const colors = ['#C28833', '#8B1E23', '#2D4A3E', '#141A21'];
      const cordColor = colors[idx % colors.length];

      path.setAttribute('stroke', cordColor);
      path.setAttribute('stroke-width', '4');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('filter', 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))');

      this.svgEl.appendChild(path);
    });
  }

  public destroy(): void {
    this.resizeObserver.disconnect();
    this.container.remove();
  }
}
