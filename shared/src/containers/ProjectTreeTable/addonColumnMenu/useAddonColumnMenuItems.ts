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
import { menuItemsAt } from '@ynput/ayon-addon/host'
import { useProjectContext } from '@shared/context'
import type { ColumnMenuItemType } from '@shared/components/ColumnHeaderMenuUI'
import { useProjectTableState } from '../context/project-table-state'
import { appliesToPage } from '../addonColumns/addonColumnsHelpers'

export interface AddonMenuColumn {
  columnId: string
  columnLabel: string
  groupField?: string
}

/** The column's addon items; `isOpen` starts loading their code. */
export type GetAddonColumnMenuItems = (
  column: AddonMenuColumn,
  isOpen: boolean,
) => ColumnMenuItemType[]

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
  text.replace(/\{column\}/g, columnLabel)

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

  const getColumnMenuItems = useCallback<GetAddonColumnMenuItems>(
    (column, isOpen) => {
      if (!page) return []
      return items
        .filter(
          (item) =>
            matchesColumn(item.columns, column.columnId) &&
            (!item.groupable || !!column.groupField),
        )
        .map((item) => {
          if (isOpen) prefetchPiece(item.dialog || item.run)
          const context: ProjectTableColumnMenuItemContext = {
            projectName,
            page,
            columnId: column.columnId,
            columnLabel: column.columnLabel,
            groupField: column.groupField,
            tableState,
          }
          const label = withColumnLabel(item.label, column.columnLabel)
          return {
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
                title: item.dialogTitle
                  ? withColumnLabel(item.dialogTitle, column.columnLabel)
                  : label,
              })
            },
          }
        })
    },
    [items, page, projectName, tableState],
  )

  return { getColumnMenuItems: items.length ? getColumnMenuItems : undefined, dialog }
}
