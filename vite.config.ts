import { defineConfig, loadEnv, searchForWorkspaceRoot } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url'
import path from 'path'
import { existsSync, realpathSync } from 'fs'
import { federation } from '@module-federation/vite'
import { dependencies } from './package.json'
import { lodashEs } from './vite-plugins/lodashEs'

const CLAUDE_DIR = fileURLToPath(new URL('./.claude', import.meta.url))

// shared/ installs nothing of its own: its imports resolve from the root node_modules.
// A leftover shared/node_modules gives shared code its own copy of packages (two React
// contexts, e.g. "useDndMonitor must be used within a children of <DndContext>").
if (existsSync(fileURLToPath(new URL('./shared/node_modules', import.meta.url)))) {
  console.warn(
    '\x1b[33mshared/node_modules exists: delete it, all packages come from the root node_modules.\x1b[0m',
  )
}

export default ({ mode }) => {
  Object.assign(process?.env, loadEnv(mode, process?.cwd(), ''))

  let SERVER_URL = 'http://localhost:5000'

  // use .env if valid
  if (process?.env?.SERVER_URL) {
    SERVER_URL = process.env.SERVER_URL
  }

  // https://vitejs.dev/config/
  return defineConfig({
    server: {
      watch: {
        // worktrees live under .claude/worktrees: any tsconfig.json added or changed there
        // makes vite invalidate every module and fully reload the page.
        // Anchored to this project's own .claude folder (not a '**/.claude/**' glob), because
        // a worktree's own path contains .claude and would then ignore every file.
        ignored: (file: string) => file === CLAUDE_DIR || file.startsWith(CLAUDE_DIR + path.sep),
      },
      fs: {
        // worktrees can symlink node_modules to the main checkout. Vite serves files by their
        // real path, so allow those too, or fonts and other assets in node_modules get a 403.
        // In a normal checkout the real paths are inside the workspace and this changes nothing.
        allow: [
          searchForWorkspaceRoot(process.cwd()),
          ...(existsSync('node_modules') ? [realpathSync('node_modules')] : []),
        ],
      },
      proxy: {
        '/api': {
          target: SERVER_URL,
          changeOrigin: true,
        },
        '/ws': {
          target: SERVER_URL,
          changeOrigin: true,
          ws: true,
        },
        '^.*/ws$': {
          target: SERVER_URL,
          changeOrigin: true,
          ws: true,
        },
        '/addons': {
          target: SERVER_URL,
          changeOrigin: true,
        },
        '/graphql': {
          target: SERVER_URL,
          changeOrigin: true,
        },
        '/graphiql': {
          target: SERVER_URL,
          changeOrigin: true,
        },
        '/docs': {
          target: SERVER_URL,
          changeOrigin: true,
        },
        '/openapi.json': {
          target: SERVER_URL,
          changeOrigin: true,
        },
        '/static': {
          target: SERVER_URL,
          changeOrigin: true,
        },
        '/openapi': {
          target: SERVER_URL,
          changeOrigin: true,
        },
      },
    },
    plugins: [
      lodashEs(['src', 'shared/src']),
      federation({
        name: 'host',
        remotes: {},
        exposes: {},
        filename: 'remoteEntry.js',
        shared: {
          react: {
            singleton: true,
            requiredVersion: dependencies.react,
          },
          'react-dom': {
            singleton: true,
            requiredVersion: dependencies['react-dom'],
          },
          '@ynput/ayon-react-components': {
            singleton: true,
          },
        },
      }),
      react(),
    ],
    optimizeDeps: {
      // federation's shared-module wrappers make vite misdetect these as ESM during the scan,
      // which forces an extra full reload once the real optimization finishes
      needsInterop: ['react', 'react-dom', '@ynput/ayon-react-components'],
    },
    build: {
      target: 'chrome89',
      // Disable module preload to prevent hardcoded URLs
      modulePreload: false,
      // Use hash for better cache invalidation
      rollupOptions: {
        output: {
          // Ensure chunks don't have hardcoded base URLs
          manualChunks: undefined,
        },
      },
    },
    resolve: {
      alias: [
        { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
        {
          find: '@containers',
          replacement: fileURLToPath(new URL('./src/containers', import.meta.url)),
        },
        { find: '@hooks', replacement: fileURLToPath(new URL('./src/hooks', import.meta.url)) },
        {
          find: '@components',
          replacement: fileURLToPath(new URL('./src/components', import.meta.url)),
        },
        { find: '@api', replacement: fileURLToPath(new URL('./src/api', import.meta.url)) },
        {
          find: '@types',
          replacement: fileURLToPath(new URL('./src/types', import.meta.url)),
        },
        {
          find: '@queries',
          replacement: fileURLToPath(new URL('./src/services', import.meta.url)),
        },
        { find: '@pages', replacement: fileURLToPath(new URL('./src/pages', import.meta.url)) },
        { find: '@context', replacement: fileURLToPath(new URL('./src/context', import.meta.url)) },
        { find: '@state', replacement: fileURLToPath(new URL('./src/features', import.meta.url)) },
        { find: '@helpers', replacement: fileURLToPath(new URL('./src/helpers', import.meta.url)) },
        {
          find: '@shared',
          replacement: fileURLToPath(new URL('./shared/src', import.meta.url)),
        },
        // @ynput/ayon-player externalises these — point them at the local shared source
        // so the player shares our React contexts instead of getting a second copy
        {
          find: '@ynput/ayon-frontend-shared/ContextMenu',
          replacement: fileURLToPath(
            new URL('./shared/src/containers/ContextMenu', import.meta.url),
          ),
        },
        {
          find: '@ynput/ayon-frontend-shared/Feed',
          replacement: fileURLToPath(new URL('./shared/src/containers/Feed', import.meta.url)),
        },
        {
          find: '@ynput/ayon-frontend-shared/api',
          replacement: fileURLToPath(new URL('./shared/src/api', import.meta.url)),
        },
        {
          find: '@ynput/ayon-frontend-shared/components',
          replacement: fileURLToPath(new URL('./shared/src/components', import.meta.url)),
        },
        {
          find: '@ynput/ayon-frontend-shared/context',
          replacement: fileURLToPath(new URL('./shared/src/context', import.meta.url)),
        },
      ],
      // @ynput/ayon-player asks for a newer styled-components, which yarn installs nested —
      // two stylesheet managers on the same data-styled attribute break rehydration
      dedupe: [
        'styled-components',
        'react',
        'react-dom',
        // lexical relies on single instances (node classes, editor context)
        'lexical',
        '@lexical/clipboard',
        '@lexical/code',
        '@lexical/code-prism',
        '@lexical/history',
        '@lexical/link',
        '@lexical/list',
        '@lexical/markdown',
        '@lexical/react',
        '@lexical/rich-text',
        '@lexical/selection',
        '@lexical/utils',
        // languages are registered on the one prism instance lexical highlights with
        'prismjs',
      ],
    },
  })
}
