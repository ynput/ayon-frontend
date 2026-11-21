import { useSyncExternalStore } from 'react'

/**
 * Saves hovered in the timeline or in the side panel, highlighted in both. Kept outside React state so
 * hovering only re-renders those two, not the settings page holding them.
 */
export type HoveredSaves = {
  get: () => string[] | null
  set: (ids: string[] | null) => void
  subscribe: (listener: () => void) => () => void
}

export const createHoveredSaves = (): HoveredSaves => {
  let ids: string[] | null = null
  const listeners = new Set<() => void>()
  return {
    get: () => ids,
    set: (next) => {
      ids = next
      listeners.forEach((listener) => listener())
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export const useHoveredSaves = (store: HoveredSaves) =>
  useSyncExternalStore(store.subscribe, store.get)
