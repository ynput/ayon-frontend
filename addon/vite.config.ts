import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'unplugin-dts/vite'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// The package bundles only its own code: react, react-router-dom, react-toastify and
// use-query-params are the host's (peerDependencies). It imports nothing from shared or the app,
// not even types.
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
      // not rolled up per entry: that gives each entry its own copy of SlotMap, and a contract
      // package's `declare module '@ynput/ayon-addon'` would only reach the main entry's
      bundleTypes: false,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        manifest: resolve(__dirname, 'src/manifest.ts'),
        host: resolve(__dirname, 'src/host.ts'),
        check: resolve(__dirname, 'src/check.ts'),
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
