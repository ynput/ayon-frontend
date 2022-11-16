import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

//const SERVER_URL = "https://dev.openpype.cloud"
const SERVER_URL = "http://localhost:5000"


// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: SERVER_URL,
        changeOrigin: true,
      },
      '/ws': {
        target: SERVER_URL,
        changeOrigin: true,
        ws: true
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
    }
  },
  plugins: [react()]
})
