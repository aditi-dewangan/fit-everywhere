import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: false,
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/extension/content.ts'),
      formats: ['iife'],
      name: 'FitEverywhereContent',
      fileName: () => 'content.js',
    },
  },
});
