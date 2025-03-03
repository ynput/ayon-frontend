import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'
import { CellId, RowId, ColId, getCellId } from '../utils/cellUtils'

interface CellEditingContextType {
  editingCellId: CellId | null
  setEditingCellId: (id: CellId | null) => void
  isEditing: (id: CellId) => boolean
  getCellIdFromPosition: (rowId: RowId, colId: ColId) => CellId
}

const CellEditingContext = createContext<CellEditingContextType | undefined>(undefined)

export const CellEditingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [editingCellId, setEditingCellId] = useState<CellId | null>(null)

  // Memoize these functions to prevent unnecessary re-renders
  const isEditing = useCallback((id: CellId) => id === editingCellId, [editingCellId])

  // Use the shared utility for cell ID generation
  const getCellIdFromPosition = useCallback(
    (rowId: RowId, colId: ColId) => getCellId(rowId, colId),
    [],
  )

  const value = useMemo(
    () => ({
      editingCellId,
      setEditingCellId,
      isEditing,
      getCellIdFromPosition,
    }),
    [editingCellId, isEditing, getCellIdFromPosition],
  )

  return <CellEditingContext.Provider value={value}>{children}</CellEditingContext.Provider>
}

export const useCellEditing = (): CellEditingContextType => {
  const context = useContext(CellEditingContext)
  if (context === undefined) {
    throw new Error('useCellEditing must be used within a CellEditingProvider')
  }
  return context
}
