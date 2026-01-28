import React, { useState, useCallback, useMemo, ReactNode, useRef } from 'react'
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
import { DRAG_HANDLE_COLUMN_ID } from '../ProjectTreeTable'
import { SelectionCellsContext, GridMap, ROW_SELECTION_COLUMN_ID } from './SelectionCellsContext'
import { useCheckSelectedCellsVisible } from '../hooks'

export const SelectionCellsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
  const mapToString = (map: Map<any, any>) => {
    return JSON.stringify(Array.from(map.entries()))
  }

  const stableGridMap = useMemo(
    () => gridMap,
    [
      mapToString(gridMap.rowIdToIndex),
      mapToString(gridMap.colIdToIndex),
      mapToString(gridMap.indexToRowId),
      mapToString(gridMap.indexToColId),
    ],
  )
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

  useCheckSelectedCellsVisible({
    selectedCells,
    setSelectedCells,
    focusedCellId,
    setFocusedCellId,
  })
  const isAdditiveSelectionRef = useRef<boolean>(false)
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
  const updateSelection = useCallback((selection: Set<CellId>, position: CellPosition) => {
    setSelectedCells((prevSelectedCells) => {
      let newSelection = new Set(selection)
      if (position.colId !== ROW_SELECTION_COLUMN_ID && position.colId !== DRAG_HANDLE_COLUMN_ID) {
        const rowSelection = Array.from(prevSelectedCells).filter(
          (id) => parseCellId(id)?.colId === ROW_SELECTION_COLUMN_ID,
        )
        if (rowSelection.length) {
          newSelection = new Set([...newSelection, ...rowSelection])
        }
      }
      return newSelection
    })
  }, [])

  // Select cells between two points in the grid
  const selectCellRange = useCallback(
    (start: CellPosition, end: CellPosition, additive: boolean): Set<CellId> => {
      if (!additive) {
        // Clear existing selection if not additive
        updateSelection(new Set(), start)
      }

      const startRowIdx = stableGridMap.rowIdToIndex.get(start.rowId) ?? 0
      const startColIdx = stableGridMap.colIdToIndex.get(start.colId) ?? 0
      const endRowIdx = stableGridMap.rowIdToIndex.get(end.rowId) ?? 0
      const endColIdx = stableGridMap.colIdToIndex.get(end.colId) ?? 0

      const minRowIdx = Math.min(startRowIdx, endRowIdx)
      const maxRowIdx = Math.max(startRowIdx, endRowIdx)
      const minColIdx = Math.min(startColIdx, endColIdx)
      const maxColIdx = Math.max(startColIdx, endColIdx)

      const newSelection = new Set(additive ? selectedCells : [])

      for (let r = minRowIdx; r <= maxRowIdx; r++) {
        const rowId = stableGridMap.indexToRowId.get(r)
        if (!rowId) continue

        for (let c = minColIdx; c <= maxColIdx; c++) {
          const colId = stableGridMap.indexToColId.get(c)
          if (!colId) continue

          newSelection.add(getCellId(rowId, colId))
        }
      }

      return newSelection
    },
    [stableGridMap, selectedCells, updateSelection],
  )

  // Start a selection operation
  const startSelection = useCallback(
    (cellId: CellId, additive: boolean) => {
      const position = parseCellId(cellId)
      if (!position) return

      setSelectionInProgress(true)
      isAdditiveSelectionRef.current = additive
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
    [selectedCells, focusedCellId, updateSelection],
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
        const newSelection = selectCellRange(anchorCell, currentPosition, isAdditiveSelectionRef.current)
        updateSelection(newSelection, currentPosition)
      }
    },
    [selectionInProgress, anchorCell, selectCellRange, updateSelection],
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
    [anchorCell, selectCellRange, updateSelection],
  )

  // Focus a cell without changing selection
  const focusCell = useCallback((cellId: CellId | null) => {
    setFocusedCellId(cellId)
  }, [])

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedCells(new Set())
    setAnchorCell(null)
    setFocusedCellId(null)
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

      const rowIndex = stableGridMap.rowIdToIndex.get(position.rowId)
      const colIndex = stableGridMap.colIdToIndex.get(position.colId)

      if (rowIndex === undefined || colIndex === undefined) return []

      // Check if the cell's neighbors in all four directions are selected
      const top = stableGridMap.indexToRowId.get(rowIndex - 1)
      const right = stableGridMap.indexToColId.get(colIndex + 1)
      const bottom = stableGridMap.indexToRowId.get(rowIndex + 1)
      const left = stableGridMap.indexToColId.get(colIndex - 1)

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
    [selectedCells, stableGridMap, isCellSelected],
  )

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      selectedCells,
      selectedRows,
      focusedCellId,
      selectionInProgress,
      anchorCell,
      gridMap: stableGridMap,
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
      stableGridMap,
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

  return <SelectionCellsContext.Provider value={value}>{children}</SelectionCellsContext.Provider>
}
