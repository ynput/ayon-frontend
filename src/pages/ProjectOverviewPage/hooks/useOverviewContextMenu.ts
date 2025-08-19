import { useVersionUploadContext } from '@shared/components'
import { useEntityListsContext } from '@pages/ProjectListsPage/context'
import {
  ContextMenuItemConstructor,
  ContextMenuItemConstructors,
  isAttribGroupable,
  TableCellContextData,
  useColumnSettingsContext,
} from '@shared/containers/ProjectTreeTable'
import { useCallback } from 'react'
import { toast } from 'react-toastify'
import {useMoveEntity} from "@shared/containers/ProjectTreeTable/context/MoveEnitityContext.tsx";

type OverviewContextMenuProps = {}

const useOverviewContextMenu = ({ }: OverviewContextMenuProps) => {
  //   groupBy
  const { updateGroupBy } = useColumnSettingsContext()
  const { openMoveDialog} = useMoveEntity()
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
        cell.columnId === 'thumbnail' ||
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

  const { onOpenVersionUpload } = useVersionUploadContext()
  const handleVersionUpload = (cell: TableCellContextData) => {
    const folderId = cell.entityType === 'folder' ? cell.entityId : cell.parentId || ''
    const taskId = cell.entityType === 'task' ? cell.entityId : ''

    if (folderId) {
      onOpenVersionUpload({ folderId, taskId })
    } else {
      toast.error('No folder selected for version upload')
    }
  }

  const uploadVersionItem: ContextMenuItemConstructor = (_e, cell) => ({
    id: 'upload-version',
    label: 'Upload Version',
    icon: 'upload',
    command: () => handleVersionUpload(cell),
  })

  const moveItem: ContextMenuItemConstructor = (_e, cell) => ({
    id: 'move-entity',
    label: 'Move',
    icon: 'drive_file_move',
    command: () => {
      if (cell.entityType === 'folder' || cell.entityType === 'task') {
        openMoveDialog?.({
          entityId: cell.entityId,
          entityType: cell.entityType
        })
      }
    },
    hidden:
      (cell.entityType !== 'folder' && cell.entityType !== 'task')
  })

  // inject in custom add to list context menu items
  const contextMenuItems: ContextMenuItemConstructors = [
    'copy-paste',
    'show-details',
    'open-viewer',
    'expand-collapse',
    menuItemsAddToList(),
    groupByColumnItem,
    unGroupTasksItem,
    'inherit',
    'export',
    uploadVersionItem,
    moveItem,
    'create-folder',
    'create-task',
    'delete',
  ]

  return contextMenuItems
}

export default useOverviewContextMenu
