import { useSyncExternalStore } from 'react'
import { readSessionStorage, writeSessionStorage } from '@shared/hooks'
import { OPEN_LIST_ITEMS_KEY } from '../SettingsGroup/SettingsGroupHelpers'

// The open folding items of the flat layout, kept for the browser session. One store
// serves every item on the page: an item listens for its own key only, so folding one
// item re-renders that item, not every list item of every list.
// The session copy is written through; it is read once, as only this tab writes it.

let openItems: string[] | null = null
let openSet = new Set<string>()
const listeners = new Set<() => void>()

const load = () => {
  if (openItems) return
  openItems = readSessionStorage<string[]>(OPEN_LIST_ITEMS_KEY, [])
  openSet = new Set(openItems)
}

/** Changes the open items from the current ones, like a state setter */
export const updateOpenItems = (update: (openKeys: string[]) => string[]) => {
  load()
  const next = update(openItems as string[])
  const unchanged = next.length === openItems?.length && next.every((key) => openSet.has(key))
  if (unchanged) return
  openItems = next
  openSet = new Set(next)
  writeSessionStorage(OPEN_LIST_ITEMS_KEY, next)
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const noSubscribe = () => () => {}

/**
 * Whether an item is open. Only an item that can fold listens: the others (plain values
 * in a list) never read the store, so they cost nothing when it changes.
 */
export const useOpenItem = (key: string, foldable: boolean) =>
  useSyncExternalStore(foldable ? subscribe : noSubscribe, () => {
    if (!foldable) return false
    load()
    return openSet.has(key)
  })
