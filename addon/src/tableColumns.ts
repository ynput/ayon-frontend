// Asking a table column for its values again (tableColumn slot). The host's table listens; the
// addon calls refreshTableColumn when something its values depend on changed outside the rows.

type RefreshListener = (columnId: string) => void

const listeners = new Set<RefreshListener>()

/**
 * Gets the values of your column `id` again, for the rows on screen now and for the others when
 * they come on screen; until then cells keep their value. AYON already does this for a row whose
 * entity changed: call it when the values depend on something else, such as a setting.
 */
export const refreshTableColumn = (id: string) => listeners.forEach((listener) => listener(id))

/** For the host: called with the column's `id` (the contribution's, not the table's). */
export const onTableColumnRefresh = (listener: RefreshListener) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Every addon column id in the host's tables starts with this (the column is hidden by default). */
export const ADDON_COLUMN_PREFIX = 'addon__'

/**
 * The id of an addon's column in the host's tables, `addon__<addon>__<id>`: what the Customize
 * panel, saved views and tests refer to. `addon` is the addon's name (anything but letters and
 * digits becomes `_`), `id` the `tableColumn` contribution's id.
 */
export const addonColumnId = (addon: string, id: string) =>
  `${ADDON_COLUMN_PREFIX}${addon.replace(/[^A-Za-z0-9]/g, '_')}__${id}`
