import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  build: {
    target: ['safari13', 'chrome90'],
    outDir: 'dist-ggbond-preview',
    rollupOptions: { input: resolve(__dirname, 'ggbond-preview.html') },
  },
});
