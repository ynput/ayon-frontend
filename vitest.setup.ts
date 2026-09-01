import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom lays nothing out, so it ships no ResizeObserver; components that watch their own
// size still have to mount. It keeps the real signature: analysis tools resolve callers
// against whichever declaration they can see, and a no-arg one makes every call look wrong.
class ResizeObserverStub implements ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {}
  observe(_target: Element, _options?: ResizeObserverOptions) {}
  unobserve(_target: Element) {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub

// node ships its own experimental localStorage global, so jsdom leaves window.localStorage
// undefined and it has to be reached for defensively
afterEach(() => {
  cleanup()
  window.sessionStorage.clear()
  window.localStorage?.clear()
})
