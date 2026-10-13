import * as THREE from 'three';

export class ProceduralTextures {
  public static createCeramicGreenTiles(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = size;
    bumpCanvas.height = size;
    const bumpCtx = bumpCanvas.getContext('2d')!;

    // Recessed clinical dark green grout base
    ctx.fillStyle = '#22352b';
    ctx.fillRect(0, 0, size, size);

    bumpCtx.fillStyle = '#181818';
    bumpCtx.fillRect(0, 0, size, size);

    const tileSize = 64;
    const gap = 3;

    for (let y = 0; y < size; y += tileSize) {
      for (let x = 0; x < size; x += tileSize) {
        // Organic tile variation calibrated for sRGB-to-Linear pipeline (matches style_showcase reflectance)
        const shade = Math.floor(Math.random() * 14 - 7);
        const r = Math.min(255, Math.max(0, 108 + shade));
        const g = Math.min(255, Math.max(0, 146 + Math.floor(shade * 1.2)));
        const b = Math.min(255, Math.max(0, 130 + shade));
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x + gap, y + gap, tileSize - gap * 2, tileSize - gap * 2);

        // Crisp glazed bevel highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
        ctx.fillRect(x + gap, y + gap, tileSize - gap * 2, 2);
        ctx.fillRect(x + gap, y + gap, 2, tileSize - gap * 2);

        // Bottom/Right bevel shade
        ctx.fillStyle = 'rgba(20, 35, 28, 0.38)';
        ctx.fillRect(x + gap, y + tileSize - gap - 2, tileSize - gap * 2, 2);
        ctx.fillRect(x + tileSize - gap - 2, y + gap, 2, tileSize - gap * 2);

        // Bump map: raised tile face with crisp edges
        bumpCtx.fillStyle = '#e8e8e8';
        bumpCtx.fillRect(x + gap, y + gap, tileSize - gap * 2, tileSize - gap * 2);
      }
    }

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.colorSpace = THREE.SRGBColorSpace;
    map.repeat.set(12, 3.5);

    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.repeat.set(12, 3.5);

    return { map, bumpMap };
  }

  public static createTerrazzoFloor(): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Pale clinical alabaster terrazzo base (matches style_showcase #dbe0d9)
    ctx.fillStyle = '#dce2da';
    ctx.fillRect(0, 0, size, size);

    // Symmetrical brass grout dividers
    ctx.strokeStyle = '#b29d7c';
    ctx.lineWidth = 2;
    for (let i = 0; i <= size; i += 128) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
    }

    // Terrazzo aggregate chips
    for (let i = 0; i < 480; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 2.5 + 0.6;
      const rand = Math.random();
      const color = rand > 0.65
        ? 'rgba(45, 74, 62, 0.50)'
        : (rand > 0.30 ? 'rgba(255, 255, 255, 0.85)' : 'rgba(40, 50, 44, 0.35)');
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.repeat.set(7, 7);
    return texture;
  }

  public static createOscilloscopeTexture(): { texture: THREE.CanvasTexture; update: (freq: number, isResonating: boolean, time: number) => void } {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const texture = new THREE.CanvasTexture(canvas);

    const update = (freq: number, isResonating: boolean, time: number) => {
      ctx.fillStyle = '#08120c';
      ctx.fillRect(0, 0, size, size);

      ctx.strokeStyle = 'rgba(74, 222, 128, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= size; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
        ctx.stroke();
      }

      ctx.strokeStyle = isResonating ? '#fbbf24' : '#4ade80';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = isResonating ? '#fbbf24' : '#4ade80';
      ctx.shadowBlur = 8;

      ctx.beginPath();
      const centerY = size / 2;
      const cycles = (freq / 80) * 1.5;
      const amplitude = isResonating ? 40 : 25 + Math.sin(time * 8) * 8;

      for (let x = 0; x < size; x++) {
        const rad = (x / size) * Math.PI * 2 * cycles + time * 6;
        const noise = isResonating ? 0 : (Math.random() - 0.5) * 6;
        const y = centerY + Math.sin(rad) * amplitude + noise;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      texture.needsUpdate = true;
    };

    return { texture, update };
  }
}
