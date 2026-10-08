import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import dts from 'unplugin-dts/vite'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Extract peerDependencies from package.json to automatically externalize them
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)).toString())

// Packages the published build imports instead of bundling. Only these are
// installed alongside it, so devDependencies must not be imported at runtime.
const runtimePackages = [
  ...Object.keys(pkg.peerDependencies || {}),
  ...Object.keys(pkg.dependencies || {}),
]

const isRuntimePackage = (id: string) =>
  runtimePackages.some((pkgName) => id === pkgName || id.startsWith(`${pkgName}/`))

// e.g. ".../node_modules/@dnd-kit/utilities/dist/x.js" -> "@dnd-kit/utilities"
const packageNameFromPath = (id: string) => {
  const [first, second] = id.split('/node_modules/').pop()!.split('/')
  return first.startsWith('@') ? `${first}/${second}` : first
}

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
      external: (id) => {
        // Local relative imports, project aliases and virtual modules are bundled
        if (id.startsWith('.') || id.startsWith('@shared') || id.startsWith('\0')) return false

        if (path.isAbsolute(id)) {
          // A resolved file of an installed package. Imports of declared packages are
          // externalized before they get here, so this package isn't declared: the
          // published import would point at the builder's own node_modules path.
          if (id.includes('/node_modules/')) {
            throw new Error(
              `"${packageNameFromPath(id)}" is imported but not declared in shared/package.json ` +
                `(${id}). Add it to "dependencies", or to "peerDependencies" if the host app must provide it.`,
            )
          }
          return false
        }

        // Imports of declared packages and their subpaths (e.g. "react/jsx-runtime")
        return isRuntimePackage(id)
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
