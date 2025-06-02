import { usePower } from '@/remote/PowerLicenseContext'
import { useEntityListsContext } from '@pages/ProjectListsPage/context/EntityListsContext'
import {
  ContextMenuItemConstructor,
  ContextMenuItemConstructors,
  useColumnSettingsContext,
} from '@shared/containers'
import { usePowerpack } from '@shared/context'
import { useCallback } from 'react'
import { isAttribGroupable } from './useGetGroupedFields'

type OverviewContextMenuProps = {}

const useOverviewContextMenu = ({}: OverviewContextMenuProps) => {
  // powerpack status
  const power = usePower()
  const { setPowerpackDialog } = usePowerpack()
  //   groupBy
  const { updateGroupBy } = useColumnSettingsContext()
  // lists data
  const { menuItems: menuItemsAddToList } = useEntityListsContext()

  const groupByColumnItem = useCallback<ContextMenuItemConstructor>(
    (_e, cell) => ({
      id: 'group-by-column',
      label: `Group by "${cell.column.label}"`,
      icon: 'splitscreen',
      command: () => {
        if (power) {
          updateGroupBy({ id: cell.columnId.replace('attrib_', 'attrib.'), desc: false })
        } else {
          setPowerpackDialog('groupAttributes')
        }
      },
      hidden:
        cell.columnId === 'name' ||
        (cell.attribField && !isAttribGroupable(cell.attribField, 'task')),
    }),
    [updateGroupBy, setPowerpackDialog, power],
  )

  // inject in custom add to list context menu items
  const contextMenuItems: ContextMenuItemConstructors = [
    'copy-paste',
    'show-details',
    'expand-collapse',
    menuItemsAddToList(),
    groupByColumnItem,
    'inherit',
    'export',
    'create-folder',
    'create-task',
    'delete',
  ]

  return contextMenuItems
}

export default useOverviewContextMenu
