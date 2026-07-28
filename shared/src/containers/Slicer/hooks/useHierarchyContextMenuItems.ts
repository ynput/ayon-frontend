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

const getExplicitParentFolderIds = (rows: SimpleTableRow[]): string[] => {
  return rows.map((row) => row.id).filter(Boolean)
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

  const getSelectedRows = useCallback(
    (row: SimpleTableRow, selectedRows: string[]) =>
      selectedRows
        .map((entityId) => entityMap?.get(entityId) || (entityId === row.id ? row : undefined))
        .filter((selectedRow): selectedRow is SimpleTableRow => !!selectedRow),
    [entityMap],
  )

  const actions = useMemo(
    () => ({
      onShowDetails: (row: SimpleTableRow, selectedRows: string[] = [row.id]) => {
        setEntities({
          entityType: 'folder',
          entities: selectedRows.map((id) => ({ id, projectName })),
        })
      },
      onAddToList,
      onMove: (selectedRows: SimpleTableRow[]) => {
        openMoveDialog?.({
          entities: selectedRows.map((selectedRow) => ({
            entityId: selectedRow.id,
            entityType: selectedRow.data?.entityType === 'task' ? 'task' : 'folder',
            currentParentId: selectedRow.parentId || selectedRow.data?.parentId,
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
      onDelete: (selectedRows: SimpleTableRow[]) => {
        const entities: DeletableEntity[] = selectedRows.map((selectedRow) => {
          const entityType = selectedRow.data?.entityType === 'task' ? 'task' : 'folder'
          const parentId = selectedRow.parentId || selectedRow.data?.parentId
          return {
            id: selectedRow.id,
            entityType,
            name: selectedRow.name,
            label: selectedRow.label,
            projectName,
            folderId: entityType === 'task' ? parentId : undefined,
            parentId: entityType === 'folder' ? parentId : undefined,
          }
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
      (_e, { selectedTableRows }) => ({
        label: 'Expand all children',
        icon: 'expand_all',
        command: () =>
          selectedTableRows
            .filter((selectedRow) => selectedRow.getCanExpand() && !selectedRow.getIsExpanded())
            .forEach((selectedRow) => toggleChildren(selectedRow, true)),
        hidden: !selectedTableRows.some(
          (selectedRow) => selectedRow.getCanExpand() && !selectedRow.getIsExpanded(),
        ),
      }),
      (_e, { selectedTableRows }) => ({
        label: 'Collapse all children',
        icon: 'collapse_all',
        command: () =>
          selectedTableRows
            .filter((selectedRow) => selectedRow.getCanExpand() && selectedRow.getIsExpanded())
            .forEach((selectedRow) => toggleChildren(selectedRow, false)),
        hidden: !selectedTableRows.some(
          (selectedRow) => selectedRow.getCanExpand() && selectedRow.getIsExpanded(),
        ),
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
        command: () => actions.onMove(getSelectedRows(row.original, selectedRows)),
        hidden: !openMoveDialog,
      }),
      (_e, { row, selectedRows }) => ({
        label: newEntityDefinitions.folder.createLabel,
        icon: newEntityDefinitions.folder.icon,
        command: () =>
          onOpenNew?.('folder', {
            parentFolderIds: getExplicitParentFolderIds(
              getSelectedRows(row.original, selectedRows),
            ),
          }),
      }),
      (_e, { row, selectedRows }) => ({
        label: newEntityDefinitions.task.createLabel,
        icon: newEntityDefinitions.task.icon,
        command: () =>
          onOpenNew?.('task', {
            parentFolderIds: getExplicitParentFolderIds(
              getSelectedRows(row.original, selectedRows),
            ),
          }),
      }),
      (_e, { row, selectedRows }) => ({
        label: 'Delete',
        icon: 'delete',
        danger: true,
        command: () => actions.onDelete(getSelectedRows(row.original, selectedRows)),
      }),
    ],
    [actions, getSelectedRows, onOpenNew],
  )

  return {
    rowContextMenuBuilders,
    onOptionClick: actions.onShowDetails,
    onRename: actions.onRename,
    renamingRow,
    renameInitialValue: renamingRow?.label || renamingRow?.name || '',
    onSubmitRename: handleRenameLabel,
    onCancelRename: () => setRenamingRow(null),
  }
}
