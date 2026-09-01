import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { aliases } from './aliases'

// the app config carries the module federation plugin and the dev proxy, neither of which
// a test run can use, so the test config only borrows the alias table
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: aliases,
    dedupe: ['styled-components', 'react', 'react-dom'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['{src,shared/src}/**/*.test.{ts,tsx}'],
    clearMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**', 'shared/src/**'],
      exclude: ['**/*.test.{ts,tsx}', 'shared/src/api/generated/**', '**/*.d.ts'],
    },
  },
})
