import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true, // Create a separate index.d.ts
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.tsx'), // Entry point of your library
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
