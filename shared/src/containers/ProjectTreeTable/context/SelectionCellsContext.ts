import React, { createContext, useContext } from 'react'
import {
  CellId,
  RowId,
  ColId,
  CellPosition,
} from '../utils/cellUtils'

export const ROW_SELECTION_COLUMN_ID = '__row_selection__' // ID for the row selection column

// Structure to map row/column IDs to their positions in the grid
export interface GridMap {
  rowIdToIndex: Map<RowId, number>
  colIdToIndex: Map<ColId, number>
  indexToRowId: Map<number, RowId>
  indexToColId: Map<number, ColId>
}

export interface SelectionCellsContextType {
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
export const SelectionCellsContext = createContext<SelectionCellsContextType | undefined>(undefined)

export const useSelectionCellsContext = (): SelectionCellsContextType => {
  const context = useContext(SelectionCellsContext)
  if (context === undefined) {
    throw new Error('useSelectionCellsContext must be used within a SelectionCellsProvider')
  }
  return context
}
