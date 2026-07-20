import { newEntityDefinitions, useNewEntityContext } from '@shared/containers/NewEntity'
import { SimpleTableRow, SimpleTableRowContextMenuBuilder } from '@shared/containers/SimpleTable'
import { ContextMenuItemType } from '@shared/containers/ContextMenu'
import { getPlatformShortcutKey, KeyMode } from '@shared/util/platform'
import { useCallback, useMemo, useState } from 'react'
import { useAppDispatch } from '@state/store'
import { openViewer } from '@state/viewer'
import { useUpdateOverviewEntitiesMutation } from '@shared/api'
import { useProjectContext, useMoveEntityContext } from '@shared/context'
import { useDetailsPanelEntityContext } from '@shared/containers/ProjectTreeTable'
import { useOptionalVersionUploadContext } from '@shared/components'

const toggleChildren = (row: any, expanded: boolean) => {
  row.toggleExpanded(expanded)
  row.subRows?.forEach((subRow: any) => toggleChildren(subRow, expanded))
}

export type OnAddToList = (
  row: SimpleTableRow,
  selectedRows: string[],
) => ContextMenuItemType | ContextMenuItemType[] | undefined

export const useHierarchyContextMenuItems = (onAddToList?: OnAddToList) => {
  const { onOpenNew } = useNewEntityContext()
  const { projectName } = useProjectContext()
  const { setSelectedEntity } = useDetailsPanelEntityContext()
  const { openMoveDialog } = useMoveEntityContext()
  const versionUpload = useOptionalVersionUploadContext()
  const dispatch = useAppDispatch()
  const [updateEntities] = useUpdateOverviewEntitiesMutation()
  const [renamingRow, setRenamingRow] = useState<SimpleTableRow | null>(null)

  const actions = useMemo(
    () => ({
      onShowDetails: (row: SimpleTableRow) => {
        setSelectedEntity({
          entityId: row.id,
          entityType: row.data?.entityType === 'task' ? 'task' : 'folder',
        })
      },
      onAddToList,
      onMove: (row: SimpleTableRow, selectedRows: string[]) => {
        const entityType = row.data?.entityType === 'task' ? 'task' : 'folder'
        openMoveDialog({
          entities: selectedRows.map((entityId) => ({
            entityId,
            entityType,
            currentParentId: row.parentId || row.data?.parentId,
          })),
        })
      },
      onRename: (row: SimpleTableRow) => setRenamingRow(row),
      onOpenViewer: (row: SimpleTableRow) => {
        const isTask = row.data?.entityType === 'task'
        dispatch(
          openViewer({
            projectName,
            quickView: true,
            ...(isTask ? { taskId: row.id } : { folderId: row.id }),
          }),
        )
      },
      onUploadVersion: (row: SimpleTableRow) => {
        const isTask = row.data?.entityType === 'task'
        const folderId = isTask ? row.parentId || row.data?.parentId : row.id
        if (folderId) {
          versionUpload?.onOpenVersionUpload({
            folderId,
            taskId: isTask ? row.id : undefined,
          })
        }
      },
      onDelete: (row: SimpleTableRow, selectedRows: string[]) => {
        const entityType = row.data?.entityType === 'task' ? 'task' : 'folder'
        updateEntities({
          projectName,
          operationsRequestModel: {
            operations: selectedRows.map((entityId) => ({
              entityType,
              type: 'delete',
              entityId,
            })),
          },
        })
      },
    }),
    [
      dispatch,
      onAddToList,
      openMoveDialog,
      projectName,
      setSelectedEntity,
      updateEntities,
      versionUpload,
    ],
  )

  const handleRenameLabel = useCallback(
    (value: string) => {
      if (!renamingRow) return
      updateEntities({
        projectName,
        operationsRequestModel: {
          operations: [
            {
              type: 'update',
              entityType: renamingRow.data?.entityType === 'task' ? 'task' : 'folder',
              entityId: renamingRow.id,
              data: { label: value },
            },
          ],
        },
      })
      setRenamingRow(null)
    },
    [projectName, renamingRow, updateEntities],
  )

  const rowContextMenuBuilders = useMemo<SimpleTableRowContextMenuBuilder[]>(
    () => [
      (_e, { row, selectedRows }) => ({
        label: 'Show details',
        icon: 'dock_to_left',
        command: () => actions.onShowDetails(row.original),
      }),
      (_e, { row }) => ({
        label: 'Rename label',
        icon: 'titlecase',
        shortcut: 'R',
        command: () => actions.onRename(row.original),
      }),
      (_e, { row }) => ({
        label: 'Open in viewer',
        icon: 'play_circle',
        command: () => actions.onOpenViewer(row.original),
      }),
      (_e, { row }) => ({
        label: 'Expand all children',
        icon: 'expand_all',
        shortcut: getPlatformShortcutKey('click', [KeyMode.Alt]),
        command: () => toggleChildren(row, true),
        hidden: !row.getCanExpand() || row.getIsExpanded(),
      }),
      (_e, { row }) => ({
        label: 'Collapse all children',
        icon: 'collapse_all',
        shortcut: getPlatformShortcutKey('click', [KeyMode.Alt]),
        command: () => toggleChildren(row, false),
        hidden: !row.getCanExpand() || !row.getIsExpanded(),
      }),
      (_e, { row, selectedRows }) => ({
        label: 'Add to list',
        icon: 'playlist_add',
        items: (() => {
          const items = actions.onAddToList?.(row.original, selectedRows)
          return items ? (Array.isArray(items) ? items : [items]) : undefined
        })(),
        hidden: !actions.onAddToList,
      }),
      (_e, { row }) => ({
        label: 'Upload version',
        icon: 'upload',
        command: () => actions.onUploadVersion(row.original),
      }),
      (_e, { row, selectedRows }) => ({
        label: 'Move',
        icon: 'drive_file_move',
        command: () => actions.onMove(row.original, selectedRows),
      }),
      () => ({
        label: newEntityDefinitions.folder.createLabel,
        icon: newEntityDefinitions.folder.icon,
        command: () => onOpenNew?.('folder'),
      }),
      () => ({
        label: newEntityDefinitions.task.createLabel,
        icon: newEntityDefinitions.task.icon,
        command: () => onOpenNew?.('task'),
      }),
      (_e, { row, selectedRows }) => ({
        label: 'Delete',
        icon: 'delete',
        danger: true,
        command: () => actions.onDelete(row.original, selectedRows),
      }),
    ],
    [actions, onOpenNew],
  )

  return {
    rowContextMenuBuilders,
    renamingRow,
    renameInitialValue: renamingRow?.label || renamingRow?.name || '',
    onSubmitRename: handleRenameLabel,
    onCancelRename: () => setRenamingRow(null),
  }
}
