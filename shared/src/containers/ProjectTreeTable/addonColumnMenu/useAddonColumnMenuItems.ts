// Items addons contribute to the column header's more menu (projectTable.columnMenuItem slot,
// @ynput/ayon-addon). The table puts `getColumnMenuItems` in its meta for ColumnHeaderMenu and
// renders `dialog`: header cells unmount on horizontal scroll, the dialog must not.
import { useCallback, useMemo, useState } from 'react'
import { prefetchPiece, runContribution, useContributions } from '@ynput/ayon-addon'
import type {
  Contribution,
  ProjectTableColumnMenuItemContext,
  ProjectTablePage,
} from '@ynput/ayon-addon'
import { getHost, menuItemsAt } from '@ynput/ayon-addon/host'
import { useProjectContext } from '@shared/context'
import type { ColumnMenuItemType } from '@shared/components/ColumnHeaderMenuUI'
import { useProjectTableState } from '../context/project-table-state'
import { appliesToPage } from '../addonColumns/addonColumnsHelpers'
import { slotEntry } from '@shared/components/AddonLayout/slotHighlight'

export interface AddonMenuColumn {
  columnId: string
  /** the column def's `header`: a string for most columns, a component for some (links) */
  header: unknown
  /** what "Group by" calls the column, when the table can group by it */
  groupLabel?: string
  groupField?: string
}

/** The column's addon items. */
export type GetAddonColumnMenuItems = (column: AddonMenuColumn) => ColumnMenuItemType[]
/** Starts loading the code of the column's addon items, when its menu opens. */
export type PrefetchAddonColumnMenuItems = (column: AddonMenuColumn) => void

export interface OpenAddonColumnMenuDialog {
  contribution: Contribution<'projectTable.columnMenuItem'>
  context: ProjectTableColumnMenuItemContext & { close: () => void }
  title: string
}

/** Column ids match exactly, or by prefix with a trailing `*`; every column when none are set. */
export const matchesColumn = (patterns: string[] | undefined, columnId: string) =>
  !patterns?.length ||
  patterns.some((pattern) =>
    pattern.endsWith('*') ? columnId.startsWith(pattern.slice(0, -1)) : pattern === columnId,
  )

export const withColumnLabel = (text: string, columnLabel: string) =>
  // a function, so `$` patterns in the label stay literal
  text.replace(/\{column\}/g, () => columnLabel)

// a header drawn by a component has no name to put in a label: no addon items there
const columnLabelOf = ({ header, groupLabel, groupField }: AddonMenuColumn) =>
  typeof header === 'string' && header ? header : groupField ? groupLabel : undefined

export const useAddonColumnMenuItems = (page: ProjectTablePage | undefined) => {
  const { contributions } = useContributions('projectTable.columnMenuItem')
  const { projectName } = useProjectContext()
  const tableState = useProjectTableState()
  const [dialog, setDialog] = useState<OpenAddonColumnMenuDialog | null>(null)

  const items = useMemo(
    () =>
      page ? menuItemsAt(contributions, 'bottom').filter((item) => appliesToPage(item, page)) : [],
    [contributions, page],
  )

  const itemsFor = useCallback(
    (column: AddonMenuColumn) =>
      items.filter(
        (item) =>
          matchesColumn(item.columns, column.columnId) && (!item.groupable || !!column.groupField),
      ),
    [items],
  )

  const contextFor = useCallback(
    (column: AddonMenuColumn): ProjectTableColumnMenuItemContext | undefined => {
      const columnLabel = columnLabelOf(column)
      if (!page || !columnLabel) return undefined
      return {
        projectName,
        page,
        columnId: column.columnId,
        columnLabel,
        groupField: column.groupField,
        tableState,
      }
    },
    [page, projectName, tableState],
  )

  const prefetchColumnMenuItems = useCallback<PrefetchAddonColumnMenuItems>(
    (column) => {
      const columnItems = itemsFor(column)
      columnItems.forEach((item) => prefetchPiece(item.dialog || item.run))
      // the dev shell shows the context a column's menu gives its items, also with none yet; AYON
      // has no devSlots
      const context = getHost().devSlots && contextFor(column)
      if (context) {
        getHost().devSlots?.menuBuilt?.(
          'projectTable.columnMenuItem',
          context,
          columnItems.map((item) => item.key),
        )
      }
    },
    [contextFor, itemsFor],
  )

  const getColumnMenuItems = useCallback<GetAddonColumnMenuItems>(
    (column) => {
      const context = contextFor(column)
      if (!context) return []
      const { columnLabel } = context
      return itemsFor(column).map((item) => {
        const label = withColumnLabel(item.label, columnLabel)
        // tagged with its slot (slotHighlight)
        return slotEntry('projectTable.columnMenuItem', {
          id: item.key,
          label,
          icon: item.icon,
          onClick: () => {
            if (!item.dialog) {
              runContribution(item, context)
              return
            }
            const close = () => setDialog(null)
            setDialog({
              contribution: item,
              context: { ...context, close },
              title: item.dialogTitle ? withColumnLabel(item.dialogTitle, columnLabel) : label,
            })
          },
        })
      })
    },
    [contextFor, itemsFor],
  )

  return {
    getColumnMenuItems: items.length ? getColumnMenuItems : undefined,
    // also without items in the dev shell, which reports the menu's context when it opens
    prefetchColumnMenuItems:
      items.length || getHost().devSlots ? prefetchColumnMenuItems : undefined,
    dialog,
  }
}
