import { useCallback, useSyncExternalStore } from 'react'

// What each addon column's fetchValues returned (tableColumn slot), by column id, then entity id.
// A store outside React: each cell subscribes to its own entry, so a batch arriving re-renders
// only its cells, and the clipboard (above the table) reads it too. Kept across scrolling, so a
// row scrolled out of view still copies; ColumnValuesFetcher starts a column over for a new
// project or table.

export interface AddonColumnEntry {
  status: 'loading' | 'loaded' | 'error'
  /** the entity's updatedAt when it was asked for: a newer one asks again */
  version: string
  /** the last value; kept while a changed entity loads again */
  value?: unknown
  error?: Error
}

// never an updatedAt: a stale entry loads again however its entity changed
const STALE = 'stale'

const columns = new Map<string, Map<string, AddonColumnEntry>>()
const listeners = new Map<string, Set<() => void>>()

const listenerKey = (columnId: string, entityId: string) => `${columnId}/${entityId}`

const notify = (columnId: string, entityIds: Iterable<string>) => {
  for (const entityId of entityIds) {
    listeners.get(listenerKey(columnId, entityId))?.forEach((listener) => listener())
  }
}

export const getAddonColumnEntry = (columnId: string, entityId: string) =>
  columns.get(columnId)?.get(entityId)

export const setAddonColumnEntries = (
  columnId: string,
  entries: Record<string, AddonColumnEntry>,
) => {
  const column = columns.get(columnId) || new Map<string, AddonColumnEntry>()
  columns.set(columnId, column)
  Object.entries(entries).forEach(([entityId, entry]) => column.set(entityId, entry))
  notify(columnId, Object.keys(entries))
}

/** Forgets a column's values (another project or table). */
export const clearAddonColumn = (columnId: string) => {
  const column = columns.get(columnId)
  columns.delete(columnId)
  if (column) notify(columnId, column.keys())
}

/** Marks every value of a column as out of date: they show until they load again. */
export const markAddonColumnStale = (columnId: string) => {
  const column = columns.get(columnId)
  if (!column) return
  column.forEach((entry, entityId) => column.set(entityId, { ...entry, version: STALE }))
}

/** One cell's entry; re-renders when that entry changes. */
export const useAddonColumnEntry = (columnId: string, entityId: string) => {
  const subscribe = useCallback(
    (listener: () => void) => {
      const key = listenerKey(columnId, entityId)
      const set = listeners.get(key) || new Set()
      listeners.set(key, set.add(listener))
      return () => {
        set.delete(listener)
        if (!set.size) listeners.delete(key)
      }
    },
    [columnId, entityId],
  )
  return useSyncExternalStore(subscribe, () => getAddonColumnEntry(columnId, entityId))
}

/** An addon cell's value as copied text: strings, numbers and booleans, lists joined with `, `. */
export const getAddonColumnText = (columnId: string, entityId: string): string => {
  const value = getAddonColumnEntry(columnId, entityId)?.value
  if (Array.isArray(value)) return value.filter((item) => typeof item !== 'object').join(', ')
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return ''
}
