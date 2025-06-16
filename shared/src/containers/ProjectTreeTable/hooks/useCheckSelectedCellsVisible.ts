// This hooks checks the current selection of cells is actually visible in the current viewport of the table
// If they are not visible, they will be removed from the selection
// This can happen when the user changes the slicer selection or filters (combined filters changes)

import { useEffect, useMemo } from 'react'
import { CellId, parseCellId } from '../utils'
import { ExpandedState } from '@tanstack/react-table'
import { useProjectTableContext } from '../context'

const getVisibleRowIds = (tableData: any[], expanded: ExpandedState): string[] => {
  const visibleIds: string[] = []
  const stack: Array<{ row: any; parentExpanded: boolean }> = []

  // Initialize stack with top-level rows
  for (const row of tableData) {
    stack.push({ row, parentExpanded: true })
  }

  while (stack.length > 0) {
    const { row, parentExpanded } = stack.pop()!

    if (parentExpanded) {
      visibleIds.push(row.id)

      // Add subRows to stack if they exist and parent is expanded
      if (row.subRows && row.subRows.length > 0) {
        // Handle both ExpandedState types: true (all expanded) or Record<string, boolean>
        const isRowExpanded = expanded === true ? true : expanded[row.id] ?? false
        for (const subRow of row.subRows) {
          stack.push({ row: subRow, parentExpanded: isRowExpanded })
        }
      }
    }
  }

  return visibleIds
}

type CheckSelectedCellsVisibleProps = {
  selectedCells: Set<CellId>
  setSelectedCells: (cells: Set<CellId>) => void
  focusedCellId: CellId | null
  setFocusedCellId: (cellId: CellId | null) => void
}

export const useCheckSelectedCellsVisible = ({
  selectedCells,
  setSelectedCells,
  focusedCellId,
  setFocusedCellId,
}: CheckSelectedCellsVisibleProps): void => {
  const { tableData, expanded } = useProjectTableContext()
  const unstableVisibleRowIds = useMemo(() => {
    return getVisibleRowIds(tableData, expanded)
  }, [tableData, expanded])
  const visibleRowIds = useMemo(
    () => unstableVisibleRowIds,
    [JSON.stringify(unstableVisibleRowIds)],
  )

  useEffect(() => {
    // Check selectedCells and remove any cells that are not in the visible row ids
    const newSelection = new Set<CellId>()
    selectedCells.forEach((cellId) => {
      const { rowId } = parseCellId(cellId) || {}
      if (rowId && visibleRowIds.includes(rowId)) {
        newSelection.add(cellId)
      }
    })

    // Only update if the selection has changed
    if (
      newSelection.size !== selectedCells.size ||
      !Array.from(newSelection).every((cellId) => selectedCells.has(cellId))
    ) {
      setSelectedCells(newSelection)
    }

    // Check focusedCellId and clear it if the row is not visible
    if (focusedCellId) {
      const { rowId } = parseCellId(focusedCellId) || {}
      if (rowId && !visibleRowIds.includes(rowId)) {
        setFocusedCellId(null)
      }
    }
  }, [visibleRowIds, selectedCells, focusedCellId, setSelectedCells, setFocusedCellId])
}
