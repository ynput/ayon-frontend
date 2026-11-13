import { createElement, useEffect, useMemo } from 'react'
import { prefetchPiece, useContributions } from '@ynput/ayon-addon'
import type { ProjectTablePage } from '@ynput/ayon-addon'
import { useListAddonsQuery } from '@shared/api'
import type { TreeTableExtraColumn } from '../buildTreeTableColumns'
import { AddonColumnCell } from './AddonColumns'
import { appliesToPage, getAddonColumnId } from './addonColumnsHelpers'

const DEFAULT_WIDTH = 150
const NO_COLUMNS: TreeTableExtraColumn[] = []

/**
 * The columns addons contribute to this page's table (tableColumn slot): `columns` for the
 * table's `extraColumns`, `settingsColumns` for the column settings and the add-column menu.
 * Both come from the descriptions; the cells' code starts loading with the table. In the
 * add-column menu each addon's columns get a submenu titled after it unless they name one
 * (`menu`) or ask for the top level (`menu: false`).
 */
export const useAddonTableColumns = (page: ProjectTablePage) => {
  const { contributions } = useContributions('tableColumn')
  const pageColumns = useMemo(
    () => contributions.filter((column) => appliesToPage(column, page)),
    [contributions, page],
  )

  // addon titles for the default submenus; project pages already load this list
  const needsTitles = pageColumns.some((column) => column.menu === undefined)
  const { data: addonList } = useListAddonsQuery({}, { skip: !needsTitles })

  // a table's cells load with it, not one by one as they scroll in
  useEffect(() => {
    pageColumns.forEach((column) => {
      prefetchPiece(column.cell)
      prefetchPiece(column.fetchValues)
    })
  }, [pageColumns])

  // a new columns array rebuilds the table's columns and remounts every cell, closing open editors
  const columns = useMemo(() => {
    if (!pageColumns.length) return NO_COLUMNS
    return pageColumns.map((contribution): TreeTableExtraColumn => {
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
  }, [pageColumns, page])

  const settingsColumns = useMemo(
    () =>
      pageColumns.map((contribution) => {
        const { addon, menu } = contribution
        const menuLabel =
          menu ?? (addonList?.addons.find((a) => a.name === addon.name)?.title || addon.name)
        return {
          value: getAddonColumnId(contribution),
          label: contribution.label,
          icon: contribution.icon,
          // one submenu per name, so addons can share one ("Production")
          menu: menuLabel === false ? undefined : menuLabel,
        }
      }),
    [pageColumns, addonList],
  )

  return { columns, settingsColumns }
}
