import { createElement, useEffect, useMemo } from 'react'
import { prefetchPiece, useContributions } from '@ynput/ayon-addon'
import type { ProjectTablePage } from '@ynput/ayon-addon'
import type { TreeTableExtraColumn } from '../buildTreeTableColumns'
import { AddonColumnCell } from './AddonColumns'
import { appliesToPage, getAddonColumnId } from './addonColumnsHelpers'

const DEFAULT_WIDTH = 150

/**
 * The columns addons contribute to this page's table (tableColumn slot): `columns` for the
 * table's `extraColumns`, `settingsColumns` for the column settings and the add-column menu.
 * Both come from the descriptions; the cells' code starts loading with the table.
 */
export const useAddonTableColumns = (page: ProjectTablePage) => {
  const { contributions } = useContributions('tableColumn')
  const pageColumns = useMemo(
    () => contributions.filter((column) => appliesToPage(column, page)),
    [contributions, page],
  )

  // a table's cells load with it, not one by one as they scroll in
  useEffect(() => {
    pageColumns.forEach((column) => {
      prefetchPiece(column.cell)
      prefetchPiece(column.useData)
    })
  }, [pageColumns])

  return useMemo(() => {
    const columns: TreeTableExtraColumn[] = pageColumns.map((contribution) => {
      const id = getAddonColumnId(contribution)
      return {
        column: {
          id,
          header: contribution.label,
          size: contribution.width || DEFAULT_WIDTH,
          enableSorting: false,
          enableResizing: true,
          enablePinning: true,
          // hidden until the user shows it in Customize, like most columns
          enableHiding: true,
          meta: { addonColumn: { contribution, page } },
          cell: ({ row }) =>
            createElement(AddonColumnCell, { contribution, page, columnId: id, row }),
        },
      }
    })

    const settingsColumns = pageColumns.map((contribution) => ({
      value: getAddonColumnId(contribution),
      label: contribution.label,
      icon: contribution.icon,
    }))

    return { columns, settingsColumns }
  }, [pageColumns, page])
}
