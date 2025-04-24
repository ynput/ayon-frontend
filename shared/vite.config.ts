import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true, // Create a separate index.d.ts
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
        index: resolve(__dirname, 'src/index.js'),
        api: resolve(__dirname, 'src/api/index.js'),
        components: resolve(__dirname, 'src/components/index.js'),
        util: resolve(__dirname, 'src/util/index.js'),
        hooks: resolve(__dirname, 'src/hooks/index.js'),
        // containers
        ContextMenu: resolve(__dirname, 'src/containers/ContextMenu/index.js'),
        Feed: resolve(__dirname, 'src/containers/Feed/index.js'),
        ProjectTreeTable: resolve(__dirname, 'src/containers/ProjectTreeTable/index.js'),
        Slicer: resolve(__dirname, 'src/containers/Slicer/index.js'),
      },
      name: 'AyonFrontendShared', // The name of your library (used for UMD and iife formats)
      formats: ['es', 'cjs'], // Output formats (es = ESM, cjs = CommonJS)
      fileName: (format) => `index.${format}.js`, // Output file name pattern
    },
    rollupOptions: {
      // Externalize deps that shouldn't be included in the library
      external: [
        'react',
        'react-dom',
        '@tanstack/react-table',
        '@ynput/ayon-react-components',
        'styled-components',
      ],
      output: {
        // Provide global variables to use in the UMD build
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    sourcemap: true,
    emptyOutDir: true, // Clean the output directory before build
  },
})
