import { useVersionUploadContext } from '@containers/VersionUploader/context/VersionUploadContext'
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
    uploadVersionItem,
    'create-folder',
    'create-task',
    'delete',
  ]

  return contextMenuItems
}

export default useOverviewContextMenu
