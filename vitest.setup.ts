import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom lays nothing out, so it ships no ResizeObserver; components that watch their own
// size still have to mount
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver

// node ships its own experimental localStorage global, so jsdom leaves window.localStorage
// undefined and it has to be reached for defensively
afterEach(() => {
  cleanup()
  window.sessionStorage.clear()
  window.localStorage?.clear()
})
