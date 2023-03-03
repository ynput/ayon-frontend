import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

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
          changeOrigin: false,
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
      },
    },
    plugins: [react()],
  })
}
