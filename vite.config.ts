import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url'
import { federation } from '@module-federation/vite'
import { dependencies } from './package.json'

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
        },
      }),
      react(),
    ],
    build: {
      target: 'chrome89',
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
      ],
    },
  })
}
