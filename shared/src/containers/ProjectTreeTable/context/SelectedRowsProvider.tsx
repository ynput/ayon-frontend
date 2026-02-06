import { ReactNode, useCallback, useMemo, useRef, useEffect } from 'react'
import { ROW_SELECTION_COLUMN_ID, useSelectionCellsContext } from './SelectionCellsContext'
import { CellId, getCellId, parseCellId, RowId } from '../utils/cellUtils'
import { SelectedRowsContext } from './SelectedRowsContext'
import { useDetailsPanelEntityContext } from './DetailsPanelEntityContext'

interface SelectedRowsProviderProps {
  children: ReactNode
}

export const SelectedRowsProvider = ({ children }: SelectedRowsProviderProps) => {
  const { selectedCells, gridMap, setSelectedCells, setFocusedCellId, setAnchorCell } =
    useSelectionCellsContext()

  // Try to get the entity context, but it might not exist
  let clearSelectedEntity: (() => void) | undefined
  try {
    const entityContext = useDetailsPanelEntityContext()
    clearSelectedEntity = entityContext.clearSelectedEntity
  } catch {
    // Context not available, that's fine
    clearSelectedEntity = undefined
  }

  const prevSelectedRowsRef = useRef<string[]>([])

  // Calculate the current selected rows, filtering out rows that no longer exist in the grid
  const currentSelectedRows = useMemo(
    () =>
      Array.from(selectedCells)
        .filter(
          (cellId) =>
            parseCellId(cellId)?.colId === ROW_SELECTION_COLUMN_ID && parseCellId(cellId)?.rowId,
        )
        .map((cellId) => parseCellId(cellId)?.rowId)
        .filter((rowId): rowId is string => rowId !== undefined && gridMap.rowIdToIndex.has(rowId)),
    [selectedCells, gridMap],
  )

  // Memoize the selected rows with a stable reference
  const selectedRows = useMemo(() => {
    // Sort for consistent comparison
    const sortedCurrent = [...currentSelectedRows].sort()
    const sortedPrev = [...prevSelectedRowsRef.current].sort()

    // Check if the arrays are different
    const hasChanged =
      sortedCurrent.length !== sortedPrev.length ||
      sortedCurrent.some((id, index) => id !== sortedPrev[index])

    // Update ref and return new array only if changed
    if (hasChanged) {
      prevSelectedRowsRef.current = currentSelectedRows
      return currentSelectedRows
    }

    // Return the previous reference if no change
    return prevSelectedRowsRef.current
  }, [currentSelectedRows])

  // Clear entity details when rows are selected
  useEffect(() => {
    if (selectedRows.length > 0 && clearSelectedEntity) {
      clearSelectedEntity()
    }
  }, [selectedRows.length, clearSelectedEntity])

  // Select all rows in the grid
  const selectAllRows = useCallback(() => {
    const allRowIds = Array.from(gridMap.rowIdToIndex.keys())
    const newSelection = new Set<CellId>()

    // Create cells for each row with the row selection column ID
    allRowIds.forEach((rowId) => {
      newSelection.add(getCellId(rowId, ROW_SELECTION_COLUMN_ID))
    })

    setSelectedCells(newSelection)
    // If there are rows, set focus to the first one
    if (allRowIds.length > 0) {
      const firstCellId = getCellId(allRowIds[0], ROW_SELECTION_COLUMN_ID)
      setFocusedCellId(firstCellId)
      setAnchorCell(parseCellId(firstCellId))
    }
  }, [gridMap])

  // clear rows selection
  const clearRowsSelection = useCallback(() => {
    setSelectedCells((prev) => {
      const newSelection = new Set(prev)
      Array.from(newSelection).forEach((cellId) => {
        if (parseCellId(cellId)?.colId === ROW_SELECTION_COLUMN_ID) {
          newSelection.delete(cellId)
        }
      })
      return newSelection
    })
  }, [setSelectedCells])

  // check if a row is selected (using selectedRows array)
  const isRowSelected = useCallback(
    (rowId: RowId) => {
      return selectedRows.includes(rowId)
    },
    [selectedRows],
  )

  // Check if all rows are selected
  const areAllRowsSelected = useCallback(() => {
    const totalRows = gridMap.rowIdToIndex.size
    return totalRows > 0 && selectedRows.length === totalRows
  }, [gridMap, selectedRows])

  // Check if some but not all rows are selected
  const areSomeRowsSelected = useCallback(() => {
    return selectedRows.length > 0 && !areAllRowsSelected()
  }, [selectedRows, areAllRowsSelected])

  const value = useMemo(() => {
    return {
      selectedRows,
      selectAllRows,
      clearRowsSelection,
      isRowSelected,
      areAllRowsSelected,
      areSomeRowsSelected,
    }
  }, [selectedRows, selectAllRows, areAllRowsSelected, areSomeRowsSelected, clearRowsSelection])

  return <SelectedRowsContext.Provider value={value}>{children}</SelectedRowsContext.Provider>
}
