import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

const DevEditorPlugin = () => ({
  name: 'dev-editor-plugin',
  configureServer(server) {
    server.middlewares.use('/api/upload-asset', (req, res) => {
      if (req.method === 'POST') {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const filename = url.searchParams.get('filename') || 'upload.bin';
        const type = url.searchParams.get('type') || 'textures';
        
        const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const targetDir = path.resolve(__dirname, `public/assets/${type}`);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        const targetPath = path.join(targetDir, safeName);
        const writeStream = fs.createWriteStream(targetPath);
        
        req.pipe(writeStream);
        
        writeStream.on('finish', () => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, path: `/assets/${type}/${safeName}` }));
        });
        
        writeStream.on('error', (err) => {
          console.error('Upload Error:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        });
      } else {
        res.statusCode = 405;
        res.end();
      }
    });

    server.middlewares.use('/api/save-layout', (req, res) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const incoming = JSON.parse(body);
            const layoutPath = path.resolve(__dirname, 'src/data/room_layout.json');
            
            let current = {};
            if (fs.existsSync(layoutPath)) {
              current = JSON.parse(fs.readFileSync(layoutPath, 'utf-8'));
            }

            // Deep merge logic for transforms
            const merged = { ...current };
            for (const [key, value] of Object.entries(incoming)) {
              if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                merged[key] = { ...(merged[key] || {}), ...value };
              } else {
                merged[key] = value;
              }
            }

            const dataDir = path.dirname(layoutPath);
            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true });
            }

            fs.writeFileSync(layoutPath, JSON.stringify(merged, null, 2));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            console.error('Error saving layout:', e);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      } else {
        res.statusCode = 405;
        res.end();
      }
    });
  },
  handleHotUpdate({ file, modules }) {
    if (file.endsWith('room_layout.json')) {
      // Suppress HMR for the layout file to prevent state wipe in the editor
      return [];
    }
    return modules;
  }
});

export default defineConfig({
  plugins: [DevEditorPlugin()],
  server: {
    port: 3000,
    open: false,
    host: true
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    }
  }
});
