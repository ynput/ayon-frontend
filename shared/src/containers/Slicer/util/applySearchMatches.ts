import type { RowSelectionState } from '@tanstack/react-table'

// a panel's search selects every row it leaves, or narrows an existing selection to
// the rows it leaves; null when nothing is left
export const applySearchMatches = (
  rowSelection: RowSelectionState,
  matches: string[],
): RowSelectionState | null => {
  const selected = Object.keys(rowSelection).filter((id) => rowSelection[id])
  const matched = new Set(matches)
  const ids = selected.length ? selected.filter((id) => matched.has(id)) : matches
  return ids.length ? Object.fromEntries(ids.map((id) => [id, true])) : null
}
