import { ADDON_COLUMN_PREFIX, addonColumnId } from '@ynput/ayon-addon'
import type { Contribution, ProjectTablePage } from '@ynput/ayon-addon'

// Columns addons contribute to the project tables (tableColumn slot, @ynput/ayon-addon).
// Their ids are prefixed so the table can tell them apart: paste skips them (ClipboardContext
// turns any other column id into a field name), and cell ids can't hold `-`.
export const isAddonColumnId = (columnId: string) => columnId.startsWith(ADDON_COLUMN_PREFIX)

export const getAddonColumnId = (column: Contribution<'tableColumn'>) =>
  addonColumnId(column.addon.name, column.id)

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
