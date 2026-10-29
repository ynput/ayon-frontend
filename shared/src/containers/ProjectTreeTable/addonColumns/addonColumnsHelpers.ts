import type { Contribution, ProjectTablePage } from '@ynput/ayon-addon'

// Columns addons contribute to the project tables (tableColumn slot, @ynput/ayon-addon).
// Their ids are prefixed so the table can tell them apart: paste skips them (ClipboardContext
// turns any other column id into a field name), and cell ids can't hold `-`.
export const ADDON_COLUMN_PREFIX = 'addon__'

export const isAddonColumnId = (columnId: string) => columnId.startsWith(ADDON_COLUMN_PREFIX)

export const getAddonColumnId = (column: Contribution<'tableColumn'>) =>
  `${ADDON_COLUMN_PREFIX}${column.addon.name.replace(/[^A-Za-z0-9]/g, '_')}__${column.id}`

// tableColumn and entityMenuItem contributions narrow themselves to some tables with `pages`
export const appliesToPage = (
  contribution: { pages?: ProjectTablePage[] },
  page: ProjectTablePage,
) => !contribution.pages?.length || contribution.pages.includes(page)

/** What the table needs to know about an addon column (ColumnDef meta). */
export interface AddonColumnMeta {
  contribution: Contribution<'tableColumn'>
  page: ProjectTablePage
}

// What each addon column's useData returned, by column id, then entity id. The clipboard
// copies it: it sits above the table, so it can't read the table's AddonColumnDataContext.
// useData only gets the rows on screen, so results are merged: a selected row scrolled out of
// view still copies. A new scope (project and table) starts over.
const columnValues = new Map<string, { scope: string; values: Record<string, unknown> }>()

export const setAddonColumnValues = (
  scope: string,
  columnId: string,
  values: Record<string, unknown> | undefined,
) => {
  const current = columnValues.get(columnId)
  const kept = current?.scope === scope ? current.values : {}
  columnValues.set(columnId, { scope, values: { ...kept, ...values } })
}

/** An addon cell's value as copied text: strings, numbers and booleans, lists joined with `, `. */
export const getAddonColumnText = (columnId: string, entityId: string): string => {
  const value = columnValues.get(columnId)?.values[entityId]
  if (Array.isArray(value)) return value.filter((item) => typeof item !== 'object').join(', ')
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return ''
}
