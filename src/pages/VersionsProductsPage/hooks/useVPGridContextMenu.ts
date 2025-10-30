import { useCallback } from 'react'
import {
  ContextMenuItemType,
  useCreateContextMenu,
  getCellId,
  parseCellId,
  ROW_SELECTION_COLUMN_ID,
  useSelectionCellsContext,
} from '@shared/containers'
import { VPContextMenuItems } from './useVPContextMenu'
import { useVersionsDataContext } from '../context/VPDataContext'

const GRID_COLUMN_ID = 'name'

export const useVPGridContextMenu = (contextMenuItems: VPContextMenuItems) => {
  const { selectedCells, setSelectedCells, setFocusedCellId } = useSelectionCellsContext()
  const {
    showDetailsItem,
    openViewerItem,
    uploadVersionItem,
    addToListItem,
    deleteVersionItem,
    deleteProductItem,
  } = contextMenuItems
  const { entitiesMap } = useVersionsDataContext()
  const [ctxMenuShow] = useCreateContextMenu([])

  // Get all selected entity IDs from the selectedCells set
  const getSelectedEntityIds = useCallback((): string[] => {
    const entityIds = new Set<string>()
    Array.from(selectedCells).forEach((cellId) => {
      const parsed = parseCellId(cellId)
      if (parsed?.rowId) {
        entityIds.add(parsed.rowId)
      }
    })
    return Array.from(entityIds)
  }, [selectedCells])

  const handleGridContextMenu = useCallback(
    (e: React.MouseEvent, entityId: string) => {
      e.preventDefault()
      e.stopPropagation()

      const selectedEntityIds = getSelectedEntityIds()

      // Check if details panel is already open (has row selection cells)
      const hasRowSelection = Array.from(selectedCells).some((id) =>
        id.includes(ROW_SELECTION_COLUMN_ID),
      )

      // If the right-clicked item is not in the current selection, update selection to just this item
      if (!selectedEntityIds.includes(entityId)) {
        const nameCellId = getCellId(entityId, GRID_COLUMN_ID)
        const newSelection = new Set<string>([nameCellId])

        // Only add row selection cell if details panel is already open
        if (hasRowSelection) {
          const rowCellId = getCellId(entityId, ROW_SELECTION_COLUMN_ID)
          newSelection.add(rowCellId)
        }

        setSelectedCells(newSelection)
        setFocusedCellId(nameCellId)
      }

      // Determine which entity IDs to use
      const targetEntityIds = selectedEntityIds.includes(entityId) ? selectedEntityIds : [entityId]

      // Get entity for cell context
      const entity = entitiesMap.get(entityId)
      if (!entity) return

      // Create mock cell and meta objects for ContextMenuItemConstructor
      const mockCell = {
        cellId: getCellId(entityId, GRID_COLUMN_ID),
        columnId: GRID_COLUMN_ID,
        entityId: entity.id,
        entityType: entity.entityType,
        parentId: undefined,
        attribField: undefined,
        column: {
          id: GRID_COLUMN_ID,
          label: 'Name',
        },
        isGroup: false,
        data: entity,
      }

      const mockMeta = {
        selectedCells: targetEntityIds.map((id) => getCellId(id, GRID_COLUMN_ID)),
        selectedRows: targetEntityIds,
        selectedColumns: [GRID_COLUMN_ID],
        selectedFullRows: hasRowSelection ? targetEntityIds : [],
        selectedGroups: [],
      }

      const mockContext = {
        history: {} as any, // Mock history object - not used by our menu items
      }

      // Build menu items using ContextMenuItemConstructor functions
      const menuItems: ContextMenuItemType[] = []

      const showDetailsMenuItem = showDetailsItem(
        e as any,
        mockCell as any,
        [],
        mockMeta,
        mockContext,
      )
      if (showDetailsMenuItem) {
        menuItems.push(showDetailsMenuItem)
      }

      const openViewerMenuItem = openViewerItem(
        e as any,
        mockCell as any,
        [],
        mockMeta,
        mockContext,
      )
      if (openViewerMenuItem) {
        menuItems.push(openViewerMenuItem)
      }

      const uploadVersionMenuItem = uploadVersionItem(
        e as any,
        mockCell as any,
        [],
        mockMeta,
        mockContext,
      )
      if (uploadVersionMenuItem) {
        menuItems.push(uploadVersionMenuItem)
      }

      const addToListMenuItem = addToListItem(e as any, mockCell as any, [], mockMeta, mockContext)
      if (addToListMenuItem) {
        menuItems.push(addToListMenuItem)
      }

      const deleteVersionMenuItem = deleteVersionItem(
        e as any,
        mockCell as any,
        [],
        mockMeta,
        mockContext,
      )
      if (deleteVersionMenuItem) {
        menuItems.push(deleteVersionMenuItem)
      }

      const deleteProductMenuItem = deleteProductItem(
        e as any,
        mockCell as any,
        [],
        mockMeta,
        mockContext,
      )
      if (deleteProductMenuItem) {
        menuItems.push(deleteProductMenuItem)
      }

      ctxMenuShow(e, menuItems)
    },
    [
      ctxMenuShow,
      showDetailsItem,
      addToListItem,
      openViewerItem,
      uploadVersionItem,
      deleteVersionItem,
      deleteProductItem,
      getSelectedEntityIds,
      setSelectedCells,
      setFocusedCellId,
      selectedCells,
      entitiesMap,
    ],
  )

  return { handleGridContextMenu }
}
