import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export function exportObjectToGLB(object: THREE.Object3D): Promise<ArrayBuffer> {
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(
      object,
      (gltf) => {
        if (gltf instanceof ArrayBuffer) {
          resolve(gltf);
        } else {
          const str = JSON.stringify(gltf);
          const buf = new TextEncoder().encode(str).buffer;
          resolve(buf);
        }
      },
      (err) => reject(err),
      { binary: true }
    );
  });
}

export function downloadGLB(buffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([buffer], { type: 'model/gltf-binary' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
