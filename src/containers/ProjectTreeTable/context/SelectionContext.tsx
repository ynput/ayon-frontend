import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useRef,
} from 'react'
import {
  CellId,
  RowId,
  ColId,
  CellPosition,
  getCellId,
  parseCellId,
  BorderPosition,
  getBorderClasses,
} from '../utils/cellUtils'

export const ROW_SELECTION_COLUMN_ID = '__row_selection__' // ID for the row selection column

// Cell range for selections

// Structure to map row/column IDs to their positions in the grid
export interface GridMap {
  rowIdToIndex: Map<RowId, number>
  colIdToIndex: Map<ColId, number>
  indexToRowId: Map<number, RowId>
  indexToColId: Map<number, ColId>
}

export interface SelectionContextType {
  // Selected cells
  selectedCells: Set<CellId>
  // Focused cell (single cell that has focus)
  focusedCellId: CellId | null
  // Selection in progress state
  selectionInProgress: boolean
  // Anchor point for range selections
  anchorCell: CellPosition | null
  // Grid mapping for coordinate lookups
  gridMap: GridMap

  selectedRows: string[] // Array of selected row IDs

  // State setters
  setSelectedCells: React.Dispatch<React.SetStateAction<Set<CellId>>>
  setFocusedCellId: React.Dispatch<React.SetStateAction<CellId | null>>
  setAnchorCell: React.Dispatch<React.SetStateAction<CellPosition | null>>
  // Methods
  registerGrid: (rows: RowId[], columns: ColId[]) => void
  selectCell: (cellId: CellId, additive: boolean, range: boolean) => void
  startSelection: (cellId: CellId, additive: boolean) => void
  extendSelection: (cellId: CellId, isRowSelectionColumn?: boolean) => void
  endSelection: (cellId: CellId) => void
  focusCell: (cellId: CellId | null) => void
  clearSelection: () => void
  isCellSelected: (cellId: CellId) => boolean
  isCellFocused: (cellId: CellId) => boolean
  getCellPositionFromId: (cellId: CellId) => CellPosition | null
  getCellBorderClasses: (cellId: CellId) => string[]
}

// Create the context
const SelectionContext = createContext<SelectionContextType | undefined>(undefined)

export const SelectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCells, setSelectedCells] = useState<Set<CellId>>(new Set())
  const [focusedCellId, setFocusedCellId] = useState<CellId | null>(null)
  const [selectionInProgress, setSelectionInProgress] = useState<boolean>(false)
  const [anchorCell, setAnchorCell] = useState<CellPosition | null>(null)
  const [gridMap, setGridMap] = useState<GridMap>({
    rowIdToIndex: new Map(),
    colIdToIndex: new Map(),
    indexToRowId: new Map(),
    indexToColId: new Map(),
  })
  // Track whether we're selecting or unselecting during drag
  const initialCellSelected = useRef<boolean>(false)

  const selectedRows = useMemo(
    () =>
      Array.from(selectedCells)
        .filter(
          (cellId) =>
            parseCellId(cellId)?.colId === ROW_SELECTION_COLUMN_ID && parseCellId(cellId)?.rowId,
        )
        .map((cellId) => parseCellId(cellId)?.rowId) as string[],
    [selectedCells],
  )

  // Register grid structure for range selections
  const registerGrid = useCallback((rows: RowId[], columns: ColId[]) => {
    const rowIdToIndex = new Map<RowId, number>()
    const colIdToIndex = new Map<ColId, number>()
    const indexToRowId = new Map<number, RowId>()
    const indexToColId = new Map<number, ColId>()

    rows.forEach((rowId, index) => {
      rowIdToIndex.set(rowId, index)
      indexToRowId.set(index, rowId)
    })

    columns.forEach((colId, index) => {
      colIdToIndex.set(colId, index)
      indexToColId.set(index, colId)
    })

    setGridMap({ rowIdToIndex, colIdToIndex, indexToRowId, indexToColId })
  }, [])

  // update the selection whilst properly handling the row-selection column
  const updateSelection = (selection: Set<CellId>, position: CellPosition) => {
    let newSelection = new Set(selection)
    if (position.colId !== ROW_SELECTION_COLUMN_ID) {
      // we always preserve the selection of the row-selection column
      const rowSelection = Array.from(selectedCells).filter(
        (id) => parseCellId(id)?.colId === ROW_SELECTION_COLUMN_ID,
      )
      if (rowSelection.length) {
        newSelection = new Set([...newSelection, ...rowSelection])
      }
    }
    // reset selection and set new anchor
    setSelectedCells(newSelection)
  }

  // Select cells between two points in the grid
  const selectCellRange = useCallback(
    (start: CellPosition, end: CellPosition, additive: boolean): Set<CellId> => {
      if (!additive) {
        // Clear existing selection if not additive
        updateSelection(new Set(), start)
      }

      const startRowIdx = gridMap.rowIdToIndex.get(start.rowId) ?? 0
      const startColIdx = gridMap.colIdToIndex.get(start.colId) ?? 0
      const endRowIdx = gridMap.rowIdToIndex.get(end.rowId) ?? 0
      const endColIdx = gridMap.colIdToIndex.get(end.colId) ?? 0

      const minRowIdx = Math.min(startRowIdx, endRowIdx)
      const maxRowIdx = Math.max(startRowIdx, endRowIdx)
      const minColIdx = Math.min(startColIdx, endColIdx)
      const maxColIdx = Math.max(startColIdx, endColIdx)

      const newSelection = new Set(additive ? selectedCells : [])

      for (let r = minRowIdx; r <= maxRowIdx; r++) {
        const rowId = gridMap.indexToRowId.get(r)
        if (!rowId) continue

        for (let c = minColIdx; c <= maxColIdx; c++) {
          const colId = gridMap.indexToColId.get(c)
          if (!colId) continue

          newSelection.add(getCellId(rowId, colId))
        }
      }

      return newSelection
    },
    [gridMap, selectedCells],
  )

  // Start a selection operation
  const startSelection = useCallback(
    (cellId: CellId, additive: boolean) => {
      const position = parseCellId(cellId)
      if (!position) return

      setSelectionInProgress(true)
      // Store whether the initial cell was selected to determine drag behavior
      initialCellSelected.current = selectedCells.has(cellId)

      if (additive) {
        // Toggle this cell in multi-select mode
        setSelectedCells((prev) => {
          const newSelection = new Set(prev)
          if (newSelection.has(cellId)) {
            newSelection.delete(cellId)
            // If this was the focused cell, set focus to another cell in the selection or null
            if (focusedCellId === cellId) {
              if (newSelection.size > 0) {
                setFocusedCellId(Array.from(newSelection)[Array.from(newSelection).length - 1])
              } else {
                setFocusedCellId(null)
              }
            }
          } else {
            newSelection.add(cellId)
            setFocusedCellId(cellId)
            setAnchorCell(position)
          }
          return newSelection
        })
      } else {
        // Single cell selection
        // If this cell is already the only selected cell, deselect it
        // and it is from name column
        if (
          selectedCells.size === 1 &&
          selectedCells.has(cellId) &&
          [ROW_SELECTION_COLUMN_ID, 'name'].includes(position.colId)
        ) {
          setSelectedCells(new Set())
          setAnchorCell(null)
          setFocusedCellId(null)
        } else {
          updateSelection(new Set([cellId]), position)
          setAnchorCell(position)
          setFocusedCellId(cellId)
        }
      }
    },
    [selectedCells, focusedCellId],
  )

  // Extend the current selection during drag
  const extendSelection = useCallback(
    (cellId: CellId, isRowSelectionColumn?: boolean) => {
      if (!selectionInProgress || !anchorCell) return

      const currentPosition = parseCellId(cellId)
      if (!currentPosition) return

      if (isRowSelectionColumn) {
        // Handle row selection column differently during drag
        setSelectedCells((prev) => {
          const newSelection = new Set(prev)
          const position = parseCellId(cellId)

          if (!position) return newSelection

          // We're either selecting or unselecting based on the initial cell's state
          if (initialCellSelected.current) {
            // If we started on a selected cell, we're removing cells during drag
            newSelection.delete(cellId)
          } else {
            // If we started on an unselected cell, we're adding cells during drag
            newSelection.add(cellId)
          }

          return newSelection
        })
      } else {
        // For normal cells, use the range selection behavior
        const newSelection = selectCellRange(anchorCell, currentPosition, false)
        updateSelection(newSelection, currentPosition)
      }
    },
    [selectionInProgress, anchorCell, selectCellRange],
  )

  // End a selection operation
  const endSelection = useCallback(() => {
    setSelectionInProgress(false)
  }, [])

  // Select a cell (click or programmatically)
  const selectCell = useCallback(
    (cellId: CellId, additive: boolean, range: boolean) => {
      const position = parseCellId(cellId)
      if (!position) return

      if (range && anchorCell) {
        // Shift+click for range selection - select cells between anchor and current
        const newSelection = selectCellRange(anchorCell, position, additive)
        updateSelection(newSelection, position)
      } else if (additive) {
        // Ctrl/Cmd+click for toggling selection
        setSelectedCells((prev) => {
          const newSelection = new Set(prev)
          if (newSelection.has(cellId)) {
            newSelection.delete(cellId)
          } else {
            newSelection.add(cellId)
          }
          return newSelection
        })
      } else {
        // Normal click - select just this cell and set as new anchor
        updateSelection(new Set([cellId]), position)
        setAnchorCell(position)
      }
    },
    [anchorCell, selectCellRange],
  )

  // Focus a cell without changing selection
  const focusCell = useCallback((cellId: CellId | null) => {
    setFocusedCellId(cellId)
  }, [])

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedCells(new Set())
    setAnchorCell(null)
  }, [])

  // Check if a cell is selected
  const isCellSelected = useCallback((cellId: CellId) => selectedCells.has(cellId), [selectedCells])

  // Check if a cell is focused
  const isCellFocused = useCallback((cellId: CellId) => cellId === focusedCellId, [focusedCellId])

  // Get position from cell ID - using shared utility
  const getCellPositionFromId = useCallback((cellId: CellId) => parseCellId(cellId), [])

  //  Get border classes for a cell based on its selection state and neighbors
  const getCellBorderClasses = useCallback(
    (cellId: CellId): string[] => {
      if (!isCellSelected(cellId)) return []

      const position = parseCellId(cellId)
      if (!position) return []

      const rowIndex = gridMap.rowIdToIndex.get(position.rowId)
      const colIndex = gridMap.colIdToIndex.get(position.colId)

      if (rowIndex === undefined || colIndex === undefined) return []

      // Check if the cell's neighbors in all four directions are selected
      const top = gridMap.indexToRowId.get(rowIndex - 1)
      const right = gridMap.indexToColId.get(colIndex + 1)
      const bottom = gridMap.indexToRowId.get(rowIndex + 1)
      const left = gridMap.indexToColId.get(colIndex - 1)

      // Default to no borders
      let borderPos = BorderPosition.None

      // Top edge check: show border if we're at the top of the grid or the cell above is not selected
      if (!top || !selectedCells.has(getCellId(top, position.colId))) {
        borderPos |= BorderPosition.Top
      }

      // Right edge check: show border if we're at the right edge of the grid or the cell to the right is not selected
      if (!right || !selectedCells.has(getCellId(position.rowId, right))) {
        borderPos |= BorderPosition.Right
      }

      // Bottom edge check: show border if we're at the bottom of the grid or the cell below is not selected
      if (!bottom || !selectedCells.has(getCellId(bottom, position.colId))) {
        borderPos |= BorderPosition.Bottom
      }

      // Left edge check: show border if we're at the left edge of the grid or the cell to the left is not selected
      if (!left || !selectedCells.has(getCellId(position.rowId, left))) {
        borderPos |= BorderPosition.Left
      }

      return getBorderClasses(borderPos)
    },
    [selectedCells, gridMap, isCellSelected],
  )

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      selectedCells,
      selectedRows,
      focusedCellId,
      selectionInProgress,
      anchorCell,
      gridMap,
      setSelectedCells,
      setFocusedCellId,
      setAnchorCell,
      registerGrid,
      selectCell,
      startSelection,
      extendSelection,
      endSelection,
      focusCell,
      clearSelection,
      isCellSelected,
      isCellFocused,
      getCellPositionFromId,
      getCellBorderClasses,
    }),
    [
      selectedCells,
      selectedRows,
      focusedCellId,
      selectionInProgress,
      anchorCell,
      gridMap,
      setSelectedCells,
      setFocusedCellId,
      setAnchorCell,
      registerGrid,
      selectCell,
      startSelection,
      extendSelection,
      endSelection,
      focusCell,
      clearSelection,
      isCellSelected,
      isCellFocused,
      getCellPositionFromId,
      getCellBorderClasses,
    ],
  )

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>
}

export const useSelectionContext = (): SelectionContextType => {
  const context = useContext(SelectionContext)
  if (context === undefined) {
    throw new Error('useSelectionContext must be used within a SelectionProvider')
  }
  return context
}
