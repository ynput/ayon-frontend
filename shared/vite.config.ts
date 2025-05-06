import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Extract peerDependencies from package.json to automatically externalize them
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)).toString())

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['**/*.test.*', '**/*.stories.*', 'node_modules/**'],
      outDir: 'dist/types',
    }),
  ],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src'), // Alias for src directory
    },
  },
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        api: resolve(__dirname, 'src/api/index.ts'),
        components: resolve(__dirname, 'src/components/index.ts'),
        util: resolve(__dirname, 'src/util/index.ts'),
        hooks: resolve(__dirname, 'src/hooks/index.ts'),
        context: resolve(__dirname, 'src/context/index.ts'),
        // containers
        Actions: resolve(__dirname, 'src/containers/Actions/index.ts'),
        ContextMenu: resolve(__dirname, 'src/containers/ContextMenu/index.ts'),
        DetailsPanel: resolve(__dirname, 'src/containers/DetailsPanel/index.ts'),
        Feed: resolve(__dirname, 'src/containers/Feed/index.ts'),
        ProjectTreeTable: resolve(__dirname, 'src/containers/ProjectTreeTable/index.ts'),
        RepresentationsList: resolve(__dirname, 'src/containers/RepresentationsList/index.ts'),
        Slicer: resolve(__dirname, 'src/containers/Slicer/index.ts'),
      },
      name: 'AyonFrontendShared',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // Automatically externalize all peerDependencies and dependencies
      external: [
        ...Object.keys(pkg.peerDependencies || {}),
        ...Object.keys(pkg.dependencies || {}),
      ],
      output: {
        entryFileNames: (chunkInfo) => `${chunkInfo.name}.[format].js`,
        // Preserve directory structure for chunks
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name.replace(/^_/, '')
          return `chunks/${name}.[format].js`
        },
        preserveModules: true,
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@tanstack/react-table': 'ReactTable',
          '@ynput/ayon-react-components': 'AyonReactComponents',
          'styled-components': 'styled',
        },
      },
    },
    sourcemap: true,
    emptyOutDir: true,
    minify: false, // TODO: set to true for production builds
    cssCodeSplit: true,
  },
})
