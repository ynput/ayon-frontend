import { useVersionUploadContext } from '@shared/components'
import { useEntityListsContext } from '@pages/ProjectListsPage/context'
import {
  ContextMenuItemConstructor,
  ContextMenuItemConstructors,
  TableCellContextData,
  useColumnSettingsContext,
} from '@shared/containers/ProjectTreeTable'
import { useCallback } from 'react'
import { toast } from 'react-toastify'
import { useMoveEntityContext, useProjectFoldersContext } from '@shared/context'

type OverviewContextMenuProps = {}

const useOverviewContextMenu = ({}: OverviewContextMenuProps) => {
  //   groupBy
  const { updateGroupBy } = useColumnSettingsContext()
  const { openMoveDialog } = useMoveEntityContext()
  // lists data
  const { menuItems: menuItemsAddToList } = useEntityListsContext()

  const { folders } = useProjectFoldersContext()

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

  const moveItem: ContextMenuItemConstructor = (_e, cell, selectedCells) => {
    // Get all selected entity data for multi-selection support
    const selectedEntities = selectedCells
      .filter((cellData) => cellData.entityType === 'folder' || cellData.entityType === 'task')
      .map((cellData) => ({
        entityId: cellData.entityId,
        entityType: cellData.entityType as 'folder' | 'task',
        currentParentId: cellData.parentId,
      }))

    // If no valid entities in selection, fall back to current cell
    const entitiesToMove =
      selectedEntities.length > 0
        ? selectedEntities
        : cell.entityType === 'folder' || cell.entityType === 'task'
        ? [
            {
              entityId: cell.entityId,
              entityType: cell.entityType,
              currentParentId: cell.parentId,
            },
          ]
        : []

    // Check if any folders have versions (published content) - they should not be movable
    const hasUnmovableFolders = entitiesToMove.some((entity) => {
      if (entity.entityType === 'folder') {
        const folderData = folders.find((folder) => folder.id === entity.entityId)
        return folderData?.hasVersions
      }
      return false
    })

    const label =
      entitiesToMove.length > 1
        ? (() => {
            const folders = entitiesToMove.filter((e) => e.entityType === 'folder').length
            const tasks = entitiesToMove.filter((e) => e.entityType === 'task').length

            if (folders > 0 && tasks > 0) {
              return `Move ${folders} folder${folders > 1 ? 's' : ''} and ${tasks} task${
                tasks > 1 ? 's' : ''
              }`
            } else if (folders > 0) {
              return `Move ${folders} folder${folders > 1 ? 's' : ''}`
            } else {
              return `Move ${tasks} task${tasks > 1 ? 's' : ''}`
            }
          })()
        : 'Move'

    return {
      id: 'move-entity',
      label,
      icon: 'drive_file_move',
      command: () => {
        if (entitiesToMove.length === 1) {
          // Single entity move
          openMoveDialog(entitiesToMove[0])
        } else if (entitiesToMove.length > 1) {
          // Multi-entity move
          openMoveDialog({ entities: entitiesToMove })
        }
      },
      hidden: entitiesToMove.length === 0,
      disabled: hasUnmovableFolders,
    }
  }

  // inject in custom add to list context menu items
  const contextMenuItems: ContextMenuItemConstructors = [
    'copy-paste',
    'show-details',
    'rename',
    'open-viewer',
    'expand-collapse',
    menuItemsAddToList(),
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
