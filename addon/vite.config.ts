import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'unplugin-dts/vite'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// The package bundles only its own code: react, react-router-dom and react-toastify are the
// host's (peerDependencies). It imports nothing from shared or the app, not even types.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)).toString())
const peers = Object.keys(pkg.peerDependencies || {})
const isPeer = (id: string) => peers.some((name) => id === name || id.startsWith(`${name}/`))

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      outDirs: 'dist/types',
      tsconfigPath: './tsconfig.json',
      entryRoot: 'src',
      bundleTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        manifest: resolve(__dirname, 'src/manifest.ts'),
        host: resolve(__dirname, 'src/host.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: isPeer,
      output: {
        entryFileNames: '[name].[format].js',
        chunkFileNames: 'chunks/[name].[format].js',
      },
    },
    // small, and readable when debugging an addon against it
    minify: false,
    sourcemap: false,
    emptyOutDir: true,
  },
})
