import { useSyncExternalStore } from 'react'

// How many outlines are on screen with something to list. The toolbar's toggle
// (SettingsOutlineToggle) is shown only while there is one to hide.
let shown = 0
const listeners = new Set<() => void>()

const notify = () => listeners.forEach((listener) => listener())

/** Called by an outline while it has links; returns the call that withdraws it */
export const announceOutline = () => {
  shown += 1
  notify()
  return () => {
    shown -= 1
    notify()
  }
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const useOutlineAvailable = () => useSyncExternalStore(subscribe, () => shown > 0)
