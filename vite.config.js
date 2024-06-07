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
          timeout: 60000, // Increase timeout to 60 seconds
          proxyTimeout: 60000, // Increase proxy timeout to 60 seconds
          // handle the errors properly
          onError(err, req, res) {
            res.writeHead(500, {
              'Content-Type': 'text/plain',
            })
            res.end('Something went wrong with the proxy server.')
          },
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
        '/static': {
          target: SERVER_URL,
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
  })
}
