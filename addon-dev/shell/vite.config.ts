import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// The standalone dev shell, built into dist/shell. Every package import stays an import: the
// addon's dev server resolves them from the addon (its React, store and shared package), so the
// shell and the real shared components it renders read the same @ynput/ayon-addon registry.
export default defineConfig({
  plugins: [react()],
  build: {
    lib: { entry: resolve(__dirname, 'src/index.tsx'), formats: ['es'], fileName: () => 'index.js' },
    outDir: resolve(__dirname, '../dist/shell'),
    emptyOutDir: true,
    minify: false,
    cssCodeSplit: false,
    rollupOptions: {
      external: (id) => !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('\0'),
      output: { assetFileNames: 'style.css' },
    },
  },
})
