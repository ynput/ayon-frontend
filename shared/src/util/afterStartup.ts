// how long after start up non essential work waits, so it doesn't compete with loading the page
export const STARTUP_DELAY = 3000

/**
 * Runs `callback` once the page has had time to load: after `delay` ms, at the next idle
 * period (or straight away where requestIdleCallback is missing).
 * Use it for work nobody waits for on load, like third party widgets or rarely used addon code.
 * Returns a function that cancels it.
 */
export const afterStartup = (callback: () => void, delay = STARTUP_DELAY) => {
  let idleId: number | undefined
  const timeoutId = setTimeout(() => {
    if ('requestIdleCallback' in window)
      idleId = window.requestIdleCallback(callback, { timeout: 2000 })
    else callback()
  }, delay)

  return () => {
    clearTimeout(timeoutId)
    if (idleId !== undefined) window.cancelIdleCallback(idleId)
  }
}
