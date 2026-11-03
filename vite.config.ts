import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Builds the popup page. The content script is built separately
// (vite.content.config.ts) because Chrome injects it as a classic script,
// so it has to be a single file with no imports.
export default defineConfig({
  root: resolve(__dirname, 'src/ui/popup'),
  publicDir: resolve(__dirname, 'public'),
  base: './',
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/ui/popup/popup.html'),
    },
  },
});
