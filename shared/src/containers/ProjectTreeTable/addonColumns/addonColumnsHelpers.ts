import type { Contribution, ProjectTablePage } from '@ynput/ayon-addon'

// Columns addons contribute to the project tables (tableColumn slot, @ynput/ayon-addon).
// Their ids are prefixed so the table can tell them apart: paste skips them (ClipboardContext
// turns any other column id into a field name), and cell ids can't hold `-`.
export const ADDON_COLUMN_PREFIX = 'addon__'

export const isAddonColumnId = (columnId: string) => columnId.startsWith(ADDON_COLUMN_PREFIX)

export const getAddonColumnId = (column: Contribution<'tableColumn'>) =>
  `${ADDON_COLUMN_PREFIX}${column.addon.name.replace(/[^A-Za-z0-9]/g, '_')}__${column.id}`

export const appliesToPage = (column: Contribution<'tableColumn'>, page: ProjectTablePage) =>
  !column.pages?.length || column.pages.includes(page)

/** What the table needs to know about an addon column (ColumnDef meta). */
export interface AddonColumnMeta {
  contribution: Contribution<'tableColumn'>
  page: ProjectTablePage
}
