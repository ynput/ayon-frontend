import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true
      },
      '/addons': {
        target: 'http://localhost:5000',
        changeOrigin: false,
      },
      '/graphql': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/graphiql': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/docs': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/openapi.json': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    }
  },
  plugins: [react()]
})
