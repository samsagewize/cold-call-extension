import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';

// BUILD_TARGET=ext => outputs a Chrome Extension bundle (dist-ext)
const target = process.env.BUILD_TARGET;
const isExt = target === 'ext';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'calltrack-copy-extension-assets',
      apply: 'build',
      async closeBundle() {
        if (!isExt) return;

        const outDir = resolve(process.cwd(), 'dist-ext');
        await mkdir(outDir, { recursive: true });

        // Copy icons
        await copyFile(resolve(process.cwd(), 'public/icon-192.png'), resolve(outDir, 'icon-192.png'));
        await copyFile(resolve(process.cwd(), 'public/icon-512.png'), resolve(outDir, 'icon-512.png'));

        // Copy background service worker
        await copyFile(resolve(process.cwd(), 'extension/background.js'), resolve(outDir, 'background.js'));

        // Write manifest.json (MV3)
        const manifestRaw = await readFile(resolve(process.cwd(), 'extension/manifest.json'), 'utf8');
        await writeFile(resolve(outDir, 'manifest.json'), manifestRaw);
      }
    }
  ],
  base: isExt ? './' : '/',
  server: {
    host: true,
    port: 5173,
    strictPort: true
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true
  },
  build: {
    outDir: isExt ? 'dist-ext' : 'dist',
    emptyOutDir: true,
    sourcemap: true
  }
});
