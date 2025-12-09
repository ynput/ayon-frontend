import { useCallback, useMemo } from 'react'
import { useCreateContextMenu } from '@shared/containers'
import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import { SimpleTableRow } from '@shared/containers/SimpleTable'
import { useMoveEntityContext, useProjectFoldersContext, useDetailsPanelContext } from '@shared/context'
import { useUpdateOverviewEntitiesMutation } from '@shared/api'
import { confirmDelete, getPlatformShortcutKey, KeyMode } from '@shared/util'
import { toast } from 'react-toastify'
import { useAppSelector } from '@state/store'
import { copyToClipboard } from '@shared/util'
import { DetailsPanelEntityType } from '@shared/api'

type UseSlicerMenuItemsProps = {
  expanded: ExpandedState
  setExpanded: (expanded: ExpandedState) => void
  rowSelection: RowSelectionState
  setRowSelection: (selection: RowSelectionState) => void
  tableData: SimpleTableRow[]
}

const useSlicerMenuItems = ({
  expanded,
  setExpanded,
  rowSelection,
  setRowSelection,
  tableData,
}: UseSlicerMenuItemsProps) => {
  const [ctxMenuShow] = useCreateContextMenu()
  const { openMoveDialog } = useMoveEntityContext()
  const { folders } = useProjectFoldersContext()
  const [updateOverviewEntities] = useUpdateOverviewEntitiesMutation()
  const projectName = useAppSelector((state) => state.project.name)
  const { setEntities, setPanelOpen } = useDetailsPanelContext()

  const mapSubTypeToEntityType = useCallback((subType: string | null | undefined): 'folder' | 'task' | null => {
    if (subType === 'Folder' || subType === 'Asset') {
      return 'folder'
    } else if (subType === 'Task') {
      return 'task'
    }
    return null
  }, [])

  const getAllDescendantIds = useCallback((rowId: string, data: SimpleTableRow[]): string[] => {
    const descendantIds: string[] = []

    // Find the row in the data
    const findRowAndDescendants = (rows: SimpleTableRow[]): void => {
      for (const row of rows) {
        if (row.id === rowId) {
          // Found the row, now get all its descendants
          const collectDescendants = (children: SimpleTableRow[]): void => {
            for (const child of children) {
              descendantIds.push(child.id)
              if (child.subRows && child.subRows.length > 0) {
                collectDescendants(child.subRows)
              }
            }
          }
          if (row.subRows && row.subRows.length > 0) {
            collectDescendants(row.subRows)
          }
          return
        }
        // Continue searching in subRows
        if (row.subRows && row.subRows.length > 0) {
          findRowAndDescendants(row.subRows)
        }
      }
    }

    findRowAndDescendants(data)
    return descendantIds
  }, [])

  const handleExpand = useCallback(
    (selectedIds: string[]) => {
      const currentExpanded = expanded || {}
      const newExpanded = { ...(currentExpanded as Record<string, boolean>) }

      selectedIds.forEach((id) => {
        // Add the folder itself
        newExpanded[id] = true

        // Add ALL its descendants (children, grandchildren, etc.)
        const descendantIds = getAllDescendantIds(id, tableData)
        descendantIds.forEach((descendantId) => {
          newExpanded[descendantId] = true
        })
      })

      setExpanded(newExpanded)
    },
    [expanded, setExpanded, tableData, getAllDescendantIds],
  )

  const handleCollapse = useCallback(
    (selectedIds: string[]) => {
      const currentExpanded = expanded || {}
      const newExpanded = { ...(currentExpanded as Record<string, boolean>) }

      selectedIds.forEach((id) => {
        // Remove the folder itself
        delete newExpanded[id]

        // Remove ALL its descendants (children, grandchildren, etc.)
        const descendantIds = getAllDescendantIds(id, tableData)
        descendantIds.forEach((descendantId) => {
          delete newExpanded[descendantId]
        })
      })

      setExpanded(newExpanded)
    },
    [expanded, setExpanded, tableData, getAllDescendantIds],
  )

  // Helper function to find a row by ID in the table data
  const findRowById = useCallback((rows: SimpleTableRow[], id: string): SimpleTableRow | undefined => {
    for (const row of rows) {
      if (row.id === id) return row
      if (row.subRows?.length) {
        const found = findRowById(row.subRows, id)
        if (found) return found
      }
    }
    return undefined
  }, [])

  const handleDelete = useCallback(
    async (selectedIds: string[]) => {
      if (!selectedIds || selectedIds.length === 0) {
        toast.error('No entities selected')
        return
      }

      // Find the entities from the table data
      const entitiesToDelete = selectedIds
        .map((id) => {
          const row = findRowById(tableData, id)
          if (!row) return null

          const entityType = mapSubTypeToEntityType(row.data?.subType)
          if (!entityType) return null

          return {
            entityId: row.data?.id || row.id,
            entityType,
            label: row.label || row.name,
            rowId: row.id,
          }
        })
        .filter((entity): entity is NonNullable<typeof entity> => entity !== null)

      if (entitiesToDelete.length === 0) {
        toast.error('No entities found')
        return
      }

      const deleteEntities = async (force = false) => {
        const operations = entitiesToDelete.map((e) => ({
          entityType: e.entityType,
          type: 'delete' as const,
          entityId: e.entityId,
          force,
        }))

        try {
          await updateOverviewEntities({
            projectName: projectName || '',
            operationsRequestModel: { operations },
          }).unwrap()
          // Clear selection after successful delete
          setRowSelection({})
        } catch (error: any) {
          const message = error?.error || 'Failed to delete entities'
          console.error('Failed to delete entities:', error)
          throw { message, ...error }
        }
      }

      const entityLabel =
        entitiesToDelete.length === 1
          ? `"${entitiesToDelete[0].label}"`
          : `${entitiesToDelete.length} entities`

      confirmDelete({
        label: 'folders and tasks',
        message: `Are you sure you want to delete ${entityLabel}? This action cannot be undone.`,
        accept: deleteEntities,
        onError: (error: any) => {
          const FOLDER_WITH_CHILDREN_CODE = 'delete-folder-with-children'
          // check if the error is because of child tasks, products
          if (error?.errorCodes?.includes(FOLDER_WITH_CHILDREN_CODE)) {
            const confirmForce = window.confirm(
              `Are you really sure you want to delete ${entityLabel} and all of its dependencies? This cannot be undone. (NOT RECOMMENDED)`,
            )
            if (confirmForce) {
              deleteEntities(true)
            } else {
              console.log('User cancelled forced delete')
            }
          }
        },
        deleteLabel: 'Delete forever',
      })
    },
    [tableData, updateOverviewEntities, projectName, setRowSelection, findRowById, mapSubTypeToEntityType],
  )

  const handleMove = useCallback(
    (selectedIds: string[]) => {
      const entitiesToMove = selectedIds
        .map((id) => {
          const row = findRowById(tableData, id)
          if (!row) return null

          const entityType = mapSubTypeToEntityType(row.data?.subType)
          if (!entityType) return null

          return {
            entityId: row.data?.id || row.id,
            entityType,
            currentParentId: row.parentId,
          }
        })
        .filter((entity): entity is NonNullable<typeof entity> => entity !== null)

      const hasUnmovableFolders = entitiesToMove.some((entity) => {
        if (entity.entityType === 'folder') {
          const folderData = folders.find((f) => f.id === entity.entityId)
          return folderData?.hasVersions
        }
        return false
      })

      if (hasUnmovableFolders) {
        return
      }

      if (entitiesToMove.length === 1) {
        openMoveDialog(entitiesToMove[0])
      } else if (entitiesToMove.length > 1) {
        openMoveDialog({ entities: entitiesToMove })
      }
    },
    [tableData, findRowById, mapSubTypeToEntityType, folders, openMoveDialog],
  )

  const copy = useCallback(
    (selectedIds: string[]) => {
      const entitiesToCopy = selectedIds
        .map((id) => {
          const row = findRowById(tableData, id)
          if (!row) return null
          return row.name
        })
        .filter((name): name is string => name !== null)

      copyToClipboard(entitiesToCopy.join('\n'))
    },
    [tableData, findRowById],
  )

  const handleOpenDetailsPanel = useCallback(
    (selectedIds: string[]) => {
      if (!projectName) {
        toast.error('No project selected')
        return
      }

      const entities = selectedIds
        .map((id) => {
          const row = findRowById(tableData, id)
          if (!row || !row.data?.id) return null

          const entityType = mapSubTypeToEntityType(row.data?.subType) as DetailsPanelEntityType | null
          if (!entityType) return null

          return {
            id: row.data.id,
            projectName,
            entityType,
          }
        })
        .filter((entity): entity is NonNullable<typeof entity> => entity !== null)

      if (entities.length === 0) {
        toast.error('No valid entities to show in details panel')
        return
      }

      const primaryEntityType = entities[0].entityType

      setEntities({
        entityType: primaryEntityType,
        entities: entities.map((e) => ({ id: e.id, projectName: e.projectName })),
      })
      setPanelOpen('slicer', true)
    },
    [projectName, tableData, findRowById, mapSubTypeToEntityType, setEntities, setPanelOpen],
  )

  // Handle alt+click for expand/collapse
  const handleRowClick = useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      if (event.altKey) {
        event.preventDefault()
        event.stopPropagation()

        // Get the row ID from the event target
        const rowId = event.currentTarget.id
        if (!rowId) return

        // Check if this row is in the current selection
        const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id])
        const isInSelection = selectedIds.includes(rowId)

        // If the clicked row is in the selection, use all selected rows, otherwise just the clicked row
        const idsToToggle = isInSelection ? selectedIds : [rowId]

        // Check if the clicked row is expanded
        const isExpanded = expanded && (expanded as Record<string, boolean>)[rowId]

        if (isExpanded) {
          handleCollapse(idsToToggle)
        } else {
          handleExpand(idsToToggle)
        }
      }
    },
    [rowSelection, expanded, handleExpand, handleCollapse],
  )

  const openContext = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault()
      e.stopPropagation()

      // Get the clicked row ID from the event target
      const clickedRowId = e.currentTarget.id

      // Temporary selection: if clicked row is not in current selection, select it temporarily
      let newSelection: RowSelectionState = { ...rowSelection }
      if (!newSelection[clickedRowId]) {
        newSelection = { [clickedRowId]: true }
        setRowSelection(newSelection)
      }

      // Get selected IDs based on the new selection
      const selectedIds = Object.keys(newSelection).filter((id) => newSelection[id])
      const multipleSelected = selectedIds.length > 1
      const hasSelection = selectedIds.length > 0

      const menuItems = [
        {
          label: 'Copy',
          icon: 'content_copy',
          command: () => copy(selectedIds),
          hidden: !hasSelection,
          shortcut: getPlatformShortcutKey('c', [KeyMode.Ctrl]),
        },
        {
          label: 'Details',
          icon: 'info',
          command: () => handleOpenDetailsPanel(selectedIds),
          hidden: !hasSelection,
        },
        {
          label: 'Move',
          icon: 'drive_file_move',
          command: () => handleMove(selectedIds),
          hidden: !hasSelection,
        },
        {
          label: 'Expand All',
          icon: 'unfold_more',
          command: () => handleExpand(selectedIds),
          hidden: multipleSelected || !hasSelection,
          shortcut: getPlatformShortcutKey('click', [KeyMode.Alt]),
        },
        {
          label: 'Collapse All',
          icon: 'unfold_less',
          command: () => handleCollapse(selectedIds),
          hidden: multipleSelected || !hasSelection,
          shortcut: getPlatformShortcutKey('click', [KeyMode.Alt]),
        },
        {
          label: 'Delete',
          icon: 'delete',
          danger: true,
          command: () => handleDelete(selectedIds),
          hidden: !hasSelection,
        },
      ].filter((item) => !item.hidden)

      ctxMenuShow(e, menuItems)
    },
    [ctxMenuShow, rowSelection, setRowSelection, handleExpand, handleCollapse, handleDelete, handleMove, handleOpenDetailsPanel, copy],
  )

  // Keyboard shortcuts
  const shortcuts = useMemo<Array<{ key: string; action: () => void }>>(() => {
    const getSelectedIds = () => Object.keys(rowSelection).filter((id) => rowSelection[id])

    return [
      {
        key: 'ctrl+c',
        action: () => {
          const selectedIds = getSelectedIds()
          if (selectedIds.length > 0) {
            copy(selectedIds)
          }
        },
      },
    ]
  }, [rowSelection, copy])

  return {
    openContext,
    handleRowClick,
    shortcuts,
  }
}

export default useSlicerMenuItems
