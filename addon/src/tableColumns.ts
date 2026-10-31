// Asking a table column for its values again (tableColumn slot). The host's table listens; the
// addon calls refreshTableColumn when something its values depend on changed outside the rows
// and outside its providesTags.

type RefreshListener = (columnId: string) => void

const listeners = new Set<RefreshListener>()

/**
 * Gets the values of your column `id` again, for the rows on screen now and for the others when
 * they come on screen; until then cells keep their value. AYON already does this for a row whose
 * entity changed, and when a tag in the column's `providesTags` is invalidated: call it when the
 * values depend on something else, such as a setting.
 */
export const refreshTableColumn = (id: string) => listeners.forEach((listener) => listener(id))

/** For the host: called with the column's `id` (the contribution's, not the table's). */
export const onTableColumnRefresh = (listener: RefreshListener) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
