import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@babylonjs/core': '@babylonjs/core/legacy/legacy',
      '@babylonjs/loaders': '@babylonjs/loaders/legacy/legacy'
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    chunkSizeWarningLimit: 1600
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  assetsInclude: ['**/*.wasm'],
  publicDir: 'public',
  optimizeDeps: {
    exclude: ['@babylonjs/havok']
  }
}); 