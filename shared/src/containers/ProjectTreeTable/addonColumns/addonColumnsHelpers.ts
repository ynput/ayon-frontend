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

// What each addon column's useData last returned, by column id, then entity id. The clipboard
// copies it: it sits above the table, so it can't read the table's AddonColumnDataContext.
const lastColumnValues = new Map<string, Record<string, unknown> | undefined>()

export const setAddonColumnValues = (columnId: string, values: Record<string, unknown> | undefined) =>
  lastColumnValues.set(columnId, values)

/** An addon cell's value as copied text: strings, numbers and booleans, lists joined with `, `. */
export const getAddonColumnText = (columnId: string, entityId: string): string => {
  const value = lastColumnValues.get(columnId)?.[entityId]
  if (Array.isArray(value)) return value.filter((item) => typeof item !== 'object').join(', ')
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return ''
}
