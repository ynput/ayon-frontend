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

/** Every addon column id in the host's tables starts with this (the column is hidden by default). */
export const ADDON_COLUMN_PREFIX = 'addon__'

/**
 * The id of an addon's column in the host's tables, `addon__<addon>__<id>`: what the Customize
 * panel, saved views and tests refer to. `addon` is the addon's name (anything but letters and
 * digits becomes `_`), `id` the `tableColumn` contribution's id.
 */
export const addonColumnId = (addon: string, id: string) =>
  `${ADDON_COLUMN_PREFIX}${addon.replace(/[^A-Za-z0-9]/g, '_')}__${id}`

/**
 * A `tableColumn` value with its own Copy text: what `cellValue` returns. `__ayonCellValue` marks
 * it, so it can't be mistaken for an addon's own `{ value, copy }` data; a string key, not a
 * symbol, so it stays plain data the host can keep, clone and serialise.
 */
export interface CellValue<T = unknown> {
  readonly __ayonCellValue: true
  /** what the cell gets as `value` */
  value: T
  /** what Copy puts on the clipboard for this cell */
  copy: string
}

/**
 * A `tableColumn` value with its own Copy text, for `fetchValues` to return for an entity:
 * `cellValue({ total, currency }, { copy: '12500 EUR' })`. The cell gets `value` (any data, it is
 * not shown as text); Copy takes `copy`. Without it, Copy takes the value itself as text
 * (strings, numbers and booleans; lists joined with `, `; nothing for other objects).
 */
export const cellValue = <T>(value: T, { copy }: { copy: string }): CellValue<T> => ({
  __ayonCellValue: true,
  value,
  copy,
})

/**
 * For the host: one entity's result of `fetchValues` as the cell's `value` and the Copy text
 * (`copy`: set only by `cellValue`). Anything not made by `cellValue` is the value itself, so a
 * plain `{ value, copy }` object of an addon stays its value.
 */
export const readCellValue = (result: unknown): { value: unknown; copy?: string } => {
  if (
    result !== null &&
    typeof result === 'object' &&
    (result as Partial<CellValue>).__ayonCellValue === true
  ) {
    const { value, copy } = result as CellValue
    return typeof copy === 'string' ? { value, copy } : { value }
  }
  return { value: result }
}

/** The Copy text of a `tableColumn` cell: `copy` when set, else the value as text. */
export const cellCopyText = ({ value, copy }: { value?: unknown; copy?: string }): string => {
  if (copy !== undefined) return copy
  if (Array.isArray(value)) return value.filter((item) => typeof item !== 'object').join(', ')
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return ''
}
