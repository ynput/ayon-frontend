import type { SortingState } from '@tanstack/react-table'

// the backend rejects a sortBy with more keys than this
export const MAX_SORT_KEYS = 5

const DESC_PREFIX = '-'

/**
 * Reads the sorting of a saved view.
 *
 * Views store `sortBy` as a list of column ids in order of precedence, where a
 * `-` prefix means descending: `['-status', 'name']`.
 * Views saved before multi-key sorting store a single column id and a separate
 * `sortDesc` flag, which is only read for that old format.
 */
export const parseViewSorting = (
  sortBy?: string | string[] | null,
  sortDesc?: boolean | null,
): SortingState => {
  if (!sortBy) return []
  if (typeof sortBy === 'string') return [{ id: sortBy, desc: !!sortDesc }]

  const sorting: SortingState = []
  for (const value of sortBy) {
    if (typeof value !== 'string') continue
    const desc = value.startsWith(DESC_PREFIX)
    const id = desc ? value.slice(DESC_PREFIX.length) : value
    if (!id || sorting.some((sort) => sort.id === id)) continue
    sorting.push({ id, desc })
  }
  return sorting.slice(0, MAX_SORT_KEYS)
}

/**
 * Writes the sorting of a view, see `parseViewSorting` for the format.
 * No sorting is `undefined` so the view falls back to its default order.
 */
export const serializeViewSorting = (sorting?: SortingState): string[] | undefined => {
  if (!sorting?.length) return undefined
  return sorting
    .slice(0, MAX_SORT_KEYS)
    .map((sort) => (sort.desc ? `${DESC_PREFIX}${sort.id}` : sort.id))
}

export type SortKey = { key?: string; desc?: boolean }
export type SortArgs = { sortBy: string | string[] | undefined; desc: boolean }

/**
 * Builds the `sortBy` and `desc` arguments of the paginated entity queries.
 *
 * `desc` is the direction of the first key. The queries page a descending sort
 * backwards (`last`/`before`), which reverses the whole ordering on the
 * backend, so the other keys are prefixed with `-` when their direction differs
 * from the first key rather than when they are descending.
 * A single key is sent as a plain string, exactly as before multi-key sorting.
 */
export const buildSortArgs = (keys: SortKey[]): SortArgs => {
  const unique: Required<SortKey>[] = []
  for (const { key, desc } of keys) {
    if (!key || unique.some((item) => item.key === key)) continue
    unique.push({ key, desc: !!desc })
  }

  const limited = unique.slice(0, MAX_SORT_KEYS)
  if (!limited.length) return { sortBy: undefined, desc: false }

  const desc = limited[0].desc
  if (limited.length === 1) return { sortBy: limited[0].key, desc }

  return {
    sortBy: limited.map((item) => (item.desc !== desc ? `${DESC_PREFIX}${item.key}` : item.key)),
    desc,
  }
}

/** The first key of a `sortBy` argument, without its direction prefix. */
export const getPrimarySortKey = (sortBy?: string | string[] | null): string | undefined => {
  const first = Array.isArray(sortBy) ? sortBy[0] : sortBy
  if (!first) return undefined
  return first.startsWith(DESC_PREFIX) ? first.slice(DESC_PREFIX.length) : first
}
