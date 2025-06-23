import { OperationResponseModel } from '@shared/api'
import {
  CellId,
  getCellId,
  parseCellId,
  useProjectTableContext,
  useSelectedRowsContext,
  useSelectionCellsContext,
} from '@shared/containers'
import { ExpandedState } from '@tanstack/react-table'
import { useCallback } from 'react'

const useExpandAndSelectNewFolders = () => {
  const { selectedRows } = useSelectedRowsContext()
  const { setSelectedCells, setFocusedCellId, selectedCells } = useSelectionCellsContext()

  const { expanded, setExpanded } = useProjectTableContext()

  const expandAndSelectNewFolders = useCallback(
    (
      ops: OperationResponseModel[],
      config: {
        enableSelect: boolean
        enableExpand: boolean
      },
    ) => {
      const { enableSelect, enableExpand } = config

      if (enableExpand) {
        // clone expanded state
        const newExpanded: ExpandedState = { ...(expanded as {}) }

        // expand all currently selected rows
        for (const rowId of selectedRows) {
          newExpanded[rowId] = true
        }

        // expand all rows referenced by selected cells
        for (const cellId of selectedCells) {
          const rowId = parseCellId(cellId)?.rowId
          if (rowId) {
            newExpanded[rowId] = true
          }
        }

        setExpanded(newExpanded)
      }

      if (enableSelect) {
        // build new cell selection for created folders
        const newSelection = new Set<CellId>()
        for (const op of ops) {
          if (!op.entityId) continue
          if (op.entityType !== 'folder') continue
          newSelection.add(getCellId(op.entityId, 'name'))
        }

        if (newSelection.size) {
          setSelectedCells(newSelection)
          setFocusedCellId(newSelection.values().next().value || null)
        }
      }
    },
    [selectedRows, selectedCells, expanded, setExpanded, setSelectedCells, setFocusedCellId],
  )

  return expandAndSelectNewFolders
}

export default useExpandAndSelectNewFolders
