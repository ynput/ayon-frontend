import { newEntityDefinitions, useNewEntityContext } from '@shared/containers/NewEntity'
import { SimpleTableRow, SimpleTableRowContextMenuBuilder } from '@shared/containers/SimpleTable'
import { ContextMenuItemType } from '@shared/containers/ContextMenu'
import { getPlatformShortcutKey, KeyMode } from '@shared/util/platform'
import { useCallback, useMemo, useState } from 'react'
import { useUpdateOverviewEntitiesMutation } from '@shared/api'
import {
  useDetailsPanelContext,
  useProjectContext,
  useDeleteEntitiesContext,
  type DeletableEntity,
} from '@shared/context'
import { OpenMoveDialog } from '@shared/containers/MoveEntityDialog'
import { useOptionalVersionUploadContext } from '@shared/components'
import { SliceMap } from '../types'

const toggleChildren = (row: any, expanded: boolean) => {
  row.toggleExpanded(expanded)
  row.subRows?.forEach((subRow: any) => toggleChildren(subRow, expanded))
}

const getExplicitParentFolderIds = (row: SimpleTableRow): string[] => {
  return row.id ? [row.id] : []
}

export type OnAddToList = (
  row: SimpleTableRow,
  selectedRows: string[],
) => ContextMenuItemType | ContextMenuItemType[] | undefined

export type OnOpenViewer = (row: SimpleTableRow, projectName: string) => void

export const useHierarchyContextMenuItems = (
  onAddToList?: OnAddToList,
  entityMap?: SliceMap,
  onOpenViewer?: OnOpenViewer,
  openMoveDialog?: OpenMoveDialog,
) => {
  const { onOpenNew } = useNewEntityContext()
  const { projectName } = useProjectContext()
  const { setEntities } = useDetailsPanelContext()
  const versionUpload = useOptionalVersionUploadContext()
  const [updateEntities] = useUpdateOverviewEntitiesMutation()
  const { deleteEntities } = useDeleteEntitiesContext()
  const [renamingRow, setRenamingRow] = useState<SimpleTableRow | null>(null)

  const actions = useMemo(
    () => ({
      onShowDetails: (row: SimpleTableRow, selectedRows: string[] = [row.id]) => {
        setEntities({
          entityType: 'folder',
          entities: selectedRows.map((id) => ({ id, projectName })),
        })
      },
      onAddToList,
      onMove: (row: SimpleTableRow, selectedRows: string[]) => {
        const entityType = row.data?.entityType === 'task' ? 'task' : 'folder'
        openMoveDialog?.({
          entities: selectedRows.map((entityId) => ({
            entityId,
            entityType,
            currentParentId: row.parentId || row.data?.parentId,
          })),
        })
      },
      onRename: (row: SimpleTableRow) => setRenamingRow(row),
      onOpenViewer: (row: SimpleTableRow) => onOpenViewer?.(row, projectName),
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
        const entities: DeletableEntity[] = selectedRows.flatMap((entityId) => {
          const selectedRow = entityMap?.get(entityId) || (entityId === row.id ? row : undefined)
          if (!selectedRow) return []

          const entityType = selectedRow.data?.entityType === 'task' ? 'task' : 'folder'
          const parentId = selectedRow.parentId || selectedRow.data?.parentId
          return [
            {
              id: selectedRow.id,
              entityType,
              name: selectedRow.name,
              label: selectedRow.label,
              projectName,
              folderId: entityType === 'task' ? parentId : undefined,
              parentId: entityType === 'folder' ? parentId : undefined,
            },
          ]
        })

        void deleteEntities(entities)
      },
    }),
    [
      onAddToList,
      onOpenViewer,
      openMoveDialog,
      projectName,
      setEntities,
      deleteEntities,
      entityMap,
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
        shortcut: getPlatformShortcutKey('click', [KeyMode.Alt]),
        command: () => actions.onShowDetails(row.original, selectedRows),
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
        hidden: !onOpenViewer,
      }),
      (_e, { row }) => ({
        label: 'Expand all children',
        icon: 'expand_all',
        command: () => toggleChildren(row, true),
        hidden: !row.getCanExpand() || row.getIsExpanded(),
      }),
      (_e, { row }) => ({
        label: 'Collapse all children',
        icon: 'collapse_all',
        command: () => toggleChildren(row, false),
        hidden: !row.getCanExpand() || !row.getIsExpanded(),
      }),
      (_e, { row, selectedRows }) => {
        const items = actions.onAddToList?.(row.original, selectedRows)
        return items ? (Array.isArray(items) ? items : [items]) : undefined
      },
      (_e, { row }) => ({
        label: 'Upload version',
        icon: 'upload',
        command: () => actions.onUploadVersion(row.original),
      }),
      (_e, { row, selectedRows }) => ({
        label: 'Move',
        icon: 'drive_file_move',
        command: () => actions.onMove(row.original, selectedRows),
        hidden: !openMoveDialog,
      }),
      (_e, { row }) => ({
        label: newEntityDefinitions.folder.createLabel,
        icon: newEntityDefinitions.folder.icon,
        command: () =>
          onOpenNew?.('folder', { parentFolderIds: getExplicitParentFolderIds(row.original) }),
      }),
      (_e, { row }) => ({
        label: newEntityDefinitions.task.createLabel,
        icon: newEntityDefinitions.task.icon,
        command: () =>
          onOpenNew?.('task', { parentFolderIds: getExplicitParentFolderIds(row.original) }),
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
    onOptionClick: actions.onShowDetails,
    renamingRow,
    renameInitialValue: renamingRow?.label || renamingRow?.name || '',
    onSubmitRename: handleRenameLabel,
    onCancelRename: () => setRenamingRow(null),
  }
}
