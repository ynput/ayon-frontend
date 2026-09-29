import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import dts from 'unplugin-dts/vite'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Extract peerDependencies from package.json to automatically externalize them
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)).toString())

const vendorPackages = [
  ...Object.keys(pkg.peerDependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
  ...Object.keys(pkg.dependencies || {}),
]

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['**/*.test.*', '**/*.stories.*', 'node_modules/**'],
      outDirs: 'dist/types',
      tsconfigPath: './tsconfig.json',
      entryRoot: 'src',
      bundleTypes: true,
      clearPureImport: false,
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
        Views: resolve(__dirname, 'src/containers/Views/index.ts'),
        SimpleTable: resolve(__dirname, 'src/containers/SimpleTable/index.ts'),
        EntityPickerDialog: resolve(__dirname, 'src/containers/EntityPickerDialog/index.ts'),
        ListTable: resolve(__dirname, 'src/containers/ListTable/index.ts'),
        NewEntity: resolve(__dirname, 'src/containers/NewEntity/index.ts'),
      },
      name: 'AyonFrontendShared',
      formats: ['es'],
    },
    rollupOptions: {
      /// Functional match for robust externalization
      external: (id) => {
        // 1. Externalize anything coming from an absolute node_modules path
        if (id.includes('node_modules')) return true

        // 2. Keep local relative imports and project aliases inside the build
        if (id.startsWith('.') || id.startsWith('/') || id.startsWith('@shared')) {
          return false
        }

        // 3. Match any package or subpath in dependencies (e.g. "react", "react/jsx-runtime")
        return vendorPackages.some((pkgName) => id === pkgName || id.startsWith(`${pkgName}/`))
      },
      output: {
        entryFileNames: (chunkInfo) => `${chunkInfo.name}.[format].js`,
        // Preserve directory structure for chunks
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name.replace(/^_/, '')
          return `chunks/${name}.[format].js`
        },
        // preserveModules: true,
        // preserveModulesRoot: 'src',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@tanstack/react-table': 'ReactTable',
          '@ynput/ayon-react-components': 'AyonReactComponents',
          'styled-components': 'styled',
        },
      },
    },
    sourcemap: false,
    emptyOutDir: true,
    minify: true,
    cssCodeSplit: true,
  },
})
