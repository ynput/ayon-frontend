import { useSyncExternalStore } from 'react'

export const PROJECT_PATH_PREFIX = '/projects/'

export const SHEET_MASK_STYLE = { backgroundColor: 'rgba(0, 0, 0, 0.5)' }

const createHeaderSlot = () => {
  let slot: HTMLElement | null = null
  const listeners = new Set<() => void>()

  const set = (element: HTMLElement | null) => {
    if (slot === element) return
    slot = element
    listeners.forEach((listener) => listener())
  }

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  const useSlot = () => useSyncExternalStore(subscribe, () => slot)

  return { set, useSlot }
}

const viewsSlot = createHeaderSlot()
const pageActionsSlot = createHeaderSlot()
const pageMainActionSlot = createHeaderSlot()

export const setHeaderViewsSlot = viewsSlot.set
export const useHeaderViewsSlot = viewsSlot.useSlot

export const setHeaderPageActionsSlot = pageActionsSlot.set
export const useHeaderPageActionsSlot = pageActionsSlot.useSlot

// left of the bar, next to Home: the page's main action (Create)
export const setHeaderPageMainActionSlot = pageMainActionSlot.set
export const useHeaderPageMainActionSlot = pageMainActionSlot.useSlot
