import { useEntityListsContext } from '@pages/ProjectListsPage/context/EntityListsContext'
import {
  ContextMenuItemConstructor,
  ContextMenuItemConstructors,
  useColumnSettingsContext,
} from '@shared/containers'
import { useCallback } from 'react'
import { isAttribGroupable } from './useGetGroupedFields'

type OverviewContextMenuProps = {}

const useOverviewContextMenu = ({}: OverviewContextMenuProps) => {
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
        const groupById = cell.columnId.replace('attrib_', 'attrib.').replace('subType', 'taskType')
        updateGroupBy({ id: groupById, desc: false })
      },
      hidden:
        cell.columnId === 'name' ||
        (cell.attribField && !isAttribGroupable(cell.attribField, 'task')),
      powerFeature: 'groupAttributes',
    }),
    [updateGroupBy],
  )

  // right click on a group header to un group the tasks
  const unGroupTasksItem: ContextMenuItemConstructor = useCallback(
    (_e, cell) => ({
      id: 'ungroup-tasks',
      label: `Ungroup`,
      icon: 'splitscreen',
      command: () => updateGroupBy(undefined),
      hidden: !cell.isGroup,
    }),
    [updateGroupBy],
  )

  // inject in custom add to list context menu items
  const contextMenuItems: ContextMenuItemConstructors = [
    'copy-paste',
    'show-details',
    'expand-collapse',
    menuItemsAddToList(),
    groupByColumnItem,
    unGroupTasksItem,
    'inherit',
    'export',
    'create-folder',
    'create-task',
    'delete',
  ]

  return contextMenuItems
}

export default useOverviewContextMenu
